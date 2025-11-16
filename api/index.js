// Vercel serverless function handler for Express app
import app from '../backend/src/server.js';

// Vercel serverless function handler
// Vercel's rewrite rule: /api/:path* -> /api/index.js
// When this happens, req.url might be the captured path segment (without /api)
// We need to reconstruct the full path with /api prefix
export default async (req, res) => {
  // Set VERCEL env var for Express middleware
  if (!process.env.VERCEL) {
    process.env.VERCEL = '1';
  }
  
  // Log incoming request for debugging
  const originalUrl = req.url || '';
  const originalOriginalUrl = req.originalUrl || '';
  
  console.log('🔍 Serverless function received (before fix):', {
    method: req.method,
    url: originalUrl,
    originalUrl: originalOriginalUrl,
    path: req.path
  });
  
  // Reconstruct the full path
  // If the URL doesn't start with /api, it's likely the captured path segment
  // We need to add /api back to it
  let finalUrl = originalUrl || originalOriginalUrl || '';
  
  if (finalUrl && !finalUrl.startsWith('/api') && !finalUrl.startsWith('/health') && !finalUrl.startsWith('/uploads')) {
    // This is the captured path segment, add /api prefix
    const queryString = finalUrl.includes('?') ? finalUrl.substring(finalUrl.indexOf('?')) : '';
    const pathOnly = finalUrl.split('?')[0];
    finalUrl = '/api' + (pathOnly.startsWith('/') ? pathOnly : '/' + pathOnly) + queryString;
    
    // Update req properties
    req.url = finalUrl;
    req.originalUrl = finalUrl;
    
    console.log('🔄 Reconstructed path:', originalUrl, '->', finalUrl);
  } else if (!req.originalUrl && req.url) {
    // Ensure originalUrl is set
    req.originalUrl = req.url;
  }
  
  console.log('📤 Passing to Express:', {
    method: req.method,
    url: req.url,
    originalUrl: req.originalUrl
  });
  
  // Pass request to Express
  return app(req, res);
};


