import mongoose from 'mongoose';
import Appointment from '../models/Appointment.js';
import MedicalRecord from '../models/MedicalRecord.js';
import User from '../models/User.js';
import { logActivity } from '../services/loggingService.js';
import { sendAppointmentConfirmation, sendAppointmentCancellation } from '../services/emailService.js';
import { assignQueueNumber } from '../services/queueService.js';
import { emitQueueUpdate, emitNewMessage, emitNotification } from '../utils/socketEmitter.js';
import Message from '../models/Message.js';
import { generateMedicalRecordDocx } from '../services/medicalRecordDocService.js';

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

    const prevStatus = appointment.status;
    appointment.status = status;
    if (notes) appointment.notes = notes;

    await appointment.save();

    // Populate appointment data for notifications
    await appointment.populate('patient', 'name email phone');
    await appointment.populate('doctor', 'name specialization');

    // Note: Queue number will only be assigned after admin confirms patient arrival
    // No auto-assignment when doctor confirms appointment

    // Emit appointment confirmed event to notify patient
    if (status === 'confirmed') {
      // Fire-and-forget email (do not block the request)
      if (appointment?.patient?.email) {
        const details = {
          date: new Date(appointment.appointmentDate).toLocaleDateString(),
          time: appointment.appointmentTime,
          doctorName: appointment?.doctor?.name || 'Assigned Doctor',
          reason: appointment.reason || 'Consultation'
        };
        sendAppointmentConfirmation(appointment.patient.email, details).catch((err) => {
          console.error('Appointment confirmation email failed:', err?.message || err);
        });
      }

      // Create in-system message to patient
      try {
        const msg = await Message.create({
          sender: req.user.id,
          receiver: appointment.patient._id || appointment.patient,
          subject: 'Appointment Confirmed',
          content: `Your appointment has been confirmed.\n\nDate: ${new Date(appointment.appointmentDate).toLocaleDateString()}\nTime: ${appointment.appointmentTime}\nDoctor: ${appointment?.doctor?.name || 'Assigned Doctor'}`,
          appointment: appointment._id,
          messageType: 'appointment'
        });
        emitNotification(appointment.patient._id || appointment.patient, {
          type: 'new_message',
          title: 'Appointment Confirmed',
          message: `Your appointment on ${new Date(appointment.appointmentDate).toLocaleDateString()} ${appointment.appointmentTime} was confirmed.`,
          data: { messageId: msg._id }
        });
        emitNewMessage(appointment.patient._id || appointment.patient, { message: msg.toObject(), sender: appointment?.doctor?.name || 'Doctor' });
      } catch (msgErr) {
        console.error('Auto message (confirmed) failed:', msgErr);
      }

      emitQueueUpdate('appointment-confirmed', {
        appointmentId: appointment._id,
        patientId: appointment.patient._id || appointment.patient,
        appointment: {
          _id: appointment._id,
          appointmentDate: appointment.appointmentDate,
          appointmentTime: appointment.appointmentTime,
          reason: appointment.reason,
          doctor: appointment.doctor,
          status: appointment.status
        }
      });
    }

    // Send cancellation email if cancelled
    if (status === 'cancelled') {
      if (appointment?.patient?.email) {
        const details = {
          date: new Date(appointment.appointmentDate).toLocaleDateString(),
          time: appointment.appointmentTime,
          doctorName: appointment?.doctor?.name || 'Assigned Doctor',
          reason: notes || 'Cancelled by doctor'
        };
        sendAppointmentCancellation(appointment.patient.email, details).catch((err) => {
          console.error('Appointment cancellation email failed:', err?.message || err);
        });
      }

      // Create in-system message to patient
      try {
        const msg = await Message.create({
          sender: req.user.id,
          receiver: appointment.patient._id || appointment.patient,
          subject: 'Appointment Cancelled',
          content: `Your appointment was cancelled.\n\nDate: ${new Date(appointment.appointmentDate).toLocaleDateString()}\nTime: ${appointment.appointmentTime}\nDoctor: ${appointment?.doctor?.name || 'Assigned Doctor'}\n${notes ? `Reason: ${notes}` : ''}`,
          appointment: appointment._id,
          messageType: 'appointment'
        });
        emitNotification(appointment.patient._id || appointment.patient, {
          type: 'new_message',
          title: 'Appointment Cancelled',
          message: `Your appointment on ${new Date(appointment.appointmentDate).toLocaleDateString()} ${appointment.appointmentTime} was cancelled.`,
          data: { messageId: msg._id }
        });
        emitNewMessage(appointment.patient._id || appointment.patient, { message: msg.toObject(), sender: appointment?.doctor?.name || 'Doctor' });
      } catch (msgErr) {
        console.error('Auto message (cancelled) failed:', msgErr);
      }
    }

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

// @desc    Download medical record as DOCX (doctor)
// @route   GET /api/doctor/medical-records/:id/download
// @access  Private
export const downloadMedicalRecordDocx = async (req, res) => {
  try {
    const record = await MedicalRecord.findById(req.params.id)
      .populate('doctor', 'name specialization')
      .populate('patient', 'name');

    if (!record) {
      return res.status(404).json({ message: 'Medical record not found' });
    }

    if (record.doctor?._id?.toString() !== req.user.id) {
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
    console.error('Doctor download medical record docx error:', error);
    return res.status(500).json({ message: 'Failed to generate visit summary document' });
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

    let patientId = patient;
    let appointmentDoc = null;

    if (appointment) {
      if (!mongoose.Types.ObjectId.isValid(appointment)) {
        return res.status(400).json({ message: 'Invalid appointment selected' });
      }

      appointmentDoc = await Appointment.findById(appointment).select('patient doctor');
      if (!appointmentDoc) {
        return res.status(404).json({ message: 'Appointment not found' });
      }

      if (String(appointmentDoc.doctor) !== String(req.user.id)) {
        return res.status(403).json({ message: 'You are not assigned to this appointment' });
      }

      if (!patientId && appointmentDoc.patient) {
        patientId = appointmentDoc.patient.toString();
      }
    }

    if (!patientId) {
      return res.status(400).json({ message: 'Patient is required' });
    }

    if (!mongoose.Types.ObjectId.isValid(patientId)) {
      return res.status(400).json({ message: 'Invalid patient selected' });
    }

    const patientExists = await User.exists({ _id: patientId, role: 'patient' });
    if (!patientExists) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    const medicalRecord = await MedicalRecord.create({
      patient: patientId,
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

    // If linked to an appointment, mark it as completed and served in queue
    if (appointmentDoc) {
      await Appointment.findByIdAndUpdate(
        appointmentDoc._id,
        { status: 'completed', queueStatus: 'served', servedAt: new Date() }
      );
    }

    // Optionally notify patient with a summary via in-app message
    const shouldNotify = req.body?.sendToPatient !== false;
    if (shouldNotify && patientId) {
      try {
        const summaryLines = [];
        if (chiefComplaint) summaryLines.push(`Chief Complaint: ${chiefComplaint}`);
        if (diagnosis) summaryLines.push(`Diagnosis: ${diagnosis}`);
        if (treatmentPlan) summaryLines.push(`Plan: ${treatmentPlan}`);
        if (Array.isArray(medications) && medications.length > 0) {
          const medsList = medications
            .filter(m => m?.name)
            .map(m => `• ${m.name}${m.dosage ? ` – ${m.dosage}` : ''}${m.frequency ? `, ${m.frequency}` : ''}`)
            .join('\n');
          if (medsList) {
            summaryLines.push(`Medications:\n${medsList}`);
          }
        }
        if (followUpDate) {
          const f = new Date(followUpDate);
          summaryLines.push(`Follow-up: ${isNaN(f.getTime()) ? followUpDate : f.toLocaleDateString()}`);
        }

        const content = `Your visit summary has been recorded.\n\n${summaryLines.join('\n\n')}`;

        const msg = await Message.create({
          sender: req.user.id,
          receiver: patientId,
          subject: 'Visit Summary',
          content,
          appointment: appointmentDoc?._id || appointment || null,
          messageType: 'appointment'
        });
        emitNotification(patientId, {
          type: 'new_message',
          title: 'Visit Summary',
          message: 'Your visit summary is available.',
          data: { messageId: msg._id }
        });
        emitNewMessage(patientId, { message: msg.toObject(), sender: req.user.name || 'Doctor' });
      } catch (e) {
        console.error('Failed to send visit summary message:', e);
      }
    }

    // Log activity
    await logActivity(req.user.id, 'create_medical_record', 'medical_record', 
      `Created medical record for patient ${patientId}`);

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

