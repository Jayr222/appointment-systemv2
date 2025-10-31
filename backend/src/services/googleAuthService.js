import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.js';
import { config } from '../config/env.js';
import { generateToken } from '../utils/generateToken.js';

// Initialize Google OAuth client
const oauth2Client = new OAuth2Client(
  config.GOOGLE_CLIENT_ID,
  config.GOOGLE_CLIENT_SECRET,
  config.GOOGLE_REDIRECT_URI
);

// Determine user role from email domain
const getRoleFromEmail = (email) => {
  if (!email) return 'patient';
  
  const domain = email.split('@')[1];
  
  // Check if domain is in admin domains list
  if (config.ADMIN_DOMAINS && config.ADMIN_DOMAINS.includes(domain)) {
    return 'admin';
  }
  
  // Check if domain is in doctor domains list
  if (config.DOCTOR_DOMAINS && config.DOCTOR_DOMAINS.includes(domain)) {
    return 'doctor';
  }
  
  // Default to patient
  return 'patient';
};

// Generate Google OAuth authorization URL
export const getGoogleAuthUrl = () => {
  const scopes = [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile'
  ];

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent',
    include_granted_scopes: true
  });
};

// Handle Google OAuth callback and create/login user
export const handleGoogleCallback = async (code) => {
  try {
    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get user info from Google
    const ticket = await oauth2Client.verifyIdToken({
      idToken: tokens.id_token,
      audience: config.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    // Check if user exists with this Google ID or email
    let user = await User.findOne({ 
      $or: [
        { googleId },
        { email: email.toLowerCase() }
      ]
    });

    if (user) {
      // Update user with Google ID if not already set
      if (!user.googleId) {
        user.googleId = googleId;
        user.authProvider = 'google';
        // Set role to doctor for all Google logins
        if (user.role !== 'admin') {
          user.role = 'doctor';
        }
        if (picture) user.avatar = picture;
        await user.save();
      } else {
        // If user already has Google ID, update role to doctor (unless admin)
        if (user.role !== 'admin') {
          user.role = 'doctor';
          await user.save();
        }
      }
    } else {
      // Create new user with doctor role for all Google logins
      user = await User.create({
        googleId,
        email: email.toLowerCase(),
        name: name || 'Google User',
        authProvider: 'google',
        role: 'doctor', // All Google logins get doctor role
        avatar: picture || null,
        isActive: true
      });
      
      console.log(`New doctor account created via Google: ${email} - Verification required`);
    }

    // Generate JWT token
    const token = generateToken(user._id);

    return {
      user,
      token
    };
  } catch (error) {
    console.error('Google OAuth error:', error);
    throw new Error(`Failed to authenticate with Google: ${error.message || 'Unknown error'}`);
  }
};

// Verify Google ID token (for frontend direct verification)
export const verifyGoogleToken = async (idToken) => {
  try {
    const ticket = await oauth2Client.verifyIdToken({
      idToken,
      audience: config.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    // Check if user exists
    let user = await User.findOne({
      $or: [
        { googleId },
        { email: email.toLowerCase() }
      ]
    });

    if (user) {
      // Update user with Google ID if not already set
      if (!user.googleId) {
        user.googleId = googleId;
        user.authProvider = 'google';
        // Set role to doctor for all Google logins
        if (user.role !== 'admin') {
          user.role = 'doctor';
        }
        if (picture) user.avatar = picture;
        await user.save();
      } else {
        // If user already has Google ID, update role to doctor (unless admin)
        if (user.role !== 'admin') {
          user.role = 'doctor';
          await user.save();
        }
      }
    } else {
      // Create new user with doctor role for all Google logins
      user = await User.create({
        googleId,
        email: email.toLowerCase(),
        name: name || 'Google User',
        authProvider: 'google',
        role: 'doctor', // All Google logins get doctor role
        avatar: picture || null,
        isActive: true
      });
      
      console.log(`New doctor account created via Google: ${email} - Verification required`);
    }

    // Generate JWT token
    const token = generateToken(user._id);

    return {
      user,
      token
    };
  } catch (error) {
    console.error('Google token verification error:', error);
    throw new Error(`Failed to verify Google token: ${error.message || 'Unknown error'}`);
  }
};

export default {
  getGoogleAuthUrl,
  handleGoogleCallback,
  verifyGoogleToken
};

