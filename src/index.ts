import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './utils/db';
import authRoutes from './routes/auth';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

app.use(cors());
app.use(express.json());

// Auth routes
app.use('/auth', authRoutes);

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
});
