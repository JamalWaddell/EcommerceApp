import React, { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
// Make sure the path to your client file is correct
import { apiFetch, setAuthToken } from '../api-to-front/client';

// 1. Define what a "User" object looks like
interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
}

// 2. Define what the AuthContext "provides" to the rest of the app
interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  loading: boolean;
  error: string | null;
  login: (params: any) => Promise<User>;
  signup: (params: any) => Promise<any>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

// 3. Define that 'children' is a React component
interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const isLoggedIn = !!user;

  const fetchMe = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch('/api/me');
      setUser(data);
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMe();
  }, []);

  // Notice the ': any' - this tells TypeScript "I know what I'm doing, allow this data"
  const login = async ({ email, password }: any) => {
    setError(null);
    try {
      const data = await apiFetch('/api/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      await setAuthToken(data.token);
      setUser(data.user);
      return data.user;
    } catch (err: any) {
      setError(err.message || 'Login failed');
      throw err;
    }
  };

  const signup = async (params: any) => {
    setError(null);
    try {
      const data = await apiFetch('/api/users', {
        method: 'POST',
        body: JSON.stringify(params),
      });
      await setAuthToken(data.token);
      await fetchMe();
      return data;
    } catch (err: any) {
      setError(err.message || 'Signup failed');
      throw err;
    }
  };

  const logout = async () => {
    await setAuthToken(null);
    setUser(null);
  };

  const value = useMemo(
    () => ({ user, isLoggedIn, loading, error, login, logout, signup, fetchMe }),
    [user, isLoggedIn, loading, error]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}