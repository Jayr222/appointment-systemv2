import express from 'express';
import {
  register,
  login,
  getMe,
  updateProfile,
  uploadAvatar,
  changePassword,
  forgotPassword,
  resetPassword,
  changeEmail,
  changePhone,
  setup2FA,
  verify2FA,
  disable2FA
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { uploadAvatar as uploadAvatarMiddleware } from '../services/avatarService.js';
import { loginAttemptLimiter, formSubmissionLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Simple test route to verify routing works (no auth required)
router.get('/test', (req, res) => {
  res.json({ message: 'Auth routes are working!', timestamp: new Date().toISOString() });
});

router.post('/register', formSubmissionLimiter({ windowMs: 5 * 1000, message: 'Please wait before registering again' }), register);
router.post('/login', loginAttemptLimiter(), login);
router.post('/forgot-password', formSubmissionLimiter({ windowMs: 60 * 1000, message: 'Please wait before requesting another reset link' }), forgotPassword);
router.put('/reset-password/:token', formSubmissionLimiter({ windowMs: 5 * 1000, message: 'Please wait before trying again' }), resetPassword);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);

// Test route to verify routing works (must be before /avatar to avoid conflict)
router.get('/avatar/test', protect, (req, res) => {
  res.json({ message: 'Avatar route is accessible', user: req.user.id });
});

// Avatar upload route with proper middleware chain
router.post('/avatar', 
  protect, 
  (req, res, next) => {
    console.log('🔵 Avatar upload route - Multer middleware starting');
    console.log('   Method:', req.method);
    console.log('   URL:', req.url);
    console.log('   Path:', req.path);
    console.log('   Original URL:', req.originalUrl);
    console.log('   Content-Type:', req.headers['content-type']);
    console.log('   Has Authorization:', !!req.headers.authorization);
    
    uploadAvatarMiddleware.single('avatar')(req, res, (err) => {
      if (err) {
        console.error('❌ Multer upload error:', err);
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ message: 'File size too large. Maximum size is 2MB.' });
        }
        if (err.message && err.message.includes('Only image files')) {
          return res.status(400).json({ message: err.message });
        }
        return res.status(400).json({ message: 'File upload error. Please try again.' });
      }
      console.log('✅ File received:', req.file ? 'Yes' : 'No');
      if (req.file) {
        console.log('   File details:', {
          fieldname: req.file.fieldname,
          originalname: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
          hasBuffer: !!req.file.buffer,
          hasFilename: !!req.file.filename
        });
      }
      next();
    });
  },
  uploadAvatar
);
router.put('/change-password', protect, changePassword);
router.put('/change-email', protect, changeEmail);
router.put('/change-phone', protect, changePhone);
router.post('/2fa/setup', protect, setup2FA);
router.post('/2fa/verify', protect, verify2FA);
router.post('/2fa/disable', protect, disable2FA);

// Debug: Log registered routes on startup
if (process.env.NODE_ENV !== 'production') {
  console.log('📋 Auth routes registered:');
  console.log('   GET  /api/auth/test (no auth)');
  console.log('   GET  /api/auth/avatar/test (auth required)');
  console.log('   POST /api/auth/avatar (auth required)');
}

export default router;

