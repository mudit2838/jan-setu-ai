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

// @desc    Direct Login (Mobile/Email + Password - No OTP)
// @route   POST /api/users/login
// @access  Public
export const loginUser = async (req, res) => {
    const { email, mobile, password } = req.body;
    let user;

    try {
        if (!password) {
            return res.status(400).json({ message: 'Password is required' });
        }

        // --- 1. Identify User (Admin vs Citizen) ---
        if (email) {
            user = await Admin.findOne({ email });
            if (!user) user = await User.findOne({ email });
        } else if (mobile) {
            user = await Admin.findOne({ mobile });
            if (!user) user = await User.findOne({ mobile, isActive: true });
        } else {
            return res.status(400).json({ message: 'Please provide either mobile number or email' });
        }

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials or account not active' });
        }

        // --- 2. Check Account Status ---
        if (user.isLocked) {
            if (user.lockUntil && user.lockUntil > new Date()) {
                return res.status(403).json({ message: 'Account temporarily locked. Please try again later.' });
            } else {
                user.isLocked = false;
                user.failedLoginAttempts = 0;
                user.lockUntil = null;
                await user.save();
            }
        }

        // --- 3. Verify Password ---
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            user.failedLoginAttempts += 1;
            if (user.failedLoginAttempts >= 5) {
                user.isLocked = true;
                user.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
            }
            await user.save();
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // --- 4. Success - Return Token ---
        user.failedLoginAttempts = 0;
        await user.save();

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            mobile: user.mobile,
            role: user.role,
            district: user.district,
            token: generateToken(user._id),
            message: `Successfully logged in as ${user.role}`
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Mock DigiLocker OAuth Login / Auto-Registration
// @route   POST /api/users/login/digilocker
// @access  Public
export const authDigilockerUser = async (req, res) => {
    const { name, mobile, aadhaar, state, district, block, village, pincode } = req.body;

    try {
        // 1. Check if user already exists
        let user = await User.findOne({ mobile });

        // 2. If not, auto-register them seamlessly
        if (!user) {
            user = await User.create({
                name,
                mobile,
                role: 'citizen',
                state,
                district,
                block,
                village,
                pincode,
                isActive: true // DigiLocker is pre-verified KYC data
            });
        }

        // 3. Log them in directly bypassing OTPs/Passwords
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            mobile: user.mobile,
            role: user.role,
            district: user.district,
            token: generateToken(user._id),
            message: `DigiLocker KYC Seamless Login Successful.`
        });

    } catch (error) {
        console.error("DigiLocker Auth Error:", error);
        res.status(500).json({ message: 'DigiLocker Auth Error', error: error.message });
    }
};
