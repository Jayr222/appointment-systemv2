import mongoose from 'mongoose';

const doctorAvailabilitySchema = new mongoose.Schema({
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Unavailable date range
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  // Reason for unavailability
  reason: {
    type: String,
    required: true,
    enum: ['seminar', 'conference', 'vacation', 'training', 'personal', 'sick', 'other']
  },
  // Additional details
  description: {
    type: String,
    default: ''
  },
  // Specific time slots if only unavailable during certain hours (optional)
  unavailableTimes: [{
    startTime: String, // e.g., "8:00 AM"
    endTime: String    // e.g., "12:00 PM"
  }],
  // Created by (doctor themselves or admin)
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Status
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
doctorAvailabilitySchema.index({ doctor: 1, startDate: 1, endDate: 1 });
doctorAvailabilitySchema.index({ doctor: 1, isActive: 1 });

// Check if doctor is unavailable on a specific date
doctorAvailabilitySchema.statics.isDoctorUnavailable = async function(doctorId, date) {
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);
  
  const unavailability = await this.findOne({
    doctor: doctorId,
    startDate: { $lte: checkDate },
    endDate: { $gte: checkDate },
    isActive: true
  });
  
  return unavailability;
};

// Check if doctor is unavailable at a specific time on a date
doctorAvailabilitySchema.statics.isDoctorUnavailableAtTime = async function(doctorId, date, time) {
  const unavailability = await this.isDoctorUnavailable(doctorId, date);
  
  if (!unavailability) {
    return false;
  }
  
  // If no specific time slots, doctor is unavailable for the whole day
  if (!unavailability.unavailableTimes || unavailability.unavailableTimes.length === 0) {
    return true;
  }
  
  // Helper to parse time to minutes for accurate comparison
  const parseTimeToMinutes = (timeStr) => {
    if (!timeStr) return null;
    const time = timeStr.trim().toUpperCase();
    
    // Handle 12-hour format
    const match = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/);
    if (match) {
      let hour = parseInt(match[1]);
      const minute = parseInt(match[2]);
      const period = match[3];
      if (period === 'PM' && hour !== 12) hour += 12;
      else if (period === 'AM' && hour === 12) hour = 0;
      return hour * 60 + minute;
    }
    
    // Handle 24-hour format
    const match24 = time.match(/(\d{1,2}):(\d{2})/);
    if (match24) {
      const hour = parseInt(match24[1]);
      const minute = parseInt(match24[2]);
      return hour * 60 + minute;
    }
    
    return null;
  };
  
  // Check if the time falls within any unavailable time slot
  const timeMinutes = parseTimeToMinutes(time);
  if (timeMinutes === null) return true; // If can't parse, assume unavailable
  
  return unavailability.unavailableTimes.some(slot => {
    const slotStartMinutes = parseTimeToMinutes(slot.startTime);
    const slotEndMinutes = parseTimeToMinutes(slot.endTime);
    
    if (slotStartMinutes === null || slotEndMinutes === null) return false;
    
    // Check if appointment time falls within unavailable range
    // Appointment slots are 30 minutes, so check if start time is in range
    return timeMinutes >= slotStartMinutes && timeMinutes < slotEndMinutes;
  });
};

// Helper function to parse time to hour (exported for use in appointmentService)
export const parseTimeToHourForAvailability = (timeStr) => {
  if (!timeStr) return null;
  const time = timeStr.trim().toUpperCase();
  
  if (time.includes('AM') || time.includes('PM')) {
    const match = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/);
    if (match) {
      let hour = parseInt(match[1]);
      const period = match[3];
      if (period === 'PM' && hour !== 12) hour += 12;
      else if (period === 'AM' && hour === 12) hour = 0;
      return hour;
    }
  }
  
  const match = time.match(/(\d{1,2}):(\d{2})/);
  return match ? parseInt(match[1]) : null;
};

// Helper function to parse time to hour (internal use)
const parseTimeToHour = (timeStr) => {
  return parseTimeToHourForAvailability(timeStr);
};

export default mongoose.model('DoctorAvailability', doctorAvailabilitySchema);

