import React, { createContext, useContext, useState, useEffect } from 'react';
import { adminAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyAuth = async () => {
      const token = localStorage.getItem('adminToken');

      if (!token) {
        console.log('🔑 No token found');
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }

      console.log('🔑 Token found, verifying...');

      try {
        const response = await adminAPI.verifyToken();
        console.log('🔑 Verify response:', response.data);

        if (response.data?.success || response.data?.valid) {
          console.log('✅ Token valid');
          setIsAuthenticated(true);
        } else {
          console.log('❌ Token invalid, clearing');
          localStorage.removeItem('adminToken');
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('❌ Token verify failed:', error.message);
        
        // Only remove token if it's a 401/403 (unauthorized)
        // Don't remove on network errors (service worker blocking, etc.)
        if (error.response?.status === 401 || error.response?.status === 403) {
          console.log('❌ Unauthorized, clearing token');
          localStorage.removeItem('adminToken');
          setIsAuthenticated(false);
        } else {
          // Network error - keep the token and try to use it
          console.log('⚠️ Network error during verify, keeping token');
          setIsAuthenticated(true);
        }
      } finally {
        setLoading(false);
      }
    };

    verifyAuth();
  }, []);

  const login = (token) => {
    console.log('✅ Login successful, saving token');
    localStorage.setItem('adminToken', token);
    setIsAuthenticated(true);
  };

  const logout = () => {
    console.log('👋 Logging out');
    localStorage.removeItem('adminToken');
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, loading, login, logout }}>
      {loading ? (
        <div className="min-h-screen bg-dark-400 flex items-center justify-center">
          <div className="w-10 h-10 border-3 border-gray-700 border-t-red-500 rounded-full animate-spin" />
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

export default AuthContext;