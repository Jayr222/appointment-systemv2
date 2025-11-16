import axios from 'axios';
import { API_BASE_URL } from '../utils/constants';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Remove Content-Type for FormData - let browser set it with boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle response errors - auto logout on 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only handle 401 errors, ignore network errors
    if (error.response?.status === 401) {
      const requestUrl = error.config?.url || '';
      const method = error.config?.method?.toLowerCase();

      const skipAutoLogout =
        requestUrl.includes('/auth/me') ||
        (method === 'get' && requestUrl.startsWith('/patient/'));

      if (!skipAutoLogout) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export const authService = {
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  updateProfile: async (userData) => {
    const response = await api.put('/auth/profile', userData);
    return response.data;
  },

  uploadAvatar: async (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    // Don't set Content-Type - axios will set it automatically with boundary for FormData
    const response = await api.post('/auth/avatar', formData);
    return response.data;
  },

  changePassword: async (currentPassword, newPassword) => {
    const response = await api.put('/auth/change-password', {
      currentPassword,
      newPassword
    });
    return response.data;
  },

  forgotPassword: async (email) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (token, password) => {
    const response = await api.put(`/auth/reset-password/${token}`, { password });
    return response.data;
  },

  changeEmail: async (newEmail, password) => {
    const response = await api.put('/auth/change-email', { newEmail, password });
    if (response.data.user) {
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  changePhone: async (newPhone, password) => {
    const response = await api.put('/auth/change-phone', { newPhone, password });
    if (response.data.user) {
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  connectGoogleAccount: async (idToken, password) => {
    const response = await api.post('/auth/google/connect', { idToken, password });
    return response.data;
  },

  disconnectGoogleAccount: async () => {
    const response = await api.delete('/auth/google/connect');
    return response.data;
  },

  setup2FA: async () => {
    const response = await api.post('/auth/2fa/setup');
    return response.data;
  },

  verify2FA: async (token) => {
    const response = await api.post('/auth/2fa/verify', { token });
    return response.data;
  },

  disable2FA: async (password) => {
    const response = await api.post('/auth/2fa/disable', { password });
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};

export default api;

