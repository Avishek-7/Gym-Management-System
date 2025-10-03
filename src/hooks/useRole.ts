import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import type { UserRole } from '../services/auth/roleService';

/**
 * Custom hook to access user role information
 * 
 * @returns Role information and helper functions
 * @throws Error if used outside AuthProvider
 * 
 * @example
 * const { role, isAdmin, isMember, hasRole } = useRole();
 * 
 * if (isAdmin) {
 *   // Show admin features
 * }
 * 
 * if (hasRole(['admin', 'trainer'])) {
 *   // Show features for admins and trainers
 * }
 */
export const useRole = () => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useRole must be used within an AuthProvider');
  }

  const { userRole, isAdmin, isMember, isTrainer, hasRole } = context;

  return {
    /** Current user's role (admin, member, or trainer) */
    role: userRole,
    
    /** True if user is an admin */
    isAdmin,
    
    /** True if user is a member */
    isMember,
    
    /** True if user is a trainer */
    isTrainer,
    
    /** Check if user has one or more specific roles */
    hasRole: (role: UserRole | UserRole[]) => hasRole(role),
    
    /** True if user has a role assigned */
    hasAnyRole: userRole !== null,
  };
};
