import Appointment from '../models/Appointment.js';
import DoctorAvailability, { parseTimeToHourForAvailability } from '../models/DoctorAvailability.js';
import DoctorBreakTime from '../models/DoctorBreakTime.js';
import SlotHold from '../models/SlotHold.js';
import { validateAppointmentDate } from '../utils/validators.js';

// Hospital operating hours: 8:00 AM - 5:00 PM
const HOSPITAL_START_HOUR = 8;
const HOSPITAL_END_HOUR = 17; // 5:00 PM

/**
 * Convert time string to hour for comparison
 * @param {string} timeStr - Time in format "HH:MM AM/PM" or "HH:MM"
 * @returns {number} - Hour in 24-hour format (0-23)
 */
const parseTimeToHour = (timeStr) => {
  if (!timeStr) return null;
  
  // Handle formats like "8:00 AM", "2:30 PM", "14:30"
  const time = timeStr.trim().toUpperCase();
  
  // Check if it's in 12-hour format with AM/PM
  if (time.includes('AM') || time.includes('PM')) {
    const match = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/);
    if (match) {
      let hour = parseInt(match[1]);
      const period = match[3];
      
      if (period === 'PM' && hour !== 12) {
        hour += 12;
      } else if (period === 'AM' && hour === 12) {
        hour = 0;
      }
      return hour;
    }
  }
  
  // Handle 24-hour format "HH:MM"
  const match = time.match(/(\d{1,2}):(\d{2})/);
  if (match) {
    return parseInt(match[1]);
  }
  
  return null;
};

/**
 * Convert time string to minute for comparison
 * @param {string} timeStr - Time in format "HH:MM AM/PM" or "HH:MM"
 * @returns {number} - Minute (0-59)
 */
const parseTimeToMinute = (timeStr) => {
  if (!timeStr) return null;
  
  const time = timeStr.trim().toUpperCase();
  const match = time.match(/(\d{1,2}):(\d{2})/);
  if (match) {
    return parseInt(match[2]);
  }
  
  return 0;
};

/**
 * Validate if time is within hospital operating hours
 */
export const validateHospitalHours = (time) => {
  const hour = parseTimeToHour(time);
  if (hour === null) return false;
  
  return hour >= HOSPITAL_START_HOUR && hour < HOSPITAL_END_HOUR;
};

/**
 * Check if time slot is available for booking
 */
export const checkAvailability = async (doctorId, date, time) => {
  try {
    // Validate hospital hours
    if (!validateHospitalHours(time)) {
      return {
        available: false,
        reason: 'Appointment time must be between 8:00 AM and 5:00 PM'
      };
    }

    // Check if doctor is unavailable on this date
    const isUnavailable = await DoctorAvailability.isDoctorUnavailableAtTime(doctorId, date, time);
    if (isUnavailable) {
      return {
        available: false,
        reason: 'Doctor is unavailable on this date. Please select another date.'
      };
    }

    // Check if doctor has a break at this time
    const hasBreak = await DoctorBreakTime.hasBreakAtTime(doctorId, date, time);
    if (hasBreak) {
      return {
        available: false,
        reason: 'Doctor is on break at this time. Please select another time.'
      };
    }

    // Check if doctor has any appointment at this time
    const existingAppointment = await Appointment.findOne({
      doctor: doctorId,
      appointmentDate: date,
      appointmentTime: time,
      status: { $in: ['confirmed', 'pending'] }
    });
    
    if (existingAppointment) {
      return {
        available: false,
        reason: 'This time slot is already taken by another patient'
      };
    }

    // Check active holds
    const activeHold = await SlotHold.findOne({
      doctor: doctorId,
      appointmentDate: date,
      appointmentTime: time,
      expiresAt: { $gt: new Date() }
    });

    if (activeHold) {
      return {
        available: false,
        reason: 'This time slot is temporarily reserved. Please try a different slot or try again shortly.'
      };
    }
    
    return {
      available: true
    };
  } catch (error) {
    console.error('Availability check error:', error);
    return {
      available: false,
      reason: 'Error checking availability'
    };
  }
};

/**
 * Get available time slots for a doctor on a specific date
 */
export const getAvailableTimeSlots = async (doctorId, date) => {
  try {
    const availableSlots = [];
    const appointmentDate = new Date(date);
    const dayOfWeek = appointmentDate.getDay(); // 0 = Sunday, 6 = Saturday
    
    // Hospital is closed on weekends
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return {
        available: false,
        slots: [],
        reason: 'Hospital is closed on weekends'
      };
    }

    // Generate time slots from 8:00 AM to 4:00 PM (last slot at 4:00 PM)
    const timeSlots = [];
    for (let hour = HOSPITAL_START_HOUR; hour < HOSPITAL_END_HOUR; hour++) {
      // Create slots every 30 minutes
      for (let minute = 0; minute < 60; minute += 30) {
        const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const displayTime = formatTimeForDisplay(hour, minute);
        timeSlots.push({
          value: displayTime,
          time: timeStr,
          hour,
          minute
        });
      }
    }

    // Check if doctor is unavailable on this date
    const isUnavailable = await DoctorAvailability.isDoctorUnavailable(doctorId, date);
    if (isUnavailable) {
      // If doctor has specific unavailable time slots, filter those out
      if (isUnavailable.unavailableTimes && isUnavailable.unavailableTimes.length > 0) {
        // Filter out slots that fall within unavailable time ranges
        const unavailableRanges = isUnavailable.unavailableTimes.map(slot => ({
          start: parseTimeToHourForAvailability(slot.startTime),
          end: parseTimeToHourForAvailability(slot.endTime)
        }));

        const filteredSlots = timeSlots.filter(slot => {
          return !unavailableRanges.some(range => {
            return slot.hour >= range.start && slot.hour < range.end;
          });
        });

        // Still check for booked appointments
        const existingAppointments = await Appointment.find({
          doctor: doctorId,
          appointmentDate: date,
          status: { $in: ['confirmed', 'pending'] }
        }).select('appointmentTime');

        const bookedTimes = existingAppointments.map(apt => apt.appointmentTime);
        
        // Get break times for this doctor
        const breakTimes = await DoctorBreakTime.getDoctorBreakTimes(doctorId);
        
        // Helper function to parse time to minutes
        const parseTimeToMinutes = (timeStr) => {
          if (!timeStr) return null;
          const match = timeStr.match(/(\d{1,2}):(\d{2})/);
          if (match) {
            const hour = parseInt(match[1]);
            const minute = parseInt(match[2]);
            return hour * 60 + minute;
          }
          // Try 12-hour format
          const match12 = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
          if (match12) {
            let hour = parseInt(match12[1]);
            const minute = parseInt(match12[2]);
            const period = match12[3].toUpperCase();
            if (period === 'PM' && hour !== 12) hour += 12;
            if (period === 'AM' && hour === 12) hour = 0;
            return hour * 60 + minute;
          }
          return null;
        };
        
        const available = filteredSlots.filter(slot => {
          // Check if slot is booked
          const isBooked = bookedTimes.some(bookedTime => {
            const bookedHour = parseTimeToHour(bookedTime);
            const bookedMinute = parseTimeToMinute(bookedTime);
            const bookedSlotMinute = bookedMinute < 30 ? 0 : 30;
            
            if (bookedHour === slot.hour && bookedSlotMinute === slot.minute) {
              return true;
            }
            
            const bookedTotalMinutes = bookedHour * 60 + bookedMinute;
            const slotTotalMinutes = slot.hour * 60 + slot.minute;
            
            if (Math.abs(bookedTotalMinutes - slotTotalMinutes) < 30) {
              return true;
            }
            
            return false;
          });
          
          if (isBooked) return false;
          
          // Check if slot falls within any break time
          // Since appointments are 30 minutes, we need to check if the slot overlaps with break time
          const checkDate = new Date(date);
          const dayOfWeek = checkDate.getDay();
          checkDate.setHours(0, 0, 0, 0);
          
          const isBreakTime = breakTimes.some(breakTime => {
            // Check if break applies to this date (recurring or specific)
            const isRecurringMatch = breakTime.daysOfWeek && breakTime.daysOfWeek.includes(dayOfWeek);
            const isSpecificMatch = breakTime.specificDate && 
              new Date(breakTime.specificDate).setHours(0, 0, 0, 0) === checkDate.getTime();
            
            if (!isRecurringMatch && !isSpecificMatch) return false;
            
            // Check if slot time overlaps with break time
            // Slots are 30 minutes, so check if slot overlaps with break range
            const breakStartMinutes = parseTimeToMinutes(breakTime.startTime);
            const breakEndMinutes = parseTimeToMinutes(breakTime.endTime);
            const slotStartMinutes = slot.hour * 60 + slot.minute;
            const slotEndMinutes = slotStartMinutes + 30; // 30-minute appointment duration
            
            if (breakStartMinutes === null || breakEndMinutes === null) return false;
            
            if (breakEndMinutes < breakStartMinutes) {
              // Break spans midnight (e.g., 23:00 - 01:00)
              // Slot overlaps if: slot starts before break ends OR slot ends after break starts
              return slotStartMinutes < breakEndMinutes || slotEndMinutes > breakStartMinutes;
            } else {
              // Normal break (e.g., 12:00 - 13:00)
              // Slot overlaps if: slot starts before break ends AND slot ends after break starts
              // This ensures any overlapping 30-minute slot is excluded
              return slotStartMinutes < breakEndMinutes && slotEndMinutes > breakStartMinutes;
            }
          });
          
          return !isBreakTime;
        });

        return {
          available: true,
          slots: available.map(slot => slot.value),
          bookedSlots: bookedTimes,
          reason: isUnavailable.reason ? `Doctor unavailable (${isUnavailable.reason})` : undefined
        };
      } else {
        // Doctor unavailable for entire day
        return {
          available: false,
          slots: [],
          reason: `Doctor is unavailable on this date${isUnavailable.reason ? ` (${isUnavailable.reason})` : ''}. Please select another date.`
        };
      }
    }

    // Get existing appointments for this doctor on this date
    const existingAppointments = await Appointment.find({
      doctor: doctorId,
      appointmentDate: date,
      status: { $in: ['confirmed', 'pending'] }
    }).select('appointmentTime');

    const bookedTimes = existingAppointments.map(apt => apt.appointmentTime);
    
    // Get break times for this doctor
    const breakTimes = await DoctorBreakTime.getDoctorBreakTimes(doctorId);
    
    // Helper function to parse time to minutes
    const parseTimeToMinutes = (timeStr) => {
      if (!timeStr) return null;
      const match = timeStr.match(/(\d{1,2}):(\d{2})/);
      if (match) {
        const hour = parseInt(match[1]);
        const minute = parseInt(match[2]);
        return hour * 60 + minute;
      }
      // Try 12-hour format
      const match12 = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
      if (match12) {
        let hour = parseInt(match12[1]);
        const minute = parseInt(match12[2]);
        const period = match12[3].toUpperCase();
        if (period === 'PM' && hour !== 12) hour += 12;
        if (period === 'AM' && hour === 12) hour = 0;
        return hour * 60 + minute;
      }
      return null;
    };
    
    // Filter out booked slots and break times
    const available = timeSlots.filter(slot => {
      // Check if this slot is booked
      const isBooked = bookedTimes.some(bookedTime => {
        const bookedHour = parseTimeToHour(bookedTime);
        const bookedMinute = parseTimeToMinute(bookedTime);
        
        // Normalize booked time to nearest 30-minute slot
        const bookedSlotMinute = bookedMinute < 30 ? 0 : 30;
        
        // Check if booked time matches this slot exactly
        if (bookedHour === slot.hour && bookedSlotMinute === slot.minute) {
          return true;
        }
        
        // Also check if booked time is within 30 minutes of this slot
        // This prevents booking overlapping appointments
        const bookedTotalMinutes = bookedHour * 60 + bookedMinute;
        const slotTotalMinutes = slot.hour * 60 + slot.minute;
        
        // If booked time is within 30 minutes before or after this slot, consider it booked
        if (Math.abs(bookedTotalMinutes - slotTotalMinutes) < 30) {
          return true;
        }
        
        return false;
      });
      
      if (isBooked) return false;
      
      // Check if slot falls within any break time
      // Since appointments are 30 minutes, we need to check if the slot overlaps with break time
      const checkDate = new Date(date);
      const dayOfWeek = checkDate.getDay();
      checkDate.setHours(0, 0, 0, 0);
      
      const isBreakTime = breakTimes.some(breakTime => {
        // Check if break applies to this date (recurring or specific)
        const isRecurringMatch = breakTime.daysOfWeek && breakTime.daysOfWeek.includes(dayOfWeek);
        const isSpecificMatch = breakTime.specificDate && 
          new Date(breakTime.specificDate).setHours(0, 0, 0, 0) === checkDate.getTime();
        
        if (!isRecurringMatch && !isSpecificMatch) return false;
        
        // Check if slot time overlaps with break time
        // Slots are 30 minutes, so check if slot overlaps with break range
        const breakStartMinutes = parseTimeToMinutes(breakTime.startTime);
        const breakEndMinutes = parseTimeToMinutes(breakTime.endTime);
        const slotStartMinutes = slot.hour * 60 + slot.minute;
        const slotEndMinutes = slotStartMinutes + 30; // 30-minute appointment duration
        
        if (breakStartMinutes === null || breakEndMinutes === null) return false;
        
        if (breakEndMinutes < breakStartMinutes) {
          // Break spans midnight (e.g., 23:00 - 01:00)
          // Slot overlaps if: slot starts before break ends OR slot ends after break starts
          return slotStartMinutes < breakEndMinutes || slotEndMinutes > breakStartMinutes;
        } else {
          // Normal break (e.g., 12:00 - 13:00)
          // Slot overlaps if: slot starts before break ends AND slot ends after break starts
          // This ensures any overlapping 30-minute slot is excluded
          return slotStartMinutes < breakEndMinutes && slotEndMinutes > breakStartMinutes;
        }
      });
      
      return !isBreakTime;
    });

    return {
      available: true,
      slots: available.map(slot => slot.value),
      bookedSlots: bookedTimes
    };
  } catch (error) {
    console.error('Get available time slots error:', error);
    return {
      available: false,
      slots: [],
      reason: 'Error fetching available time slots'
    };
  }
};

/**
 * Format time for display (12-hour format)
 */
const formatTimeForDisplay = (hour, minute) => {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
  return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
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

