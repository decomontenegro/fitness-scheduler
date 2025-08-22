'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/services/api';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  phone?: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null | undefined;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check for stored auth data
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      setToken(storedToken);
      // Set cookie for middleware
      document.cookie = `auth-token=${storedToken}; path=/; max-age=${60 * 60 * 24 * 7}`;
      setLoading(false);
    } else {
      // Check if we have a cookie but no localStorage (happens after login redirect)
      const cookies = document.cookie.split(';');
      let authToken = null;
      for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'auth-token') {
          authToken = value;
          break;
        }
      }
      
      if (authToken) {
        // We have a token in cookie, fetch user data
        fetch('/api/users/me', {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        })
        .then(res => res.json())
        .then(data => {
          if (data.user) {
            setUser(data.user);
            setToken(authToken);
            localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.setItem('token', authToken);
          } else {
            setUser(null);
          }
          setLoading(false);
        })
        .catch(() => {
          setUser(null);
          setLoading(false);
        });
      } else {
        setUser(null);
        setLoading(false);
      }
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const data = await api.login(email, password);
      
      // Use accessToken if available, otherwise use token
      const authToken = data.accessToken || data.token;
      
      setUser(data.user);
      setToken(authToken);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('token', authToken);
      
      // Set cookie for middleware
      document.cookie = `auth-token=${authToken}; path=/; max-age=${60 * 60 * 24 * 7}`;

      // Small delay to ensure localStorage is updated
      setTimeout(() => {
        // Redirect based on role
        if (data.user.role === 'TRAINER') {
          router.push('/dashboard/trainer');
        } else {
          router.push('/dashboard/client');
        }
      }, 100);
    } catch (error: any) {
      throw new Error(error.message || 'Login failed');
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      router.push('/login');
    }
  };

  return (
    <AuthContext.Provider 
      value={{
        user,
        token,
        loading,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}