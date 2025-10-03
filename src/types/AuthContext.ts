import type { User as FirebaseUser } from 'firebase/auth';
import type { UserRole } from '../services/auth/roleService';

export interface AuthContextType {
    user: FirebaseUser | null;
    userRole: UserRole | null;
    loading: boolean;
    isAdmin: boolean;
    isMember: boolean;
    isTrainer: boolean;
    hasRole: (role: UserRole | UserRole[]) => boolean;
    login: (email: string, password: string) => Promise<void>;
    signup: (email: string, password: string, displayName: string) => Promise<void>;
    logout: () => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
}