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

// Log all requests for debugging
app.use((req, res, next) => {
  if (req.path.includes('/api/auth/avatar')) {
    console.log('🌐 Incoming request:', req.method, req.path, req.url, req.headers['content-type']);
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

// Only serve static files if the uploads directory exists (local dev)
if (fs.existsSync(uploadsPath) && !process.env.VERCEL) {
  app.use('/uploads', express.static(uploadsPath));
} else {
  // On Vercel/serverless: serve files via API route (for filesystem-based avatars)
  // Note: Avatars uploaded on serverless are stored as base64 data URLs in the database
  app.get('/uploads/avatars/:filename', async (req, res) => {
    try {
      const { filename } = req.params;
      // Try to read from filesystem first (in case file exists from local upload)
      const filePath = join(uploadsPath, 'avatars', filename);
      if (fs.existsSync(filePath)) {
        return res.sendFile(filePath);
      }
      // If file doesn't exist, it might be stored as base64 in database
      // The avatar URL in the database will be the data URL itself
      res.status(404).json({ message: 'File not found' });
    } catch (error) {
      console.error('Error serving file:', error);
      res.status(500).json({ message: 'Error serving file' });
    }
  });
}

// Log all incoming requests to /api/auth for debugging
app.use('/api/auth', (req, res, next) => {
  console.log('🔍 /api/auth request:', req.method, req.path, req.url);
  console.log('   Full URL:', req.originalUrl || req.url);
  next();
});

// Routes
console.log('🚀 Registering /api/auth routes...');
app.use('/api/auth', authRoutes);
console.log('✅ /api/auth routes registered');
app.use('/api/auth/google', googleAuthRoutes);
app.use('/api/patient', patientRoutes);
app.use('/api/doctor', doctorRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/nurse', nurseRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/site-content', siteContentRoutes);
app.use('/api/doctor/availability', doctorAvailabilityRoutes);
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

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Route not found' 
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

