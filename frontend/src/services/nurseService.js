import api from './authService';

export const nurseService = {
  getDashboard: async () => {
    const response = await api.get('/nurse/dashboard');
    return response.data;
  },

  getTodayQueue: async () => {
    const response = await api.get('/nurse/queue');
    return response.data;
  },

  getPatientInfo: async (patientId) => {
    const response = await api.get(`/nurse/patients/${patientId}`);
    return response.data;
  },

  recordVitalSigns: async (vitalSignsData) => {
    const response = await api.post('/nurse/vital-signs', vitalSignsData);
    return response.data;
  },

  getPatientVitalSigns: async (patientId) => {
    const response = await api.get(`/nurse/vital-signs/${patientId}`);
    return response.data;
  },

  createFollowUp: async (followUpData) => {
    const response = await api.post('/nurse/follow-ups', followUpData);
    return response.data;
  },

  getFollowUps: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.priority) params.append('priority', filters.priority);
    if (filters.patientId) params.append('patientId', filters.patientId);
    
    const response = await api.get(`/nurse/follow-ups?${params.toString()}`);
    return response.data;
  },

  updateFollowUp: async (followUpId, updateData) => {
    const response = await api.put(`/nurse/follow-ups/${followUpId}`, updateData);
    return response.data;
  }
};

export default nurseService;

