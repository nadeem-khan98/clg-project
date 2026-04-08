import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import scanRoutes from './routes/scanRoutes.js';
import intakeRoutes from './routes/intakeRoutes.js';
import weightRoutes from './routes/weightRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/scan', scanRoutes);
app.use('/api/intake', intakeRoutes);
app.use('/api/weight', weightRoutes);

// Detailed Database Connection Options can go here if needed
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/diet-coach')
  .then(() => console.log('MongoDB successfully connected'))
  .catch(err => console.error('MongoDB connection error:', err));

app.get('/', (req, res) => {
  res.send('AI Diet Coach API is running');
});

// Use ES modules
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
