import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import connectDB from './config/db.js';
import userRoutes from './routes/userRoutes.js';
import complaintRoutes from './routes/complaintRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import masterRoutes from './routes/masterRoutes.js';
import { startEscalationCron } from './services/escalationService.js';
import path from 'path';
import pino from 'pino';

// Initialize Structured Logger
const isProduction = process.env.NODE_ENV === 'production';
const logger = pino(isProduction ? {} : {
    transport: {
        target: 'pino-pretty',
        options: { colorize: true }
    }
});


dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(helmet());
app.use(cors());

// Internal Request Logger Middleware
app.use((req, res, next) => {
    logger.info({ method: req.method, url: req.url, ip: req.ip }, 'Incoming Request');
    next();
});

// Rate Limiting - General API (Generous for NAT/Shared IPs)
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Increased for rural government NAT gateways
    standardHeaders: true, 
    legacyHeaders: false,
    message: { message: 'High traffic detected from this IP. Please wait a few minutes.' }
});

// Rate Limiting - Auth (Strict against credential stuffing)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // Strict: 20 attempts per 15 minutes
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many login/registration attempts. Security lockout active for 15 minutes.' }
});

// Apply segmented limiters
app.use('/api/users/login', authLimiter);
app.use('/api/users/register', authLimiter);
app.use('/api', apiLimiter);


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
    res.json({ message: 'Bharat JanSetu API is running....', version: '2.0.0-hardened' });
});

// Global Error Handler Middleware (Production Grade)
app.use((err, req, res, next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    logger.error({
        message: err.message,
        stack: isProduction ? 'REDACTED' : err.stack,
        url: req.originalUrl,
        method: req.method
    }, 'Unhandled Exception');
    
    res.status(statusCode).json({
        message: err.message,
        stack: isProduction ? null : err.stack,
    });
});

// Start Background Jobs
startEscalationCron().catch(error => {
    logger.error('Failed to start Escalation Cron:', error);
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => logger.info(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`));

