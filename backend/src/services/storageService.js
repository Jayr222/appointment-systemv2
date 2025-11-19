/**
 * MongoDB GridFS Storage Service
 * Stores files directly in MongoDB using GridFS
 */

// Import BSON FIRST before mongodb to ensure it's available
import 'bson';
import mongoose from 'mongoose';
import { GridFSBucket } from 'mongodb';
import path from 'path';

// Storage provider types
export const STORAGE_TYPES = {
  MONGODB_GRIDFS: 'mongodb_gridfs',
  LOCAL: 'local',
  DATABASE: 'database' // Base64 fallback (for very small files or compatibility)
};

// Get GridFS bucket for avatars
const getGridFSBucket = () => {
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('MongoDB connection not available');
  }
  return new GridFSBucket(db, { bucketName: 'avatars' });
};

/**
 * Upload file to MongoDB GridFS
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} filename - Original filename
 * @param {string} mimeType - MIME type
 * @param {string} folder - Storage folder (e.g., 'avatars')
 * @returns {Promise<{url: string, fileId: string}>}
 */
export const uploadToStorage = async (fileBuffer, filename, mimeType, folder = 'avatars') => {
  // Check if we should use local filesystem (development)
  const useLocal = !process.env.VERCEL && 
                   !process.env.AWS_LAMBDA_FUNCTION_NAME && 
                   process.env.USE_LOCAL_STORAGE === 'true';
  
  if (useLocal) {
    // Return null to use local filesystem
    return null;
  }

  try {
    const bucket = getGridFSBucket();
    const fileId = new mongoose.Types.ObjectId();
    const uploadFilename = `${folder}/${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(filename)}`;
    
    return new Promise((resolve, reject) => {
      const uploadStream = bucket.openUploadStreamWithId(fileId, uploadFilename, {
        contentType: mimeType,
        metadata: {
          originalName: filename,
          uploadedAt: new Date(),
          folder: folder
        }
      });

      uploadStream.on('finish', () => {
        // Return a URL that can be used to retrieve the file
        const url = `/api/storage/avatars/${fileId.toString()}`;
        resolve({
          url: url,
          fileId: fileId.toString(),
          storageType: STORAGE_TYPES.MONGODB_GRIDFS
        });
      });

      uploadStream.on('error', (error) => {
        console.error('GridFS upload error:', error);
        reject(error);
      });

      uploadStream.end(fileBuffer);
    });
  } catch (error) {
    console.error('Storage upload error:', error);
    // Fallback to base64 in database on error
    const base64 = fileBuffer.toString('base64');
    return {
      url: `data:${mimeType};base64,${base64}`,
      storageType: STORAGE_TYPES.DATABASE,
      error: error.message
    };
  }
};

/**
 * Delete file from MongoDB GridFS
 * @param {string} urlOrId - File URL or GridFS file ID
 * @param {string} storageType - Storage type (optional)
 */
export const deleteFromStorage = async (urlOrId, storageType = null) => {
  if (!urlOrId) return;
  
  // Don't delete data URLs or local files
  if (urlOrId.startsWith('data:') || urlOrId.startsWith('/uploads/')) {
    return;
  }

  try {
    // Extract file ID from URL if it's a GridFS URL
    let fileId = urlOrId;
    if (urlOrId.includes('/api/storage/avatars/')) {
      fileId = urlOrId.split('/api/storage/avatars/')[1];
    }

    // Check if it's a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(fileId)) {
      console.log('Not a valid GridFS file ID, skipping deletion:', fileId);
      return;
    }

    const bucket = getGridFSBucket();
    await bucket.delete(new mongoose.Types.ObjectId(fileId));
    console.log('✅ Deleted file from GridFS:', fileId);
  } catch (error) {
    console.error('Storage delete error:', error);
    // Don't throw - deletion failures shouldn't break the app
  }
};

/**
 * Get file from MongoDB GridFS
 * @param {string} fileId - GridFS file ID
 * @returns {Promise<{stream: Readable, contentType: string, length: number}>}
 */
export const getFileFromStorage = async (fileId) => {
  try {
    const bucket = getGridFSBucket();
    const objectId = new mongoose.Types.ObjectId(fileId);
    
    // Check if file exists
    const files = await bucket.find({ _id: objectId }).toArray();
    if (files.length === 0) {
      throw new Error('File not found');
    }

    const file = files[0];
    const downloadStream = bucket.openDownloadStream(objectId);

    return {
      stream: downloadStream,
      contentType: file.contentType || 'application/octet-stream',
      length: file.length
    };
  } catch (error) {
    console.error('Error getting file from GridFS:', error);
    throw error;
  }
};

// Helper to get storage type from URL
export const getStorageTypeFromUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('data:')) return STORAGE_TYPES.DATABASE;
  if (url.startsWith('/uploads/')) return STORAGE_TYPES.LOCAL;
  if (url.includes('/api/storage/')) return STORAGE_TYPES.MONGODB_GRIDFS;
  // Legacy URLs (Google OAuth, old cloud storage)
  if (url.startsWith('http://') || url.startsWith('https://')) return 'external';
  return null;
};
