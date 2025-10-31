import Appointment from '../models/Appointment.js';
import MedicalRecord from '../models/MedicalRecord.js';
import User from '../models/User.js';
import { logActivity } from '../services/loggingService.js';

// @desc    Get doctor dashboard stats
// @route   GET /api/doctor/dashboard
// @access  Private
export const getDashboard = async (req, res) => {
  try {
    const doctorId = req.user.id;

    const totalAppointments = await Appointment.countDocuments({ doctor: doctorId });
    
    // Get today's start and end
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    
    const todayAppointments = await Appointment.countDocuments({
      doctor: doctorId,
      appointmentDate: { $gte: todayStart, $lte: todayEnd }
    });
    const pendingAppointments = await Appointment.countDocuments({
      doctor: doctorId,
      status: 'pending'
    });

    res.json({
      success: true,
      stats: {
        totalAppointments,
        todayAppointments,
        pendingAppointments
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get appointments
// @route   GET /api/doctor/appointments
// @access  Private
export const getAppointments = async (req, res) => {
  try {
    const { status, date } = req.query;
    let query = { doctor: req.user.id };

    if (status) {
      query.status = status;
    }

    if (date) {
      query.appointmentDate = new Date(date);
    }

    const appointments = await Appointment.find(query)
      .populate('patient', 'name email phone medicalHistory')
      .sort({ appointmentDate: 1 });

    res.json({
      success: true,
      appointments
    });
  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update appointment status
// @route   PUT /api/doctor/appointments/:id/status
// @access  Private
export const updateAppointmentStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;

    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    if (appointment.doctor.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    appointment.status = status;
    if (notes) appointment.notes = notes;

    await appointment.save();

    // Log activity
    await logActivity(req.user.id, 'update_appointment_status', 'appointment', 
      `Appointment status changed to ${status}`);

    res.json({
      success: true,
      appointment
    });
  } catch (error) {
    console.error('Update appointment status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    View patient record
// @route   GET /api/doctor/patients/:id/records
// @access  Private
export const getPatientRecords = async (req, res) => {
  try {
    const records = await MedicalRecord.find({ patient: req.params.id })
      .populate('doctor', 'name')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      records
    });
  } catch (error) {
    console.error('Get patient records error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create medical record
// @route   POST /api/doctor/medical-records
// @access  Private
export const createMedicalRecord = async (req, res) => {
  try {
    const {
      patient,
      appointment,
      vitalSigns,
      chiefComplaint,
      historyOfPresentIllness,
      examination,
      diagnosis,
      treatmentPlan,
      medications,
      investigations,
      followUpInstructions,
      followUpDate
    } = req.body;

    const medicalRecord = await MedicalRecord.create({
      patient,
      doctor: req.user.id,
      appointment,
      vitalSigns,
      chiefComplaint,
      historyOfPresentIllness,
      examination,
      diagnosis,
      treatmentPlan,
      medications,
      investigations,
      followUpInstructions,
      followUpDate
    });

    // If linked to an appointment, mark it as completed
    if (appointment) {
      await Appointment.findByIdAndUpdate(appointment, { status: 'completed' });
    }

    // Log activity
    await logActivity(req.user.id, 'create_medical_record', 'medical_record', 
      `Created medical record for patient ${patient}`);

    res.status(201).json({
      success: true,
      medicalRecord
    });
  } catch (error) {
    console.error('Create medical record error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get schedule
// @route   GET /api/doctor/schedule
// @access  Private
export const getSchedule = async (req, res) => {
  try {
    const appointments = await Appointment.find({
      doctor: req.user.id,
      status: { $in: ['pending', 'confirmed'] },
      appointmentDate: { $gte: new Date() }
    })
      .populate('patient', 'name phone medicalHistory')
      .sort({ appointmentDate: 1 });

    res.json({
      success: true,
      schedule: appointments
    });
  } catch (error) {
    console.error('Get schedule error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get patient medical history
// @route   GET /api/doctor/patients/:id/medical-history
// @access  Private
export const getPatientMedicalHistory = async (req, res) => {
  try {
    const patient = await User.findById(req.params.id).select('medicalHistory name');
    
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    res.json({
      success: true,
      patient: {
        name: patient.name,
        medicalHistory: patient.medicalHistory || {}
      }
    });
  } catch (error) {
    console.error('Get patient medical history error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

