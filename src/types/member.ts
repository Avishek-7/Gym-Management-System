export interface Member {
  id: string;
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
  membershipId: string;
  joinDate: Date;
  status: 'active' | 'inactive' | 'suspended';
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  medicalConditions?: string[];
  profileImage?: string;
  lastVisit?: Date;
  createdAt: Date;
  updatedAt: Date;
}