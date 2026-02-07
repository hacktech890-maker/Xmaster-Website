import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { adminAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check token on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('adminToken');
      if (token) {
        try {
          const response = await adminAPI.verifyToken();
          if (response.data.success) {
            setIsAuthenticated(true);
            setAdmin(response.data.admin);
          } else {
            localStorage.removeItem('adminToken');
          }
        } catch (error) {
          console.error('Token verification failed:', error);
          localStorage.removeItem('adminToken');
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = useCallback(async (password, username = 'admin') => {
    try {
      const response = await adminAPI.login(password, username);
      if (response.data.success) {
        localStorage.setItem('adminToken', response.data.token);
        setIsAuthenticated(true);
        setAdmin(response.data.admin);
        return { success: true };
      }
      return { success: false, error: 'Login failed' };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Invalid credentials' 
      };
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('adminToken');
    setIsAuthenticated(false);
    setAdmin(null);
  }, []);

  const value = {
    isAuthenticated,
    admin,
    loading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};