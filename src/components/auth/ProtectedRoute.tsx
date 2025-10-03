import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useRole } from '../../hooks/useRole';
import type { UserRole } from '../../services/auth/roleService';

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Required role(s) to access this route. If not specified, only authentication is required */
  requiredRole?: UserRole | UserRole[];
  /** Redirect path if user is not authenticated. Defaults to /login */
  redirectTo?: string;
  /** Redirect path if user doesn't have required role. Defaults to /unauthorized */
  unauthorizedRedirect?: string;
}

/**
 * ProtectedRoute Component
 * 
 * Protects routes based on authentication and role requirements.
 * 
 * @example
 * // Require authentication only
 * <ProtectedRoute>
 *   <Dashboard />
 * </ProtectedRoute>
 * 
 * @example
 * // Require admin role
 * <ProtectedRoute requiredRole="admin">
 *   <AdminPanel />
 * </ProtectedRoute>
 * 
 * @example
 * // Require admin or trainer role
 * <ProtectedRoute requiredRole={['admin', 'trainer']}>
 *   <ManageClasses />
 * </ProtectedRoute>
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  redirectTo = '/login',
  unauthorizedRedirect = '/unauthorized',
}) => {
  const { user, loading } = useAuth();
  const { hasRole, hasAnyRole } = useRole();
  const location = useLocation();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // If no role is required, just check authentication
  if (!requiredRole) {
    return <>{children}</>;
  }

  // Check if user has any role assigned
  if (!hasAnyRole) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center max-w-md p-8 bg-gray-800 rounded-lg border border-gray-700">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-white mb-2">Role Not Assigned</h2>
          <p className="text-gray-400 mb-4">
            Your account doesn't have a role assigned. Please contact an administrator.
          </p>
          <button
            onClick={() => window.location.href = '/login'}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  // Check if user has required role(s)
  if (!hasRole(requiredRole)) {
    return <Navigate to={unauthorizedRedirect} state={{ from: location }} replace />;
  }

  // User is authenticated and has required role
  return <>{children}</>;
};
