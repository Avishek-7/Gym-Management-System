import type { MemberPackageAssignment } from './package';

export interface Member {
  id: string; // Firestore document ID
  userId?: string; // Firebase Auth UID - links to user account (optional for admin-created members without accounts)
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: Date;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  membershipId: string; // Gym membership number (e.g., "MEM-001")
  joinDate: Date;
  status: 'active' | 'inactive' | 'suspended';
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  // Fee Package Assignment
  package?: MemberPackageAssignment;
  medicalConditions?: string[];
  profileImage?: string;
  lastVisit?: Date;
  createdAt: Date;
  updatedAt: Date;
}