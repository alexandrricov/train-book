import {
  collection,
  addDoc,
  doc,
  setDoc,
  getDocs,
  query,
  orderBy,
  onSnapshot,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "./firebase";
import { SetRow } from "./types";

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
