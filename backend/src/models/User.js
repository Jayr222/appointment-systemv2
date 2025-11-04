import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    minlength: 6,
    select: false
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true
  },
  authProvider: {
    type: String,
    enum: ['local', 'google'],
    default: 'local'
  },
  role: {
    type: String,
    enum: ['admin', 'doctor', 'patient', 'nurse'],
    required: true
  },
  phone: {
    type: String,
    trim: true
  },
  dateOfBirth: {
    type: Date
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other']
  },
  address: {
    type: String
  },
  // Doctor specific fields
  specialization: {
    type: String
  },
  licenseNumber: {
    type: String,
    unique: true,
    sparse: true
  },
  experience: {
    type: Number
  },
  bio: {
    type: String
  },
  // Doctor verification fields
  doctorVerification: {
    isVerified: {
      type: Boolean,
      default: false
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    verifiedAt: {
      type: Date
    },
    verificationDocuments: {
      medicalLicense: String,      // File path or URL
      idDocument: String,          // Government ID
      diploma: String,             // Medical degree
      additionalDocs: [String]     // Other certificates
    },
    verificationNotes: String,
    rejectionReason: String
  },
  // Patient specific fields
  emergencyContact: {
    name: String,
    phone: String,
    relationship: String
  },
  insuranceInfo: {
    provider: String,
    policyNumber: String
  },
  // Medical History
  medicalHistory: {
    allergies: [{
      name: String,
      severity: {
        type: String,
        enum: ['mild', 'moderate', 'severe'],
        default: 'moderate'
      },
      reaction: String,
      notes: String
    }],
    chronicConditions: [{
      condition: String,
      diagnosedDate: Date,
      status: {
        type: String,
        enum: ['active', 'controlled', 'resolved'],
        default: 'active'
      },
      medications: String,
      notes: String
    }],
    currentMedications: [{
      name: String,
      dosage: String,
      frequency: String,
      startDate: Date,
      prescribingDoctor: String,
      notes: String
    }],
    pastSurgeries: [{
      procedure: String,
      date: Date,
      hospital: String,
      notes: String
    }],
    familyHistory: {
      diabetes: Boolean,
      hypertension: Boolean,
      heartDisease: Boolean,
      cancer: Boolean,
      otherConditions: String
    },
    bloodType: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'],
      default: 'Unknown'
    },
    additionalNotes: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  avatar: {
    type: String
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  // Skip password hashing for Google OAuth users or if password not modified
  if (this.authProvider === 'google' || !this.isModified('password') || !this.password) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Match password method
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model('User', userSchema);

