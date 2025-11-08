import express from 'express';
import {
  getDoctorAvailability,
  markUnavailable,
  removeUnavailability,
  updateUnavailability
} from '../controllers/doctorAvailabilityController.js';
import { protect } from '../middleware/authMiddleware.js';
import { doctorOnly } from '../middleware/doctorOnly.js';
import { adminOnly } from '../middleware/adminOnly.js';

const router = express.Router();

// Get doctor availability (doctor or admin)
router.get('/', protect, getDoctorAvailability);

// Mark unavailable (doctor or admin)
router.post('/', protect, markUnavailable);

// Update unavailability (doctor or admin)
router.put('/:id', protect, updateUnavailability);

// Remove unavailability (doctor or admin)
router.delete('/:id', protect, removeUnavailability);

export default router;

