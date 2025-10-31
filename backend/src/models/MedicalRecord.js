import mongoose from 'mongoose';

const medicalRecordSchema = new mongoose.Schema({
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
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  },
  // Vital signs
  vitalSigns: {
    bloodPressure: String,
    heartRate: Number,
    temperature: Number,
    weight: Number,
    height: Number
  },
  // Medical history
  chiefComplaint: {
    type: String,
    required: true
  },
  historyOfPresentIllness: {
    type: String
  },
  examination: {
    type: String
  },
  diagnosis: {
    type: String,
    required: true
  },
  treatmentPlan: {
    type: String
  },
  // Medication prescribed
  medications: [{
    name: String,
    dosage: String,
    frequency: String,
    duration: String,
    instructions: String
  }],
  // Lab tests or procedures
  investigations: [{
    testName: String,
    results: String,
    date: Date,
    notes: String
  }],
  // Follow-up information
  followUpInstructions: {
    type: String
  },
  followUpDate: {
    type: Date
  },
  // Document attachments
  attachments: [{
    filename: String,
    originalName: String,
    path: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

export default mongoose.model('MedicalRecord', medicalRecordSchema);

