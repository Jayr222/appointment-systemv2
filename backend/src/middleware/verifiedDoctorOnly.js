import User from '../models/User.js';

// Middleware to check if doctor is verified
export const verifiedDoctorOnly = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    if (user.role !== 'doctor') {
      return res.status(403).json({ message: 'Access denied. Doctor access required.' });
    }

    if (!user.doctorVerification || !user.doctorVerification.isVerified) {
      return res.status(403).json({ 
        message: 'Doctor account not verified. Please wait for admin approval.',
        isVerified: false
      });
    }

    next();
  } catch (error) {
    console.error('Verified doctor check error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export default verifiedDoctorOnly;

