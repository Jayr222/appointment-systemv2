import api from './authService';

export const adminService = {
  getDashboard: async () => {
    const response = await api.get('/admin/dashboard');
    return response.data;
  },

  getUsers: async (role, isActive) => {
    const params = {};
    if (role) params.role = role;
    if (isActive !== undefined) params.isActive = isActive;
    
    const response = await api.get('/admin/users', { params });
    return response.data;
  },

  getUserById: async (userId) => {
    const response = await api.get(`/admin/users/${userId}`);
    return response.data;
  },

  updateUser: async (userId, userData) => {
    const response = await api.put(`/admin/users/${userId}`, userData);
    return response.data;
  },

  deleteUser: async (userId) => {
    const response = await api.delete(`/admin/users/${userId}`);
    return response.data;
  },

  getAppointmentRequests: async () => {
    const response = await api.get('/admin/appointment-requests');
    return response.data;
  },

  getAllAppointments: async (status, date) => {
    const params = {};
    if (status) params.status = status;
    if (date) params.date = date;
    
    const response = await api.get('/admin/appointments', { params });
    return response.data;
  },

  getSystemLogs: async (limit = 100) => {
    const response = await api.get('/admin/logs', { params: { limit } });
    return response.data;
  },

  getDoctorVerifications: async () => {
    const response = await api.get('/admin/doctor-verifications');
    return response.data;
  },

  approveDoctor: async (doctorId, data) => {
    const response = await api.put(`/admin/doctor-verifications/${doctorId}/approve`, data);
    return response.data;
  },

  rejectDoctor: async (doctorId, data) => {
    const response = await api.put(`/admin/doctor-verifications/${doctorId}/reject`, data);
    return response.data;
  }
};

export default adminService;

