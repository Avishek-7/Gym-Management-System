export interface Membership {
  id: string;
  name: string;
  duration: number; // in months
  price: number;
  features: string[];
  description?: string;
  isActive: boolean;
}

export interface CreateMembershipRequest {
  name: string;
  duration: number;
  price: number;
  features: string[];
  description?: string;
}