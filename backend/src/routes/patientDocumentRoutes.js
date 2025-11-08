import express from 'express';
import {
  getAllPatientDocuments,
  uploadPatientDocument,
  getDocumentById,
  downloadDocument,
  deletePatientDocument,
  uploadMiddleware,
  getAssignedPatients
} from '../controllers/patientDocumentController.js';
import { doctorOnly } from '../middleware/doctorOnly.js';
import verifiedDoctorOnly from '../middleware/verifiedDoctorOnly.js';

const router = express.Router();
const doctorAccess = [...doctorOnly, verifiedDoctorOnly];

router.get('/patients', ...doctorAccess, getAssignedPatients);
router.get('/', ...doctorAccess, getAllPatientDocuments);
router.post('/', ...doctorAccess, uploadMiddleware, uploadPatientDocument);
router.get('/:id', ...doctorAccess, getDocumentById);
router.get('/:id/download', ...doctorAccess, downloadDocument);
router.delete('/:id', ...doctorAccess, deletePatientDocument);

export default router;

