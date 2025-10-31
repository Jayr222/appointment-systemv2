import Appointment from '../models/Appointment.js';
import { validateAppointmentDate } from '../utils/validators.js';

export const checkAvailability = async (doctorId, date, time) => {
  try {
    const existingAppointment = await Appointment.findOne({
      doctor: doctorId,
      appointmentDate: date,
      appointmentTime: time,
      status: { $in: ['confirmed', 'pending'] }
    });
    
    return !existingAppointment;
  } catch (error) {
    console.error('Availability check error:', error);
    return false;
  }
};

export const validateAppointmentData = (appointmentData) => {
  const errors = [];
  
  if (!validateAppointmentDate(appointmentData.appointmentDate)) {
    errors.push('Appointment date must be today or in the future');
  }
  
  // Additional validations can be added here
  // Time format validation, doctor availability, etc.
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const sendAppointmentNotifications = async (appointment) => {
  // This would integrate with emailService or notification service
  // For now, just log the notification requirement
  console.log('Notification needed for appointment:', appointment._id);
  return true;
};

