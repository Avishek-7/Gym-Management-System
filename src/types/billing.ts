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
