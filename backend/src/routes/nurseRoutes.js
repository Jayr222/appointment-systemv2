import express from 'express';
import {
  getDashboard,
  getTodayQueue,
  recordVitalSigns,
  getPatientVitalSigns,
  createFollowUp,
  getFollowUps,
  updateFollowUp,
  getPatientInfo
} from '../controllers/nurseController.js';
import { nurseOnly } from '../middleware/nurseOnly.js';

const router = express.Router();

// All routes require nurse role
router.use(nurseOnly);

router.get('/dashboard', getDashboard);
router.get('/queue', getTodayQueue);
router.get('/patients/:id', getPatientInfo);

// Vital Signs
router.post('/vital-signs', recordVitalSigns);
router.get('/vital-signs/:patientId', getPatientVitalSigns);

// Follow-ups
router.post('/follow-ups', createFollowUp);
router.get('/follow-ups', getFollowUps);
router.put('/follow-ups/:id', updateFollowUp);

export default router;

