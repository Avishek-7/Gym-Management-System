// Legacy - keeping for compatibility
export interface BillingInfo {
    id: string;
    memberId: string;
    membershipId: string;
    amountDue: number;
    dueDate: string;
    status: 'paid' | 'unpaid' | 'overdue';
    createdAt: string;
    updatedAt: string;
}

// Enhanced Bill/Invoice Types
export interface Bill {
  id: string;
  userId: string;
  membershipId: string;
  subscriptionId?: string;
  billNumber: string;
  amount: number;
  taxAmount: number;
  totalAmount: number;
  dueDate: Date;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  items: BillItem[];
  discountApplied?: number;
  paymentMethod?: 'cash' | 'card' | 'upi' | 'bank_transfer';
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface BillItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface CreateBillRequest {
  userId: string;
  membershipId: string;
  subscriptionId?: string;
  amount: number;
  taxAmount: number;
  dueDate: Date;
  items: Omit<BillItem, 'id'>[];
  discountApplied?: number;
}

// Payment Types for Billing
export interface BillingPayment {
  id: string;
  billId: string;
  userId: string;
  amount: number;
  paymentMethod: 'cash' | 'card' | 'upi' | 'bank_transfer';
  transactionId?: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentDate: Date;
  refundAmount?: number;
  refundDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBillingPaymentRequest {
  billId: string;
  userId: string;
  amount: number;
  paymentMethod: 'cash' | 'card' | 'upi' | 'bank_transfer';
  transactionId?: string;
  notes?: string;
}

// Receipt Types
export interface Receipt {
  id: string;
  billId: string;
  paymentId: string;
  userId: string;
  receiptNumber: string;
  amount: number;
  paymentMethod: string;
  issueDate: Date;
  downloadUrl?: string;
  emailSent: boolean;
  createdAt: Date;
}

export interface CreateReceiptRequest {
  billId: string;
  paymentId: string;
  userId: string;
  amount: number;
  paymentMethod: string;
}

// Discount Types
export interface Discount {
  id: string;
  code: string;
  name: string;
  description?: string;
  type: 'percentage' | 'fixed_amount';
  value: number; // percentage (0-100) or fixed amount
  maxUsage?: number;
  currentUsage: number;
  validFrom: Date;
  validUntil: Date;
  isActive: boolean;
  applicableToMemberships: string[]; // membership IDs
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateDiscountRequest {
  code: string;
  name: string;
  description?: string;
  type: 'percentage' | 'fixed_amount';
  value: number;
  maxUsage?: number;
  validFrom: Date;
  validUntil: Date;
  applicableToMemberships: string[];
}
