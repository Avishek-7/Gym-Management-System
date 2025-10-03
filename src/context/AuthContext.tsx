import React, { createContext, useEffect, useState } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services/core/firebase';
import { registerUser, loginUser, logoutUser, resetPassword as resetPasswordService } from '../services/auth/authService';
import { getUserRole, ensureUserRole, type UserRole } from '../services/auth/roleService';
import type { AuthContextType } from '../types/AuthContext';


const AuthContext = createContext<AuthContextType | undefined>(undefined);

export { AuthContext };

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        try {
          // Fetch user role from Firestore
          const role = await getUserRole(firebaseUser.uid);
          
          // If no role exists, assign default 'member' role
          if (!role) {
            const defaultRole = await ensureUserRole(firebaseUser.uid, 'member');
            setUserRole(defaultRole);
          } else {
            setUserRole(role);
          }
        } catch (error) {
          console.error('Error fetching user role:', error);
          setUserRole(null);
        }
      } else {
        setUserRole(null);
      }
      
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    await loginUser(email, password);
  };

  const signup = async (email: string, password: string, displayName: string) => {
    await registerUser(email, password, displayName);
  };

  const logout = async () => {
    await logoutUser();
    setUserRole(null);
  };

  const resetPassword = async (email: string) => {
    await resetPasswordService(email);
  };

  // Helper function to check if user has specific role(s)
  const hasRole = (role: UserRole | UserRole[]): boolean => {
    if (!userRole) return false;
    
    const roles = Array.isArray(role) ? role : [role];
    return roles.includes(userRole);
  };

  const value: AuthContextType = {
    user,
    userRole,
    loading,
    isAdmin: userRole === 'admin',
    isMember: userRole === 'member',
    isTrainer: userRole === 'trainer',
    hasRole,
    login,
    signup,
    logout,
    resetPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
