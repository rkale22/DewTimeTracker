import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
  token: string | null;
  userRole: string | null;
  userName: string | null;
  company: string | null;
  isAuthenticated: boolean;
  login: (token: string, role: string, userName: string, company: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('access_token'));
  const [userRole, setUserRole] = useState<string | null>(() => localStorage.getItem('user_role'));
  const [userName, setUserName] = useState<string | null>(() => localStorage.getItem('user_name'));
  const [company, setCompany] = useState<string | null>(() => localStorage.getItem('company'));

  useEffect(() => {
    if (token) {
      localStorage.setItem('access_token', token);
    } else {
      localStorage.removeItem('access_token');
    }
    if (userRole) {
      localStorage.setItem('user_role', userRole);
    } else {
      localStorage.removeItem('user_role');
    }
    if (userName) {
      localStorage.setItem('user_name', userName);
    } else {
      localStorage.removeItem('user_name');
    }
    if (company) {
      localStorage.setItem('company', company);
    } else {
      localStorage.removeItem('company');
    }
  }, [token, userRole, userName, company]);

  const login = (newToken: string, role: string, name: string, comp: string) => {
    setToken(newToken);
    setUserRole(role);
    setUserName(name);
    setCompany(comp);
  };

  const logout = () => {
    setToken(null);
    setUserRole(null);
    setUserName(null);
    setCompany(null);
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_name');
    localStorage.removeItem('company');
  };

  const value: AuthContextType = {
    token,
    userRole,
    userName,
    company,
    isAuthenticated: !!token,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 