import mongoose from 'mongoose';

const followUpSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    default: null
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // Can be assigned to a specific nurse or doctor
  },
  type: {
    type: String,
    enum: ['phone', 'in-person', 'telemedicine', 'lab-results', 'medication-check', 'other'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'scheduled', 'completed', 'cancelled', 'missed'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  scheduledDate: {
    type: Date,
    required: true
  },
  scheduledTime: {
    type: String
  },
  completedDate: {
    type: Date
  },
  reason: {
    type: String,
    required: true
  },
  notes: {
    type: String
  },
  outcome: {
    type: String
  },
  // For phone follow-ups
  contactMethod: {
    type: String,
    enum: ['phone', 'email', 'sms', 'in-person']
  },
  // For lab results follow-up
  labResults: {
    type: String
  },
  // Reminder settings
  reminderSent: {
    type: Boolean,
    default: false
  },
  reminderDate: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
followUpSchema.index({ patient: 1, status: 1 });
followUpSchema.index({ assignedTo: 1, status: 1 });
followUpSchema.index({ scheduledDate: 1, status: 1 });
followUpSchema.index({ appointment: 1 });

export default mongoose.model('FollowUp', followUpSchema);

