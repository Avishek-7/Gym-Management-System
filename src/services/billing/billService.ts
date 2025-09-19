import { db } from "../core/firebase";
import { collection, addDoc, getDocs, doc, deleteDoc, updateDoc, query, where, orderBy } from "firebase/firestore";
import type { Bill, CreateBillRequest, BillingInfo } from "../../types/billing";

const billsCol = collection(db, "bills");

// Generate unique bill number
const generateBillNumber = (): string => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `BILL-${timestamp}-${random}`;
};

// Legacy function - keeping for compatibility
export async function addBill(bill: Omit<BillingInfo, "id">) {
    const docRef = await addDoc(billsCol, bill);
    return docRef.id;
}

// Enhanced CRUD Operations

// CREATE
export const createBill = async (bill: CreateBillRequest): Promise<string> => {
    try {
        const billData = {
            ...bill,
            billNumber: generateBillNumber(),
            totalAmount: bill.amount + bill.taxAmount - (bill.discountApplied || 0),
            status: 'pending' as const,
            items: bill.items.map((item, index) => ({
                ...item,
                id: `item-${index + 1}`,
                totalPrice: item.quantity * item.unitPrice
            })),
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        const docRef = await addDoc(billsCol, billData);
        return docRef.id;
    } catch (error) {
        console.error("Error creating bill:", error);
        throw error;
    }
};

// READ ALL
export async function getBills(): Promise<BillingInfo[]> {
    const snapshot = await getDocs(billsCol);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as BillingInfo[];
}

export const getAllBills = async (): Promise<Bill[]> => {
    try {
        const q = query(billsCol, orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ ...doc.data() as Bill, id: doc.id }));
    } catch (error) {
        console.error("Error fetching bills:", error);
        throw error;
    }
};

// READ BY USER
export const getUserBills = async (userId: string): Promise<Bill[]> => {
    try {
        const q = query(billsCol, where("userId", "==", userId), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ ...doc.data() as Bill, id: doc.id }));
    } catch (error) {
        console.error("Error fetching user bills:", error);
        throw error;
    }
};

// READ BY STATUS
export const getBillsByStatus = async (status: string): Promise<Bill[]> => {
    try {
        const q = query(billsCol, where("status", "==", status), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ ...doc.data() as Bill, id: doc.id }));
    } catch (error) {
        console.error("Error fetching bills by status:", error);
        throw error;
    }
};

// UPDATE
export const updateBill = async (billId: string, updateFields: Partial<Bill>): Promise<void> => {
    try {
        await updateDoc(doc(db, "bills", billId), {
            ...updateFields,
            updatedAt: new Date()
        });
    } catch (error) {
        console.error("Error updating bill:", error);
        throw error;
    }
};

// DELETE
export const deleteBill = async (billId: string): Promise<void> => {
    try {
        await deleteDoc(doc(db, "bills", billId));
    } catch (error) {
        console.error("Error deleting bill:", error);
        throw error;
    }
};

// BUSINESS LOGIC FUNCTIONS
export const markBillAsPaid = async (billId: string, paymentMethod: 'cash' | 'card' | 'upi' | 'bank_transfer'): Promise<void> => {
    await updateBill(billId, { 
        status: 'paid', 
        paymentMethod,
        paidAt: new Date() 
    });
};

export const markBillAsOverdue = async (billId: string): Promise<void> => {
    await updateBill(billId, { status: 'overdue' });
};

export const cancelBill = async (billId: string): Promise<void> => {
    await updateBill(billId, { status: 'cancelled' });
};

export const getOverdueBills = async (): Promise<Bill[]> => {
    return getBillsByStatus('overdue');
};

export const getPendingBills = async (): Promise<Bill[]> => {
    return getBillsByStatus('pending');
};

export const getPaidBills = async (): Promise<Bill[]> => {
    return getBillsByStatus('paid');
};

// Get bills due within specified days
export const getBillsDueSoon = async (daysAhead: number = 7): Promise<Bill[]> => {
    try {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + daysAhead);
        
        const q = query(
            billsCol, 
            where("status", "==", "pending"),
            where("dueDate", "<=", futureDate),
            orderBy("dueDate", "asc")
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ ...doc.data() as Bill, id: doc.id }));
    } catch (error) {
        console.error("Error fetching bills due soon:", error);
        throw error;
    }
};

