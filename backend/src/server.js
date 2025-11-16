import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import connectDB from './config/db.js';
import { config } from './config/env.js';
import { setIO } from './utils/socketEmitter.js';
import { ensureDefaultAdmin } from './utils/ensureDefaultAdmin.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import googleAuthRoutes from './routes/googleAuthRoutes.js';
import patientRoutes from './routes/patientRoutes.js';
import doctorRoutes from './routes/doctorRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import nurseRoutes from './routes/nurseRoutes.js';
import queueRoutes from './routes/queueRoutes.js';
import siteContentRoutes from './routes/siteContentRoutes.js';
import doctorAvailabilityRoutes from './routes/doctorAvailabilityRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import { getFileFromStorage } from './services/storageService.js';

// Connect to database and ensure default admin exists
await connectDB();
await ensureDefaultAdmin();

// Initialize app
const app = express();

// Create HTTP server
const httpServer = createServer(app);

// Initialize Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: config.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Store io instance for use in routes
app.set('io', io);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log all requests for debugging (especially /uploads paths)
app.use((req, res, next) => {
  if (req.path.includes('/uploads') || req.path.includes('/api/auth/avatar')) {
    console.log('🌐 Incoming request:', req.method, req.path, req.url, req.headers['content-type']);
    console.log('   Original URL:', req.originalUrl);
  }
  next();
});

// Trust proxy for accurate IP addresses (if behind reverse proxy)
app.set('trust proxy', 1);

// Serve static files (avatars and uploads) - only in non-serverless environments
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const uploadsPath = join(__dirname, '../uploads');

// Handle /uploads routes BEFORE any other routes
// On Vercel/serverless: serve files via API route (for filesystem-based avatars)
if (process.env.VERCEL || !fs.existsSync(uploadsPath)) {
  // On Vercel/serverless: serve files via API route (for filesystem-based avatars)
  // Note: Avatars uploaded on serverless are stored as base64 data URLs in the database
  // Old avatars stored as filenames won't exist on serverless - return 404 gracefully
  console.log('📁 Setting up /uploads/avatars route for serverless environment');
  app.get('/uploads/avatars/:filename', async (req, res) => {
    console.log('🖼️ /uploads/avatars route hit:', req.method, req.url, req.path);
    console.log('   Filename param:', req.params.filename);
    console.log('   Original URL:', req.originalUrl);
    try {
      const { filename } = req.params;
      // Try to read from filesystem first (in case file exists from local upload)
      const filePath = join(uploadsPath, 'avatars', filename);
      console.log('   Checking file path:', filePath);
      if (fs.existsSync(filePath)) {
        console.log('   ✅ File exists, sending file');
        return res.sendFile(filePath);
      }
      // File doesn't exist - this is expected for old avatars on serverless
      console.log('   ❌ File not found (expected for old avatars on serverless)');
      // Return 404 with proper headers so browser can handle it gracefully
      res.status(404).set('Content-Type', 'application/json').json({ 
        message: 'Avatar file not found. This avatar may have been uploaded before serverless deployment.',
        error: 'File not found'
      });
    } catch (error) {
      console.error('❌ Error serving avatar file:', error);
      res.status(500).set('Content-Type', 'application/json').json({ 
        message: 'Error serving file',
        error: 'Internal server error'
      });
    }
  });
  console.log('✅ /uploads/avatars route registered');
}

// Local development: serve static files if uploads directory exists
if (fs.existsSync(uploadsPath) && !process.env.VERCEL) {
  app.use('/uploads', express.static(uploadsPath));
  console.log('📁 Static file serving enabled for /uploads');
}

// GridFS storage route - serve files from MongoDB
app.get('/api/storage/avatars/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const fileData = await getFileFromStorage(fileId);
    
    res.set({
      'Content-Type': fileData.contentType,
      'Content-Length': fileData.length,
      'Cache-Control': 'public, max-age=31536000' // Cache for 1 year
    });
    
    fileData.stream.pipe(res);
  } catch (error) {
    console.error('Error serving file from GridFS:', error);
    res.status(404).json({ message: 'File not found' });
  }
});

// Log all incoming requests to /api/auth for debugging
app.use('/api/auth', (req, res, next) => {
  console.log('🔍 /api/auth request:', req.method, req.path, req.url);
  console.log('   Full URL:', req.originalUrl || req.url);
  next();
});

// Path normalization for Vercel serverless functions
// Vercel's rewrite rule sends /api/:path* to /api/index.js
// The req.url might already include /api or might not, so we normalize it
if (process.env.VERCEL) {
  app.use((req, res, next) => {
    // Log the incoming request for debugging
    console.log('📥 Vercel request (before normalization):', {
      method: req.method,
      url: req.url,
      path: req.path,
      originalUrl: req.originalUrl
    });
    
    // Get the current URL - prefer originalUrl as it contains the full path before any modifications
    const currentUrl = req.originalUrl || req.url || '';
    const queryString = currentUrl.includes('?') ? currentUrl.substring(currentUrl.indexOf('?')) : '';
    const pathOnly = currentUrl.split('?')[0];
    
    // If the path doesn't start with /api, add it
    // This handles the case where Vercel might strip /api from the path
    if (!pathOnly.startsWith('/api')) {
      const normalizedPath = pathOnly.startsWith('/') ? pathOnly : '/' + pathOnly;
      req.url = '/api' + normalizedPath + queryString;
      console.log('🔄 Vercel path normalization:', currentUrl, '->', req.url);
    }
    // If it already starts with /api, ensure req.url is set correctly
    else if (req.url !== pathOnly + queryString) {
      req.url = pathOnly + queryString;
    }
    
    console.log('📤 Vercel request (after normalization):', {
      method: req.method,
      url: req.url,
      path: req.path
    });
    
    next();
  });
}

// Routes
console.log('🚀 Registering /api/auth routes...');
app.use('/api/auth', authRoutes);
console.log('✅ /api/auth routes registered');
console.log('   Available routes: POST /api/auth/avatar, GET /api/auth/test, etc.');
app.use('/api/auth/google', googleAuthRoutes);
app.use('/api/patient', patientRoutes);
// Mount more specific routes BEFORE general routes to ensure proper matching
app.use('/api/doctor/availability', doctorAvailabilityRoutes);
app.use('/api/doctor', doctorRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/nurse', nurseRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/site-content', siteContentRoutes);
app.use('/api/messages', messageRoutes);

// Friendly root route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Healthcare System API - see /health or /api/* endpoints',
    health: '/health',
    apiBase: '/api'
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Healthcare System API is running',
    timestamp: new Date().toISOString()
  });
});

// 404 handler - log what route was requested
app.use((req, res) => {
  console.log('❌ 404 - Route not found:', req.method, req.originalUrl || req.url);
  console.log('   Path:', req.path);
  console.log('   URL:', req.url);
  console.log('   Original URL:', req.originalUrl);
  console.log('   Query:', req.query);
  console.log('   All routes should start with /api');
  console.log('   Registered routes include: POST /api/auth/avatar, GET /api/auth/test');
  res.status(404).json({ 
    success: false, 
    message: 'Route not found',
    method: req.method,
    path: req.path,
    url: req.url,
    originalUrl: req.originalUrl,
    hint: 'Check if the route is registered and the URL path is correct'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    success: false, 
    message: 'Server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Initialize socket emitter
setIO(io);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // Join user-specific room for messaging
  socket.on('join-user', (data) => {
    const { userId } = data;
    if (userId) {
      socket.join(`user-${userId}`);
      console.log(`User ${userId} joined user room`);
    }
  });

  // Join queue room
  socket.on('join-queue', (data) => {
    const { role, userId, doctorId } = data;
    
    // Join based on role
    if (role === 'admin') {
      socket.join('admin-queue');
      console.log(`Admin ${userId} joined queue room`);
    } else if (role === 'doctor') {
      socket.join(`doctor-${doctorId || userId}-queue`);
      socket.join('doctor-queue'); // Also join general doctor room
      console.log(`Doctor ${userId} joined queue room`);
    } else if (role === 'patient') {
      socket.join(`patient-${userId}-queue`);
      socket.join('patient-queue'); // Also join general patient room
      console.log(`Patient ${userId} joined queue room`);
    }
  });

  // Leave queue room
  socket.on('leave-queue', () => {
    socket.leave('admin-queue');
    socket.leave('doctor-queue');
    socket.leave('patient-queue');
    console.log(`Client ${socket.id} left queue rooms`);
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// Export io for use in controllers
export { io };

// Start server (avoid starting a listener on serverless platforms like Vercel)
const PORT = config.PORT;
if (!process.env.VERCEL) {
  httpServer.listen(PORT, () => {
    console.log(`Server running in ${config.NODE_ENV} mode on port ${PORT}`);
    console.log(`Socket.IO server initialized`);
  });
}

// Export Express app for serverless platforms (e.g., Vercel)
export default app;

