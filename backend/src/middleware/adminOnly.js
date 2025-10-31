import { protect, authorize } from './authMiddleware.js';

export const adminOnly = [protect, authorize('admin')];

