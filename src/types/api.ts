import type { Member } from './member';
import type { Membership, CreateMembershipRequest } from './membership';
import type { Payment, CreatePaymentRequest } from './payment';
import type { GymClass, CreateClassRequest } from './class';

// Re-export types for easier imports
export type { CreateMembershipRequest } from './membership';
export type { CreatePaymentRequest } from './payment';
export type { CreateClassRequest } from './class';

// API Request/Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
  };
  token: string;
}

export interface CreateMemberRequest {
  name: string;
  email: string;
  phone: string;
  packageId: string;
  joinDate: string;
}

export interface UpdateMemberRequest extends Partial<CreateMemberRequest> {
  status?: "active" | "inactive";
  expiryDate?: string;
}

// Generic API data types
export type ApiData = 
  | Member 
  | CreateMemberRequest 
  | UpdateMemberRequest
  | Membership 
  | CreateMembershipRequest
  | Payment 
  | CreatePaymentRequest
  | GymClass 
  | CreateClassRequest
  | LoginRequest 
  | RegisterRequest
  | { memberId: string };