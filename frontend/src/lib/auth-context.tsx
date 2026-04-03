'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { backendApi } from './backend-api';

interface User {
  id: string;
  email: string;
  name?: string;
  admin?: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (name: string) => Promise<void>;
  updateProfileEmail: (email: string) => Promise<void>;
  resetPassword: (currentPassword: string, newPassword: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        // If the HttpOnly cookie is present, this request will succeed
        const profile = await backendApi.getProfile();
        setUser(profile);
      } catch {
        // No valid session — user is not authenticated
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await backendApi.login(email, password);
    // Backend sets the HttpOnly cookie via Set-Cookie header
    setUser(response.user);
  };

  const register = async (email: string, password: string, name?: string) => {
    const response = await backendApi.register(email, password, name);
    setUser(response.user);
  };

  const logout = async () => {
    await backendApi.logout();
    setUser(null);
  };

  const updateProfile = async (name: string) => {
    const updatedUser = await backendApi.updateProfile(name);
    setUser(updatedUser);
  };

  const updateProfileEmail = async (email: string) => {
    const updatedUser = await backendApi.updateProfileEmail(email);
    setUser(updatedUser);
  };

  const resetPassword = async (currentPassword: string, newPassword: string) => {
    await backendApi.resetPassword(currentPassword, newPassword);
  };

  const forgotPassword = async (email: string) => {
    await backendApi.forgotPassword(email);
  };

  const refreshUser = async () => {
    try {
      const profile = await backendApi.getProfile();
      setUser(profile);
    } catch {
      setUser(null);
    }
  };

  const value = useMemo(() => ({
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
    updateProfileEmail,
    resetPassword,
    forgotPassword,
    refreshUser,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
