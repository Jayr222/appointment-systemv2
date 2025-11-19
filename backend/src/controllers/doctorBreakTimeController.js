import DoctorBreakTime from '../models/DoctorBreakTime.js';
import { logActivity } from '../services/loggingService.js';

// @desc    Get doctor's break times
// @route   GET /api/doctor/break-times
// @access  Private/Doctor
export const getDoctorBreakTimes = async (req, res) => {
  try {
    const doctorId = req.user.role === 'admin' ? req.query.doctorId : req.user.id;
    
    if (!doctorId) {
      return res.status(400).json({ message: 'Doctor ID is required' });
    }

    const breakTimes = await DoctorBreakTime.find({
      doctor: doctorId,
      isActive: true
    }).sort({ daysOfWeek: 1, startTime: 1 });

    res.json({
      success: true,
      breakTimes
    });
  } catch (error) {
    console.error('Get doctor break times error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Add break time
// @route   POST /api/doctor/break-times
// @access  Private/Doctor or Admin
export const addBreakTime = async (req, res) => {
  try {
    const { daysOfWeek, specificDate, startTime, endTime, description } = req.body;
    const doctorId = req.user.role === 'admin' && req.body.doctorId 
      ? req.body.doctorId 
      : req.user.id;

    // Validate: either daysOfWeek or specificDate must be provided
    if ((!daysOfWeek || daysOfWeek.length === 0) && !specificDate) {
      return res.status(400).json({ 
        message: 'Either days of week or specific date must be provided' 
      });
    }

    // Validate times
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      return res.status(400).json({ 
        message: 'Invalid time format. Use 24-hour format (HH:MM)' 
      });
    }

    // Validate end time is after start time (unless spanning midnight)
    const parseTimeToMinutes = (timeStr) => {
      const match = timeStr.match(/(\d{1,2}):(\d{2})/);
      if (match) {
        const hour = parseInt(match[1]);
        const minute = parseInt(match[2]);
        return hour * 60 + minute;
      }
      return null;
    };

    const startMinutes = parseTimeToMinutes(startTime);
    const endMinutes = parseTimeToMinutes(endTime);
    
    if (startMinutes === null || endMinutes === null) {
      return res.status(400).json({ message: 'Invalid time format' });
    }

    // Allow break to span midnight (end < start is valid)
    // But if it doesn't span midnight, end must be > start
    if (endMinutes > startMinutes && endMinutes <= startMinutes) {
      return res.status(400).json({ 
        message: 'End time must be after start time' 
      });
    }

    const breakTime = await DoctorBreakTime.create({
      doctor: doctorId,
      daysOfWeek: daysOfWeek || [],
      specificDate: specificDate ? new Date(specificDate) : null,
      startTime,
      endTime,
      description: description || 'Break Time',
      isActive: true
    });

    // Log activity
    await logActivity(req.user.id, 'add_break_time', 'doctor_break_time', 
      `Added break time: ${startTime} - ${endTime}`);

    res.status(201).json({
      success: true,
      breakTime
    });
  } catch (error) {
    console.error('Add break time error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Remove break time
// @route   DELETE /api/doctor/break-times/:id
// @access  Private/Doctor or Admin
export const removeBreakTime = async (req, res) => {
  try {
    const breakTime = await DoctorBreakTime.findById(req.params.id);

    if (!breakTime) {
      return res.status(404).json({ message: 'Break time record not found' });
    }

    // Check permission
    if (req.user.role !== 'admin' && breakTime.doctor.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    breakTime.isActive = false;
    await breakTime.save();

    // Log activity
    await logActivity(req.user.id, 'remove_break_time', 'doctor_break_time', 
      'Removed doctor break time');

    res.json({
      success: true,
      message: 'Break time removed successfully'
    });
  } catch (error) {
    console.error('Remove break time error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update break time
// @route   PUT /api/doctor/break-times/:id
// @access  Private/Doctor or Admin
export const updateBreakTime = async (req, res) => {
  try {
    const breakTime = await DoctorBreakTime.findById(req.params.id);

    if (!breakTime) {
      return res.status(404).json({ message: 'Break time record not found' });
    }

    // Check permission
    if (req.user.role !== 'admin' && breakTime.doctor.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { daysOfWeek, specificDate, startTime, endTime, description } = req.body;

    if (daysOfWeek !== undefined) breakTime.daysOfWeek = daysOfWeek;
    if (specificDate !== undefined) breakTime.specificDate = specificDate ? new Date(specificDate) : null;
    if (startTime !== undefined) breakTime.startTime = startTime;
    if (endTime !== undefined) breakTime.endTime = endTime;
    if (description !== undefined) breakTime.description = description;

    await breakTime.save();

    // Log activity
    await logActivity(req.user.id, 'update_break_time', 'doctor_break_time', 
      'Updated doctor break time');

    res.json({
      success: true,
      breakTime
    });
  } catch (error) {
    console.error('Update break time error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
