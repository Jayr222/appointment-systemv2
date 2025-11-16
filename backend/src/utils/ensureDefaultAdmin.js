import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure environment variables from root .env are loaded when this utility is used directly
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const DEFAULT_ADMIN_EMAIL = process.env.DEFAULT_ADMIN_EMAIL || 'admin@healthcenter.com';
const DEFAULT_ADMIN_PASSWORD = process.env.DEFAULT_ADMIN_PASSWORD || 'admin123';
const DEFAULT_ADMIN_NAME = process.env.DEFAULT_ADMIN_NAME || 'System Admin';

export const ensureDefaultAdmin = async () => {
  try {
    if (!DEFAULT_ADMIN_EMAIL || !DEFAULT_ADMIN_PASSWORD) {
      console.warn('[Auth] Skipping default admin check: missing email or password env configuration.');
      return;
    }

    let adminUser = await User.findOne({ email: DEFAULT_ADMIN_EMAIL.toLowerCase().trim() });

    if (!adminUser) {
      adminUser = await User.create({
        name: DEFAULT_ADMIN_NAME,
        email: DEFAULT_ADMIN_EMAIL.toLowerCase().trim(),
        password: DEFAULT_ADMIN_PASSWORD,
        role: 'admin',
        isActive: true
      });
      console.log(`[Auth] Created default admin user (${adminUser.email}).`);
      return;
    }

    let requiresSave = false;

    if (adminUser.role !== 'admin') {
      adminUser.role = 'admin';
      requiresSave = true;
    }

    if (adminUser.isDeleted) {
      adminUser.isDeleted = false;
      adminUser.deletedAt = undefined;
      adminUser.deletedBy = undefined;
      requiresSave = true;
    }

    if (!adminUser.isActive) {
      adminUser.isActive = true;
      requiresSave = true;
    }

    if (requiresSave) {
      await adminUser.save();
      console.log('[Auth] Ensured default admin account is active and has the correct role.');
    }
  } catch (error) {
    console.error('[Auth] Failed to ensure default admin user exists:', error);
  }
};


