import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;

  console.log('🛡️ Protect middleware called for:', req.method, req.path);
  console.log('   Has Authorization header:', !!req.headers.authorization);

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];
      console.log('   Token found:', token ? 'Yes' : 'No');
      
      // Verify token
      const decoded = jwt.verify(token, config.JWT_SECRET);
      console.log('   Token decoded, userId:', decoded.userId);
      
      // Get user from token
      req.user = await User.findById(decoded.userId).select('-password');
      
      if (!req.user || !req.user.isActive) {
        console.log('   ❌ User not found or inactive');
        return res.status(401).json({ message: 'Not authorized, user not found or inactive' });
      }
      
      console.log('   ✅ User authenticated:', req.user.id);
      next();
    } catch (error) {
      console.log('   ❌ Token verification failed:', error.name, error.message);
      // Only log unexpected errors, not standard token expiration/invalid signature
      if (error.name !== 'JsonWebTokenError' && error.name !== 'TokenExpiredError') {
        console.error('Token verification error:', error);
      }
      return res.status(401).json({ message: 'Not authorized, invalid token' });
    }
  }

  if (!token) {
    console.log('   ❌ No token provided');
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `User role '${req.user.role}' is not authorized to access this route` 
      });
    }
    next();
  };
};

