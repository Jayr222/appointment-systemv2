import { protect, authorize } from './authMiddleware.js';

export const doctorOnly = [protect, authorize('doctor')];

