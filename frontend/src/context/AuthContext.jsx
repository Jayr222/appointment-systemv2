import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if user is logged in on mount and validate token
    const validateAuth = async () => {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      
      // First, set user from localStorage immediately so user stays logged in during validation
      if (token && userData) {
        try {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
        } catch (error) {
          console.error('Error parsing user data:', error);
        }
      }
      
      // Then validate token in the background (don't block UI)
      if (token && userData) {
        try {
          // Verify token is still valid by calling /auth/me
          const response = await authService.getMe();
          setUser(response.user);
          // Update stored user data
          localStorage.setItem('user', JSON.stringify(response.user));
        } catch (error) {
          // Only logout on actual 401 (unauthorized), not on network errors
          if (error.response?.status === 401) {
            // Token is invalid or expired - clear auth data
            console.error('Token validation failed - unauthorized:', error);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
          } else {
            // Network error or other issue - keep user logged in with cached data
            console.warn('Token validation failed (network error) - keeping user logged in:', error.message);
          }
        }
      }
      
      setLoading(false);
    };

    validateAuth();
  }, []);

  const login = async (email, password) => {
    try {
      setError(null);
      const response = await authService.login(email, password);
      setUser(response.user);
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      return response;
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
      throw err;
    }
  };

  const loginWithToken = (userData, token) => {
    try {
      setError(null);
      setUser(userData);
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
    } catch (err) {
      setError('Failed to set user data');
      throw err;
    }
  };

  const register = async (userData) => {
    try {
      setError(null);
      const response = await authService.register(userData);
      setUser(response.user);
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      return response;
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
      throw err;
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setError(null);
  };

  const updateProfile = async (userData) => {
    try {
      setError(null);
      const response = await authService.updateProfile(userData);
      setUser(response.user);
      localStorage.setItem('user', JSON.stringify(response.user));
      return response;
    } catch (err) {
      setError(err.response?.data?.message || 'Profile update failed');
      throw err;
    }
  };

  const refreshUser = async () => {
    try {
      const response = await authService.getMe();
      if (response?.user) {
        setUser(response.user);
        localStorage.setItem('user', JSON.stringify(response.user));
      }
      return response?.user;
    } catch (err) {
      console.error('Failed to refresh user data:', err);
      throw err;
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    loginWithToken,
    register,
    logout,
    updateProfile,
    refreshUser,
    isAuthenticated: !!user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

