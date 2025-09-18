import { db } from "../core/firebase";
import { collection, addDoc, getDocs, doc, updateDoc } from "firebase/firestore";
import type { Payment, CreatePaymentRequest } from "..//../types/payment";

const paymentsCol = collection(db, "payments");

export async function addPayment(data: CreatePaymentRequest): Promise<Payment> {
    const newPayment = {
        ...data,
        status: "pending" as const, // default status
        paymentDate: new Date().toISOString(), // auto-set 
    };

    const docRef = await addDoc(paymentsCol, newPayment);
    return { id: docRef.id, ...newPayment };
}

export async function getPayments(): Promise<Payment[]> {
    const snapshot = await getDocs(paymentsCol);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Payment[];
}

export async function updatePayment(id: string, updates: Partial<Payment>): Promise<Payment> {
    const docRef = doc(db, "payments", id);
    await updateDoc(docRef, updates);
    return { id, ...updates } as Payment;
}

