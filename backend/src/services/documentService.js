import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure Cloudinary (for production/deployed environments)
const useCloudinary = process.env.USE_CLOUDINARY === 'true' && 
                      process.env.CLOUDINARY_CLOUD_NAME && 
                      process.env.CLOUDINARY_API_KEY && 
                      process.env.CLOUDINARY_API_SECRET;

if (useCloudinary) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
  console.log('📁 Using Cloudinary for file storage');
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

// Configure storage based on environment
let storage;

if (useCloudinary) {
  // Cloud storage for production
  storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'healthcare-documents',
      allowed_formats: ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx'],
      resource_type: 'auto'
    }
  });
} else {
  // Local storage for development
  storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, path.join(__dirname, '../../uploads/'));
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  });
}

export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: fileFilter
});

export const deleteFile = async (filePath, cloudinaryPublicId = null) => {
  try {
    if (useCloudinary && cloudinaryPublicId) {
      // Delete from Cloudinary
      const result = await cloudinary.uploader.destroy(cloudinaryPublicId);
      return result.result === 'ok';
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

export { cloudinary, useCloudinary };

