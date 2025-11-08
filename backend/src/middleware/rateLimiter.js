import User from '../models/User.js';

// In-memory store for rate limiting (can be replaced with Redis in production)
const requestStore = new Map();

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of requestStore.entries()) {
    // Remove entries older than 1 hour
    if (data.lastReset < now - 60 * 60 * 1000) {
      requestStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * General API rate limiter
 * Limits requests per user/IP per time window
 */
export const apiRateLimiter = (options = {}) => {
  const {
    windowMs = 60 * 1000, // 1 minute default
    maxRequests = 60, // 60 requests per minute default
    message = 'Too many requests, please try again later',
    keyGenerator = (req) => {
      // Use user ID if authenticated, otherwise use IP
      return req.user ? `user:${req.user.id}` : `ip:${req.ip}`;
    }
  } = options;

  return async (req, res, next) => {
    try {
      const key = keyGenerator(req);
      const now = Date.now();
      
      let requestData = requestStore.get(key);
      
      // Initialize or reset if window expired
      if (!requestData || now - requestData.lastReset > windowMs) {
        requestData = {
          count: 0,
          lastReset: now
        };
      }
      
      // Check if limit exceeded
      if (requestData.count >= maxRequests) {
        return res.status(429).json({
          success: false,
          message,
          retryAfter: Math.ceil((windowMs - (now - requestData.lastReset)) / 1000)
        });
      }
      
      // Increment count
      requestData.count++;
      requestStore.set(key, requestData);
      
      // Add rate limit headers
      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - requestData.count));
      res.setHeader('X-RateLimit-Reset', new Date(requestData.lastReset + windowMs).toISOString());
      
      next();
    } catch (error) {
      console.error('Rate limiter error:', error);
      // On error, allow request to proceed (fail open)
      next();
    }
  };
};

/**
 * Form submission rate limiter
 * Limits form submissions to 1 per 5 seconds
 */
export const formSubmissionLimiter = (options = {}) => {
  const {
    windowMs = 5 * 1000, // 5 seconds
    maxRequests = 1,
    message = 'Please wait before submitting again'
  } = options;

  return async (req, res, next) => {
    try {
      const key = req.user 
        ? `form:user:${req.user.id}:${req.path}`
        : `form:ip:${req.ip}:${req.path}`;
      
      const now = Date.now();
      let requestData = requestStore.get(key);
      
      if (!requestData || now - requestData.lastReset > windowMs) {
        requestData = {
          count: 0,
          lastReset: now
        };
      }
      
      if (requestData.count >= maxRequests) {
        const retryAfter = Math.ceil((windowMs - (now - requestData.lastReset)) / 1000);
        return res.status(429).json({
          success: false,
          message,
          retryAfter
        });
      }
      
      requestData.count++;
      requestStore.set(key, requestData);
      
      next();
    } catch (error) {
      console.error('Form submission limiter error:', error);
      next();
    }
  };
};

/**
 * Login attempt rate limiter
 * Limits login attempts per IP
 */
export const loginAttemptLimiter = () => {
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxAttempts = 5;

  return async (req, res, next) => {
    try {
      const key = `login:ip:${req.ip}`;
      const now = Date.now();
      
      let attemptData = requestStore.get(key);
      
      if (!attemptData || now - attemptData.lastReset > windowMs) {
        attemptData = {
          count: 0,
          lastReset: now
        };
      }
      
      // If already over the limit within the window, block
      if (attemptData.count >= maxAttempts) {
        const retryAfter = Math.ceil((windowMs - (now - attemptData.lastReset)) / 1000);
        return res.status(429).json({
          success: false,
          message: 'Too many login attempts. Please try again later.',
          retryAfter
        });
      }
      
      // Pass current attempt data to the controller; controller will increment on failure and reset on success
      req.loginAttempts = attemptData.count || 0;
      
      next();
    } catch (error) {
      console.error('Login attempt limiter error:', error);
      next();
    }
  };
};

/**
 * Increment login attempts for current IP (called on failed login)
 */
export const noteFailedLogin = (req) => {
  const windowMs = 15 * 60 * 1000; // mirror limiter window
  const maxAttempts = 5;
  const key = `login:ip:${req.ip}`;
  const now = Date.now();

  let attemptData = requestStore.get(key);
  if (!attemptData || now - attemptData.lastReset > windowMs) {
    attemptData = { count: 0, lastReset: now };
  }

  attemptData.count += 1;
  requestStore.set(key, attemptData);

  const remaining = Math.max(0, maxAttempts - attemptData.count);
  const retryAfter = Math.ceil((windowMs - (now - attemptData.lastReset)) / 1000);

  return { count: attemptData.count, remaining, retryAfter, windowMs };
};

/**
 * Reset login attempts (called on successful login)
 */
export const resetLoginAttempts = (req) => {
  const key = `login:ip:${req.ip}`;
  requestStore.delete(key);
};

