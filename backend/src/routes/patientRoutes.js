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
  updateMedicalHistory
} from '../controllers/patientController.js';
import { patientOnly } from '../middleware/patientOnly.js';

const router = express.Router();

router.get('/dashboard', patientOnly, getDashboard);
router.get('/appointments/upcoming', patientOnly, getUpcomingAppointments);
router.get('/appointments', patientOnly, getAllAppointments);
router.post('/appointments', patientOnly, bookAppointment);
router.put('/appointments/:id/cancel', patientOnly, cancelAppointment);
router.get('/records', patientOnly, getMedicalRecords);
router.get('/doctors', patientOnly, getDoctors);
router.get('/medical-history', patientOnly, getMedicalHistory);
router.put('/medical-history', patientOnly, updateMedicalHistory);

export default router;

