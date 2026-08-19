import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import productRoutes from './routes/productRoutes.js';
import authRoutes from './routes/authRoutes.js';
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());



// Routes
app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);

// Base route
app.get('/', (req, res) => {
  res.send('E-Commerce API is running...');
});

export default app;
