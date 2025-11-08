import express from 'express';
import {
  getDashboard,
  getUpcomingAppointments,
  getAllAppointments,
  bookAppointment,
  cancelAppointment,
  getMedicalRecords,
  getDoctors,
  getMedicalHistory,
  updateMedicalHistory,
  getAvailableSlots,
  holdAppointmentSlot,
  releaseAppointmentHold,
  downloadMedicalRecordDocx
} from '../controllers/patientController.js';
import { patientOnly } from '../middleware/patientOnly.js';
import { formSubmissionLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.get('/dashboard', patientOnly, getDashboard);
router.get('/appointments/upcoming', patientOnly, getUpcomingAppointments);
router.get('/appointments', patientOnly, getAllAppointments);
router.post('/appointments', patientOnly, formSubmissionLimiter({ windowMs: 5 * 1000, message: 'Please wait 5 seconds before booking another appointment' }), bookAppointment);
router.put('/appointments/:id/cancel', patientOnly, cancelAppointment);
router.post('/appointments/hold', patientOnly, holdAppointmentSlot);
router.delete('/appointments/hold', patientOnly, releaseAppointmentHold);
router.get('/records', patientOnly, getMedicalRecords);
router.get('/records/:id/download', patientOnly, downloadMedicalRecordDocx);
router.get('/doctors', patientOnly, getDoctors);
router.get('/available-slots', patientOnly, getAvailableSlots);
router.get('/medical-history', patientOnly, getMedicalHistory);
router.put('/medical-history', patientOnly, updateMedicalHistory);

export default router;

