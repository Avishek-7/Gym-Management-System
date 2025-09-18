export interface Payment {
  id: string;
  memberId: string;
  membershipId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: 'cash' | 'card' | 'upi' | 'bank_transfer';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  transactionId?: string;
  description?: string;
}

export interface CreatePaymentRequest {
  memberId: string;
  membershipId: string;
  amount: number;
  paymentMethod: 'cash' | 'card' | 'upi' | 'bank_transfer';
  transactionId?: string;
  description?: string;
}