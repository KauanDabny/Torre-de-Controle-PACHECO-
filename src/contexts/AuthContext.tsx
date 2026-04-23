import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  name: string;
  role: string;
  avatar: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  login: (name: string, role: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  // Load from local storage if exists
  useEffect(() => {
    const savedUser = localStorage.getItem('transpacheco_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const login = (name: string, role: string) => {
    const newUser = {
      name,
      role,
      email: 'user@transpacheco.com.br',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop'
    };
    setUser(newUser);
    localStorage.setItem('transpacheco_user', JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('transpacheco_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
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
