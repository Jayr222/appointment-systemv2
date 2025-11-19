import fs from 'fs';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { put, del } from '@vercel/blob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const avatarsDir = path.join(__dirname, '../../uploads/avatars/');

// Check if we should use Vercel Blob (for production)
const useVercelBlob = process.env.BLOB_READ_WRITE_TOKEN && process.env.BLOB_READ_WRITE_TOKEN.length > 0;

if (useVercelBlob) {
  console.log('📸 Using Vercel Blob for avatar storage');
} else {
  console.log('📸 Using local filesystem for avatar storage');
}

const ensureAvatarsDir = () => {
  if (!fs.existsSync(avatarsDir)) {
    fs.mkdirSync(avatarsDir, { recursive: true });
  }
  return avatarsDir;
};

// Configure storage - Always use multer memory storage for Vercel Blob
// Local files still use disk storage
const storage = useVercelBlob
  ? multer.memoryStorage() // Store in memory for Vercel Blob upload
  : multer.diskStorage({
      destination: function (req, file, cb) {
        try {
          cb(null, ensureAvatarsDir());
        } catch (error) {
          cb(error);
        }
      },
      filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
      }
    });

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
    fileSize: 5 * 1024 * 1024 // 5MB limit for avatars
  },
  fileFilter: fileFilter
});

// Upload avatar to Vercel Blob
export const uploadAvatarToVercelBlob = async (file, filename) => {
  if (!useVercelBlob) {
    throw new Error('Vercel Blob is not configured');
  }

  const blob = await put(filename, file.buffer, {
    access: 'public',
    addRandomSuffix: true,
  });

  return {
    url: blob.url,
    pathname: blob.pathname,
    downloadUrl: blob.downloadUrl
  };
};

// Delete avatar from Vercel Blob or local filesystem
export const deleteAvatar = async (filePath, blobUrl = null) => {
  try {
    if (useVercelBlob && blobUrl) {
      // Delete from Vercel Blob
      await del(blobUrl);
      return true;
    } else {
      // Delete from local filesystem
      const fullPath = path.join(avatarsDir, path.basename(filePath));
      if (fs.existsSync(fullPath)) {
        await fs.promises.unlink(fullPath);
      }
      return true;
    }
  } catch (error) {
    console.error('Avatar deletion error:', error);
    return false;
  }
};

export const AVATARS_DIR = avatarsDir;
export const ensureAvatarUploadDirExists = ensureAvatarsDir;
export { useVercelBlob };

// Get avatar URL
export const getAvatarUrl = (avatar, blobUrl = null) => {
  if (!avatar) return null;
  
  // If blobUrl is provided (Vercel Blob), use it
  if (blobUrl) {
    return blobUrl;
  }
  
  // If it's already a URL (from Google OAuth or Vercel Blob), return as is
  if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
    return avatar;
  }
  
  // If it's a file path, return the full URL
  return `/uploads/avatars/${avatar}`;
};

