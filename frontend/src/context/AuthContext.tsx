import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Organization } from '../types/index.js';
import { api } from '../services/api.js';

interface AuthContextType {
  user: User | null;
  organization: Organization | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, orgName?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('pulsewatch_user');
    const savedOrg = localStorage.getItem('pulsewatch_org');
    const token = localStorage.getItem('pulsewatch_access_token');

    if (savedUser && token) {
      try {
        setUser(JSON.parse(savedUser));
        if (savedOrg) {
          setOrganization(JSON.parse(savedOrg));
        }
      } catch {
        localStorage.clear();
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    const { user: authUser, organization: authOrg, accessToken, refreshToken } = data.data;

    localStorage.setItem('pulsewatch_access_token', accessToken);
    localStorage.setItem('pulsewatch_refresh_token', refreshToken);
    localStorage.setItem('pulsewatch_user', JSON.stringify(authUser));
    if (authOrg) {
      localStorage.setItem('pulsewatch_org', JSON.stringify(authOrg));
    }

    setUser(authUser);
    setOrganization(authOrg);
  };

  const register = async (name: string, email: string, password: string, orgName?: string) => {
    const { data } = await api.post('/auth/register', { name, email, password, orgName });
    const { user: authUser, organization: authOrg, accessToken, refreshToken } = data.data;

    localStorage.setItem('pulsewatch_access_token', accessToken);
    localStorage.setItem('pulsewatch_refresh_token', refreshToken);
    localStorage.setItem('pulsewatch_user', JSON.stringify(authUser));
    if (authOrg) {
      localStorage.setItem('pulsewatch_org', JSON.stringify(authOrg));
    }

    setUser(authUser);
    setOrganization(authOrg);
  };

  const logout = () => {
    localStorage.removeItem('pulsewatch_access_token');
    localStorage.removeItem('pulsewatch_refresh_token');
    localStorage.removeItem('pulsewatch_user');
    localStorage.removeItem('pulsewatch_org');
    setUser(null);
    setOrganization(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        organization,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
