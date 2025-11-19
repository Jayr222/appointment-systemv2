import crypto from 'crypto';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import path from 'path';
import fs from 'fs/promises';
import mongoose from 'mongoose';
import User from '../models/User.js';
import { generateToken } from '../utils/generateToken.js';
import { logActivity, logError } from '../services/loggingService.js';
import { noteFailedLogin, resetLoginAttempts } from '../middleware/rateLimiter.js';
import { sendPasswordResetEmail } from '../services/emailService.js';
import { AVATARS_DIR, ensureAvatarUploadDirExists } from '../services/avatarService.js';
import { uploadToStorage, deleteFromStorage, getStorageTypeFromUrl } from '../services/storageService.js';
import connectDB from '../config/db.js';

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
  try {
    const { name, email, password, phone, dateOfBirth, gender, address } = req.body;

    if (!email?.trim()) {
      return res.status(400).json({ message: 'Email is required' });
    }

    if (!phone?.trim()) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = phone.trim();
    const role = 'patient';

    // Check if user exists
    const userExists = await User.findOne({ email: normalizedEmail, isDeleted: { $ne: true } });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create user
    const user = await User.create({
      name,
      email: normalizedEmail,
      password,
      role,
      phone: normalizedPhone,
      dateOfBirth,
      gender,
      address
    });

    // Log activity (don't block registration if logging fails)
    logActivity(user._id, 'register', 'auth', `User registered as ${role}`).catch(err => {
      console.error('Failed to log registration activity:', err);
      // Don't throw - logging is non-critical
    });

    res.status(201).json({
      success: true,
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({ message: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check for user email
    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    if (!user) {
      const attemptInfo = noteFailedLogin(req);
      return res.status(401).json({
        message: 'Invalid credentials',
        attemptsRemaining: attemptInfo.remaining
      });
    }

    if (user.isDeleted) {
      return res.status(403).json({ message: 'Account has been deleted. Please contact an administrator for assistance.' });
    }

    // Check if account is locked
    if (user.lockUntil && user.lockUntil > Date.now()) {
      const lockTime = Math.ceil((user.lockUntil.getTime() - Date.now()) / 1000 / 60);
      return res.status(423).json({ 
        message: `Account locked due to too many failed login attempts. Please try again in ${lockTime} minute(s).`,
        lockUntil: user.lockUntil
      });
    }

    // Check if user has a password (Google-authenticated users might not)
    if (!user.password) {
      const attemptInfo = noteFailedLogin(req);
      return res.status(401).json({ 
        message: 'This account uses Google Sign-In. Please use the Google Sign-In button instead.',
        attemptsRemaining: attemptInfo.remaining
      });
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    
    if (!isMatch) {
      // Increment login attempts (per-user and per-IP)
      await user.incLoginAttempts();
      const attemptInfo = noteFailedLogin(req);
      
      // Check if account should be locked now
      const updatedUser = await User.findById(user._id);
      if (updatedUser.lockUntil && updatedUser.lockUntil > Date.now()) {
        const lockTime = Math.ceil((updatedUser.lockUntil.getTime() - Date.now()) / 1000 / 60);
        return res.status(423).json({ 
          message: `Account locked due to too many failed login attempts. Please try again in ${lockTime} minute(s).`,
          lockUntil: updatedUser.lockUntil,
          attemptsRemaining: 0
        });
      }
      
      // Calculate remaining attempts (5 max attempts, already incremented)
      const currentAttempts = updatedUser.loginAttempts || 1;
      const remainingAttempts = Math.max(0, 5 - currentAttempts);
      return res.status(401).json({ 
        message: 'Invalid credentials',
        attemptsRemaining: Math.min(remainingAttempts, attemptInfo.remaining)
      });
    }

    if (!user.isActive) {
      return res.status(401).json({ message: 'Account is inactive' });
    }

    // Reset login attempts on successful login (per-user and per-IP)
    await user.resetLoginAttempts();
    resetLoginAttempts(req);

    if (
      user.mustChangePassword &&
      user.temporaryPasswordExpiresAt &&
      new Date(user.temporaryPasswordExpiresAt).getTime() < Date.now()
    ) {
      user.mustChangePassword = false;
      user.temporaryPasswordIssuedAt = undefined;
      user.temporaryPasswordExpiresAt = undefined;
      await user.save({ validateBeforeSave: false });

      return res.status(401).json({
        message: 'Temporary password has expired. Please contact the clinic to obtain a new one.'
      });
    }

    // Log activity (don't block login if logging fails)
    logActivity(user._id, 'login', 'auth', 'User logged in', {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    }).catch(err => {
      console.error('Failed to log login activity:', err);
      // Don't throw - logging is non-critical
    });

    res.json({
      success: true,
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        mustChangePassword: user.mustChangePassword || false,
        temporaryPasswordExpiresAt: user.temporaryPasswordExpiresAt
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    console.error('Login error stack:', error.stack);
    res.status(500).json({ 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({
      success: true,
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        phone: user.phone,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
        address: user.address,
        googleConnected: !!user.googleId,
        googleEmail: user.googleEmail,
        googleConnectedAt: user.googleConnectedAt,
        authProvider: user.authProvider,
        twoFactorEnabled: user.twoFactorEnabled || false,
        lastPasswordChange: user.lastPasswordChange,
        lastEmailChange: user.lastEmailChange
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Log activity
    await logActivity(user._id, 'update_profile', 'auth', 'Profile updated');

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Upload avatar
// @route   POST /api/auth/avatar
// @access  Private
export const uploadAvatar = async (req, res) => {
  try {
    console.log('🟢 uploadAvatar controller called');
    console.log('   User ID:', req.user?.id);
    console.log('   Has file:', !!req.file);
    
    if (!req.file) {
      console.error('❌ Upload avatar: No file received');
      console.log('   Request body keys:', Object.keys(req.body || {}));
      console.log('   Request files:', Object.keys(req.files || {}));
      return res.status(400).json({ message: 'No file uploaded. Please select an image file.' });
    }

    // Check file size (5MB limit)
    if (req.file.size > 5 * 1024 * 1024) {
      return res.status(400).json({ message: 'File size too large. Maximum size is 5MB.' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get file buffer (from memory storage on serverless or disk storage locally)
    let fileBuffer;
    if (req.file.buffer) {
      fileBuffer = req.file.buffer;
    } else if (req.file.path) {
      // Local filesystem - read the file
      fileBuffer = await fs.readFile(req.file.path);
    } else {
      console.error('Upload avatar: No file buffer or path available');
      return res.status(500).json({ message: 'File processing error. Please try again.' });
    }

    // Delete old avatar from storage if it exists
    if (user.avatar) {
      const storageType = getStorageTypeFromUrl(user.avatar);
      // Only delete from cloud storage, not local files or data URLs (handled separately)
      if (storageType && storageType !== 'local' && storageType !== 'database') {
        await deleteFromStorage(user.avatar, storageType);
      } else if (!user.avatar.startsWith('http') && !user.avatar.startsWith('data:')) {
        // Delete local file
        ensureAvatarUploadDirExists();
        const oldAvatarPath = path.join(AVATARS_DIR, user.avatar);
        try {
          await fs.rm(oldAvatarPath, { force: true });
        } catch (error) {
          console.error('Error deleting old avatar:', error);
        }
      }
    }

    // Ensure database is connected before uploading to GridFS
    if (mongoose.connection.readyState !== 1) {
      console.log('⚠️ Database not connected, attempting to connect...');
      console.log('   Connection state:', mongoose.connection.readyState);
      await connectDB();
      console.log('✅ Database connection ensured, state:', mongoose.connection.readyState);
    } else {
      console.log('✅ Database already connected, state:', mongoose.connection.readyState);
    }
    
    // Upload to cloud storage (or use local/filesystem)
    const mimeType = req.file.mimetype || 'image/jpeg';
    const filename = req.file.originalname || `avatar-${Date.now()}.jpg`;
    console.log('📤 Starting avatar upload to storage...');
    console.log('   File size:', fileBuffer.length);
    console.log('   MIME type:', mimeType);
    console.log('   Filename:', filename);
    console.log('   Serverless environment:', !!process.env.VERCEL);
    
    let uploadResult;
    let avatarValue;
    let avatarUrl;

    // In serverless environments, GridFS streaming can be unreliable
    // For avatars, prefer base64 storage directly in database if GridFS fails
    if (process.env.VERCEL) {
      console.log('⚠️ Serverless environment detected - using base64 storage for avatars');
      // For serverless, store avatars as base64 data URLs directly in database
      // This is more reliable than GridFS streaming in serverless functions
      const base64 = fileBuffer.toString('base64');
      avatarValue = `data:${mimeType};base64,${base64}`;
      avatarUrl = avatarValue;
      console.log(`✅ Avatar stored as base64 data URL (length: ${avatarValue.length})`);
    } else {
      // Non-serverless: Try GridFS first, fall back to base64 if it fails
      try {
        uploadResult = await uploadToStorage(fileBuffer, filename, mimeType, 'avatars');
        console.log('📥 Upload result received:', uploadResult ? 'Success' : 'Null (using local)');
        
        if (uploadResult) {
          // Cloud storage was used
          avatarValue = uploadResult.url;
          avatarUrl = uploadResult.url;
          console.log(`✅ Avatar uploaded to ${uploadResult.storageType || 'cloud storage'}: ${avatarUrl}`);
          console.log('   File ID:', uploadResult.fileId);
        } else {
          // Local filesystem storage
          const fileExt = req.file.originalname ? path.extname(req.file.originalname) : '.jpg';
          avatarValue = req.file.filename || `avatar-${Date.now()}-${Math.round(Math.random() * 1E9)}${fileExt}`;
          avatarUrl = `/uploads/avatars/${avatarValue}`;
          console.log(`✅ Avatar saved to local filesystem: ${avatarUrl}`);
        }
      } catch (storageError) {
        console.error('⚠️ Storage upload failed, falling back to base64:', storageError.message);
        // Fallback to base64 storage in database
        const base64 = fileBuffer.toString('base64');
        avatarValue = `data:${mimeType};base64,${base64}`;
        avatarUrl = avatarValue;
        console.log(`✅ Avatar stored as base64 data URL (fallback, length: ${avatarValue.length})`);
      }
    }

    // Update user with new avatar
    console.log('💾 Saving avatar to user record...');
    console.log('   Avatar value:', avatarValue);
    user.avatar = avatarValue;
    await user.save();
    console.log('✅ User record updated with new avatar');

    // Log activity
    try {
      await logActivity(user._id, 'upload_avatar', 'auth', 'Avatar uploaded');
    } catch (error) {
      console.error('⚠️ Failed to log activity (non-critical):', error.message);
    }

    // Update user object in response (remove password)
    const userResponse = user.toObject();
    delete userResponse.password;

    console.log('📤 Sending response to client...');
    console.log('   Response avatar:', userResponse.avatar);
    res.json({
      success: true,
      avatar: avatarUrl,
      user: userResponse
    });
    console.log('✅ Avatar upload response sent successfully');
  } catch (error) {
    console.error('Upload avatar error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({ 
      message: error.message || 'Server error while uploading avatar',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id).select('+password');

    if (!(await user.matchPassword(currentPassword))) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Check cooldown period (1 month = 30 days)
    if (user.lastPasswordChange) {
      const daysSinceLastChange = (Date.now() - user.lastPasswordChange.getTime()) / (1000 * 60 * 60 * 24);
      const daysRemaining = 30 - daysSinceLastChange;
      
      if (daysRemaining > 0) {
        const days = Math.ceil(daysRemaining);
        return res.status(429).json({ 
          message: `You can change your password again in ${days} day${days !== 1 ? 's' : ''}. Please wait before changing your password again.`,
          daysRemaining: days,
          canChangeAfter: new Date(user.lastPasswordChange.getTime() + 30 * 24 * 60 * 60 * 1000)
        });
      }
    }

    user.password = newPassword;
    user.lastPasswordChange = new Date();
    user.mustChangePassword = false;
    user.temporaryPasswordIssuedAt = undefined;
    user.temporaryPasswordExpiresAt = undefined;
    await user.save();

    // Log activity
    await logActivity(user._id, 'change_password', 'auth', 'Password changed');

    res.json({
      success: true,
      message: 'Password changed successfully. You can change it again after 30 days.'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Forgot password - send reset email
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Normalize email (lowercase and trim)
    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({ 
      email: normalizedEmail, 
      isDeleted: { $ne: true } 
    });

    // Don't reveal if user exists or not for security
    if (!user) {
      return res.status(200).json({ 
        message: 'If an account with that email exists, a password reset link has been sent.' 
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    const resetPasswordExpire = Date.now() + 60 * 60 * 1000; // 1 hour

    user.resetPasswordToken = resetPasswordToken;
    user.resetPasswordExpire = resetPasswordExpire;
    await user.save({ validateBeforeSave: false });

    // Send email
    try {
      const emailSent = await sendPasswordResetEmail(user.email, resetToken);
      
      if (emailSent) {
        console.log(`✅ Password reset email sent to: ${user.email}`);
        res.status(200).json({ 
          message: 'If an account with that email exists, a password reset link has been sent.' 
        });
      } else {
        // Reset token fields if email fails
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save({ validateBeforeSave: false });
        
        console.error(`❌ Failed to send password reset email to: ${user.email}`);
        res.status(500).json({ 
          message: 'Email could not be sent. Please check your email configuration or try again later.' 
        });
      }
    } catch (emailError) {
      // Reset token fields if email fails
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
      
      console.error('❌ Email sending error in controller:', emailError);
      res.status(500).json({ 
        message: 'Email could not be sent. Please check your email configuration or try again later.' 
      });
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Reset password with token
// @route   PUT /api/auth/reset-password/:token
// @access  Public
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // Hash token to compare with stored token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find user with valid token
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
      isDeleted: { $ne: true }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // Set new password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Change email
// @route   PUT /api/auth/change-email
// @access  Private
export const changeEmail = async (req, res) => {
  try {
    const { newEmail, password } = req.body;

    if (!newEmail || !password) {
      return res.status(400).json({ message: 'New email and password are required' });
    }

    const user = await User.findById(req.user.id).select('+password');

    // Verify current password
    if (!(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Password is incorrect' });
    }

    // Check cooldown period (1 month = 30 days)
    if (user.lastEmailChange) {
      const daysSinceLastChange = (Date.now() - user.lastEmailChange.getTime()) / (1000 * 60 * 60 * 24);
      const daysRemaining = 30 - daysSinceLastChange;
      
      if (daysRemaining > 0) {
        const days = Math.ceil(daysRemaining);
        return res.status(429).json({ 
          message: `You can change your email again in ${days} day${days !== 1 ? 's' : ''}. Please wait before changing your email again.`,
          daysRemaining: days,
          canChangeAfter: new Date(user.lastEmailChange.getTime() + 30 * 24 * 60 * 60 * 1000)
        });
      }
    }

    // Check if email already exists
    const emailExists = await User.findOne({ email: newEmail.toLowerCase() });
    if (emailExists && emailExists._id.toString() !== user._id.toString()) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    // Update email
    user.email = newEmail.toLowerCase();
    user.lastEmailChange = new Date();
    await user.save();

    // Log activity
    await logActivity(user._id, 'change_email', 'auth', 'Email changed');

    res.json({
      success: true,
      message: 'Email changed successfully. You can change it again after 30 days.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('Change email error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Change phone number
// @route   PUT /api/auth/change-phone
// @access  Private
export const changePhone = async (req, res) => {
  try {
    const { newPhone, password } = req.body;

    if (!newPhone || !password) {
      return res.status(400).json({ message: 'New phone number and password are required' });
    }

    const user = await User.findById(req.user.id).select('+password');

    // Verify current password
    if (!(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Password is incorrect' });
    }

    // Update phone
    user.phone = newPhone;
    await user.save();

    // Log activity
    await logActivity(user._id, 'change_phone', 'auth', 'Phone number changed');

    res.json({
      success: true,
      message: 'Phone number changed successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('Change phone error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Generate 2FA secret
// @route   POST /api/auth/2fa/setup
// @access  Private
export const setup2FA = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    const secret = speakeasy.generateSecret({
      name: `${user.name || user.email} (Healthcare System)`,
      issuer: 'Healthcare System'
    });

    // Generate QR code data URL
    const qrCodeDataUrl = await QRCode.toDataURL(secret.otpauth_url);

    // Store secret temporarily (don't enable yet)
    user.twoFactorSecret = secret.base32;
    await user.save({ validateBeforeSave: false });

    res.json({
      success: true,
      secret: secret.base32,
      qrCode: qrCodeDataUrl,
      manualEntryKey: secret.base32
    });
  } catch (error) {
    console.error('2FA setup error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Verify and enable 2FA
// @route   POST /api/auth/2fa/verify
// @access  Private
export const verify2FA = async (req, res) => {
  try {
    const { token } = req.body;

    const user = await User.findById(req.user.id).select('+twoFactorSecret');

    if (!user.twoFactorSecret) {
      return res.status(400).json({ message: '2FA not set up. Please set up 2FA first.' });
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: token
    });

    if (!verified) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    // Generate backup codes
    const backupCodes = [];
    for (let i = 0; i < 10; i++) {
      backupCodes.push(Math.random().toString(36).substring(2, 10).toUpperCase());
    }

    user.twoFactorEnabled = true;
    user.twoFactorBackupCodes = backupCodes;
    await user.save({ validateBeforeSave: false });

    // Log activity
    await logActivity(user._id, 'enable_2fa', 'auth', 'Two-factor authentication enabled');

    res.json({
      success: true,
      message: '2FA enabled successfully',
      backupCodes: backupCodes
    });
  } catch (error) {
    console.error('2FA verify error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Disable 2FA
// @route   POST /api/auth/2fa/disable
// @access  Private
export const disable2FA = async (req, res) => {
  try {
    const { password } = req.body;

    const user = await User.findById(req.user.id).select('+password');

    // Verify password
    if (!(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Password is incorrect' });
    }

    user.twoFactorEnabled = false;
    user.twoFactorSecret = undefined;
    user.twoFactorBackupCodes = [];
    await user.save({ validateBeforeSave: false });

    // Log activity
    await logActivity(user._id, 'disable_2fa', 'auth', 'Two-factor authentication disabled');

    res.json({
      success: true,
      message: '2FA disabled successfully'
    });
  } catch (error) {
    console.error('2FA disable error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

