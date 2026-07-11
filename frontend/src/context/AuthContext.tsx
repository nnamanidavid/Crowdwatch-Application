import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService, pingGateway } from '../services/api';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<any>;
  signup: (email: string, password: string, username: string) => Promise<any>;
  logout: () => void;
  isDemoMode: boolean;
  gatewayAvailable: boolean;
  triggerRefresh: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [gatewayAvailable, setGatewayAvailable] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    async function initAuth() {
      // Check if real gateway is reachable
      const available = await pingGateway();
      setGatewayAvailable(available);

      if (authService.isLoggedIn()) {
        try {
          const currentUser = await authService.getCurrentUser();
          setUser(currentUser);
        } catch {
          authService.logout();
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    }
    initAuth();
  }, [refreshTrigger]);

  const triggerRefresh = () => setRefreshTrigger(prev => prev + 1);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const data = await authService.login(email, password);
      setUser(data.user);
      return data;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email: string, password: string, username: string) => {
    setLoading(true);
    try {
      const data = await authService.signup(email, password, username);
      setUser(data.user);
      return data;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    authService.logout();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        signup,
        logout,
        isDemoMode: !gatewayAvailable,
        gatewayAvailable,
        triggerRefresh,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
