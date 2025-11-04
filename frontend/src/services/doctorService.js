import api from './authService';

export const doctorService = {
  getDashboard: async () => {
    const response = await api.get('/doctor/dashboard');
    return response.data;
  },

  getAppointments: async (status, date) => {
    const params = {};
    if (status) params.status = status;
    if (date) params.date = date;
    
    const response = await api.get('/doctor/appointments', { params });
    return response.data;
  },

  updateAppointmentStatus: async (appointmentId, status, notes) => {
    const response = await api.put(`/doctor/appointments/${appointmentId}/status`, {
      status,
      notes
    });
    return response.data;
  },

  getSchedule: async () => {
    const response = await api.get('/doctor/schedule');
    return response.data;
  },

  getPatientRecords: async (patientId) => {
    const response = await api.get(`/doctor/patients/${patientId}/records`);
    return response.data;
  },

  createMedicalRecord: async (recordData) => {
    const response = await api.post('/doctor/medical-records', recordData);
    return response.data;
  },

  cancelAppointment: async (appointmentId, reason) => {
    const response = await api.put(`/doctor/appointments/${appointmentId}/status`, {
      status: 'cancelled',
      notes: reason
    });
    return response.data;
  }
};

export default doctorService;

