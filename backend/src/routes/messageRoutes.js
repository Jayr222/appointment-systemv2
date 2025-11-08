import express from 'express';
import {
  sendMessage,
  getConversations,
  getConversation,
  getUnreadCount,
  markMessagesAsRead,
  getPatients,
  getDoctors
} from '../controllers/messageController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get conversations list
router.get('/conversations', getConversations);

// Get conversation with specific user
router.get('/conversation/:userId', getConversation);

// Get unread message count
router.get('/unread-count', getUnreadCount);

// Get patients list (for doctors)
router.get('/patients', getPatients);

// Get doctors list (for patients)
router.get('/doctors', getDoctors);

// Send a message
router.post('/', sendMessage);

// Mark messages as read
router.put('/mark-read', markMessagesAsRead);

export default router;

