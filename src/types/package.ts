// Fee Package Types
export interface FeePackage {
  id: string;
  name: string;
  description: string;
  duration: number; // in months (1=monthly, 3=quarterly, 6=half-yearly, 12=yearly)
  price: number;
  features: string[];
  isActive: boolean;
  category: 'basic' | 'standard' | 'premium' | 'vip';
  maxMembers?: number; // optional limit on how many members can use this package
  currentMembers: number; // track current usage
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateFeePackageRequest {
  name: string;
  description: string;
  duration: number;
  price: number;
  features: string[];
  category: 'basic' | 'standard' | 'premium' | 'vip';
  maxMembers?: number;
}

export interface UpdateFeePackageRequest {
  name?: string;
  description?: string;
  duration?: number;
  price?: number;
  features?: string[];
  category?: 'basic' | 'standard' | 'premium' | 'vip';
  maxMembers?: number;
  isActive?: boolean;
}

// Member Package Assignment
export interface MemberPackageAssignment {
  packageId: string;
  packageName: string;
  startDate: Date;
  endDate: Date;
  price: number;
  status: 'active' | 'expired' | 'cancelled';
  autoRenew: boolean;
}
