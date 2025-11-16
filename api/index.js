// Re-export the Express app for Vercel's Node.js serverless runtime
import express from 'express';
import app from '../backend/src/server.js';

// Vercel sometimes invokes the function with the path stripped of the /api prefix.
// Normalize the URL so our Express app (which mounts routes under /api) always matches.
const server = express();
server.use((req, res, next) => {
  console.log('🔵 api/index.js middleware - Original request:', req.method, req.url, req.path);
  
  // Don't modify /uploads paths - they should go directly to Express routes
  if (req.url.startsWith('/uploads/')) {
    console.log('   ✅ /uploads path detected - passing through unchanged');
    return next();
  }
  // For /api routes, ensure they have the /api prefix
  if (!req.url.startsWith('/api/')) {
    const originalUrl = req.url;
    req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
    console.log('   🔄 Modified URL:', originalUrl, '->', req.url);
  } else {
    console.log('   ✅ /api path detected - passing through unchanged');
  }
  next();
});
server.use(app);

export default server;


