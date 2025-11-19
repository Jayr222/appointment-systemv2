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
    console.log('📦 Getting GridFS bucket...');
    const bucket = getGridFSBucket();
    const fileId = new mongoose.Types.ObjectId();
    const uploadFilename = `${folder}/${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(filename)}`;
    console.log('📤 Opening GridFS upload stream...');
    console.log('   File ID:', fileId.toString());
    console.log('   Upload filename:', uploadFilename);
    console.log('   Content type:', mimeType);
    console.log('   Buffer size:', fileBuffer.length);
    
    return new Promise((resolve, reject) => {
      let timeout;
      let finished = false;

      const uploadStream = bucket.openUploadStreamWithId(fileId, uploadFilename, {
        contentType: mimeType,
        metadata: {
          originalName: filename,
          uploadedAt: new Date(),
          folder: folder
        }
      });

      // Set a timeout to prevent hanging (30 seconds)
      timeout = setTimeout(() => {
        if (!finished) {
          finished = true;
          console.error('⏱️ GridFS upload timeout after 30 seconds');
          uploadStream.destroy();
          reject(new Error('GridFS upload timeout - file may be too large or connection is slow'));
        }
      }, 30000);

      uploadStream.on('finish', () => {
        if (!finished) {
          finished = true;
          clearTimeout(timeout);
          // Return a URL that can be used to retrieve the file
          const url = `/api/storage/avatars/${fileId.toString()}`;
          console.log('✅ GridFS upload finished:', url);
          resolve({
            url: url,
            fileId: fileId.toString(),
            storageType: STORAGE_TYPES.MONGODB_GRIDFS
          });
        }
      });

      uploadStream.on('error', (error) => {
        if (!finished) {
          finished = true;
          clearTimeout(timeout);
          console.error('❌ GridFS upload stream error:', error);
          console.error('   Error message:', error.message);
          console.error('   Error stack:', error.stack);
          reject(error);
        }
      });

      // Handle stream close event as a fallback
      uploadStream.on('close', () => {
        console.log('🔒 GridFS upload stream closed');
      });

      // Write the buffer - use end() which writes and closes the stream
      console.log('📝 Writing buffer to GridFS stream...');
      
      // For small buffers (< 16KB), write directly
      // For larger buffers, use write() + end() pattern
      if (fileBuffer.length < 16 * 1024) {
        // Small buffer - use end() directly
        console.log('   Small buffer, using end() directly...');
        uploadStream.end(fileBuffer);
      } else {
        // Larger buffer - write in chunks or use write() + end()
        console.log('   Large buffer, writing then ending...');
        const writeSuccess = uploadStream.write(fileBuffer);
        console.log('   Write immediate success:', writeSuccess);
        
        if (!writeSuccess) {
          // Stream is buffering - wait for drain event
          console.log('   Stream is buffering, waiting for drain event...');
          uploadStream.once('drain', () => {
            console.log('   Stream drained, ending stream...');
            uploadStream.end();
          });
        } else {
          // Write was successful, end the stream immediately
          console.log('   Write successful, ending stream...');
          uploadStream.end();
        }
      }
      
      console.log('✅ Buffer write initiated, waiting for finish event...');
    });
  } catch (error) {
    console.error('❌ Storage upload error:', error);
    console.error('   Error message:', error.message);
    console.error('   Error stack:', error.stack);
    // Fallback to base64 in database on error
    console.log('⚠️ Falling back to base64 storage in database...');
    const base64 = fileBuffer.toString('base64');
    const dataUrl = `data:${mimeType};base64,${base64}`;
    console.log('✅ Base64 conversion complete, length:', dataUrl.length);
    return {
      url: dataUrl,
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
