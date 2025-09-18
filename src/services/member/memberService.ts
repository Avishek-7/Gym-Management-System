import { db } from "../core/firebase";
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore";
import type { Member } from "../../types/member";

const membersCol = collection(db, "members");

export async function addMember(member: Omit<Member, "id">) {
  const docRef = await addDoc(membersCol, member);
  return docRef.id;
}

export async function getMembers() {
  const snapshot = await getDocs(membersCol);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Member[];
}

export async function updateMember(id: string, updates: Partial<Member>) {
  const docRef = doc(db, "members", id);
  await updateDoc(docRef, updates);
}

export async function deleteMember(id: string) {
  await deleteDoc(doc(db, "members", id));
}
