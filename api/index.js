// Re-export the Express app for Vercel's Node.js serverless runtime
import express from 'express';
import app from '../backend/src/server.js';

// Vercel sometimes invokes the function with the path stripped of the /api prefix.
// Normalize the URL so our Express app (which mounts routes under /api) always matches.
const server = express();

// Add request logging middleware first
server.use((req, res, next) => {
  console.log('🔵 api/index.js - Incoming request:', {
    method: req.method,
    url: req.url,
    path: req.path,
    originalUrl: req.originalUrl,
    query: req.query,
    headers: {
      'content-type': req.headers['content-type'],
      'authorization': req.headers['authorization'] ? 'present' : 'missing'
    }
  });
  next();
});

// URL normalization middleware
server.use((req, res, next) => {
  const originalUrl = req.url;
  
  // Don't modify /uploads paths - they should go directly to Express routes
  if (req.url.startsWith('/uploads/')) {
    console.log('   ✅ /uploads path detected - passing through unchanged');
    return next();
  }
  
  // For /api routes, ensure they have the /api prefix
  // Vercel might strip /api from the path when routing to the function
  if (!req.url.startsWith('/api/')) {
    req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
    console.log('   🔄 Modified URL:', originalUrl, '->', req.url);
  } else {
    console.log('   ✅ /api path detected - passing through unchanged');
  }
  next();
});

server.use(app);

export default server;


