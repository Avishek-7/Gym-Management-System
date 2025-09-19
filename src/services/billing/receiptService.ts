import { db } from "../core/firebase";
import { collection, addDoc, getDocs } from "firebase/firestore";
import type { Receipt } from "../../types/receipt";

const receiptsCol = collection(db, "receipts");

export async function addReceipt(receipt: Omit<Receipt, "id">) {
    const docRef = await addDoc(receiptsCol, receipt);
    return docRef.id;
}

export async function getReceipts() {
    const snapshot = await getDocs(receiptsCol);
    return snapshot.docs.map(doc => ({ id: doc.id,...doc.data() })) as Receipt[];
}

