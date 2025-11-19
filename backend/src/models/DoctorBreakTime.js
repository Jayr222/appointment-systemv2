import mongoose from 'mongoose';

const doctorBreakTimeSchema = new mongoose.Schema({
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Break time pattern
  // If daysOfWeek is set, break is recurring on those days
  // If specificDate is set, break is for a specific date only
  daysOfWeek: [{
    type: Number, // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    min: 0,
    max: 6
  }],
  specificDate: {
    type: Date, // Optional: for one-time break on a specific date
    default: null
  },
  // Start time (24-hour format: "HH:MM")
  startTime: {
    type: String,
    required: true,
    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
  },
  // End time (24-hour format: "HH:MM")
  endTime: {
    type: String,
    required: true,
    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
  },
  // Description/reason for break (e.g., "Lunch Break", "Coffee Break")
  description: {
    type: String,
    default: 'Break Time'
  },
  // Status
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
doctorBreakTimeSchema.index({ doctor: 1, isActive: 1 });
doctorBreakTimeSchema.index({ doctor: 1, daysOfWeek: 1 });
doctorBreakTimeSchema.index({ doctor: 1, specificDate: 1 });

// Check if doctor has a break at a specific time on a date
doctorBreakTimeSchema.statics.hasBreakAtTime = async function(doctorId, date, time) {
  const checkDate = new Date(date);
  const dayOfWeek = checkDate.getDay();
  
  // Check recurring break times
  const recurringBreaks = await this.find({
    doctor: doctorId,
    daysOfWeek: dayOfWeek,
    isActive: true
  });
  
  // Check specific date break times
  checkDate.setHours(0, 0, 0, 0);
  const specificDateBreaks = await this.find({
    doctor: doctorId,
    specificDate: checkDate,
    isActive: true
  });
  
  const allBreaks = [...recurringBreaks, ...specificDateBreaks];
  
  if (allBreaks.length === 0) {
    return false;
  }
  
  // Parse the appointment time to minutes
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
  
  const appointmentMinutes = parseTimeToMinutes(time);
  if (appointmentMinutes === null) return false;
  
  // Check if appointment time falls within any break time
  return allBreaks.some(breakTime => {
    const startMinutes = parseTimeToMinutes(breakTime.startTime);
    const endMinutes = parseTimeToMinutes(breakTime.endTime);
    
    if (startMinutes === null || endMinutes === null) return false;
    
    // Handle break times that span midnight (end time < start time)
    if (endMinutes < startMinutes) {
      // Break spans midnight: check if time is >= start OR < end
      return appointmentMinutes >= startMinutes || appointmentMinutes < endMinutes;
    } else {
      // Normal break: check if time is within range [start, end)
      return appointmentMinutes >= startMinutes && appointmentMinutes < endMinutes;
    }
  });
};

// Get all active break times for a doctor
doctorBreakTimeSchema.statics.getDoctorBreakTimes = async function(doctorId) {
  return await this.find({
    doctor: doctorId,
    isActive: true
  }).sort({ daysOfWeek: 1, startTime: 1 });
};

export default mongoose.model('DoctorBreakTime', doctorBreakTimeSchema);
