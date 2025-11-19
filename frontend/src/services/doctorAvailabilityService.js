import api from './authService';

export const doctorAvailabilityService = {
  // Get doctor's unavailability schedule
  getAvailability: async (doctorId = null) => {
    const params = doctorId ? { doctorId } : {};
    const response = await api.get('/doctor/availability', { params });
    return response.data;
  },

  // Mark doctor as unavailable
  markUnavailable: async (data) => {
    const response = await api.post('/doctor/availability', data);
    return response.data;
  },

  // Update unavailability
  updateUnavailability: async (id, data) => {
    const response = await api.put(`/doctor/availability/${id}`, data);
    return response.data;
  },

  // Remove unavailability
  removeUnavailability: async (id) => {
    const response = await api.delete(`/doctor/availability/${id}`);
    return response.data;
  },

  // Break Times
  getBreakTimes: async (doctorId = null) => {
    const params = doctorId ? { doctorId } : {};
    const response = await api.get('/doctor/availability/break-times', { params });
    return response.data;
  },

  addBreakTime: async (data) => {
    const response = await api.post('/doctor/availability/break-times', data);
    return response.data;
  },

  removeBreakTime: async (id) => {
    const response = await api.delete(`/doctor/availability/break-times/${id}`);
    return response.data;
  },

  updateBreakTime: async (id, data) => {
    const response = await api.put(`/doctor/availability/break-times/${id}`, data);
    return response.data;
  }
};

export default doctorAvailabilityService;

