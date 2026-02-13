import {
  collection,
  addDoc,
  doc,
  getDocs,
  query,
  orderBy,
  onSnapshot,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
  writeBatch,
  where,
  limit,
} from "firebase/firestore";
import { auth, db } from "./firebase";
import {
  type ExerciseType,
  type SetRow,
  type SetRowDB,
  type TargetRowDB,
  type TargetsAsOf,
} from "./types";
import { toDateString } from "./utils/date";
import { EXERCISE } from "./exercises";
import { z } from "zod";

const exerciseType = z.enum(
  Object.keys(EXERCISE) as [string, ...string[]]
);

const dateYMD = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const isoTimestamp = z.iso.datetime({ offset: true }).optional();

const itemDataSchema = z.object({
  date: dateYMD,
  type: exerciseType,
  count: z.number(),
  createdAt: isoTimestamp,
});

const targetDataSchema = z.object({
  date: dateYMD,
  type: exerciseType,
  value: z.number(),
  createdAt: isoTimestamp,
});

const exportFileSchema = z.object({
  schema: z.literal("trainbook.v1"),
  items: z.array(z.object({ id: z.string().optional(), data: itemDataSchema })),
  targets: z.array(z.object({ id: z.string().optional(), data: targetDataSchema })),
});

export async function createItemForCurrentUser(payload: SetRow) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Not authenticated");
  const col = collection(db, "users", uid, "items");
  await addDoc(col, { ...payload, createdAt: serverTimestamp() });
}

export async function listMyItemsOnce() {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Not authenticated");
  const q = query(
    collection(db, "users", uid, "items"),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export function subscribeItems(cb: (items: SetRowDB[]) => void, date?: string) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Not authenticated");
  const q = query(
    collection(db, "users", uid, "items"),
    orderBy("createdAt", "desc"),
    ...(date ? [where("date", ">=", date)] : [])
  );
  return onSnapshot(q, (snap) => {
    // console.log(
    //   "Snapshot received",
    //   snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    // );
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() })) as SetRowDB[]);
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function updateMyItem(itemId: string, patch: Record<string, any>) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Not authenticated");
  await updateDoc(doc(db, "users", uid, "items", itemId), patch);
}

export async function deleteMyItem(itemId: string) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Not authenticated");
  await deleteDoc(doc(db, "users", uid, "items", itemId));
}

function tsToISO(v: unknown): string | unknown {
  if (v instanceof Timestamp) return v.toDate().toISOString();
  return v;
}

function deepMapValues<T = unknown>(
  obj: T,
  mapFn: (v: unknown) => unknown
): unknown {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map((x) => deepMapValues(x, mapFn));
  if (typeof obj === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      if (v && typeof v === "object" && !(v instanceof Timestamp)) {
        out[k] = deepMapValues(v, mapFn);
      } else {
        out[k] = mapFn(v);
      }
    }
    return out;
  }
  return obj;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function exportMyItemsToJSON(filename = "trainbook-items.json") {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Not authenticated");

  const serialize = (d: import("firebase/firestore").QueryDocumentSnapshot) => {
    const raw = d.data();
    const serialized = deepMapValues(raw, tsToISO) as Record<string, unknown>;
    return { id: d.id, data: serialized };
  };

  const [itemsSnap, targetsSnap] = await Promise.all([
    getDocs(query(collection(db, "users", uid, "items"), orderBy("createdAt", "desc"))),
    getDocs(query(collection(db, "users", uid, "targets"), orderBy("createdAt", "desc"))),
  ]);

  const payload = {
    schema: "trainbook.v1",
    uid,
    exportedAt: new Date().toISOString(),
    items: itemsSnap.docs.map(serialize),
    targets: targetsSnap.docs.map(serialize),
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  downloadBlob(blob, filename);
}

type ImportOptions = {
  mode?: "append" | "replace";
  preserveIds?: boolean;
  reassignCreatedAt?: boolean;
};

export async function importMyItemsFromJSON(
  fileOrText: File | string,
  opts: ImportOptions = {}
) {
  const {
    mode = "append",
    preserveIds = true,
    reassignCreatedAt = false,
  } = opts;

  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Not authenticated");

  // Read JSON text from file or string
  const text =
    typeof fileOrText === "string" ? fileOrText : await fileOrText.text();

  // Parse & validate JSON
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error("Invalid JSON file");
  }

  const result = exportFileSchema.safeParse(raw);
  if (!result.success) {
    throw new Error(`Invalid export file: ${result.error.issues.map((i) => i.message).join(", ")}`);
  }
  const parsed = result.data;

  const itemsCol = collection(db, "users", uid, "items");
  const targetsCol = collection(db, "users", uid, "targets");

  // If replace mode: delete all current docs first
  if (mode === "replace") {
    const [itemsSnap, targetsSnap] = await Promise.all([
      getDocs(query(itemsCol)),
      getDocs(query(targetsCol)),
    ]);
    const toDelete = [
      ...itemsSnap.docs.map((d) => d.ref),
      ...targetsSnap.docs.map((d) => d.ref),
    ];
    for (let i = 0; i < toDelete.length; i += 400) {
      const batch = writeBatch(db);
      for (const ref of toDelete.slice(i, i + 400)) {
        batch.delete(ref);
      }
      await batch.commit();
    }
  }

  // Helper: convert createdAt only (string ISO -> Timestamp).
  const normalizeDocument = (raw: Record<string, unknown>) => {
    const out: Record<string, unknown> = { ...raw };

    if (typeof out.createdAt === "string") {
      const d = new Date(out.createdAt as string);
      if (!isNaN(d.getTime())) {
        out.createdAt = Timestamp.fromDate(d);
      }
    }

    if (reassignCreatedAt) {
      out.createdAt = serverTimestamp();
    }

    if (out.date && typeof out.date !== "string") {
      try {
        if (out.date instanceof Timestamp) {
          const d = (out.date as Timestamp).toDate();
          out.date = d.toISOString().slice(0, 10);
        } else if (out.date instanceof Date) {
          out.date = (out.date as Date).toISOString().slice(0, 10);
        }
      } catch {
        // Leave as-is on any error
      }
    }

    if (out.createdAt === undefined) {
      out.createdAt = serverTimestamp();
    }

    return out;
  };

  // Write in batches of 400 operations
  let batch = writeBatch(db);
  let inBatch = 0;

  const flush = async () => {
    if (inBatch > 0) {
      await batch.commit();
      batch = writeBatch(db);
      inBatch = 0;
    }
  };

  // Import items
  for (const row of parsed.items) {
    const id = preserveIds && row.id ? row.id : undefined;
    const ref = id ? doc(itemsCol, id) : doc(itemsCol);
    batch.set(ref, normalizeDocument({ ...row.data }), { merge: false });
    inBatch++;
    if (inBatch >= 400) await flush();
  }

  // Import targets
  for (const row of parsed.targets) {
    const id = preserveIds && row.id ? row.id : undefined;
    const ref = id ? doc(targetsCol, id) : doc(targetsCol);
    batch.set(ref, normalizeDocument({ ...row.data }), { merge: false });
    inBatch++;
    if (inBatch >= 400) await flush();
  }

  await flush();
}

export function subscribeAllTargets(
  cb: (targets: TargetRowDB[]) => void
): () => void {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Not authenticated");
  const col = collection(db, "users", uid, "targets");
  const q = query(col, orderBy("date", "asc"));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() })) as TargetRowDB[]);
  });
}

export async function setTarget(
  type: ExerciseType,
  value: number,
  date: string = toDateString()
): Promise<void> {
  // Basic validation
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error("date must be 'YYYY-MM-DD'");
  }
  // if (value < 0) throw new Error("value must be >= 0");

  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Not authenticated");

  const col = collection(db, "users", uid, "targets");
  await addDoc(col, {
    type,
    value,
    date,
    createdAt: serverTimestamp(),
  } as TargetRowDB);
}

export async function getTargets(
  dateYMD: string = toDateString(new Date())
): Promise<TargetsAsOf> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateYMD)) {
    throw new Error("dateYMD must be 'YYYY-MM-DD'");
  }

  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Not authenticated");

  const col = collection(db, "users", uid, "targets");

  const result: TargetsAsOf = {};
  const types = Object.keys(EXERCISE) as ExerciseType[];

  // Run per-type "latest before or on date" query
  // where(type == T) && where(date <= date) orderBy(date desc) limit(1)
  await Promise.all(
    types.map(async (t) => {
      const q1 = query(
        col,
        where("type", "==", t),
        where("date", "<=", dateYMD),
        orderBy("date", "desc"),
        limit(1)
      );
      const snap = await getDocs(q1);
      const doc = snap.docs[0];
      if (doc) {
        const data = doc.data() as TargetRowDB;
        result[t] = { value: data.value, date: data.date };
      }
    })
  );
  return result;
}

export function subscribeTargets(
  dateYMD: string,
  cb: (targets: TargetsAsOf) => void
): () => void {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateYMD)) {
    throw new Error("dateYMD must be 'YYYY-MM-DD'");
  }

  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Not authenticated");

  const col = collection(db, "users", uid, "targets");
  const types = Object.keys(EXERCISE) as ExerciseType[];

  // Keep last values in memory and emit merged object on any change
  const current: TargetsAsOf = {};

  const unsubs = types.map((t) => {
    const q1 = query(
      col,
      where("type", "==", t),
      where("date", "<=", dateYMD),
      orderBy("date", "desc"),
      limit(1)
    );

    return onSnapshot(q1, (snap) => {
      const doc = snap.docs[0];
      if (doc) {
        const data = doc.data() as TargetRowDB;
        current[t] = { value: data.value, date: data.date };
      } else {
        delete current[t];
      }
      cb({ ...current });
    });
  });

  // Return combined unsubscribe
  return () => unsubs.forEach((u) => u());
}
