import React, { createContext, useEffect, useState } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services/core/firebase';
import { registerUser, loginUser, logoutUser, resetPassword as resetPasswordService } from '../services/auth/authService';
import type { AuthContextType } from '../types/AuthContext';


const AuthContext = createContext<AuthContextType | undefined>(undefined);

export { AuthContext };

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
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
  };

  const resetPassword = async (email: string) => {
    await resetPasswordService(email);
  };

  const value: AuthContextType = {
    user,
    loading,
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
