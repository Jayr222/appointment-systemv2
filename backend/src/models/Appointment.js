import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  appointmentDate: {
    type: Date,
    required: true
  },
  appointmentTime: {
    type: String,
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled'],
    default: 'pending'
  },
  notes: {
    type: String
  },
  // Proof documents (if required)
  proofDocuments: [{
    filename: String,
    originalName: String,
    path: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // After appointment completion
  diagnosis: {
    type: String
  },
  prescription: [{
    medication: String,
    dosage: String,
    frequency: String,
    duration: String
  }],
  followUpRequired: {
    type: Boolean,
    default: false
  },
  followUpDate: {
    type: Date
  },
  canceledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  cancellationReason: {
    type: String
  },
  // Queue Number System
  queueNumber: {
    type: Number,
    default: null
  },
  queueDate: {
    type: Date,
    default: null
  },
  queueStatus: {
    type: String,
    enum: ['waiting', 'called', 'in-progress', 'served', 'skipped'],
    default: 'waiting'
  },
  // Patient arrival confirmation
  patientArrived: {
    type: Boolean,
    default: false
  },
  arrivedAt: {
    type: Date,
    default: null
  },
  confirmedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  checkedInAt: {
    type: Date,
    default: null
  },
  calledAt: {
    type: Date,
    default: null
  },
  servedAt: {
    type: Date,
    default: null
  },
  // Visit metadata
  visitType: {
    type: String,
    enum: ['booking', 'walk-in'],
    default: 'booking'
  },
  priorityLevel: {
    type: String,
    enum: ['regular', 'priority', 'emergency'],
    default: 'regular'
  },
  estimatedStartAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Index for efficient queue queries
appointmentSchema.index({ queueDate: 1, queueNumber: 1 });
appointmentSchema.index({ queueStatus: 1 });

// Prevent double booking of identical slot for a doctor (pending/confirmed only)
appointmentSchema.index(
  { doctor: 1, appointmentDate: 1, appointmentTime: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ['pending', 'confirmed'] } }
  }
);

export default mongoose.model('Appointment', appointmentSchema);

