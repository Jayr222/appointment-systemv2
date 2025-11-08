import express from 'express';
import {
  getDashboard,
  getAppointments,
  updateAppointmentStatus,
  getPatientRecords,
  createMedicalRecord,
  getSchedule,
  getPatientMedicalHistory
} from '../controllers/doctorController.js';
import { getVerificationStatus } from '../controllers/doctorVerificationController.js';
import { doctorOnly } from '../middleware/doctorOnly.js';
import verifiedDoctorOnly from '../middleware/verifiedDoctorOnly.js';
import patientDocumentRoutes from './patientDocumentRoutes.js';

const router = express.Router();

// Routes accessible to all doctors (verified or not)
router.get('/dashboard', doctorOnly, getDashboard);
router.get('/verification-status', doctorOnly, getVerificationStatus);
router.get('/appointments', doctorOnly, getAppointments); // Allow unverified doctors to see appointments
router.put('/appointments/:id/status', doctorOnly, updateAppointmentStatus); // Allow unverified doctors to update appointment status
router.get('/schedule', doctorOnly, getSchedule); // Allow unverified doctors to see their schedule
router.get('/patients/:id/medical-history', doctorOnly, getPatientMedicalHistory); // Allow all doctors to view patient medical history

// Patient document routes (require verified doctor access)
router.use('/patient-documents', patientDocumentRoutes);

// Routes requiring verified doctors only
router.get('/patients/:id/records', doctorOnly, verifiedDoctorOnly, getPatientRecords);
router.post('/medical-records', doctorOnly, verifiedDoctorOnly, createMedicalRecord);

export default router;

