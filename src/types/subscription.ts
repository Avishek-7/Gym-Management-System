export interface Subscription {
    id: string;
    userId: string;
    planId: string;
    startDate: string;
    endDate?: Date;
    status: 'active' | 'inactive' | 'canceled';
    autoRenew: boolean;
    createdAt: Date;
    updatedAt: Date;
}

