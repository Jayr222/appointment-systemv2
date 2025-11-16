// Vercel serverless function handler for Express app
import app from '../backend/src/server.js';

// Vercel serverless function handler
// Vercel's rewrite rule: /api/(.*) -> /api/index.js
// When Vercel rewrites, it may pass the path in different ways
export default async (req, res) => {
  // Set VERCEL env var for Express middleware
  if (!process.env.VERCEL) {
    process.env.VERCEL = '1';
  }
  
  // Check Vercel-specific headers for the original path
  // Vercel may pass the original path in x-vercel-rewrite or x-invoke-path headers
  const vercelPath = req.headers['x-invoke-path'] || req.headers['x-vercel-rewrite'] || req.headers['x-vercel-original-path'];
  
  // Get the incoming URL - try multiple sources
  let incomingUrl = vercelPath || req.url || req.originalUrl || '';
  
  // Log all available information for debugging
  console.log('🔍 Serverless function received:', {
    method: req.method,
    url: req.url,
    originalUrl: req.originalUrl,
    vercelPath: vercelPath,
    incomingUrl: incomingUrl,
    headers: {
      'x-invoke-path': req.headers['x-invoke-path'],
      'x-vercel-rewrite': req.headers['x-vercel-rewrite'],
      'x-vercel-original-path': req.headers['x-vercel-original-path']
    }
  });
  
  // If we still don't have a URL, this is a problem
  if (!incomingUrl) {
    console.error('❌ No URL found in request!');
    return res.status(500).json({ 
      error: 'Internal server error: No URL found',
      debug: {
        url: req.url,
        originalUrl: req.originalUrl,
        headers: Object.keys(req.headers)
      }
    });
  }
  
  // Handle different cases of what Vercel might pass
  let finalUrl = incomingUrl;
  
  // Case 1: URL already has /api prefix - use as is
  if (finalUrl.startsWith('/api')) {
    // Already correct, but ensure originalUrl is set
    if (!req.originalUrl) {
      req.originalUrl = finalUrl;
    }
    // Ensure req.url matches
    if (req.url !== finalUrl) {
      req.url = finalUrl;
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
    if (req.url !== finalUrl) {
      req.url = finalUrl;
    }
  }
  
  console.log('📤 Final URL passed to Express:', {
    method: req.method,
    url: req.url,
    originalUrl: req.originalUrl,
    path: req.path
  });
  
  // Pass request to Express
  return app(req, res);
};


