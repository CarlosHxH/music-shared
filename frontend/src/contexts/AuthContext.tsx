import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '@/services/AuthService';
import type { Usuario, LoginRequest, RegisterRequest } from '@/types/types';

interface AuthContextType {
  user: Usuario | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

/**
 * Hook para acessar o contexto de autenticação
 * @returns AuthContextType com user, login, logout, etc.
 * @throws Error se usado fora de AuthProvider
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * Provider de autenticação
 * Envolve a aplicação e fornece estado de login/logout
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<Usuario | null>(authService.obterUsuarioAtual());
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;
  const isAdmin = user?.roles?.includes('ROLE_ADMIN') ?? false;

  useEffect(() => {
    const subUsuario = authService.obterUsuario().subscribe(setUser);
    return () => subUsuario.unsubscribe();
  }, []);

  useEffect(() => {
    if (!isLoading) return;
    setUser(authService.obterUsuarioAtual());
    setIsLoading(false);
  }, []);

  const refreshUser = useCallback(async () => {
    setUser(authService.obterUsuarioAtual());
  }, []);

  const login = useCallback(async (credentials: LoginRequest) => {
    await authService.login(credentials);
    setUser(authService.obterUsuarioAtual());
  }, []);

  const register = useCallback(async (data: RegisterRequest) => {
    await authService.registrar(data);
    setUser(authService.obterUsuarioAtual());
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    isAdmin,
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
