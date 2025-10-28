// User Approval Types

export interface PendingApproval {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  phone: string;
  requestedRole: 'trainer' | 'admin';
  currentRole: string;
  status: 'pending' | 'approved' | 'rejected';
  reason?: string; // Reason for rejection or additional notes
  requestedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string; // Admin user ID who reviewed
  reviewerName?: string; // Admin name
}

export interface CreateApprovalRequest {
  userId: string;
  userEmail: string;
  userName: string;
  phone: string;
  requestedRole: 'trainer' | 'admin';
  currentRole: string;
}

export interface ReviewApprovalRequest {
  approvalId: string;
  status: 'approved' | 'rejected';
  reviewerId: string;
  reviewerName: string;
  reason?: string;
}
