import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, User } from '../lib/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  isUser: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('quizforge_token');
    const savedUser = localStorage.getItem('quizforge_user');

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
        // Verify with server in background
        api.auth
          .me()
          .then((res) => {
            setUser(res.user);
            localStorage.setItem('quizforge_user', JSON.stringify(res.user));
          })
          .catch(() => {
            // Token expired or invalid
            logout();
          })
          .finally(() => setIsLoading(false));
        return;
      } catch {
        localStorage.removeItem('quizforge_token');
        localStorage.removeItem('quizforge_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const res = await api.auth.login(email, password);
    if (!res || !res.user) {
      throw new Error((res as any)?.error || 'Invalid response from server. Please check your credentials.');
    }
    setToken(res.token);
    setUser(res.user);
    localStorage.setItem('quizforge_token', res.token);
    localStorage.setItem('quizforge_user', JSON.stringify(res.user));
    return res.user;
  };

  const logout = async () => {
    try {
      if (token) {
        await api.auth.logout().catch(() => {});
      }
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('quizforge_token');
      localStorage.removeItem('quizforge_user');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        logout,
        isAdmin: user?.role === 'admin',
        isUser: user?.role === 'user',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
