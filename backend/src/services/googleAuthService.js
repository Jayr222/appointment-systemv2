import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.js';
import { config } from '../config/env.js';
import { generateToken } from '../utils/generateToken.js';

// Initialize OAuth client for server-side flows (needs secret/redirect)
const serverOAuthClient = new OAuth2Client(
  config.GOOGLE_CLIENT_ID,
  config.GOOGLE_CLIENT_SECRET,
  config.GOOGLE_REDIRECT_URI
);

// Helper to create a fresh client when only ID token verification is needed.
// Using a new client avoids credential caching issues when switching accounts.
const createVerifierClient = () => new OAuth2Client(config.GOOGLE_CLIENT_ID);

// Parse domains from comma-separated string (case-insensitive, handles arrays)
const parseDomains = (domainsInput) => {
  // Handle if it's already an array (from old config)
  if (Array.isArray(domainsInput)) {
    return domainsInput.map(d => String(d).trim().toLowerCase()).filter(d => d.length > 0);
  }
  
  // Handle string
  if (!domainsInput || typeof domainsInput !== 'string') return [];
  
  return domainsInput
    .split(',')
    .map(d => d.trim().toLowerCase())
    .filter(d => d.length > 0);
};

// Determine user role from email domain (case-insensitive)
// Returns 'patient' by default for non-organizational emails
const getRoleFromEmail = (email) => {
  if (!email) return 'patient';
  
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return 'patient';
  
  const adminDomains = parseDomains(config.ADMIN_DOMAINS);
  const doctorDomains = parseDomains(config.DOCTOR_DOMAINS);
  
  // Check if domain is in admin domains list (case-insensitive)
  if (adminDomains.length > 0 && adminDomains.includes(domain)) {
    return 'admin';
  }
  
  // Check if domain is in doctor domains list (case-insensitive)
  if (doctorDomains.length > 0 && doctorDomains.includes(domain)) {
    return 'doctor';
  }
  
  // Default to patient for any other email (Gmail, Yahoo, etc.)
  return 'patient';
};

// Check if email is valid (all emails are now allowed for Google Sign-In)
const isEmailValid = (email) => {
  if (!email) {
    console.log('[Google Auth] No email provided');
    return false;
  }
  
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) {
    console.log('[Google Auth] Invalid email format:', email);
    return false;
  }
  
  // All valid email addresses are allowed for Google Sign-In
  // Organizational domains get admin/doctor roles, others get patient role
  console.log('[Google Auth] Email is valid:', email);
  return true;
};

// Generate Google OAuth authorization URL
export const getGoogleAuthUrl = () => {
  const scopes = [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile'
  ];

  return serverOAuthClient.generateAuthUrl({
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
    const { tokens } = await serverOAuthClient.getToken(code);
    serverOAuthClient.setCredentials(tokens);

    // Get user info from Google
    const verifier = createVerifierClient();
    const ticket = await verifier.verifyIdToken({
      idToken: tokens.id_token,
      audience: config.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    // Validate email format
    if (!isEmailValid(email)) {
      throw new Error('Invalid email address');
    }

    // Determine role from email domain (returns 'patient' by default for non-organizational emails)
    const role = getRoleFromEmail(email);
    const domain = email.split('@')[1]?.toLowerCase();
    
    console.log(`[Google Auth] User ${email} signing in with role: ${role}`);

    // Check if user exists with this Google ID or email
    let user = await User.findOne({ 
      $or: [
        { googleId },
        { email: email.toLowerCase() }
      ]
    });

    if (user) {
      let shouldSave = false;

      // Update user with Google ID if not already set
      if (!user.googleId) {
        user.googleId = googleId;
        // Only switch auth provider to Google if user does not have a local password
        if (!user.password) {
          user.authProvider = 'google';
        }
        shouldSave = true;
      }

      // Update role based on domain (unless admin)
      if (user.role !== 'admin' && role && user.role !== role) {
        user.role = role;
        shouldSave = true;
      }

      // Update connected email metadata
      const normalizedEmail = email?.toLowerCase();
      if (normalizedEmail && user.googleEmail !== normalizedEmail) {
        user.googleEmail = normalizedEmail;
        shouldSave = true;
      }
      if (!user.googleConnectedAt) {
        user.googleConnectedAt = new Date();
        shouldSave = true;
      }

      if (picture && !user.avatar) {
        user.avatar = picture;
        shouldSave = true;
      }

      if (shouldSave) {
        await user.save();
      }
    } else {
      // Create new user with role determined from email domain
      user = await User.create({
        googleId,
        email: email.toLowerCase(),
        name: name || 'Google User',
        authProvider: 'google',
        role: role, // Role determined from domain
        avatar: picture || null,
        googleEmail: email.toLowerCase(),
        googleConnectedAt: new Date(),
        isActive: true
      });
      
      console.log(`New ${role} account created via Google: ${email}${role === 'doctor' ? ' - Verification required' : ''}`);
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
    const verifier = createVerifierClient();
    const ticket = await verifier.verifyIdToken({
      idToken,
      audience: config.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    // Validate email format
    if (!isEmailValid(email)) {
      throw new Error('Invalid email address');
    }

    // Determine role from email domain (returns 'patient' by default for non-organizational emails)
    const role = getRoleFromEmail(email);
    const domain = email.split('@')[1]?.toLowerCase();
    
    console.log(`[Google Auth] User ${email} signing in with role: ${role}`);

    // Check if user exists
    let user = await User.findOne({
      $or: [
        { googleId },
        { email: email.toLowerCase() }
      ]
    });

    if (user) {
      let shouldSave = false;

      // Update user with Google ID if not already set
      if (!user.googleId) {
        user.googleId = googleId;
        if (!user.password) {
          user.authProvider = 'google';
        }
        shouldSave = true;
      }

      if (user.role !== 'admin' && role && user.role !== role) {
        user.role = role;
        shouldSave = true;
      }

      const normalizedEmail = email?.toLowerCase();
      if (normalizedEmail && user.googleEmail !== normalizedEmail) {
        user.googleEmail = normalizedEmail;
        shouldSave = true;
      }
      if (!user.googleConnectedAt) {
        user.googleConnectedAt = new Date();
        shouldSave = true;
      }

      if (picture && !user.avatar) {
        user.avatar = picture;
        shouldSave = true;
      }

      if (shouldSave) {
        await user.save();
      }
    } else {
      // Create new user with role determined from email domain
      user = await User.create({
        googleId,
        email: email.toLowerCase(),
        name: name || 'Google User',
        authProvider: 'google',
        role: role, // Role determined from domain
        avatar: picture || null,
        googleEmail: email.toLowerCase(),
        googleConnectedAt: new Date(),
        isActive: true
      });
      
      console.log(`New ${role} account created via Google: ${email}${role === 'doctor' ? ' - Verification required' : ''}`);
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

export const linkGoogleAccount = async (userId, idToken) => {
  try {
    if (!idToken) {
      throw new Error('ID token is required');
    }

    const verifier = createVerifierClient();
    const ticket = await verifier.verifyIdToken({
      idToken,
      audience: config.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    if (!isEmailValid(email)) {
      throw new Error('Invalid email address');
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const existing = await User.findOne({
      googleId,
      _id: { $ne: userId }
    });

    if (existing) {
      throw new Error('This Google account is already connected to another user.');
    }

    const normalizedEmail = email?.toLowerCase();

    user.googleId = googleId;
    if (normalizedEmail) {
      user.googleEmail = normalizedEmail;
    }
    user.googleConnectedAt = new Date();

    // Preserve local auth for users with passwords
    if (!user.password) {
      user.authProvider = 'google';
    }

    if (picture && !user.avatar) {
      user.avatar = picture;
    }

    await user.save();

    return user;
  } catch (error) {
    console.error('Google account linking error:', error);
    throw new Error(error.message || 'Failed to connect Google account');
  }
};

export const disconnectGoogleAccount = async (userId) => {
  try {
    const user = await User.findById(userId).select('+password');

    if (!user) {
      throw new Error('User not found');
    }

    if (!user.googleId) {
      return user;
    }

    if (user.authProvider === 'google' && !user.password) {
      throw new Error('Your account uses Google sign-in. Please set a password before disconnecting Gmail.');
    }

    user.googleId = undefined;
    user.googleEmail = undefined;
    user.googleConnectedAt = undefined;

    if (user.authProvider === 'google') {
      user.authProvider = 'local';
    }

    await user.save();

    return user;
  } catch (error) {
    console.error('Google account disconnect error:', error);
    throw new Error(error.message || 'Failed to disconnect Google account');
  }
};

export default {
  getGoogleAuthUrl,
  handleGoogleCallback,
  verifyGoogleToken,
  linkGoogleAccount,
  disconnectGoogleAccount
};

