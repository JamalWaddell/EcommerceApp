// AuthContext.tsx is the context provider for authentication state and actions
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

// Create the actual context object with a default value of null
const AuthContext = createContext<AuthContextType | null>(null);

// 3. Define that 'children' is a React component
interface AuthProviderProps {
  children: ReactNode;
}

// 4. The AuthProvider component that wraps the app and provides auth state and actions
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const isLoggedIn = !!user;

  // 5. Function to fetch the current user's info from the API and update state accordingly
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

  // 6. Function to handle user login, which calls the API and updates auth state
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

  // 7. Function to handle user signup, which calls the API and updates auth state
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

  // 8. Function to handle user logout, which clears the auth token and resets user state
  const logout = async () => {
    await setAuthToken(null);
    setUser(null);
  };

  // 9. Memoize the context value to optimize performance and prevent unnecessary re-renders
  const value = useMemo(
    () => ({ user, isLoggedIn, loading, error, login, logout, signup, fetchMe }),
    [user, isLoggedIn, loading, error]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// 10. Custom hook to easily access the AuthContext in other components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}