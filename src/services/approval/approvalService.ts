import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../core/firebase';
import { setDoc } from 'firebase/firestore';
import type { PendingApproval, CreateApprovalRequest, ReviewApprovalRequest } from '../../types/approval';

const APPROVALS_COLLECTION = 'pendingApprovals';

/**
 * Create a new approval request
 */
export const createApprovalRequest = async (
  request: CreateApprovalRequest
): Promise<string> => {
  try {
    const approvalDoc = {
      userId: request.userId,
      userEmail: request.userEmail,
      userName: request.userName,
      phone: request.phone,
      requestedRole: request.requestedRole,
      currentRole: request.currentRole,
      status: 'pending',
      requestedAt: serverTimestamp(),
    };

    const docRef = await addDoc(
      collection(db, APPROVALS_COLLECTION),
      approvalDoc
    );

    return docRef.id;
  } catch (error) {
    console.error('Error creating approval request:', error);
    throw error;
  }
};

/**
 * Get all pending approvals (for admin dashboard)
 */
export const getPendingApprovals = async (): Promise<PendingApproval[]> => {
  try {
    const q = query(
      collection(db, APPROVALS_COLLECTION),
      where('status', '==', 'pending'),
      orderBy('requestedAt', 'desc')
    );

    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        requestedAt: data.requestedAt?.toDate(),
        reviewedAt: data.reviewedAt?.toDate(),
      } as PendingApproval;
    });
  } catch (error) {
    console.error('Error fetching pending approvals:', error);
    throw error;
  }
};

/**
 * Get all approvals (pending, approved, rejected)
 */
export const getAllApprovals = async (): Promise<PendingApproval[]> => {
  try {
    const q = query(
      collection(db, APPROVALS_COLLECTION),
      orderBy('requestedAt', 'desc')
    );

    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        requestedAt: data.requestedAt?.toDate(),
        reviewedAt: data.reviewedAt?.toDate(),
      } as PendingApproval;
    });
  } catch (error) {
    console.error('Error fetching all approvals:', error);
    throw error;
  }
};

/**
 * Get approval request for a specific user
 */
export const getUserApprovalStatus = async (
  userId: string
): Promise<PendingApproval | null> => {
  try {
    const q = query(
      collection(db, APPROVALS_COLLECTION),
      where('userId', '==', userId),
      where('status', '==', 'pending')
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    const doc = querySnapshot.docs[0];
    const data = doc.data();

    return {
      id: doc.id,
      ...data,
      requestedAt: data.requestedAt?.toDate(),
      reviewedAt: data.reviewedAt?.toDate(),
    } as PendingApproval;
  } catch (error) {
    console.error('Error fetching user approval status:', error);
    throw error;
  }
};

/**
 * Review (approve or reject) an approval request
 */
export const reviewApproval = async (
  request: ReviewApprovalRequest
): Promise<void> => {
  try {
    const approvalRef = doc(db, APPROVALS_COLLECTION, request.approvalId);
    const approvalSnap = await getDoc(approvalRef);

    if (!approvalSnap.exists()) {
      throw new Error('Approval request not found');
    }

    const approvalData = approvalSnap.data();

    // Update the approval status
    await updateDoc(approvalRef, {
      status: request.status,
      reviewedAt: serverTimestamp(),
      reviewedBy: request.reviewerId,
      reviewerName: request.reviewerName,
      reason: request.reason || '',
    });

    // If approved, update the user's role
    if (request.status === 'approved') {
      const userRoleRef = doc(db, 'userRoles', approvalData.userId);
      await setDoc(userRoleRef, {
        role: approvalData.requestedRole,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      console.log(
        `User role updated to ${approvalData.requestedRole} for user ${approvalData.userId}`
      );
    }
  } catch (error) {
    console.error('Error reviewing approval:', error);
    throw error;
  }
};

/**
 * Delete an approval request
 */
export const deleteApprovalRequest = async (
  approvalId: string
): Promise<void> => {
  try {
    const approvalRef = doc(db, APPROVALS_COLLECTION, approvalId);
    await deleteDoc(approvalRef);
  } catch (error) {
    console.error('Error deleting approval request:', error);
    throw error;
  }
};

/**
 * Get approval statistics
 */
export const getApprovalStats = async (): Promise<{
  pending: number;
  approved: number;
  rejected: number;
  total: number;
}> => {
  try {
    const querySnapshot = await getDocs(collection(db, APPROVALS_COLLECTION));

    const stats = {
      pending: 0,
      approved: 0,
      rejected: 0,
      total: querySnapshot.size,
    };

    querySnapshot.forEach((doc) => {
      const status = doc.data().status;
      if (status === 'pending') stats.pending++;
      else if (status === 'approved') stats.approved++;
      else if (status === 'rejected') stats.rejected++;
    });

    return stats;
  } catch (error) {
    console.error('Error fetching approval stats:', error);
    throw error;
  }
};
