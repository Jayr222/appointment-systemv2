import express from 'express';
import {
  getGoogleAuthUrl,
  handleGoogleCallback,
  verifyGoogleToken,
  linkGoogleAccount,
  disconnectGoogleAccount
} from '../services/googleAuthService.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get Google OAuth authorization URL
router.get('/url', (req, res) => {
  try {
    const url = getGoogleAuthUrl();
    res.json({ url });
  } catch (error) {
    console.error('Error generating Google OAuth URL:', error);
    res.status(500).json({ message: 'Failed to generate Google OAuth URL' });
  }
});

// Handle Google OAuth callback (optional, for server-side flow)
router.get('/callback', async (req, res) => {
  try {
    const { code } = req.query;
    
    if (!code) {
      return res.status(400).json({ message: 'Authorization code not provided' });
    }

    const { user, token } = await handleGoogleCallback(code);

    // Redirect to frontend with token
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}&user=${encodeURIComponent(JSON.stringify(user))}`);
  } catch (error) {
    console.error('Error handling Google callback:', error);
    res.redirect(`${process.env.FRONTEND_URL}/auth/error?error=google_auth_failed`);
  }
});

// Verify Google token from frontend (recommended approach)
router.post('/verify', async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ message: 'ID token not provided' });
    }

    const { user, token } = await verifyGoogleToken(idToken);

    res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('Error verifying Google token:', error);
    res.status(401).json({ 
      message: error.message || 'Failed to verify Google token',
      error: error.message || 'Unknown error'
    });
  }
});

// Connect Google account for authenticated user
router.post('/connect', protect, async (req, res) => {
  try {
    const { idToken, password } = req.body;

    if (!idToken) {
      return res.status(400).json({ message: 'ID token not provided' });
    }

    // Get user with password field
    const User = (await import('../models/User.js')).default;
    const user = await User.findById(req.user.id).select('+password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify password if user has one
    // Note: Users who only use Google auth won't have a password, so we skip verification for them
    if (user.password) {
      if (!password) {
        return res.status(400).json({ 
          message: 'Password verification required to connect Google account',
          requiresPassword: true
        });
      }

      const isPasswordValid = await user.matchPassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({ 
          message: 'Invalid password. Please verify your password to connect Google account.',
          requiresPassword: true
        });
      }
    } else {
      // User doesn't have a password (Google-only account)
      // This shouldn't normally happen for linking, but handle it gracefully
      console.log(`User ${user.email} doesn't have a password - skipping password verification for Google account linking`);
    }

    const linkedUser = await linkGoogleAccount(req.user.id, idToken);

    res.json({
      success: true,
      message: 'Gmail account connected successfully.',
      user: {
        id: linkedUser._id,
        email: linkedUser.email,
        googleEmail: linkedUser.googleEmail,
        googleConnectedAt: linkedUser.googleConnectedAt,
        googleConnected: !!linkedUser.googleId
      }
    });
  } catch (error) {
    console.error('Error connecting Google account:', error);
    res.status(400).json({
      message: error.message || 'Failed to connect Google account'
    });
  }
});

// Disconnect Google account for authenticated user
router.delete('/connect', protect, async (req, res) => {
  try {
    const user = await disconnectGoogleAccount(req.user.id);

    res.json({
      success: true,
      message: 'Gmail account disconnected successfully.',
      user: {
        id: user._id,
        email: user.email,
        googleEmail: user.googleEmail,
        googleConnectedAt: user.googleConnectedAt,
        googleConnected: !!user.googleId
      }
    });
  } catch (error) {
    console.error('Error disconnecting Google account:', error);
    const status = error.message?.includes('Please set a password') ? 400 : 500;
    res.status(status).json({
      message: error.message || 'Failed to disconnect Google account'
    });
  }
});

export default router;

