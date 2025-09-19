import { db } from "../core/firebase";
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, orderBy } from "firebase/firestore";
import type { Payment, CreatePaymentRequest } from "../../types/payment";
import type { BillingPayment, CreateBillingPaymentRequest } from "../../types/billing";

const paymentsCol = collection(db, "payments");

// Legacy functions - keeping for compatibility
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

// Enhanced Payment Service for Billing

// CREATE
export const createBillingPayment = async (payment: CreateBillingPaymentRequest): Promise<string> => {
    try {
        const paymentData = {
            ...payment,
            status: 'pending' as const,
            paymentDate: new Date(),
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        const docRef = await addDoc(paymentsCol, paymentData);
        return docRef.id;
    } catch (error) {
        console.error("Error creating payment:", error);
        throw error;
    }
};

// READ ALL BILLING PAYMENTS
export const getAllBillingPayments = async (): Promise<BillingPayment[]> => {
    try {
        const q = query(paymentsCol, orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ ...doc.data() as BillingPayment, id: doc.id }));
    } catch (error) {
        console.error("Error fetching payments:", error);
        throw error;
    }
};

// READ BY USER
export const getUserBillingPayments = async (userId: string): Promise<BillingPayment[]> => {
    try {
        const q = query(paymentsCol, where("userId", "==", userId), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ ...doc.data() as BillingPayment, id: doc.id }));
    } catch (error) {
        console.error("Error fetching user payments:", error);
        throw error;
    }
};

// READ BY BILL
export const getBillPayments = async (billId: string): Promise<BillingPayment[]> => {
    try {
        const q = query(paymentsCol, where("billId", "==", billId), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ ...doc.data() as BillingPayment, id: doc.id }));
    } catch (error) {
        console.error("Error fetching bill payments:", error);
        throw error;
    }
};

// READ BY STATUS
export const getPaymentsByStatus = async (status: string): Promise<BillingPayment[]> => {
    try {
        const q = query(paymentsCol, where("status", "==", status), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ ...doc.data() as BillingPayment, id: doc.id }));
    } catch (error) {
        console.error("Error fetching payments by status:", error);
        throw error;
    }
};

// UPDATE
export const updateBillingPayment = async (paymentId: string, updateFields: Partial<BillingPayment>): Promise<void> => {
    try {
        await updateDoc(doc(db, "payments", paymentId), {
            ...updateFields,
            updatedAt: new Date()
        });
    } catch (error) {
        console.error("Error updating payment:", error);
        throw error;
    }
};

// DELETE
export const deleteBillingPayment = async (paymentId: string): Promise<void> => {
    try {
        await deleteDoc(doc(db, "payments", paymentId));
    } catch (error) {
        console.error("Error deleting payment:", error);
        throw error;
    }
};

// BUSINESS LOGIC FUNCTIONS
export const processPayment = async (paymentId: string, transactionId?: string): Promise<void> => {
    await updateBillingPayment(paymentId, { 
        status: 'completed',
        transactionId,
        paymentDate: new Date()
    });
};

export const failPayment = async (paymentId: string, reason?: string): Promise<void> => {
    await updateBillingPayment(paymentId, { 
        status: 'failed',
        notes: reason
    });
};

export const refundPayment = async (paymentId: string, refundAmount: number, reason?: string): Promise<void> => {
    await updateBillingPayment(paymentId, { 
        status: 'refunded',
        refundAmount,
        refundDate: new Date(),
        notes: reason
    });
};

export const getPendingPayments = async (): Promise<BillingPayment[]> => {
    return getPaymentsByStatus('pending');
};

export const getCompletedPayments = async (): Promise<BillingPayment[]> => {
    return getPaymentsByStatus('completed');
};

export const getFailedPayments = async (): Promise<BillingPayment[]> => {
    return getPaymentsByStatus('failed');
};

export const getRefundedPayments = async (): Promise<BillingPayment[]> => {
    return getPaymentsByStatus('refunded');
};

// Get payment history for analytics
export const getPaymentHistory = async (startDate: Date, endDate: Date): Promise<BillingPayment[]> => {
    try {
        const q = query(
            paymentsCol,
            where("paymentDate", ">=", startDate),
            where("paymentDate", "<=", endDate),
            where("status", "==", "completed"),
            orderBy("paymentDate", "desc")
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ ...doc.data() as BillingPayment, id: doc.id }));
    } catch (error) {
        console.error("Error fetching payment history:", error);
        throw error;
    }
};

// Calculate total revenue
export const calculateRevenue = async (startDate: Date, endDate: Date): Promise<number> => {
    try {
        const payments = await getPaymentHistory(startDate, endDate);
        return payments.reduce((total, payment) => total + payment.amount, 0);
    } catch (error) {
        console.error("Error calculating revenue:", error);
        throw error;
    }
};

