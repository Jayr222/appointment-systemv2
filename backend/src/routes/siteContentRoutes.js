import express from 'express';
import {
  getSiteContent,
  updateSiteContent,
  resetSiteContent
} from '../controllers/siteContentController.js';
import { protect } from '../middleware/authMiddleware.js';
import { adminOnly } from '../middleware/adminOnly.js';

const router = express.Router();

// Public route - get site content
router.get('/', getSiteContent);

// Admin routes - update site content
router.put('/', protect, adminOnly, updateSiteContent);
router.post('/reset', protect, adminOnly, resetSiteContent);

export default router;

