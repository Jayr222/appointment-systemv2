import mongoose from 'mongoose';

const slotHoldSchema = new mongoose.Schema({
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
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  expiresAt: {
    type: Date,
    required: true
  }
}, {
  timestamps: true
});

// TTL index - automatic expiry of holds
slotHoldSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Avoid multiple holds for same slot
slotHoldSchema.index(
  { doctor: 1, appointmentDate: 1, appointmentTime: 1 },
  { unique: true }
);

export default mongoose.model('SlotHold', slotHoldSchema);


