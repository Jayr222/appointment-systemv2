// Vercel serverless function handler for Express app
// Import the Express app - it handles all route registration
import app from '../backend/src/server.js';

// Vercel serverless function handler
// Vercel's rewrite rule: /api/(.*) -> /api/index.js
// When Vercel rewrites, the captured group (.*) might be passed in req.url
// We need to reconstruct the full /api path
export default async (req, res) => {
  // Set VERCEL env var (should already be set, but ensure it)
  process.env.VERCEL = '1';
  
  // Get the incoming URL - Vercel might pass it in different ways
  let incomingUrl = req.url || req.originalUrl || '';
  
  // Log for debugging
  console.log('🔍 Vercel serverless function received:', {
    method: req.method,
    url: req.url,
    originalUrl: req.originalUrl,
    incomingUrl: incomingUrl,
    path: req.path
  });
  
  // Normalize the path to ensure it starts with /api
  // Vercel's rewrite captures the path after /api/, so we need to add it back
  let finalUrl = incomingUrl;
  
  if (!finalUrl.startsWith('/api')) {
    // This is likely the captured path segment (e.g., "auth/register" or "/auth/register")
    const queryString = finalUrl.includes('?') ? finalUrl.substring(finalUrl.indexOf('?')) : '';
    const pathOnly = finalUrl.split('?')[0];
    
    // Ensure path starts with /, then add /api prefix
    const normalizedPath = pathOnly.startsWith('/') ? pathOnly : '/' + pathOnly;
    finalUrl = '/api' + normalizedPath + queryString;
    
    // Update request properties
    req.url = finalUrl;
    req.originalUrl = finalUrl;
    
    console.log('🔄 Normalized path:', incomingUrl, '->', finalUrl);
  } else {
    // Path already has /api, ensure originalUrl is set
    if (!req.originalUrl) {
      req.originalUrl = finalUrl;
    }
    if (req.url !== finalUrl) {
      req.url = finalUrl;
    }
  }
  
  console.log('📤 Passing to Express:', {
    method: req.method,
    url: req.url,
    originalUrl: req.originalUrl
  });
  
  // Pass the request to Express app
  // Express will handle routing based on req.url
  try {
    app(req, res);
  } catch (error) {
    console.error('❌ Error in serverless function:', error);
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Internal server error',
        message: error.message 
      });
    }
  }
};


