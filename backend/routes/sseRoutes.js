import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';
import Admin from '../models/adminModel.js';
import { addClient, removeClient } from '../services/sseManager.js';

const router = express.Router();

// @route   GET /api/events/stream
// @desc    Server-Sent Events stream for official dashboards
// @access  Private (Official/Admin) — auth via query param token
router.get('/stream', async (req, res) => {
    const token = req.query.token;

    if (!token) {
        return res.status(401).json({ message: 'No token provided for SSE stream.' });
    }

    // Verify token (can't use the protect middleware directly — SSE needs to hijack the response)
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Check both User and Admin models
        let user = await User.findById(decoded.id).select('-password');
        if (!user) user = await Admin.findById(decoded.id).select('-password');
        if (!user) return res.status(401).json({ message: 'User not found.' });

        const allowedRoles = ['official_block', 'official_district', 'official_state', 'admin'];
        if (!allowedRoles.includes(user.role)) {
            return res.status(403).json({ message: 'SSE stream is for officials only.' });
        }
    } catch {
        return res.status(401).json({ message: 'Invalid token for SSE stream.' });
    }

    // --- SSE Headers — keep connection alive ---
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.flushHeaders(); // Send headers immediately to establish stream

    // Send initial connection confirmation event
    res.write(`event: CONNECTED\ndata: ${JSON.stringify({ message: 'JanSetu live stream active', timestamp: new Date() })}\n\n`);

    // Register this client for broadcasts
    addClient(res);

    // Heartbeat every 25 seconds to prevent proxies/Nginx from closing the connection
    const heartbeat = setInterval(() => {
        try {
            res.write(`: heartbeat\n\n`); // SSE comment — keeps connection alive
        } catch {
            clearInterval(heartbeat);
        }
    }, 25000);

    // Clean up on client disconnect
    req.on('close', () => {
        clearInterval(heartbeat);
        removeClient(res);
    });
});

export default router;
