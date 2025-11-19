import Appointment from '../models/Appointment.js';
import VitalSigns from '../models/VitalSigns.js';
import { emitQueueUpdate } from '../utils/socketEmitter.js';

const PRIORITY_WEIGHTS = {
  emergency: 1000,
  priority: 500,
  regular: 0
};

const GRACE_MINUTES = 10; // late grace for bookings

const minutesDiff = (a, b) => Math.round((a.getTime() - b.getTime()) / 60000);

const computeScore = (apt) => {
  const now = new Date();
  const priority = PRIORITY_WEIGHTS[apt.priorityLevel || 'regular'] || 0;

  // Proximity to scheduled time (for bookings)
  let proximity = 0;
  if (apt.visitType === 'booking' && apt.appointmentDate && apt.appointmentTime) {
    // Build a Date from appointmentDate + appointmentTime (HH:MM or "HH:MM AM/PM")
    const base = new Date(apt.appointmentDate);
    const timeStr = String(apt.appointmentTime).toUpperCase();
    const m = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/);
    if (m) {
      let hour = parseInt(m[1], 10);
      const minute = parseInt(m[2], 10);
      const period = m[3];
      if (period === 'PM' && hour !== 12) hour += 12;
      if (period === 'AM' && hour === 12) hour = 0;
      base.setHours(hour, minute, 0, 0);
      const minsToAppt = minutesDiff(base, now);
      // Higher score when close/overdue; clamp to [0..300]
      proximity = Math.max(0, 300 - Math.abs(minsToAppt));
    }
  }

  // Waiting time since check-in
  let wait = 0;
  if (apt.checkedInAt) {
    const minsWaiting = Math.max(0, minutesDiff(now, new Date(apt.checkedInAt)));
    wait = Math.min(200, minsWaiting);
  }

  return priority + proximity + wait;
};

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
 * Only works if patient has arrived
 */
export const assignQueueNumber = async (appointmentId) => {
  try {
    const appointment = await Appointment.findById(appointmentId).populate('patient doctor');

    if (!appointment) {
      throw new Error('Appointment not found');
    }

    // Check if patient has arrived
    if (!appointment.patientArrived) {
      throw new Error('Patient must arrive before queue number can be assigned');
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
 * Shows all appointments scheduled for today, even if they don't have queue numbers yet
 */
export const getTodayQueue = async (doctorId = null) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Check if appointment date is today (appointmentDate field)
    // OR if queueDate is today (for already queued appointments)
    const baseQuery = {
      status: { $in: ['confirmed', 'pending'] }
    };

    if (doctorId) {
      baseQuery.doctor = doctorId;
    }

    // Only show appointments where patient has arrived
    const query = {
      ...baseQuery,
      patientArrived: true, // Only show arrived patients
      appointmentDate: {
        $gte: today,
        $lt: tomorrow
      }
    };

    // Late booking auto-convert to walk-in (grace-based)
    await Appointment.updateMany(
      {
        ...baseQuery,
        appointmentDate: { $gte: today, $lt: tomorrow },
        visitType: 'booking',
        patientArrived: false
      },
      [
        {
          $set: {
            visitType: {
              $cond: [
                {
                  $lt: [
                    {
                      $dateAdd: {
                        startDate: '$appointmentDate',
                        unit: 'minute',
                        amount: GRACE_MINUTES
                      }
                    },
                    new Date()
                  ]
                },
                'walk-in',
                '$visitType'
              ]
            }
          }
        }
      ]
    );

    const appointments = await Appointment.find(query)
      .populate('patient', 'name email phone')
      .populate('doctor', 'name')
      .sort({ 
        queueNumber: 1,
        appointmentTime: 1
      })
      .lean();

    // For appointments without queue numbers, assign them if patient has arrived
    const appointmentsToUpdate = [];
    for (const appointment of appointments) {
      // If patient has arrived but has no queue number, assign it
      if (!appointment.queueNumber && appointment.patientArrived) {
        appointmentsToUpdate.push(appointment);
      }
    }

    // Auto-assign queue numbers for arrived patients without queue numbers
    if (appointmentsToUpdate.length > 0) {
      for (const appointment of appointmentsToUpdate) {
        try {
          await assignQueueNumber(appointment._id);
        } catch (error) {
          console.error(`Error auto-assigning queue for appointment ${appointment._id}:`, error);
        }
      }
      
      // Re-fetch to get updated queue numbers
      return await getTodayQueue(doctorId);
    }

    // Compute scores and estimated start (simple heuristic: position in waiting list * avg 15 mins)
    const now = new Date();
    const waiting = appointments.filter(a => a.queueStatus === 'waiting');
    const scored = waiting
      .map(a => ({ ...a, _score: computeScore(a) }))
      .sort((a, b) => b._score - a._score || (a.queueNumber || 1e9) - (b.queueNumber || 1e9));

    // Estimated start (15 min per patient before you)
    const AVG_MIN_PER_PATIENT = 15;
    let etaCursor = new Date(now);
    scored.forEach((a, idx) => {
      const eta = new Date(now.getTime() + idx * AVG_MIN_PER_PATIENT * 60000);
      a.estimatedStartAt = eta;
    });

    const result = appointments.map(a => {
      const s = scored.find(x => String(x._id) === String(a._id));
      return s ? s : a;
    });

    // Fetch the most recent vital signs for each patient
    // Only show vital signs if the appointment has a doctor assigned (i.e., patient is assigned to a doctor)
    const appointmentsWithVitals = await Promise.all(
      result.map(async (appointment) => {
        try {
          const patientId = appointment.patient?._id || appointment.patient;
          if (!patientId) {
            return {
              ...appointment,
              latestVitalSigns: null
            };
          }

          // Only fetch vital signs if this appointment has a doctor assigned
          // This ensures vital signs are only visible for appointments where patient is assigned to a doctor
          const appointmentDoctorId = appointment.doctor?._id || appointment.doctor;
          if (!appointmentDoctorId) {
            // No doctor assigned to this appointment, don't show vital signs
            return {
              ...appointment,
              latestVitalSigns: null
            };
          }

          // Get the most recent vital signs for this patient, preferably linked to this appointment
          // First try to find vital signs linked to this specific appointment
          let vitalSigns = await VitalSigns.findOne({
            patient: patientId,
            appointment: appointment._id
          })
            .populate('recordedBy', 'name')
            .sort({ createdAt: -1 })
            .lean();

          // If not found, get the most recent vital signs for this patient (not linked to any appointment)
          if (!vitalSigns) {
            vitalSigns = await VitalSigns.findOne({
              patient: patientId,
              appointment: { $exists: false }
            })
              .populate('recordedBy', 'name')
              .sort({ createdAt: -1 })
              .lean();
          }

          // If still not found, get any recent vital signs for this patient
          if (!vitalSigns) {
            vitalSigns = await VitalSigns.findOne({
              patient: patientId
            })
              .populate('recordedBy', 'name')
              .sort({ createdAt: -1 })
              .lean();
          }

          return {
            ...appointment,
            latestVitalSigns: vitalSigns || null
          };
        } catch (error) {
          console.error(`Error fetching vital signs for appointment ${appointment._id}:`, error);
          return {
            ...appointment,
            latestVitalSigns: null
          };
        }
      })
    );

    return appointmentsWithVitals;
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

    // Use scoring to pick next waiting appointment
    const waiting = await Appointment.find(query)
      .populate('patient', 'name email phone')
      .populate('doctor', 'name')
      .lean();

    if (!waiting || waiting.length === 0) {
      return null;
    }

    const nextAppointmentRaw = waiting
      .map(a => ({ ...a, _score: computeScore(a) }))
      .sort((a, b) => b._score - a._score || (a.queueNumber || 1e9) - (b.queueNumber || 1e9))[0];

    const nextAppointment = await Appointment.findById(nextAppointmentRaw._id);

    if (!nextAppointment) {
      return null;
    }

    // Update status to called
    nextAppointment.queueStatus = 'called';
    nextAppointment.calledAt = new Date();
    await nextAppointment.save();

    // Emit socket updates
    emitQueueUpdate('patient-called', {
      appointmentId: nextAppointment._id,
      patientId: nextAppointment.patient,
      doctorId: nextAppointment.doctor,
      queueNumber: nextAppointment.queueNumber
    });

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

