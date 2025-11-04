import Appointment from '../models/Appointment.js';

/**
 * Generate a unique queue number for today
 * Queue numbers reset daily starting from 1
 */
export const generateQueueNumber = async () => {
  try {
    // Get today's date at midnight
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Find the highest queue number for today
    const lastAppointment = await Appointment.findOne({
      queueDate: {
        $gte: today,
        $lt: tomorrow
      }
    }).sort({ queueNumber: -1 });

    // Generate next queue number (start from 1)
    const nextQueueNumber = lastAppointment?.queueNumber 
      ? lastAppointment.queueNumber + 1 
      : 1;

    return nextQueueNumber;
  } catch (error) {
    console.error('Error generating queue number:', error);
    throw error;
  }
};

/**
 * Assign queue number to an appointment
 */
export const assignQueueNumber = async (appointmentId) => {
  try {
    const appointment = await Appointment.findById(appointmentId).populate('patient doctor');

    if (!appointment) {
      throw new Error('Appointment not found');
    }

    // If queue number already assigned, return it
    if (appointment.queueNumber && appointment.queueDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const queueDate = new Date(appointment.queueDate);
      queueDate.setHours(0, 0, 0, 0);

      // If it's the same day, return existing queue number
      if (queueDate.getTime() === today.getTime()) {
        return appointment;
      }
    }

    // Generate new queue number
    const queueNumber = await generateQueueNumber();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Update appointment with queue number
    appointment.queueNumber = queueNumber;
    appointment.queueDate = today;
    appointment.queueStatus = 'waiting';
    appointment.checkedInAt = new Date();
    
    await appointment.save();

    return appointment;
  } catch (error) {
    console.error('Error assigning queue number:', error);
    throw error;
  }
};

/**
 * Get today's queue list
 */
export const getTodayQueue = async (doctorId = null) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const query = {
      queueDate: {
        $gte: today,
        $lt: tomorrow
      },
      status: { $in: ['confirmed', 'pending'] },
      queueNumber: { $ne: null }
    };

    if (doctorId) {
      query.doctor = doctorId;
    }

    const appointments = await Appointment.find(query)
      .populate('patient', 'name email phone')
      .populate('doctor', 'name')
      .sort({ queueNumber: 1 })
      .lean();

    return appointments;
  } catch (error) {
    console.error('Error getting today queue:', error);
    throw error;
  }
};

/**
 * Update queue status
 */
export const updateQueueStatus = async (appointmentId, status, userId) => {
  try {
    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      throw new Error('Appointment not found');
    }

    appointment.queueStatus = status;

    // Update timestamps based on status
    const now = new Date();
    switch (status) {
      case 'called':
        appointment.calledAt = now;
        break;
      case 'in-progress':
        if (!appointment.calledAt) {
          appointment.calledAt = now;
        }
        break;
      case 'served':
        appointment.servedAt = now;
        appointment.status = 'completed';
        break;
      case 'skipped':
        break;
      default:
        break;
    }

    await appointment.save();

    // Return populated appointment
    return await Appointment.findById(appointmentId)
      .populate('patient', 'name email phone')
      .populate('doctor', 'name');
  } catch (error) {
    console.error('Error updating queue status:', error);
    throw error;
  }
};

/**
 * Call next patient in queue
 */
export const callNextPatient = async (doctorId = null) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const query = {
      queueDate: {
        $gte: today,
        $lt: tomorrow
      },
      queueStatus: 'waiting',
      queueNumber: { $ne: null },
      status: { $in: ['confirmed', 'pending'] }
    };

    if (doctorId) {
      query.doctor = doctorId;
    }

    // Find the next patient in queue
    const nextAppointment = await Appointment.findOne(query)
      .populate('patient', 'name email phone')
      .populate('doctor', 'name')
      .sort({ queueNumber: 1 });

    if (!nextAppointment) {
      return null;
    }

    // Update status to called
    nextAppointment.queueStatus = 'called';
    nextAppointment.calledAt = new Date();
    await nextAppointment.save();

    return nextAppointment;
  } catch (error) {
    console.error('Error calling next patient:', error);
    throw error;
  }
};

/**
 * Reset daily queue numbers (called by scheduled job)
 */
export const resetDailyQueue = async () => {
  try {
    // This would typically be called at midnight
    // Queue numbers reset automatically when new appointments get queue numbers on a new day
    console.log('Daily queue reset completed');
  } catch (error) {
    console.error('Error resetting daily queue:', error);
    throw error;
  }
};

