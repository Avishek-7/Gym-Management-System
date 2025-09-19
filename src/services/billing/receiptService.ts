import { db } from "../core/firebase";
import { collection, addDoc, getDocs, doc, deleteDoc, updateDoc, query, where, orderBy } from "firebase/firestore";
import type { Receipt } from "../../types/receipt";
import type { Receipt as BillingReceipt, CreateReceiptRequest } from "../../types/billing";

const receiptsCol = collection(db, "receipts");

// Generate unique receipt number
const generateReceiptNumber = (): string => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `REC-${timestamp}-${random}`;
};

// Legacy functions - keeping for compatibility
export async function addReceipt(receipt: Omit<Receipt, "id">) {
    const docRef = await addDoc(receiptsCol, receipt);
    return docRef.id;
}

export async function getReceipts() {
    const snapshot = await getDocs(receiptsCol);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Receipt[];
}

// Enhanced Receipt Service

// CREATE
export const createBillingReceipt = async (receipt: CreateReceiptRequest): Promise<string> => {
    try {
        const receiptData = {
            ...receipt,
            receiptNumber: generateReceiptNumber(),
            issueDate: new Date(),
            emailSent: false,
            createdAt: new Date()
        };
        
        const docRef = await addDoc(receiptsCol, receiptData);
        return docRef.id;
    } catch (error) {
        console.error("Error creating receipt:", error);
        throw error;
    }
};

// READ ALL BILLING RECEIPTS
export const getAllBillingReceipts = async (): Promise<BillingReceipt[]> => {
    try {
        const q = query(receiptsCol, orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ ...doc.data() as BillingReceipt, id: doc.id }));
    } catch (error) {
        console.error("Error fetching receipts:", error);
        throw error;
    }
};

// READ BY USER
export const getUserBillingReceipts = async (userId: string): Promise<BillingReceipt[]> => {
    try {
        const q = query(receiptsCol, where("userId", "==", userId), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ ...doc.data() as BillingReceipt, id: doc.id }));
    } catch (error) {
        console.error("Error fetching user receipts:", error);
        throw error;
    }
};

// READ BY BILL
export const getBillReceipts = async (billId: string): Promise<BillingReceipt[]> => {
    try {
        const q = query(receiptsCol, where("billId", "==", billId), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ ...doc.data() as BillingReceipt, id: doc.id }));
    } catch (error) {
        console.error("Error fetching bill receipts:", error);
        throw error;
    }
};

// READ BY PAYMENT
export const getPaymentReceipt = async (paymentId: string): Promise<BillingReceipt | null> => {
    try {
        const q = query(receiptsCol, where("paymentId", "==", paymentId));
        const snapshot = await getDocs(q);
        if (snapshot.empty) return null;
        const docData = snapshot.docs[0];
        return { ...docData.data() as BillingReceipt, id: docData.id };
    } catch (error) {
        console.error("Error fetching payment receipt:", error);
        throw error;
    }
};

// UPDATE
export const updateBillingReceipt = async (receiptId: string, updateFields: Partial<BillingReceipt>): Promise<void> => {
    try {
        await updateDoc(doc(db, "receipts", receiptId), updateFields);
    } catch (error) {
        console.error("Error updating receipt:", error);
        throw error;
    }
};

// DELETE
export const deleteBillingReceipt = async (receiptId: string): Promise<void> => {
    try {
        await deleteDoc(doc(db, "receipts", receiptId));
    } catch (error) {
        console.error("Error deleting receipt:", error);
        throw error;
    }
};

// BUSINESS LOGIC FUNCTIONS
export const markReceiptAsEmailed = async (receiptId: string): Promise<void> => {
    await updateBillingReceipt(receiptId, { emailSent: true });
};

export const setReceiptDownloadUrl = async (receiptId: string, downloadUrl: string): Promise<void> => {
    await updateBillingReceipt(receiptId, { downloadUrl });
};

// Generate receipt for payment
export const generateReceiptForPayment = async (
    billId: string, 
    paymentId: string, 
    userId: string, 
    amount: number, 
    paymentMethod: string
): Promise<string> => {
    const receipt: CreateReceiptRequest = {
        billId,
        paymentId,
        userId,
        amount,
        paymentMethod
    };
    
    return await createBillingReceipt(receipt);
};

// Get receipts that haven't been emailed
export const getPendingEmailReceipts = async (): Promise<BillingReceipt[]> => {
    try {
        const q = query(receiptsCol, where("emailSent", "==", false), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ ...doc.data() as BillingReceipt, id: doc.id }));
    } catch (error) {
        console.error("Error fetching pending email receipts:", error);
        throw error;
    }
};

// Email receipt to user (placeholder for email service integration)
export const emailReceipt = async (receiptId: string, userEmail: string): Promise<void> => {
    try {
        // TODO: Integrate with email service
        console.log(`Emailing receipt ${receiptId} to ${userEmail}`);
        
        // Mark as emailed
        await markReceiptAsEmailed(receiptId);
    } catch (error) {
        console.error("Error emailing receipt:", error);
        throw error;
    }
};

// Download receipt (generate PDF or return download URL)
export const downloadReceipt = async (receiptId: string): Promise<string> => {
    try {
        // TODO: Generate PDF and return download URL
        const downloadUrl = `https://your-storage.com/receipts/${receiptId}.pdf`;
        await setReceiptDownloadUrl(receiptId, downloadUrl);
        
        return downloadUrl;
    } catch (error) {
        console.error("Error downloading receipt:", error);
        throw error;
    }
};

