// Vercel serverless function handler for Express app
// Import the Express app - it handles all route registration
import app from '../backend/src/server.js';

// CORS helper function - apply CORS headers
const setCorsHeaders = (res, origin) => {
  // Allow all .vercel.app domains and specific origins
  const allowedOrigins = [
    'https://appointment-systemv2.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:5174'
  ];
  
  // Get frontend URL from environment if set
  const frontendUrl = process.env.FRONTEND_URL;
  if (frontendUrl && !allowedOrigins.includes(frontendUrl)) {
    allowedOrigins.push(frontendUrl);
  }
  
  // Check if origin is allowed
  const isAllowed = !origin || 
                    allowedOrigins.includes(origin) || 
                    origin.includes('.vercel.app');
  
  if (isAllowed && origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (isAllowed) {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
};

// Vercel serverless function handler
// Vercel's rewrite rule: /api/(.*) -> /api/index.js
// When Vercel rewrites, req.url should contain the original full path
// But we need to handle cases where it might be just the captured group
export default async (req, res) => {
  // Set VERCEL env var
  process.env.VERCEL = '1';
  
  // Get origin from request headers
  const origin = req.headers.origin || req.headers.referer?.split('/').slice(0, 3).join('/');
  
  // Handle OPTIONS preflight request
  if (req.method === 'OPTIONS') {
    setCorsHeaders(res, origin);
    return res.status(200).end();
  }
  
  // Set CORS headers for all requests
  setCorsHeaders(res, origin);
  
  // Get all possible URL sources
  const urlFromReq = req.url || '';
  const urlFromOriginal = req.originalUrl || '';
  const urlFromHeaders = req.headers['x-invoke-path'] || req.headers['x-vercel-rewrite'] || '';
  
  // Use the first available URL source
  let incomingUrl = urlFromHeaders || urlFromOriginal || urlFromReq;
  
  // Log for debugging
  console.log('🔍 Vercel serverless function received:', {
    method: req.method,
    url: req.url,
    originalUrl: req.originalUrl,
    headers: {
      'x-invoke-path': req.headers['x-invoke-path'],
      'x-vercel-rewrite': req.headers['x-vercel-rewrite']
    },
    incomingUrl: incomingUrl
  });
  
  // Handle empty URL case
  if (!incomingUrl || incomingUrl === '') {
    console.error('❌ Empty URL received!');
    return res.status(400).json({ 
      error: 'Bad request: No URL found',
      debug: {
        reqUrl: req.url,
        originalUrl: req.originalUrl,
        headers: Object.keys(req.headers)
      }
    });
  }
  
  // Normalize the path to ensure it starts with /api
  let finalUrl = incomingUrl;
  const queryString = finalUrl.includes('?') ? finalUrl.substring(finalUrl.indexOf('?')) : '';
  let pathOnly = finalUrl.split('?')[0];
  
  // Remove trailing slash for consistency (except for root paths)
  if (pathOnly !== '/' && pathOnly !== '/api' && pathOnly.endsWith('/')) {
    pathOnly = pathOnly.slice(0, -1);
  }
  
  // If path doesn't start with /api, add it
  if (!pathOnly.startsWith('/api')) {
    // This is likely the captured path segment from the rewrite rule
    // Ensure it starts with /, then add /api prefix
    const normalizedPath = pathOnly.startsWith('/') ? pathOnly : '/' + pathOnly;
    finalUrl = '/api' + normalizedPath + queryString;
    
    // Update request properties - Express uses both url and path for routing
    req.url = finalUrl;
    req.originalUrl = finalUrl;
    // Also update req.path (Express derives this from req.url, but let's be explicit)
    req.path = pathOnly.startsWith('/') ? '/api' + pathOnly : '/api/' + pathOnly;
    
    console.log('🔄 Normalized path:', incomingUrl, '->', finalUrl);
  } else {
    // Path already has /api, ensure both url and originalUrl are set correctly
    finalUrl = pathOnly + queryString;
    req.url = finalUrl;
    if (!req.originalUrl) {
      req.originalUrl = finalUrl;
    }
    // Ensure req.path is set correctly (Express should derive this, but be explicit)
    req.path = pathOnly;
  }
  
  console.log('📤 Final request to Express:', {
    method: req.method,
    url: req.url,
    originalUrl: req.originalUrl,
    path: req.path,
    baseUrl: req.baseUrl
  });
  
  // Pass the request to Express app
  // Express will handle routing based on req.url
  try {
    app(req, res);
  } catch (error) {
    console.error('❌ Error in serverless function:', error);
    console.error('   Stack:', error.stack);
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Internal server error',
        message: error.message 
      });
    }
  }
};


