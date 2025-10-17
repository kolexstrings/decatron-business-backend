import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
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

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Get port from environment or use default
const PORT = process.env.PORT || 3000;

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

// Protected route example
app.get('/protected', (req: Request, res: Response) => {
  res.json({ message: 'This is a protected route' });
});

// Health check
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Server is running' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`API Docs available at http://localhost:${PORT}/api-docs`);
});
