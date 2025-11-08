import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import connectDB from './config/db.js';
import { config } from './config/env.js';
import { setIO } from './utils/socketEmitter.js';

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

// Connect to database
connectDB();

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

// Trust proxy for accurate IP addresses (if behind reverse proxy)
app.set('trust proxy', 1);

// Serve static files (avatars and uploads)
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
app.use('/uploads', express.static(join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/auth/google', googleAuthRoutes);
app.use('/api/patient', patientRoutes);
app.use('/api/doctor', doctorRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/nurse', nurseRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/site-content', siteContentRoutes);
app.use('/api/doctor/availability', doctorAvailabilityRoutes);
app.use('/api/messages', messageRoutes);

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

// Start server
const PORT = config.PORT;
httpServer.listen(PORT, () => {
  console.log(`Server running in ${config.NODE_ENV} mode on port ${PORT}`);
  console.log(`Socket.IO server initialized`);
});

