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
  }
}, {
  timestamps: true
});

export default mongoose.model('Appointment', appointmentSchema);

