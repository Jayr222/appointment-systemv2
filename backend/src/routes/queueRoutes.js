import express from 'express';
import { 
  getTodayQueueList, 
  assignQueue, 
  updateStatus, 
  callNext, 
  checkIn,
  updatePriority
} from '../controllers/queueController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All queue routes require authentication
router.use(protect);

// Get today's queue
router.get('/today', getTodayQueueList);

// Assign queue number to appointment
router.post('/assign/:appointmentId', assignQueue);

// Update queue status
router.put('/:appointmentId/status', updateStatus);
router.put('/:appointmentId/priority', updatePriority);

// Call next patient
router.post('/next', callNext);

// Check in patient
router.post('/checkin/:appointmentId', checkIn);

export default router;

