import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { api, setStoredTokens, clearStoredTokens } from '../lib/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  login: (u: string, p: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUserSession: (updatedData: Partial<User>) => void;
  isManager: boolean;
  isCashier: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('smartpos_theme') as 'light' | 'dark') || 'light';
  });

  useEffect(() => {
    // Apply theme to html element
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('smartpos_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  useEffect(() => {
    async function checkAuth() {
      try {
        const token = localStorage.getItem('smartpos_access_token');
        if (token) {
          const res = await api.getMe();
          setUser(res.user);
        }
      } catch {
        clearStoredTokens();
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    checkAuth();

    const handleLogoutEvent = () => {
      setUser(null);
    };

    window.addEventListener('smartpos_logout', handleLogoutEvent);
    return () => window.removeEventListener('smartpos_logout', handleLogoutEvent);
  }, []);

  const login = async (u: string, p: string) => {
    const res = await api.login(u, p);
    setStoredTokens(res.accessToken, res.refreshToken);
    setUser(res.user);
  };

  const refreshUser = async () => {
    try {
      const res = await api.getMe();
      if (res?.user) {
        setUser(res.user);
      }
    } catch (err) {
      console.error('Failed to refresh user context:', err);
    }
  };

  const updateUserSession = (updatedData: Partial<User>) => {
    setUser(prev => (prev ? { ...prev, ...updatedData } : null));
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {
      // Ignore
    } finally {
      clearStoredTokens();
      setUser(null);
    }
  };

  const isManager = user?.role === UserRole.MANAGER;
  const isCashier = user?.role === UserRole.CASHIER;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        theme,
        toggleTheme,
        login,
        logout,
        refreshUser,
        updateUserSession,
        isManager,
        isCashier
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
