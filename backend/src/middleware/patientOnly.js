import { protect, authorize } from './authMiddleware.js';

export const patientOnly = [protect, authorize('patient')];

