import fs from 'fs';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const avatarsDir = path.join(__dirname, '../../uploads/avatars/');

const ensureAvatarsDir = () => {
  if (!fs.existsSync(avatarsDir)) {
    fs.mkdirSync(avatarsDir, { recursive: true });
  }
  return avatarsDir;
};

// On Vercel/serverless, use memory storage (files don't persist to filesystem)
// In local dev, use disk storage
const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;

const diskStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    try {
      cb(null, ensureAvatarsDir());
    } catch (error) {
      cb(error);
    }
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.round(Math.random() * 1E9));
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const memoryStorage = multer.memoryStorage();

const storage = isServerless ? memoryStorage : diskStorage;

// File filter for images only
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (JPEG, JPG, PNG, GIF, WEBP)'));
  }
};

export const uploadAvatar = multer({
  storage: storage,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB limit for avatars
  },
  fileFilter: fileFilter
});

export const AVATARS_DIR = avatarsDir;
export const ensureAvatarUploadDirExists = ensureAvatarsDir;

// Get avatar URL
export const getAvatarUrl = (avatar) => {
  if (!avatar) return null;
  
  // If it's already a URL (from Google OAuth), return as is
  if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
    return avatar;
  }
  
  // If it's a file path, return the full URL
  return `/uploads/avatars/${avatar}`;
};

