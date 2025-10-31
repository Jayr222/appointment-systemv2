import Appointment from '../models/Appointment.js';
import MedicalRecord from '../models/MedicalRecord.js';
import User from '../models/User.js';
import { checkAvailability } from '../services/appointmentService.js';
import { logActivity } from '../services/loggingService.js';

// @desc    Get patient dashboard stats
// @route   GET /api/patient/dashboard
// @access  Private
export const getDashboard = async (req, res) => {
  try {
    const patientId = req.user.id;

    const appointments = await Appointment.countDocuments({ patient: patientId });
    const upcomingAppointments = await Appointment.countDocuments({
      patient: patientId,
      status: { $in: ['pending', 'confirmed'] },
      appointmentDate: { $gte: new Date() }
    });
    const medicalRecords = await MedicalRecord.countDocuments({ patient: patientId });

    res.json({
      success: true,
      stats: {
        totalAppointments: appointments,
        upcomingAppointments,
        medicalRecords
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get upcoming appointments
// @route   GET /api/patient/appointments/upcoming
// @access  Private
export const getUpcomingAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({
      patient: req.user.id,
      status: { $in: ['pending', 'confirmed'] },
      appointmentDate: { $gte: new Date() }
    })
      .populate('doctor', 'name specialization')
      .sort({ appointmentDate: 1 });

    res.json({
      success: true,
      appointments
    });
  } catch (error) {
    console.error('Get upcoming appointments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all appointments
// @route   GET /api/patient/appointments
// @access  Private
export const getAllAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ patient: req.user.id })
      .populate('doctor', 'name specialization')
      .sort({ appointmentDate: -1 });

    res.json({
      success: true,
      appointments
    });
  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Book new appointment
// @route   POST /api/patient/appointments
// @access  Private
export const bookAppointment = async (req, res) => {
  try {
    const { doctor, appointmentDate, appointmentTime, reason } = req.body;

    // Check availability
    const isAvailable = await checkAvailability(doctor, appointmentDate, appointmentTime);
    
    if (!isAvailable) {
      return res.status(400).json({ message: 'Time slot not available' });
    }

    const appointment = await Appointment.create({
      patient: req.user.id,
      doctor,
      appointmentDate,
      appointmentTime,
      reason,
      status: 'pending'
    });

    await appointment.populate('doctor', 'name specialization');

    // Log activity
    await logActivity(req.user.id, 'book_appointment', 'appointment', `Booked appointment with ${appointment.doctor.name}`);

    res.status(201).json({
      success: true,
      appointment
    });
  } catch (error) {
    console.error('Book appointment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Cancel appointment
// @route   PUT /api/patient/appointments/:id/cancel
// @access  Private
export const cancelAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    if (appointment.patient.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    appointment.status = 'cancelled';
    appointment.canceledBy = req.user.id;
    appointment.cancellationReason = req.body.reason;

    await appointment.save();

    // Log activity
    await logActivity(req.user.id, 'cancel_appointment', 'appointment', 'Appointment cancelled');

    res.json({
      success: true,
      appointment
    });
  } catch (error) {
    console.error('Cancel appointment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get medical records
// @route   GET /api/patient/records
// @access  Private
export const getMedicalRecords = async (req, res) => {
  try {
    const records = await MedicalRecord.find({ patient: req.user.id })
      .populate('doctor', 'name specialization')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      records
    });
  } catch (error) {
    console.error('Get medical records error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get doctors list
// @route   GET /api/patient/doctors
// @access  Private
export const getDoctors = async (req, res) => {
  try {
    const doctors = await User.find({ role: 'doctor', isActive: true })
      .select('name specialization experience bio');

    res.json({
      success: true,
      doctors
    });
  } catch (error) {
    console.error('Get doctors error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get medical history
// @route   GET /api/patient/medical-history
// @access  Private
export const getMedicalHistory = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('medicalHistory');
    
    res.json({
      success: true,
      medicalHistory: user.medicalHistory || {}
    });
  } catch (error) {
    console.error('Get medical history error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update medical history
// @route   PUT /api/patient/medical-history
// @access  Private
export const updateMedicalHistory = async (req, res) => {
  try {
    const { medicalHistory } = req.body;
    
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Merge with existing medical history
    user.medicalHistory = {
      ...user.medicalHistory,
      ...medicalHistory
    };

    await user.save();

    // Log activity
    await logActivity(req.user.id, 'update_medical_history', 'medical_record', 'Medical history updated');

    res.json({
      success: true,
      medicalHistory: user.medicalHistory
    });
  } catch (error) {
    console.error('Update medical history error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

