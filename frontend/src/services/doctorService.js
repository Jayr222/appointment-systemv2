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

  downloadMedicalRecordDocx: async (recordId) => {
    const response = await api.get(`/doctor/medical-records/${recordId}/download`, {
      responseType: 'blob'
    });
    return response.data;
  },

  getAssignedPatients: async () => {
    const response = await api.get('/doctor/patient-documents/patients');
    return response.data;
  },

  getPatientDocuments: async (patientId, documentType) => {
    const params = {};
    if (patientId) params.patientId = patientId;
    if (documentType) params.documentType = documentType;

    const response = await api.get('/doctor/patient-documents', { params });
    return response.data;
  },

  uploadPatientDocument: async (formData) => {
    const response = await api.post('/doctor/patient-documents', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  deletePatientDocument: async (documentId) => {
    const response = await api.delete(`/doctor/patient-documents/${documentId}`);
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

