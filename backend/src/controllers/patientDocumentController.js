import PatientDocument from '../models/PatientDocument.js';
import User from '../models/User.js';
import Appointment from '../models/Appointment.js';
import { upload, useCloudinary } from '../services/documentService.js';
import { deleteFile } from '../services/documentService.js';
import { logActivity } from '../services/loggingService.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ASSIGNMENT_STATUSES = ['pending', 'confirmed', 'completed'];

const getAssignedPatientIds = async (doctorId) => {
  const ids = await Appointment.distinct('patient', {
    doctor: doctorId,
    status: { $in: ASSIGNMENT_STATUSES }
  });

  return ids.map((id) => id.toString());
};

const isPatientAssignedToDoctor = async (doctorId, patientId) => {
  if (!patientId) {
    return false;
  }

  const assignmentExists = await Appointment.exists({
    doctor: doctorId,
    patient: patientId,
    status: { $in: ASSIGNMENT_STATUSES }
  });

  return Boolean(assignmentExists);
};

const extractPatientId = (patient) => {
  if (!patient) return null;
  if (typeof patient === 'string') return patient;
  if (patient._id) return patient._id.toString();
  if (patient.toString) return patient.toString();
  return null;
};

// @desc    Get patients assigned to the doctor
// @route   GET /api/doctor/patient-documents/patients
// @access  Private/Doctor
export const getAssignedPatients = async (req, res) => {
  try {
    const doctorsPatients = await getAssignedPatientIds(req.user.id);

    const patients = await User.find({ role: 'patient' })
      .select('name email phone')
      .sort({ name: 1 });

    // Flag which patients are actually assigned to this doctor
    const assignedSet = new Set(doctorsPatients.map((id) => id.toString()));
    const enrichedPatients = patients.map((patient) => ({
      ...patient.toObject(),
      isAssigned: assignedSet.has(patient._id.toString())
    }));

    res.json({
      success: true,
      patients: enrichedPatients
    });
  } catch (error) {
    console.error('Get assigned patients error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all patient documents for the authenticated doctor
// @route   GET /api/doctor/patient-documents
// @access  Private/Doctor
export const getAllPatientDocuments = async (req, res) => {
  try {
    const { patientId, documentType } = req.query;
    const assignedPatientIds = await getAssignedPatientIds(req.user.id);

    if (assignedPatientIds.length === 0) {
      return res.json({
        success: true,
        documents: []
      });
    }

    const assignedPatientIdSet = new Set(assignedPatientIds.map((id) => id.toString()));

    if (patientId && !assignedPatientIdSet.has(patientId.toString())) {
      return res.status(403).json({ message: 'You are not authorized to view this patient\'s documents' });
    }

    const query = {
      patient: patientId ? patientId : { $in: assignedPatientIds }
    };

    if (documentType) {
      query.documentType = documentType;
    }

    const documents = await PatientDocument.find(query)
      .populate('patient', 'name email phone')
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      documents
    });
  } catch (error) {
    console.error('Get patient documents error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Upload patient document
// @route   POST /api/doctor/patient-documents
// @access  Private/Doctor
export const uploadPatientDocument = async (req, res) => {
  try {
    const { patientId, documentType, diseaseName, diseaseCode, diagnosisDate, notes } = req.body;

    if (!patientId || !documentType) {
      return res.status(400).json({ message: 'Patient ID and document type are required' });
    }

    if (!diseaseName || !diseaseName.trim()) {
      return res.status(400).json({ message: 'Please provide the condition associated with this document.' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'File is required' });
    }

    // Verify patient exists
    const patient = await User.findById(patientId);
    if (!patient || patient.role !== 'patient') {
      return res.status(404).json({ message: 'Patient not found' });
    }

    const isAssigned = await isPatientAssignedToDoctor(req.user.id, patientId);
    if (!isAssigned) {
      return res.status(403).json({ message: 'You are not authorized to upload documents for this patient' });
    }

    // Create document record
    let parsedDiagnosisDate;
    if (diagnosisDate) {
      const parsed = new Date(diagnosisDate);
      if (Number.isNaN(parsed.getTime())) {
        return res.status(400).json({ message: 'Invalid diagnosis date provided.' });
      }
      parsedDiagnosisDate = parsed;
    }

    // Handle both local and Cloudinary file storage
    const fileName = useCloudinary 
      ? req.file.filename || req.file.public_id || `cloudinary-${Date.now()}`
      : req.file.filename;
    
    const filePath = useCloudinary 
      ? req.file.path // Cloudinary URL
      : req.file.path; // Local path
    
    const cloudinaryPublicId = useCloudinary && req.file.public_id 
      ? req.file.public_id 
      : undefined;

    const document = new PatientDocument({
      patient: patientId,
      fileName: fileName,
      originalFileName: req.file.originalname,
      filePath: filePath,
      cloudinaryPublicId: cloudinaryPublicId,
      documentType,
      uploadedBy: req.user.id,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      diseaseName: diseaseName.trim(),
      diseaseCode: diseaseCode?.trim() || undefined,
      diagnosisDate: parsedDiagnosisDate,
      notes: notes?.trim() || undefined
    });

    await document.save();
    await document.populate('patient', 'name email phone');
    await document.populate('uploadedBy', 'name email');

    // Log activity
    await logActivity(
      req.user.id,
      'upload_document',
      'document_management',
      `Uploaded ${documentType} for patient ${patient.name}`
    );

    res.status(201).json({
      success: true,
      document
    });
  } catch (error) {
    console.error('Upload document error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get document by ID
// @route   GET /api/doctor/patient-documents/:id
// @access  Private/Doctor
export const getDocumentById = async (req, res) => {
  try {
    const document = await PatientDocument.findById(req.params.id)
      .populate('patient', 'name email phone')
      .populate('uploadedBy', 'name email');

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const patientId = extractPatientId(document.patient);
    const isAssigned = await isPatientAssignedToDoctor(req.user.id, patientId);

    if (!isAssigned) {
      return res.status(403).json({ message: 'You are not authorized to view this document' });
    }

    res.json({
      success: true,
      document
    });
  } catch (error) {
    console.error('Get document error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Download/view document
// @route   GET /api/doctor/patient-documents/:id/download
// @access  Private/Doctor
export const downloadDocument = async (req, res) => {
  try {
    const document = await PatientDocument.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const patientId = extractPatientId(document.patient);
    const isAssigned = await isPatientAssignedToDoctor(req.user.id, patientId);

    if (!isAssigned) {
      return res.status(403).json({ message: 'You are not authorized to access this document' });
    }

    // Determine the correct file path
    let fullPath;
    if (document.filePath) {
      // If filePath is absolute, use it directly
      if (path.isAbsolute(document.filePath)) {
        fullPath = document.filePath;
      } else {
        // If relative, resolve from project root
        fullPath = path.join(__dirname, '../../', document.filePath);
      }
    } else {
      // Fallback to using fileName
      fullPath = path.join(__dirname, '../../uploads', document.fileName);
    }

    // Check if file exists
    try {
      await fs.access(fullPath);
    } catch (error) {
      console.error('File access error:', error);
      console.error('Looking for file at:', fullPath);
      return res.status(404).json({ message: 'File not found on server' });
    }

    // Read file as buffer to ensure binary data integrity
    const fileBuffer = await fs.readFile(fullPath);
    
    // Set appropriate headers
    res.setHeader('Content-Type', document.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(document.originalFileName)}"`);
    res.setHeader('Content-Length', fileBuffer.length);
    
    // Send file buffer
    res.send(fileBuffer);
  } catch (error) {
    console.error('Download document error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete patient document
// @route   DELETE /api/doctor/patient-documents/:id
// @access  Private/Doctor
export const deletePatientDocument = async (req, res) => {
  try {
    const document = await PatientDocument.findById(req.params.id)
      .populate('patient', 'name email');

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const patientId = extractPatientId(document.patient);
    const isAssigned = await isPatientAssignedToDoctor(req.user.id, patientId);

    if (!isAssigned) {
      return res.status(403).json({ message: 'You are not authorized to delete this document' });
    }

    // Delete file from storage (local or Cloudinary)
    if (useCloudinary && document.cloudinaryPublicId) {
      // Delete from Cloudinary
      await deleteFile(document.filePath, document.cloudinaryPublicId);
    } else {
      // Delete from local filesystem
      let fullPath;
      if (document.filePath) {
        fullPath = path.isAbsolute(document.filePath)
          ? document.filePath
          : path.join(__dirname, '../../', document.filePath);
      } else {
        fullPath = path.join(__dirname, '../../uploads', document.fileName);
      }
      await deleteFile(fullPath);
    }

    // Delete document record
    await PatientDocument.findByIdAndDelete(req.params.id);

    // Log activity
    await logActivity(
      req.user.id,
      'delete_document',
      'document_management',
      `Deleted ${document.documentType} for patient ${document.patient.name}`
    );

    res.json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Middleware for file upload
export const uploadMiddleware = upload.single('document');

