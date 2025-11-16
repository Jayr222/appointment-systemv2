// Vercel serverless function handler for Express app
import app from '../backend/src/server.js';

// Vercel serverless function handler
// This wraps the Express app to handle Vercel's serverless function format
export default async (req, res) => {
  // Ensure VERCEL env var is set for path normalization
  if (!process.env.VERCEL) {
    process.env.VERCEL = '1';
  }
  
  // Log the incoming request to understand what Vercel is passing
  console.log('🔍 Vercel serverless function received:', {
    method: req.method,
    url: req.url,
    path: req.path,
    originalUrl: req.originalUrl,
    headers: {
      'x-vercel-rewrite': req.headers['x-vercel-rewrite'],
      'x-invoke-path': req.headers['x-invoke-path']
    }
  });
  
  // Vercel's rewrite rule sends /api/:path* to this function
  // The path might be in req.url, req.originalUrl, or a header
  // We'll let the Express middleware handle path normalization
  return app(req, res);
};


