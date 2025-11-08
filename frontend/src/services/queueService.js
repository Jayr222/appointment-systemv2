import api from './authService';

export const queueService = {
  // Get today's queue
  getTodayQueue: async (doctorId = null) => {
    const params = doctorId ? { doctorId } : {};
    const response = await api.get('/queue/today', { params });
    return response.data;
  },

  // Assign queue number to appointment
  assignQueue: async (appointmentId) => {
    const response = await api.post(`/queue/assign/${appointmentId}`);
    return response.data;
  },

  // Update queue status
  updateQueueStatus: async (appointmentId, status) => {
    const response = await api.put(`/queue/${appointmentId}/status`, { status });
    return response.data;
  },

  // Update priority or visit type
  updatePriority: async (appointmentId, { priorityLevel, visitType }) => {
    const response = await api.put(`/queue/${appointmentId}/priority`, { priorityLevel, visitType });
    return response.data;
  },

  // Call next patient
  callNextPatient: async (doctorId = null) => {
    const response = await api.post('/queue/next', { doctorId });
    return response.data;
  },

  // Check in patient
  checkIn: async (appointmentId) => {
    const response = await api.post(`/queue/checkin/${appointmentId}`);
    return response.data;
  }
};

export default queueService;

