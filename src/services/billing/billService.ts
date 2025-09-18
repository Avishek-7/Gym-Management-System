import { db } from "../core/firebase";
import { collection, addDoc, getDocs } from "firebase/firestore";
import type { BillingInfo } from "../../types/billing";

const billsCol = collection(db, "bills");

export async function addBill(bill: Omit<BillingInfo, "id">) {
    const docRef = await addDoc(billsCol, bill);
    return docRef.id;
}

export async function getBills() {
    const snapshot = await getDocs(billsCol);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as BillingInfo[];
}

