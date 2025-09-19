export interface Receipt {
    id: string;
    billId: string;
    paymentId: string;
    issuedAt: string;
    amountPaid: number;
    method: 'cash' | 'card' | 'upi' | 'bank_transfer';
    createdAt: string;
    updatedAt: string;
    description?: string;
}

export interface createReceiptRequest {
    billId: string;
    paymentId: string;
    amountPaid: number;
    method: 'cash' | 'card' | 'upi' | 'bank_transfer';
    description?: string;
}