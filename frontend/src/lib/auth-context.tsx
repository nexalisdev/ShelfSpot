// New authentication system using the NestJS backend
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
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
  logout: () => void;
  updateProfile: (name: string) => Promise<void>;
  updateProfileEmail: (email: string) => Promise<void>;
  resetPassword: (email: string, newPassword: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Avoid double initializations
    if (isInitialized) {
      console.log("AuthContext: Already initialized, skipping");
      return;
    }

    const initAuth = async () => {
      console.log("AuthContext: Initializing authentication");
      setIsInitialized(true);

      const token = localStorage.getItem('access_token');
      console.log("AuthContext: Token found:", !!token);

      if (token) {
        try {
          console.log("AuthContext: Getting profile from backend");
          const profile = await backendApi.getProfile();
          console.log("AuthContext: Profile received:", profile);
          setUser(profile);
        } catch (error) {
          console.log("AuthContext: Profile fetch failed, removing tokens:", error);
          // Invalid token, remove it completely
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        }
      }
      setLoading(false);
      console.log("AuthContext: Authentication initialization complete");
    };

    initAuth();
  }, [isInitialized]);

  const login = async (email: string, password: string) => {
    try {
      const response = await backendApi.login(email, password);

      // Store both tokens in localStorage
      localStorage.setItem('access_token', response.access_token);
      localStorage.setItem('refresh_token', response.refresh_token);

      // Also store access token in cookies for the middleware
      document.cookie = `access_token=${response.access_token}; path=/; max-age=${60 * 60 * 24 * 7}`; // 7 jours

      setUser(response.user);
    } catch (error) {
      throw error;
    }
  };

  const register = async (email: string, password: string, name?: string) => {
    try {
      const response = await backendApi.register(email, password, name);
      localStorage.setItem('access_token', response.access_token);
      localStorage.setItem('refresh_token', response.refresh_token);
      document.cookie = `access_token=${response.access_token}; path=/; max-age=${60 * 60 * 24 * 7}`;
      setUser(response.user);
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');

    // Also remove the cookie
    document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';

    setUser(null);
  };

  const updateProfile = async (name: string) => {
    try {
      const updatedUser = await backendApi.updateProfile(name);
      setUser(updatedUser);
    } catch (error) {
      throw error;
    }
  };

  const updateProfileEmail = async (email: string) => {
    try {
      const updatedUser = await backendApi.updateProfileEmail(email);
      setUser(updatedUser);
    } catch (error) {
      throw error;
    }
  };

  const resetPassword = async (email: string, newPassword: string) => {
    try {
      await backendApi.resetPassword(email, newPassword);
    } catch (error) {
      throw error;
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      await backendApi.forgotPassword(email);
    } catch (error) {
      throw error;
    }
  };

  const refreshUser = async () => {
    try {
      const profile = await backendApi.getProfile();
      setUser(profile);
    } catch (error) {
      // If the error is due to an invalid token, log out the user
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setUser(null);
      throw error;
    }
  };

  const value = {
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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
