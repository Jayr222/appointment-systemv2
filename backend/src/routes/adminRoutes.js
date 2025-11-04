import express from 'express';
import {
  getDashboard,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  getAppointmentRequests,
  getAllAppointments,
  getSystemLogs
} from '../controllers/adminController.js';
import {
  getPendingVerifications,
  approveDoctor,
  rejectDoctor
} from '../controllers/doctorVerificationController.js';
import { adminOnly } from '../middleware/adminOnly.js';

const router = express.Router();

router.get('/dashboard', adminOnly, getDashboard);
router.get('/users', adminOnly, getUsers);
router.get('/users/:id', adminOnly, getUserById);
router.put('/users/:id', adminOnly, updateUser);
router.delete('/users/:id', adminOnly, deleteUser);
router.get('/appointment-requests', adminOnly, getAppointmentRequests);
router.get('/appointments', adminOnly, getAllAppointments);
router.get('/logs', adminOnly, getSystemLogs);

// Doctor verification routes
router.get('/doctor-verifications', adminOnly, getPendingVerifications);
router.put('/doctor-verifications/:id/approve', adminOnly, approveDoctor);
router.put('/doctor-verifications/:id/reject', adminOnly, rejectDoctor);

export default router;

