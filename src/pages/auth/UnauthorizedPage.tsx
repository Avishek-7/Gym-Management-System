import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useRole } from '../../hooks/useRole';
import Background from '../../components/common/Background';

const UnauthorizedPage: React.FC = () => {
  const navigate = useNavigate();
  const { role, isAdmin, isMember, isTrainer } = useRole();

  const getDashboardLink = () => {
    if (isAdmin) return '/admin/dashboard';
    if (isTrainer) return '/trainer/dashboard';
    if (isMember) return '/member/dashboard';
    return '/';
  };

  return (
    <>
      <Background />
      <div className="min-h-screen flex items-center justify-center px-4 relative z-10">
        <div className="max-w-md w-full">
          <div className="backdrop-blur-md bg-gray-900/80 p-8 rounded-2xl shadow-2xl border border-gray-800">
            {/* Icon */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-500/20 border-2 border-red-500/50 mb-4">
                <svg
                  className="w-10 h-10 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">Access Denied</h1>
              <p className="text-gray-400">
                You don't have permission to access this page.
              </p>
            </div>

            {/* Role Info */}
            {role && (
              <div className="mb-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                <p className="text-sm text-gray-400 mb-1">Your current role:</p>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    isAdmin
                      ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                      : isMember
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : 'bg-green-500/20 text-green-400 border border-green-500/30'
                  }`}>
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </span>
                </div>
              </div>
            )}

            {/* Message */}
            <div className="mb-6 text-center">
              <p className="text-gray-300 text-sm">
                This page requires different permissions. If you believe this is an error, 
                please contact your administrator.
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <button
                onClick={() => navigate(-1)}
                className="w-full px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors duration-200 font-medium"
              >
                Go Back
              </button>
              
              <Link
                to={getDashboardLink()}
                className="block w-full px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors duration-200 font-medium text-center"
              >
                Go to Dashboard
              </Link>

              <Link
                to="/login"
                className="block w-full px-4 py-3 border border-gray-600 hover:bg-gray-800 text-gray-300 rounded-lg transition-colors duration-200 font-medium text-center"
              >
                Back to Login
              </Link>
            </div>
          </div>

          {/* Help Text */}
          <p className="text-center text-gray-500 text-sm mt-6">
            Need help? Contact support at{' '}
            <a href="mailto:support@gymfit.com" className="text-blue-400 hover:text-blue-300">
              support@gymfit.com
            </a>
          </p>
        </div>
      </div>
    </>
  );
};

export default UnauthorizedPage;
