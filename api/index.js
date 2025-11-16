// Re-export the Express app for Vercel's Node.js serverless runtime
import express from 'express';
import app from '../backend/src/server.js';

// Create a wrapper to handle Vercel's routing
// Vercel's rewrite rule routes /api/* to this function, but may strip the /api prefix
const handler = express();

// Middleware to ensure /api prefix is preserved
handler.use((req, res, next) => {
  // Log the incoming request for debugging
  const originalUrl = req.url;
  
  console.log('🔵 Vercel handler - Incoming request:', {
    method: req.method,
    url: req.url,
    path: req.path,
    originalUrl: req.originalUrl
  });

  // Vercel's rewrite rule routes /api/* to this function
  // The path might already include /api, or Vercel might strip it
  // Ensure the path always starts with /api for our Express routes
  // Check both url and path to handle different Vercel behaviors
  const hasApiPrefix = req.url.startsWith('/api') || req.path.startsWith('/api');
  
  if (!hasApiPrefix) {
    // Add /api prefix if missing
    // Preserve query string if present
    const queryString = req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';
    const pathOnly = req.url.split('?')[0];
    const newPath = pathOnly.startsWith('/') ? pathOnly : '/' + pathOnly;
    req.url = '/api' + newPath + queryString;
    console.log('   🔄 Normalized URL:', originalUrl, '->', req.url);
  } else {
    console.log('   ✅ Path already has /api prefix');
  }

  next();
});

// Mount the Express app
handler.use(app);

export default handler;


