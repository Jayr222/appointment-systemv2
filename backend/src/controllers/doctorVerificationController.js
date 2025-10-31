import User from '../models/User.js';
import { logActivity } from '../services/loggingService.js';

// @desc    Get pending doctor verifications
// @route   GET /api/admin/doctor-verifications
// @access  Private/Admin
export const getPendingVerifications = async (req, res) => {
  try {
    const doctors = await User.find({
      role: 'doctor',
      'doctorVerification.isVerified': false
    }).select('-password');

    res.json({
      success: true,
      doctors
    });
  } catch (error) {
    console.error('Get pending verifications error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Approve doctor verification
// @route   PUT /api/admin/doctor-verifications/:id/approve
// @access  Private/Admin
export const approveDoctor = async (req, res) => {
  try {
    const { verificationNotes } = req.body;
    const doctor = await User.findByIdAndUpdate(
      req.params.id,
      {
        'doctorVerification.isVerified': true,
        'doctorVerification.verifiedBy': req.user.id,
        'doctorVerification.verifiedAt': new Date(),
        'doctorVerification.verificationNotes': verificationNotes
      },
      { new: true }
    ).select('-password');

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    if (doctor.role !== 'doctor') {
      return res.status(400).json({ message: 'User is not a doctor' });
    }

    // Log activity
    await logActivity(req.user.id, 'approve_doctor', 'doctor_verification', 
      `Approved doctor verification for ${doctor.name}`);

    res.json({
      success: true,
      message: 'Doctor verification approved',
      doctor
    });
  } catch (error) {
    console.error('Approve doctor error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Reject doctor verification
// @route   PUT /api/admin/doctor-verifications/:id/reject
// @access  Private/Admin
export const rejectDoctor = async (req, res) => {
  try {
    const { rejectionReason } = req.body;
    const doctor = await User.findByIdAndUpdate(
      req.params.id,
      {
        'doctorVerification.isVerified': false,
        'doctorVerification.verifiedBy': req.user.id,
        'doctorVerification.verifiedAt': new Date(),
        'doctorVerification.rejectionReason': rejectionReason
      },
      { new: true }
    ).select('-password');

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    if (doctor.role !== 'doctor') {
      return res.status(400).json({ message: 'User is not a doctor' });
    }

    // Log activity
    await logActivity(req.user.id, 'reject_doctor', 'doctor_verification', 
      `Rejected doctor verification for ${doctor.name} - ${rejectionReason}`);

    res.json({
      success: true,
      message: 'Doctor verification rejected',
      doctor
    });
  } catch (error) {
    console.error('Reject doctor error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get doctor verification status
// @route   GET /api/doctor/verification-status
// @access  Private/Doctor
export const getVerificationStatus = async (req, res) => {
  try {
    const doctor = await User.findById(req.user.id).select('doctorVerification');

    res.json({
      success: true,
      verification: doctor.doctorVerification
    });
  } catch (error) {
    console.error('Get verification status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

