import { protect } from './authMiddleware.js';

export const nurseOnly = (req, res, next) => {
  protect(req, res, () => {
    if (req.user.role !== 'nurse') {
      return res.status(403).json({ 
        message: 'Access denied. Nurse role required.' 
      });
    }
    next();
  });
};

export default nurseOnly;

