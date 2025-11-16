// Vercel serverless function handler for Express app
import app from '../backend/src/server.js';

// Vercel serverless function handler
// Vercel's rewrite rule: /api/(.*) -> /api/index.js
// The captured group (.*) is passed, which might be:
// - "doctor/availability" (no leading slash, no /api prefix)
// - "/doctor/availability" (with leading slash, no /api prefix)  
// - "/api/doctor/availability" (full path - less likely but possible)
export default async (req, res) => {
  // Set VERCEL env var for Express middleware
  if (!process.env.VERCEL) {
    process.env.VERCEL = '1';
  }
  
  // Get the incoming URL - Vercel might pass it in different formats
  let incomingUrl = req.url || req.originalUrl || '';
  
  console.log('🔍 Serverless function received:', {
    method: req.method,
    url: req.url,
    originalUrl: req.originalUrl,
    incomingUrl: incomingUrl
  });
  
  // Handle different cases of what Vercel might pass
  let finalUrl = incomingUrl;
  
  // Case 1: URL already has /api prefix - use as is
  if (finalUrl.startsWith('/api')) {
    // Already correct, but ensure originalUrl is set
    if (!req.originalUrl) {
      req.originalUrl = finalUrl;
    }
  }
  // Case 2: URL starts with / but not /api (e.g., "/doctor/availability")
  else if (finalUrl.startsWith('/')) {
    // Add /api prefix
    const queryString = finalUrl.includes('?') ? finalUrl.substring(finalUrl.indexOf('?')) : '';
    const pathOnly = finalUrl.split('?')[0];
    finalUrl = '/api' + pathOnly + queryString;
    req.url = finalUrl;
    req.originalUrl = finalUrl;
    console.log('🔄 Added /api prefix:', incomingUrl, '->', finalUrl);
  }
  // Case 3: URL has no leading slash (e.g., "doctor/availability")
  else if (finalUrl && !finalUrl.startsWith('/')) {
    // Add leading slash and /api prefix
    const queryString = finalUrl.includes('?') ? finalUrl.substring(finalUrl.indexOf('?')) : '';
    const pathOnly = finalUrl.split('?')[0];
    finalUrl = '/api/' + pathOnly + queryString;
    req.url = finalUrl;
    req.originalUrl = finalUrl;
    console.log('🔄 Added / and /api prefix:', incomingUrl, '->', finalUrl);
  }
  // Case 4: Special routes that shouldn't have /api
  else if (finalUrl.startsWith('/health') || finalUrl.startsWith('/uploads')) {
    // Keep as is
    if (!req.originalUrl) {
      req.originalUrl = finalUrl;
    }
  }
  
  console.log('📤 Final URL passed to Express:', {
    method: req.method,
    url: req.url,
    originalUrl: req.originalUrl
  });
  
  // Pass request to Express
  return app(req, res);
};


