import api from './authService';

export const adminService = {
  getDashboard: async () => {
    const response = await api.get('/admin/dashboard');
    return response.data;
  },

  getUsers: async (role, isActive, includeDeleted) => {
    const params = {};
    if (role) params.role = role;
    if (isActive !== undefined) params.isActive = isActive;
    if (includeDeleted) params.includeDeleted = includeDeleted;
    
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

  restoreUser: async (userId) => {
    const response = await api.put(`/admin/users/${userId}/restore`);
    return response.data;
  },

  getHealthReports: async (params = {}) => {
    const response = await api.get('/admin/reports/health', { params });
    return response.data;
  },

  getDeletedUserLogs: async (limit = 50) => {
    const response = await api.get('/admin/users/deleted/logs', { params: { limit } });
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
  },

  getPendingArrivals: async (options = {}) => {
    const params = {};
    if (options.date) params.date = options.date; // 'YYYY-MM-DD'
    if (options.includeFuture !== undefined) params.includeFuture = String(options.includeFuture);
    const response = await api.get('/admin/appointments/pending-arrival', { params });
    return response.data;
  },

  confirmPatientArrival: async (appointmentId, doctorId = null, options = {}) => {
    const payload = { doctorId };
    if (options.convertToToday !== undefined) payload.convertToToday = options.convertToToday;
    const response = await api.put(`/admin/appointments/${appointmentId}/confirm-arrival`, payload);
    return response.data;
  },

  createWalkInAppointment: async (data) => {
    const response = await api.post('/admin/walk-in-appointments', data);
    return response.data;
  },

  getPatientDocuments: async (patientId, documentType) => {
    const params = {};
    if (patientId) params.patientId = patientId;
    if (documentType) params.documentType = documentType;
    
    const response = await api.get('/admin/patient-documents', { params });
    return response.data;
  },

  uploadPatientDocument: async (formData) => {
    const response = await api.post('/admin/patient-documents', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  deletePatientDocument: async (documentId) => {
    const response = await api.delete(`/admin/patient-documents/${documentId}`);
    return response.data;
  }
};

export default adminService;

