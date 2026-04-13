import User from '../models/userModel.js';
import Admin from '../models/adminModel.js';
import Otp from '../models/otpModel.js';
import { sendNotification } from '../services/notificationService.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// @desc    Citizen Login (Mobile + Password)
// @route   POST /api/users/login/citizen
// @access  Public
export const loginCitizen = async (req, res) => {
    const { mobile, password } = req.body;

    try {
        if (!mobile || !password) {
            return res.status(400).json({ message: 'Mobile and password are required' });
        }

        if (mobile.length !== 10 || !/^\d+$/.test(mobile)) {
            return res.status(400).json({ message: 'Mobile number must be exactly 10 numeric digits' });
        }

        const user = await User.findOne({ mobile, role: 'citizen', isActive: true });

        if (!user) {
            return res.status(401).json({ message: 'Account not found or not registered as a Citizen. Check which portal you are using.' });
        }

        // --- 2. Check Account Status ---
        if (user.isLocked && user.lockUntil && user.lockUntil > new Date()) {
            return res.status(403).json({ message: 'Account temporarily locked.' });
        }

        // --- 3. Verify Password ---
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
            if (user.failedLoginAttempts >= 5) {
                user.isLocked = true;
                user.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
            }
            await user.save();
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // --- 4. Success ---
        user.failedLoginAttempts = 0;
        user.isLocked = false;
        user.lockUntil = null;
        await user.save();

        res.json({
            _id: user._id,
            name: user.name,
            mobile: user.mobile,
            role: user.role,
            district: user.district,
            token: generateToken(user._id),
            message: 'Citizen login successful'
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Official Login (Email + Password)
// @route   POST /api/users/login/official
// @access  Public
export const loginOfficial = async (req, res) => {
    const { email, password } = req.body;
    let user;

    try {
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        // Check Admin model first (Super Admin)
        user = await Admin.findOne({ email });

        // Check User model if not in Admin model
        if (!user) {
            user = await User.findOne({ email, isActive: true });
        }

        if (!user || user.role === 'citizen') {
            return res.status(401).json({ message: 'Access denied: Only officials can login here.' });
        }

        // --- 2. Check Account Status ---
        if (user.isLocked && user.lockUntil && user.lockUntil > new Date()) {
            return res.status(403).json({ message: 'Account temporarily locked.' });
        }

        // --- 3. Verify Password ---
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
            if (user.failedLoginAttempts >= 5) {
                user.isLocked = true;
                user.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
            }
            await user.save();
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // --- 4. Success ---
        user.failedLoginAttempts = 0;
        user.isLocked = false;
        user.lockUntil = null;
        await user.save();

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            district: user.district,
            token: generateToken(user._id),
            message: `Official login successful as ${user.role}`
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

