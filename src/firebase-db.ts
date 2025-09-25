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

export function subscribeMyItems(cb: (items: SetRow[]) => void) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Not authenticated");
  const q = query(
    collection(db, "users", uid, "items"),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(q, (snap) => {
    // console.log(
    //   "Snapshot received",
    //   snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    // );
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() })) as SetRow[]);
  });
}

function getTodayYMD(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function subscribeTodayItems(cb: (rows: SetRowDB[]) => void) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Not authenticated");

  const today = getTodayYMD();
  const q = query(
    collection(db, "users", uid, "items"),
    where("date", "==", today)
  );

  return onSnapshot(q, (snap) => {
    const rows = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as SetRowDB[];
    cb(rows);
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

  const q = query(
    collection(db, "users", uid, "items"),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);

  const items = snap.docs.map((d) => {
    const raw = d.data();
    const serialized = deepMapValues(raw, tsToISO) as Record<string, unknown>;
    return { id: d.id, data: serialized };
  });

  const payload = {
    schema: "trainbook.v1",
    uid,
    exportedAt: new Date().toISOString(),
    items,
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

  // Parse JSON
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let parsed: any;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Invalid JSON file");
  }
  if (!parsed || !Array.isArray(parsed.items)) {
    throw new Error("Invalid payload: expected { items: [...] }");
  }

  const colRef = collection(db, "users", uid, "items");

  // If replace mode: delete all current docs first
  if (mode === "replace") {
    const snap = await getDocs(query(colRef));
    const toDelete = snap.docs.map((d) => d.ref);
    for (let i = 0; i < toDelete.length; i += 400) {
      const batch = writeBatch(db);
      for (const ref of toDelete.slice(i, i + 400)) {
        batch.delete(ref);
      }
      await batch.commit();
    }
  }

  // Helper: convert createdAt only (string ISO -> Timestamp).
  // DO NOT touch 'date' or any other fields.
  const normalizeDocument = (raw: Record<string, unknown>) => {
    const out: Record<string, unknown> = { ...raw };

    // Only convert 'createdAt' if it is a string ISO date
    if (typeof out.createdAt === "string") {
      const d = new Date(out.createdAt as string);
      if (!isNaN(d.getTime())) {
        out.createdAt = Timestamp.fromDate(d);
      }
    }

    // If reassignCreatedAt -> override with serverTimestamp()
    if (reassignCreatedAt) {
      out.createdAt = serverTimestamp();
    }

    // Ensure 'date' stays STRING (if someone passed Date/Timestamp by mistake)
    // If it's not a string, coerce to ISO date-only string for safety
    if (out.date && typeof out.date !== "string") {
      try {
        // Attempt to coerce to YYYY-MM-DD if possible
        if (out.date instanceof Timestamp) {
          const d = (out.date as Timestamp).toDate();
          out.date = d.toISOString().slice(0, 10);
        } else if (out.date instanceof Date) {
          out.date = (out.date as Date).toISOString().slice(0, 10);
        } else {
          // Leave as-is if we cannot safely coerce
        }
      } catch {
        // Leave as-is on any error
      }
    }

    // If createdAt is missing entirely, set serverTimestamp() to keep sort stable
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const row of parsed.items as Array<{ id?: string; data: any }>) {
    const id = preserveIds && row.id ? row.id : undefined;
    const ref = id ? doc(colRef, id) : doc(colRef);

    const normalized = normalizeDocument(row.data || {});
    batch.set(ref, normalized, { merge: false });

    inBatch++;
    if (inBatch >= 400) await flush();
  }
  await flush();
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
