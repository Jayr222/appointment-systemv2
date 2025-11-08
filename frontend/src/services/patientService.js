import api from './authService';

export const patientService = {
  getDashboard: async () => {
    const response = await api.get('/patient/dashboard');
    return response.data;
  },

  getAppointments: async () => {
    const response = await api.get('/patient/appointments');
    return response.data;
  },

  getUpcomingAppointments: async () => {
    const response = await api.get('/patient/appointments/upcoming');
    return response.data;
  },

  bookAppointment: async (appointmentData) => {
    const response = await api.post('/patient/appointments', appointmentData);
    return response.data;
  },

  cancelAppointment: async (appointmentId, reason) => {
    const response = await api.put(`/patient/appointments/${appointmentId}/cancel`, { reason });
    return response.data;
  },

  getMedicalRecords: async () => {
    const response = await api.get('/patient/records');
    return response.data;
  },

  getDoctors: async () => {
    const response = await api.get('/patient/doctors');
    return response.data;
  },

  getMedicalHistory: async () => {
    const response = await api.get('/patient/medical-history');
    return response.data;
  },

  updateMedicalHistory: async (medicalHistory) => {
    const response = await api.put('/patient/medical-history', { medicalHistory });
    return response.data;
  },

  getAvailableSlots: async (doctorId, date) => {
    const response = await api.get('/patient/available-slots', {
      params: { doctorId, date }
    });
    return response.data;
  },

  downloadMedicalRecordDocx: async (recordId) => {
    const response = await api.get(`/patient/records/${recordId}/download`, {
      responseType: 'blob'
    });
    return response.data;
  }
};

export default patientService;

