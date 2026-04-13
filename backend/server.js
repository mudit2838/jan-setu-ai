import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';
import userRoutes from './routes/userRoutes.js';
import complaintRoutes from './routes/complaintRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import masterRoutes from './routes/masterRoutes.js';
import { startEscalationCron } from './services/escalationService.js';
import path from 'path';

dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/users', userRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/master', masterRoutes);

// Expose the uploads folder statically
const __dirname = path.resolve();
app.use('/uploads', express.static(path.join(__dirname, '/uploads')));

// Basic Route for Testing
app.get('/', (req, res) => {
    res.send('API is running....');
});

// Start Background Jobs
startEscalationCron();

const PORT = process.env.PORT || 5000;

app.listen(PORT, console.log(`Server running on port ${PORT}`));
