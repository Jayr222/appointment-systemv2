import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import { put, del } from '@vercel/blob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check if we should use Vercel Blob (for production)
const useVercelBlob = process.env.BLOB_READ_WRITE_TOKEN && process.env.BLOB_READ_WRITE_TOKEN.length > 0;

if (useVercelBlob) {
  console.log('📁 Using Vercel Blob for file storage');
} else {
  console.log('📁 Using local filesystem for file storage');
}

// File filter
const fileFilter = (req, file, cb) => {
  // Accept images, PDFs, and documents
  const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Only images, PDFs, and documents are allowed'));
  }
};

// Configure storage - Always use multer memory storage for Vercel Blob
// Local files still use disk storage
const storage = useVercelBlob 
  ? multer.memoryStorage() // Store in memory for Vercel Blob upload
  : multer.diskStorage({
      destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../../uploads/'));
      },
      filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
      }
    });

export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: fileFilter
});

// Upload file to Vercel Blob
export const uploadToVercelBlob = async (file, filename) => {
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

export const deleteFile = async (filePath, blobUrl = null) => {
  try {
    if (useVercelBlob && blobUrl) {
      // Delete from Vercel Blob
      await del(blobUrl);
      return true;
    } else {
      // Delete from local filesystem
      await fs.unlink(filePath);
      return true;
    }
  } catch (error) {
    console.error('File deletion error:', error);
    return false;
  }
};

export { useVercelBlob };

