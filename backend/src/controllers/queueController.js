import { 
  assignQueueNumber, 
  getTodayQueue, 
  updateQueueStatus, 
  callNextPatient 
} from '../services/queueService.js';
import Appointment from '../models/Appointment.js';
import { logActivity } from '../services/loggingService.js';
import { emitQueueUpdate } from '../utils/socketEmitter.js';

// @desc    Get today's queue
// @route   GET /api/queue/today
// @access  Private
export const getTodayQueueList = async (req, res) => {
  try {
    const doctorId = req.query.doctorId || null;
    const queue = await getTodayQueue(doctorId);

    res.json({
      success: true,
      queue
    });
  } catch (error) {
    console.error('Get queue error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Assign queue number to appointment
// @route   POST /api/queue/assign/:appointmentId
// @access  Private
export const assignQueue = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const appointment = await assignQueueNumber(appointmentId);

    // Log activity
    if (req.user) {
      await logActivity(req.user.id, 'assign_queue', 'appointment', 
        `Assigned queue number ${appointment.queueNumber} to appointment`);
    }

    // Emit socket event
    emitQueueUpdate('queue-number-assigned', {
      appointmentId: appointment._id,
      patientId: appointment.patient._id || appointment.patient,
      queueNumber: appointment.queueNumber,
      appointment: appointment
    });

    res.json({
      success: true,
      appointment
    });
  } catch (error) {
    console.error('Assign queue error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Update queue status
// @route   PUT /api/queue/:appointmentId/status
// @access  Private
export const updateStatus = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { status } = req.body;

    if (!['waiting', 'called', 'in-progress', 'served', 'skipped'].includes(status)) {
      return res.status(400).json({ message: 'Invalid queue status' });
    }

    const appointment = await updateQueueStatus(appointmentId, status, req.user?.id);

    // Log activity
    if (req.user) {
      await logActivity(req.user.id, 'update_queue_status', 'appointment', 
        `Updated queue status to ${status}`);
    }

    // Emit socket event
    emitQueueUpdate('queue-status-changed', {
      appointmentId: appointment._id,
      patientId: appointment.patient._id || appointment.patient,
      queueNumber: appointment.queueNumber,
      status: appointment.queueStatus,
      appointment: appointment
    });

    // Also emit general queue update
    const queue = await getTodayQueue(null);
    emitQueueUpdate('queue-updated', { queue });

    res.json({
      success: true,
      appointment
    });
  } catch (error) {
    console.error('Update queue status error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Call next patient
// @route   POST /api/queue/next
// @access  Private
export const callNext = async (req, res) => {
  try {
    const doctorId = req.body.doctorId || (req.user?.role === 'doctor' ? req.user.id : null);
    const appointment = await callNextPatient(doctorId);

    if (!appointment) {
      return res.json({
        success: true,
        message: 'No patients waiting in queue',
        appointment: null
      });
    }

    // Log activity
    if (req.user) {
      await logActivity(req.user.id, 'call_next_patient', 'appointment', 
        `Called next patient with queue number ${appointment.queueNumber}`);
    }

    // Emit socket event
    emitQueueUpdate('patient-called', {
      appointmentId: appointment._id,
      patientId: appointment.patient._id || appointment.patient,
      queueNumber: appointment.queueNumber,
      appointment: appointment
    });

    // Also emit general queue update
    const queue = await getTodayQueue(doctorId);
    emitQueueUpdate('queue-updated', { queue });

    res.json({
      success: true,
      appointment
    });
  } catch (error) {
    console.error('Call next patient error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Check in patient (auto-assign queue on appointment booking/confirmation)
// @route   POST /api/queue/checkin/:appointmentId
// @access  Private
export const checkIn = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const appointment = await assignQueueNumber(appointmentId);

    // Log activity
    if (req.user) {
      await logActivity(req.user.id, 'patient_checkin', 'appointment', 
        `Patient checked in with queue number ${appointment.queueNumber}`);
    }

    // Emit socket event
    emitQueueUpdate('queue-number-assigned', {
      appointmentId: appointment._id,
      patientId: appointment.patient._id || appointment.patient,
      queueNumber: appointment.queueNumber,
      appointment: appointment
    });

    // Also emit general queue update
    const queue = await getTodayQueue(null);
    emitQueueUpdate('queue-updated', { queue });

    res.json({
      success: true,
      appointment
    });
  } catch (error) {
    console.error('Check in error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

