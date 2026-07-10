import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { fetchWithAuth, getTokens, clearTokens } from '../lib/auth';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const { accessToken } = getTokens();
      if (accessToken) {
        try {
          const res = await fetchWithAuth('/auth/me');
          if (res.ok) {
            const data = await res.json();
            setUser(data);
          } else {
            clearTokens();
          }
        } catch (e) {
          console.error(e);
          clearTokens();
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = (newUser: User) => {
    setUser(newUser);
  };

  const logout = () => {
    clearTokens();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
