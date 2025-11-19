import mongoose from 'mongoose';

const patientDocumentSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  originalFileName: {
    type: String,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  blobUrl: {
    type: String,
    default: null
  },
  documentType: {
    type: String,
    required: true,
    enum: ['medical_certificate', 'lab_result', 'vaccination_record', 'prescription', 'xray', 'other']
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  diseaseName: {
    type: String,
    trim: true
  },
  diseaseCode: {
    type: String,
    trim: true
  },
  diagnosisDate: {
    type: Date
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Index for faster queries
patientDocumentSchema.index({ patient: 1, createdAt: -1 });
patientDocumentSchema.index({ documentType: 1 });
patientDocumentSchema.index({ diseaseName: 1, diagnosisDate: -1 });

const PatientDocument = mongoose.model('PatientDocument', patientDocumentSchema);

export default PatientDocument;

