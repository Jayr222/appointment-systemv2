import Appointment from '../models/Appointment.js';
import VitalSigns from '../models/VitalSigns.js';
import FollowUp from '../models/FollowUp.js';
import User from '../models/User.js';
import { logActivity } from '../services/loggingService.js';

// @desc    Get nurse dashboard stats
// @route   GET /api/nurse/dashboard
// @access  Private (Nurse)
export const getDashboard = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get today's appointments with queue numbers
    const todayAppointments = await Appointment.find({
      appointmentDate: {
        $gte: today,
        $lt: tomorrow
      },
      status: { $in: ['confirmed', 'pending'] }
    })
      .populate('patient', 'name email phone')
      .populate('doctor', 'name specialization')
      .sort({ queueNumber: 1, appointmentTime: 1 });

    // Get pending follow-ups
    const pendingFollowUps = await FollowUp.countDocuments({
      status: 'pending',
      $or: [
        { assignedTo: req.user.id },
        { assignedTo: null }
      ]
    });

    // Get today's vital signs recorded
    const todayVitalSigns = await VitalSigns.countDocuments({
      recordedBy: req.user.id,
      createdAt: {
        $gte: today
      }
    });

    // Get urgent follow-ups
    const urgentFollowUps = await FollowUp.countDocuments({
      priority: 'urgent',
      status: { $in: ['pending', 'scheduled'] }
    });

    res.json({
      success: true,
      stats: {
        todayAppointments: todayAppointments.length,
        pendingFollowUps,
        todayVitalSigns,
        urgentFollowUps
      },
      todayAppointments
    });
  } catch (error) {
    console.error('Get nurse dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get today's queue
// @route   GET /api/nurse/queue
// @access  Private (Nurse)
export const getTodayQueue = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const appointments = await Appointment.find({
      appointmentDate: {
        $gte: today,
        $lt: tomorrow
      },
      status: { $in: ['confirmed', 'pending'] },
      queueNumber: { $ne: null }
    })
      .populate('patient', 'name email phone dateOfBirth gender')
      .populate('doctor', 'name specialization')
      .sort({ queueNumber: 1, appointmentTime: 1 });

    res.json({
      success: true,
      appointments
    });
  } catch (error) {
    console.error('Get queue error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Record vital signs
// @route   POST /api/nurse/vital-signs
// @access  Private (Nurse)
export const recordVitalSigns = async (req, res) => {
  try {
    const {
      patientId,
      appointmentId,
      bloodPressure,
      heartRate,
      temperature,
      respiratoryRate,
      oxygenSaturation,
      weight,
      height,
      notes,
      symptoms,
      painLevel
    } = req.body;

    const vitalSigns = await VitalSigns.create({
      patient: patientId,
      appointment: appointmentId || null,
      recordedBy: req.user.id,
      bloodPressure: bloodPressure ? {
        systolic: bloodPressure.systolic,
        diastolic: bloodPressure.diastolic
      } : undefined,
      heartRate,
      temperature: temperature ? {
        value: temperature.value,
        unit: temperature.unit || 'Celsius'
      } : undefined,
      respiratoryRate,
      oxygenSaturation,
      weight: weight ? {
        value: weight.value,
        unit: weight.unit || 'kg'
      } : undefined,
      height: height ? {
        value: height.value,
        unit: height.unit || 'cm'
      } : undefined,
      notes,
      symptoms: symptoms || [],
      painLevel
    });

    await vitalSigns.populate('patient', 'name email');
    await vitalSigns.populate('recordedBy', 'name');

    // Log activity
    await logActivity(req.user.id, 'record_vital_signs', 'vital_signs', 
      `Recorded vital signs for ${vitalSigns.patient.name}`);

    res.status(201).json({
      success: true,
      vitalSigns
    });
  } catch (error) {
    console.error('Record vital signs error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get patient vital signs history
// @route   GET /api/nurse/vital-signs/:patientId
// @access  Private (Nurse)
export const getPatientVitalSigns = async (req, res) => {
  try {
    const vitalSigns = await VitalSigns.find({ patient: req.params.patientId })
      .populate('recordedBy', 'name')
      .populate('appointment', 'appointmentDate appointmentTime')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      vitalSigns
    });
  } catch (error) {
    console.error('Get patient vital signs error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create follow-up
// @route   POST /api/nurse/follow-ups
// @access  Private (Nurse)
export const createFollowUp = async (req, res) => {
  try {
    const {
      patientId,
      appointmentId,
      type,
      priority,
      scheduledDate,
      scheduledTime,
      reason,
      notes,
      contactMethod,
      assignedTo
    } = req.body;

    const followUp = await FollowUp.create({
      patient: patientId,
      appointment: appointmentId || null,
      createdBy: req.user.id,
      assignedTo: assignedTo || req.user.id,
      type,
      priority: priority || 'medium',
      scheduledDate,
      scheduledTime,
      reason,
      notes,
      contactMethod: contactMethod || (type === 'phone' ? 'phone' : 'in-person'),
      status: 'pending'
    });

    await followUp.populate('patient', 'name email phone');
    await followUp.populate('createdBy', 'name');
    await followUp.populate('assignedTo', 'name');

    // Log activity
    await logActivity(req.user.id, 'create_follow_up', 'follow_up', 
      `Created follow-up for ${followUp.patient.name}`);

    res.status(201).json({
      success: true,
      followUp
    });
  } catch (error) {
    console.error('Create follow-up error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get follow-ups
// @route   GET /api/nurse/follow-ups
// @access  Private (Nurse)
export const getFollowUps = async (req, res) => {
  try {
    const { status, priority, patientId } = req.query;
    const query = {
      $or: [
        { assignedTo: req.user.id },
        { assignedTo: null },
        { createdBy: req.user.id }
      ]
    };

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (patientId) query.patient = patientId;

    const followUps = await FollowUp.find(query)
      .populate('patient', 'name email phone')
      .populate('createdBy', 'name')
      .populate('assignedTo', 'name')
      .populate('appointment', 'appointmentDate appointmentTime')
      .sort({ scheduledDate: 1, priority: -1 });

    res.json({
      success: true,
      followUps
    });
  } catch (error) {
    console.error('Get follow-ups error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update follow-up status
// @route   PUT /api/nurse/follow-ups/:id
// @access  Private (Nurse)
export const updateFollowUp = async (req, res) => {
  try {
    const { status, notes, outcome, completedDate } = req.body;

    const followUp = await FollowUp.findById(req.params.id);

    if (!followUp) {
      return res.status(404).json({ message: 'Follow-up not found' });
    }

    // Check if nurse has access
    if (followUp.assignedTo && followUp.assignedTo.toString() !== req.user.id && 
        followUp.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (status) followUp.status = status;
    if (notes !== undefined) followUp.notes = notes;
    if (outcome !== undefined) followUp.outcome = outcome;
    if (completedDate) followUp.completedDate = completedDate;

    if (status === 'completed' && !followUp.completedDate) {
      followUp.completedDate = new Date();
    }

    await followUp.save();

    await followUp.populate('patient', 'name email');
    await followUp.populate('assignedTo', 'name');

    // Log activity
    await logActivity(req.user.id, 'update_follow_up', 'follow_up', 
      `Updated follow-up status to ${status}`);

    res.json({
      success: true,
      followUp
    });
  } catch (error) {
    console.error('Update follow-up error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get patient info
// @route   GET /api/nurse/patients/:id
// @access  Private (Nurse)
export const getPatientInfo = async (req, res) => {
  try {
    const patient = await User.findById(req.params.id)
      .select('-password');

    if (!patient || patient.role !== 'patient') {
      return res.status(404).json({ message: 'Patient not found' });
    }

    res.json({
      success: true,
      patient
    });
  } catch (error) {
    console.error('Get patient info error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

