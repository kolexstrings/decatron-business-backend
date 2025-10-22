import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { connectDB } from './utils/db';
import staffScheduleRoutes from './routes/staffSchedules';

import authRoutes from './routes/auth';
import availabilityRoutes from './routes/availability';
import propertyRoutes from './routes/properties';
import bookingRoutes from './routes/bookings';
import inspectionRoutes from './routes/inspections';
import proxyBookingRoutes from './routes/proxyBookings';
import feedbackRoutes from './routes/feedback';
import analyticsRoutes from './routes/analytics';
import locationTrackingRoutes from './routes/locationTracking';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Create HTTP server for Socket.IO
const server = createServer(app);

// Initialize Socket.IO with CORS
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// WebSocket authentication middleware
io.use(async (socket: any, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    // Import JWT utils dynamically
    const { JWTUtils } = await import('./utils/jwt');
    const decoded = JWTUtils.verify(token);

    if (!decoded) {
      return next(new Error('Authentication error: Invalid token'));
    }

    socket.userId = decoded.userId;
    socket.organizationId = decoded.organizationId;
    socket.role = decoded.role;

    next();
  } catch (error) {
    console.error('WebSocket authentication error:', error);
    next(new Error('Authentication error'));
  }
});

// WebSocket connection handling
io.on('connection', (socket: any) => {
  console.log(`User ${socket.userId} connected to WebSocket`);

  // Join inspection room
  socket.on('join-inspection', (inspectionId: string) => {
    socket.join(`inspection-${inspectionId}`);
    console.log(`User ${socket.userId} joined inspection ${inspectionId}`);
  });

  // Leave inspection room
  socket.on('leave-inspection', (inspectionId: string) => {
    socket.leave(`inspection-${inspectionId}`);
    console.log(`User ${socket.userId} left inspection ${inspectionId}`);
  });

  // Handle location updates via WebSocket
  socket.on('location-update', async (locationData: any) => {
    try {
      // Import LocationUpdate model dynamically
      const { LocationUpdate } = await import('./models/LocationUpdate');

      const locationUpdate = new LocationUpdate({
        inspectionId: locationData.inspectionId,
        userId: socket.userId,
        userType: socket.role === 'staff' || socket.role === 'agent' ? 'staff' : 'client',
        organizationId: socket.organizationId,
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        accuracy: locationData.accuracy,
        altitude: locationData.altitude,
        speed: locationData.speed,
        heading: locationData.heading,
        status: locationData.status || 'inspection_in_progress',
        notes: locationData.notes,
        timestamp: new Date(),
        isRealTime: true
      });

      await locationUpdate.save();

      // Broadcast location update to all users in the inspection room
      socket.to(`inspection-${locationData.inspectionId}`).emit('location-updated', {
        userId: socket.userId,
        userType: socket.role === 'staff' || socket.role === 'agent' ? 'staff' : 'client',
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        timestamp: locationUpdate.timestamp,
        status: locationData.status,
        speed: locationData.speed,
        heading: locationData.heading
      });

      // Send confirmation back to sender
      socket.emit('location-update-confirmed', {
        id: locationUpdate._id,
        timestamp: locationUpdate.timestamp,
        status: 'success'
      });

    } catch (error) {
      console.error('Error saving location update:', error);
      socket.emit('location-update-error', {
        error: 'Failed to save location update',
        timestamp: new Date()
      });
    }
  });

  // Handle inspection status changes
  socket.on('inspection-status-change', async (data: any) => {
    try {
      // Broadcast status change to all users in the inspection room
      socket.to(`inspection-${data.inspectionId}`).emit('inspection-status-updated', {
        inspectionId: data.inspectionId,
        status: data.status,
        userId: socket.userId,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error broadcasting status change:', error);
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`User ${socket.userId} disconnected from WebSocket`);
  });
});

// Connect to MongoDB
connectDB();

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Decatron Business Backend API',
      version: '1.0.0',
      description:
        'API for Decatron Business Backend - Multi-tenancy authentication and user management',
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        BearerAuth: [],
      },
    ],
  },
  apis: ['**/*.ts'], // Paths to files containing OpenAPI definitions
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Connect to MongoDB
connectDB();

app.use(cors());
app.use(express.json());

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Serve OpenAPI JSON spec for Postman import
app.get('/api-docs.json', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Auth routes
app.use('/auth', authRoutes);

// Availability routes
app.use('/availability', availabilityRoutes);

// Property routes
app.use('/properties', propertyRoutes);

// Booking routes
app.use('/bookings', bookingRoutes);

// Staff schedule routes
app.use('/staff-schedules', staffScheduleRoutes);

// Inspection routes
app.use('/inspections', inspectionRoutes);

// Proxy booking routes (staff/admin booking on behalf of clients)
app.use('/proxy-bookings', proxyBookingRoutes);

// Feedback routes (staff feedback and client reviews)
app.use('/feedback', feedbackRoutes);

// Analytics routes (business insights and performance metrics)
app.use('/analytics', analyticsRoutes);

// Location tracking routes (real-time GPS tracking during inspections)
app.use('/location', locationTrackingRoutes);

// Protected route example
app.get('/protected', (req: Request, res: Response) => {
  res.json({ message: 'This is a protected route' });
});

// Health check
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Server is running' });
});

// Start the server
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`API Docs available at http://localhost:${PORT}/api-docs`);
  console.log(`WebSocket server ready for real-time connections`);
});
