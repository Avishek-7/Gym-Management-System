import { db } from "../core/firebase";
import { collection, addDoc, getDocs, doc, deleteDoc, updateDoc, query, where } from "firebase/firestore";
import type { Bill, CreateBillRequest, BillingInfo } from "../../types/billing";
import { logger } from "../../utils/logger";

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
    logger.info('Creating new bill', {
        service: 'billService',
        action: 'createBill',
        userId: bill.userId,
        amount: bill.amount
    });

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
        
        logger.logFirebaseOperation('create', 'bills', {
            userId: bill.userId,
            totalAmount: billData.totalAmount
        });
        
        const docRef = await addDoc(billsCol, billData);
        
        logger.info('Bill created successfully', {
            service: 'billService',
            billId: docRef.id,
            billNumber: billData.billNumber,
            totalAmount: billData.totalAmount
        });
        
        return docRef.id;
    } catch (error) {
        logger.error('Failed to create bill', error, {
            service: 'billService',
            action: 'createBill',
            userId: bill.userId
        });
        throw error;
    }
};

// READ ALL
export async function getBills(): Promise<BillingInfo[]> {
    logger.debug('Fetching all bills', {
        service: 'billService',
        action: 'getBills'
    });

    try {
        logger.logFirebaseOperation('query', 'bills');
        const snapshot = await getDocs(billsCol);
        const bills = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as BillingInfo[];
        
        logger.info('Bills fetched successfully', {
            service: 'billService',
            count: bills.length
        });
        
        return bills;
    } catch (error) {
        logger.error('Failed to fetch bills', error, {
            service: 'billService',
            action: 'getBills'
        });
        throw error;
    }
}

export const getAllBills = async (): Promise<Bill[]> => {
    logger.debug('Fetching all bills (sorted)', {
        service: 'billService',
        action: 'getAllBills'
    });

    try {
        // Remove orderBy to avoid index requirement - sort in memory instead
        logger.logFirebaseOperation('query', 'bills');
        const snapshot = await getDocs(billsCol);
        const bills = snapshot.docs.map(doc => ({ ...doc.data() as Bill, id: doc.id }));
        
        // Sort in memory by createdAt descending
        const sortedBills = bills.sort((a, b) => {
            const dateA = new Date(a.createdAt);
            const dateB = new Date(b.createdAt);
            return dateB.getTime() - dateA.getTime();
        });
        
        logger.info('All bills fetched and sorted', {
            service: 'billService',
            count: sortedBills.length
        });
        
        return sortedBills;
    } catch (error) {
        logger.error('Failed to fetch all bills', error, {
            service: 'billService',
            action: 'getAllBills'
        });
        throw error;
    }
};

// READ BY USER
export const getUserBills = async (userId: string): Promise<Bill[]> => {
    logger.debug('Fetching user bills', {
        service: 'billService',
        action: 'getUserBills',
        userId
    });

    try {
        // Remove orderBy to avoid composite index requirement
        logger.logFirebaseOperation('query', 'bills', { userId });
        const q = query(billsCol, where("userId", "==", userId));
        const snapshot = await getDocs(q);
        const bills = snapshot.docs.map(doc => ({ ...doc.data() as Bill, id: doc.id }));
        
        // Sort in memory instead of using Firestore orderBy
        const sortedBills = bills.sort((a, b) => {
            const dateA = new Date(a.createdAt);
            const dateB = new Date(b.createdAt);
            return dateB.getTime() - dateA.getTime();
        });
        
        logger.info('User bills fetched successfully', {
            service: 'billService',
            userId,
            count: sortedBills.length
        });
        
        return sortedBills;
    } catch (error) {
        logger.error('Failed to fetch user bills', error, {
            service: 'billService',
            action: 'getUserBills',
            userId
        });
        throw error;
    }
};

// READ BY STATUS
export const getBillsByStatus = async (status: string): Promise<Bill[]> => {
    try {
        // Remove orderBy to avoid composite index requirement
        const q = query(billsCol, where("status", "==", status));
        const snapshot = await getDocs(q);
        const bills = snapshot.docs.map(doc => ({ ...doc.data() as Bill, id: doc.id }));
        
        // Sort in memory instead of using Firestore orderBy
        return bills.sort((a, b) => {
            const dateA = new Date(a.createdAt);
            const dateB = new Date(b.createdAt);
            return dateB.getTime() - dateA.getTime();
        });
    } catch (error) {
        console.error("Error fetching bills by status:", error);
        throw error;
    }
};

// UPDATE
export const updateBill = async (billId: string, updateFields: Partial<Bill>): Promise<void> => {
    logger.info('Updating bill', {
        service: 'billService',
        action: 'updateBill',
        billId,
        fields: Object.keys(updateFields)
    });

    try {
        logger.logFirebaseOperation('update', 'bills', {
            billId,
            fields: Object.keys(updateFields)
        });
        
        await updateDoc(doc(db, "bills", billId), {
            ...updateFields,
            updatedAt: new Date()
        });
        
        logger.info('Bill updated successfully', {
            service: 'billService',
            billId
        });
    } catch (error) {
        logger.error('Failed to update bill', error, {
            service: 'billService',
            action: 'updateBill',
            billId
        });
        throw error;
    }
};

// DELETE
export const deleteBill = async (billId: string): Promise<void> => {
    logger.info('Deleting bill', {
        service: 'billService',
        action: 'deleteBill',
        billId
    });

    try {
        logger.logFirebaseOperation('delete', 'bills', { billId });
        await deleteDoc(doc(db, "bills", billId));
        
        logger.info('Bill deleted successfully', {
            service: 'billService',
            billId
        });
    } catch (error) {
        logger.error('Failed to delete bill', error, {
            service: 'billService',
            action: 'deleteBill',
            billId
        });
        throw error;
    }
};

// BUSINESS LOGIC FUNCTIONS
export const markBillAsPaid = async (billId: string, paymentMethod: 'cash' | 'card' | 'upi' | 'bank_transfer'): Promise<void> => {
    logger.info('Marking bill as paid', {
        service: 'billService',
        action: 'markBillAsPaid',
        billId,
        paymentMethod
    });
    
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
        
        // Use simpler query to avoid composite index requirement
        const q = query(billsCol, where("status", "==", "pending"));
        const snapshot = await getDocs(q);
        const bills = snapshot.docs.map(doc => ({ ...doc.data() as Bill, id: doc.id }));
        
        // Filter and sort in memory
        return bills
            .filter(bill => {
                const dueDate = new Date(bill.dueDate);
                return dueDate <= futureDate;
            })
            .sort((a, b) => {
                const dateA = new Date(a.dueDate);
                const dateB = new Date(b.dueDate);
                return dateA.getTime() - dateB.getTime();
            });
    } catch (error) {
        console.error("Error fetching bills due soon:", error);
        throw error;
    }
};

