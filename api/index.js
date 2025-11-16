// Re-export the Express app for Vercel's Node.js serverless runtime
import express from 'express';
import app from '../backend/src/server.js';

// Vercel sometimes invokes the function with the path stripped of the /api prefix.
// Normalize the URL so our Express app (which mounts routes under /api) always matches.
const server = express();
server.use((req, res, next) => {
  if (!req.url.startsWith('/api/')) {
    req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
  }
  next();
});
server.use(app);

export default server;


