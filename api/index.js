// Vercel serverless function handler for Express app
// Import the Express app - it handles all route registration
import app from '../backend/src/server.js';

// Vercel serverless function handler
// Vercel's rewrite rule: /api/(.*) -> /api/index.js
// When Vercel rewrites, req.url should contain the original full path
export default async (req, res) => {
  // Set VERCEL env var (should already be set, but ensure it)
  process.env.VERCEL = '1';
  
  // Vercel should preserve the original URL in req.url when using rewrites
  // But we need to ensure it's set correctly for Express
  const originalUrl = req.url || '';
  
  // Log for debugging
  console.log('🔍 Vercel serverless function:', {
    method: req.method,
    url: req.url,
    originalUrl: req.originalUrl,
    path: req.path
  });
  
  // Ensure originalUrl is set (Vercel should preserve this)
  if (!req.originalUrl && req.url) {
    req.originalUrl = req.url;
  }
  
  // If the URL doesn't start with /api and it's not a special route,
  // it might be the captured path segment, so add /api prefix
  if (originalUrl && 
      !originalUrl.startsWith('/api') && 
      !originalUrl.startsWith('/health') && 
      !originalUrl.startsWith('/uploads') &&
      !originalUrl.startsWith('/socket.io')) {
    const queryString = originalUrl.includes('?') ? originalUrl.substring(originalUrl.indexOf('?')) : '';
    const pathOnly = originalUrl.split('?')[0];
    const normalizedPath = pathOnly.startsWith('/') ? pathOnly : '/' + pathOnly;
    req.url = '/api' + normalizedPath + queryString;
    req.originalUrl = req.url;
    console.log('🔄 Normalized path:', originalUrl, '->', req.url);
  }
  
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


