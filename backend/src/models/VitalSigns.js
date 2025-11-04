import mongoose from 'mongoose';

const vitalSignsSchema = new mongoose.Schema({
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
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Vital Signs
  bloodPressure: {
    systolic: { type: Number },
    diastolic: { type: Number }
  },
  heartRate: {
    type: Number,
    min: 0
  },
  temperature: {
    value: { type: Number },
    unit: { type: String, enum: ['Celsius', 'Fahrenheit'], default: 'Celsius' }
  },
  respiratoryRate: {
    type: Number,
    min: 0
  },
  oxygenSaturation: {
    type: Number,
    min: 0,
    max: 100
  },
  weight: {
    value: { type: Number },
    unit: { type: String, enum: ['kg', 'lbs'], default: 'kg' }
  },
  height: {
    value: { type: Number },
    unit: { type: String, enum: ['cm', 'ft'], default: 'cm' }
  },
  bmi: {
    type: Number
  },
  // Additional Notes
  notes: {
    type: String
  },
  // Symptoms or Observations
  symptoms: [{
    type: String
  }],
  // Pain Level (1-10)
  painLevel: {
    type: Number,
    min: 0,
    max: 10
  }
}, {
  timestamps: true
});

// Calculate BMI before saving
vitalSignsSchema.pre('save', function(next) {
  if (this.weight && this.weight.value && this.height && this.height.value) {
    let weightInKg = this.weight.value;
    let heightInM = this.height.value;

    // Convert to kg and meters if needed
    if (this.weight.unit === 'lbs') {
      weightInKg = weightInKg * 0.453592;
    }
    if (this.height.unit === 'ft') {
      heightInM = heightInM * 0.3048;
    } else if (this.height.unit === 'cm') {
      heightInM = heightInM / 100;
    }

    if (heightInM > 0) {
      this.bmi = weightInKg / (heightInM * heightInM);
      this.bmi = Math.round(this.bmi * 10) / 10; // Round to 1 decimal place
    }
  }
  next();
});

// Indexes for efficient queries
vitalSignsSchema.index({ patient: 1, createdAt: -1 });
vitalSignsSchema.index({ appointment: 1 });
vitalSignsSchema.index({ recordedBy: 1 });

export default mongoose.model('VitalSigns', vitalSignsSchema);

