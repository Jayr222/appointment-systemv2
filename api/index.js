// Re-export the Express app for Vercel's Node.js serverless runtime
import app from '../backend/src/server.js';

// Path normalization is handled in server.js when VERCEL env var is set
// This file simply exports the Express app for Vercel's serverless function handler
export default app;


