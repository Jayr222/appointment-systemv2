import Appointment from '../models/Appointment.js';
import MedicalRecord from '../models/MedicalRecord.js';
import User from '../models/User.js';
import { checkAvailability, getAvailableTimeSlots } from '../services/appointmentService.js';
import { logActivity } from '../services/loggingService.js';
import { assignQueueNumber } from '../services/queueService.js';
import { emitQueueUpdate } from '../utils/socketEmitter.js';
import SlotHold from '../models/SlotHold.js';
import { generateMedicalRecordDocx } from '../services/medicalRecordDocService.js';

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

    // Check appointment booking limit (max 3 per day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayAppointmentsCount = await Appointment.countDocuments({
      patient: req.user.id,
      createdAt: {
        $gte: today,
        $lt: tomorrow
      },
      status: { $ne: 'cancelled' }
    });

    if (todayAppointmentsCount >= 3) {
      return res.status(429).json({ 
        message: 'You have reached the daily booking limit of 3 appointments. Please try again tomorrow.',
        limit: 3,
        currentCount: todayAppointmentsCount
      });
    }

    // Check availability with enhanced validation
    const availability = await checkAvailability(doctor, appointmentDate, appointmentTime);
    
    if (!availability.available) {
      return res.status(400).json({ 
        message: availability.reason || 'Time slot not available' 
      });
    }

    let appointment;
    try {
      appointment = await Appointment.create({
        patient: req.user.id,
        doctor,
        appointmentDate,
        appointmentTime,
        reason,
        status: 'pending'
      });
    } catch (e) {
      // Handle unique index violation (duplicate slot)
      if (e?.code === 11000) {
        return res.status(400).json({ message: 'This time slot has just been taken. Please choose another slot.' });
      }
      throw e;
    }

    await appointment.populate('doctor', 'name specialization');
    await appointment.populate('patient', 'name email');

    // Cleanup any existing hold for this slot
    try {
      await SlotHold.deleteOne({
        doctor,
        appointmentDate,
        appointmentTime
      });
    } catch (_) {}

    // Note: Queue number will be assigned only after admin confirms patient arrival
    // No auto-assignment on booking

    // Log activity
    await logActivity(req.user.id, 'book_appointment', 'appointment', `Booked appointment with ${appointment.doctor.name}`);

    res.status(201).json({
      success: true,
      appointment,
      todayBookingsRemaining: 3 - todayAppointmentsCount - 1
    });
  } catch (error) {
    console.error('Book appointment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create a temporary hold for a slot (60-120s)
// @route   POST /api/patient/appointments/hold
// @access  Private
export const holdAppointmentSlot = async (req, res) => {
  try {
    const { doctor, appointmentDate, appointmentTime, ttlSeconds = 90 } = req.body;

    if (!doctor || !appointmentDate || !appointmentTime) {
      return res.status(400).json({ message: 'Doctor, date and time are required' });
    }

    // Check if slot already taken or held
    const availability = await checkAvailability(doctor, appointmentDate, appointmentTime);
    if (!availability.available) {
      return res.status(400).json({ message: availability.reason || 'Slot not available' });
    }

    const expiresAt = new Date(Date.now() + Math.max(30, Math.min(180, ttlSeconds)) * 1000);

    try {
      await SlotHold.findOneAndUpdate(
        { doctor, appointmentDate, appointmentTime },
        {
          doctor,
          appointmentDate,
          appointmentTime,
          patient: req.user.id,
          expiresAt
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    } catch (e) {
      if (e?.code === 11000) {
        return res.status(400).json({ message: 'This time slot is currently reserved. Please try again shortly.' });
      }
      throw e;
    }

    return res.json({ success: true, expiresAt });
  } catch (error) {
    console.error('Hold appointment slot error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Release a temporary slot hold
// @route   DELETE /api/patient/appointments/hold
// @access  Private
export const releaseAppointmentHold = async (req, res) => {
  try {
    const { doctor, appointmentDate, appointmentTime } = req.body;
    if (!doctor || !appointmentDate || !appointmentTime) {
      return res.status(400).json({ message: 'Doctor, date and time are required' });
    }

    await SlotHold.deleteOne({
      doctor,
      appointmentDate,
      appointmentTime,
      patient: req.user.id
    });

    return res.json({ success: true });
  } catch (error) {
    console.error('Release appointment hold error:', error);
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

    // Prevent cancellation of confirmed appointments
    if (appointment.status === 'confirmed') {
      return res.status(400).json({ 
        message: 'Cannot cancel appointment once it has been confirmed by the doctor. Please contact the clinic for assistance.' 
      });
    }

    // Only allow cancellation of pending appointments
    if (appointment.status !== 'pending') {
      return res.status(400).json({ 
        message: `Cannot cancel appointment with status: ${appointment.status}` 
      });
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

// @desc    Download medical record as DOCX
// @route   GET /api/patient/records/:id/download
// @access  Private
export const downloadMedicalRecordDocx = async (req, res) => {
  try {
    const record = await MedicalRecord.findById(req.params.id)
      .populate('doctor', 'name specialization')
      .populate('patient', 'name');

    if (!record) {
      return res.status(404).json({ message: 'Medical record not found' });
    }

    if (record.patient?._id?.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to download this record' });
    }

    const { buffer, filename } = await generateMedicalRecordDocx(record);

    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length
    });

    return res.send(buffer);
  } catch (error) {
    console.error('Download medical record docx error:', error);
    return res.status(500).json({ message: 'Failed to generate visit summary document' });
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

// @desc    Get available time slots for a doctor on a specific date
// @route   GET /api/patient/available-slots
// @access  Private
export const getAvailableSlots = async (req, res) => {
  try {
    const { doctorId, date } = req.query;

    if (!doctorId || !date) {
      return res.status(400).json({ 
        message: 'Doctor ID and date are required' 
      });
    }

    const result = await getAvailableTimeSlots(doctorId, date);

    res.json({
      success: result.available,
      slots: result.slots || [],
      bookedSlots: result.bookedSlots || [],
      message: result.reason || (result.available ? 'Available slots retrieved' : 'No available slots')
    });
  } catch (error) {
    console.error('Get available slots error:', error);
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

