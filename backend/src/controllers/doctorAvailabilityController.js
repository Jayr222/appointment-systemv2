import DoctorAvailability from '../models/DoctorAvailability.js';
import { logActivity } from '../services/loggingService.js';

// @desc    Get doctor's unavailability schedule
// @route   GET /api/doctor/availability
// @access  Private/Doctor
export const getDoctorAvailability = async (req, res) => {
  try {
    const doctorId = req.user.role === 'admin' ? req.query.doctorId : req.user.id;
    
    if (!doctorId) {
      return res.status(400).json({ message: 'Doctor ID is required' });
    }

    const unavailabilities = await DoctorAvailability.find({
      doctor: doctorId,
      isActive: true
    })
      .populate('createdBy', 'name email')
      .sort({ startDate: 1 });

    res.json({
      success: true,
      unavailabilities
    });
  } catch (error) {
    console.error('Get doctor availability error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Mark doctor as unavailable
// @route   POST /api/doctor/availability
// @access  Private/Doctor or Admin
export const markUnavailable = async (req, res) => {
  try {
    const { startDate, endDate, reason, description, unavailableTimes } = req.body;
    const doctorId = req.user.role === 'admin' && req.body.doctorId 
      ? req.body.doctorId 
      : req.user.id;

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start > end) {
      return res.status(400).json({ message: 'Start date must be before end date' });
    }

    // Check for overlapping unavailability
    const overlapping = await DoctorAvailability.findOne({
      doctor: doctorId,
      startDate: { $lte: end },
      endDate: { $gte: start },
      isActive: true
    });

    if (overlapping) {
      return res.status(400).json({ 
        message: 'Unavailability period overlaps with existing unavailability',
        overlapping
      });
    }

    const unavailability = await DoctorAvailability.create({
      doctor: doctorId,
      startDate: start,
      endDate: end,
      reason: reason || 'other',
      description: description || '',
      unavailableTimes: unavailableTimes || [],
      createdBy: req.user.id,
      isActive: true
    });

    // Log activity
    await logActivity(req.user.id, 'mark_unavailable', 'doctor_availability', 
      `Marked doctor unavailable from ${startDate} to ${endDate}`);

    res.status(201).json({
      success: true,
      unavailability
    });
  } catch (error) {
    console.error('Mark unavailable error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Remove unavailability (make doctor available again)
// @route   DELETE /api/doctor/availability/:id
// @access  Private/Doctor or Admin
export const removeUnavailability = async (req, res) => {
  try {
    const unavailability = await DoctorAvailability.findById(req.params.id);

    if (!unavailability) {
      return res.status(404).json({ message: 'Unavailability record not found' });
    }

    // Check permission
    if (req.user.role !== 'admin' && unavailability.doctor.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    unavailability.isActive = false;
    await unavailability.save();

    // Log activity
    await logActivity(req.user.id, 'remove_unavailability', 'doctor_availability', 
      'Removed doctor unavailability');

    res.json({
      success: true,
      message: 'Unavailability removed successfully'
    });
  } catch (error) {
    console.error('Remove unavailability error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update unavailability
// @route   PUT /api/doctor/availability/:id
// @access  Private/Doctor or Admin
export const updateUnavailability = async (req, res) => {
  try {
    const unavailability = await DoctorAvailability.findById(req.params.id);

    if (!unavailability) {
      return res.status(404).json({ message: 'Unavailability record not found' });
    }

    // Check permission
    if (req.user.role !== 'admin' && unavailability.doctor.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { startDate, endDate, reason, description, unavailableTimes } = req.body;

    if (startDate) unavailability.startDate = new Date(startDate);
    if (endDate) unavailability.endDate = new Date(endDate);
    if (reason) unavailability.reason = reason;
    if (description !== undefined) unavailability.description = description;
    if (unavailableTimes) unavailability.unavailableTimes = unavailableTimes;

    await unavailability.save();

    // Log activity
    await logActivity(req.user.id, 'update_unavailability', 'doctor_availability', 
      'Updated doctor unavailability');

    res.json({
      success: true,
      unavailability
    });
  } catch (error) {
    console.error('Update unavailability error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

