import express from 'express';
import { getGoogleAuthUrl, handleGoogleCallback, verifyGoogleToken } from '../services/googleAuthService.js';

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

export default router;

