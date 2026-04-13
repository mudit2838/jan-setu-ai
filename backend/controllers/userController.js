import Otp from '../models/otpModel.js';
import User from '../models/userModel.js';
import { sendNotification } from '../services/notificationService.js';
import bcrypt from 'bcryptjs';

// Helper to generate 6-digit OTP
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// @desc    Register a Citizen (Direct - No OTP)
// @route   POST /api/users/register
// @access  Public
export const registerCitizen = async (req, res) => {
    const { name, mobile, email, password, district, block, village, pincode, addressLine } = req.body;

    try {
        if (!name || !mobile || !password || !district || !block || !pincode || !addressLine) {
            return res.status(400).json({ message: 'Missing mandatory fields' });
        }

        if (mobile.length !== 10 || !/^\d+$/.test(mobile)) {
            return res.status(400).json({ message: 'Mobile number must be exactly 10 numeric digits' });
        }

        const userExists = await User.findOne({ mobile });
        if (userExists) {
            return res.status(400).json({ message: 'Mobile number already registered' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await User.create({
            name,
            mobile,
            email,
            password: hashedPassword,
            role: 'citizen',
            state: 'Uttar Pradesh',
            district,
            block,
            village,
            pincode,
            addressLine,
            isActive: true, // Default to active without OTP
        });

        res.status(201).json({
            message: 'Account created successfully.',
            user: {
                _id: user._id,
                name: user.name,
                mobile: user.mobile,
                district: user.district
            }
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};


// @desc    Register a new Official (Admin Only)
// @route   POST /api/users/admin/register-official
// @access  Private (Admin)
export const registerOfficial = async (req, res) => {
    const { name, mobile, email, password, role, district, block, department } = req.body;

    try {
        if (mobile.length !== 10 || !/^\d+$/.test(mobile)) {
            return res.status(400).json({ message: 'Mobile number must be exactly 10 numeric digits' });
        }

        const allowedRoles = ['official_block', 'official_district', 'official_state'];
        if (!allowedRoles.includes(role)) {
            return res.status(400).json({ message: 'Invalid official role' });
        }

        const userExists = await User.findOne({ mobile });
        if (userExists) {
            return res.status(400).json({ message: 'User with this mobile already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const official = await User.create({
            name,
            mobile,
            email,
            password: hashedPassword,
            role,
            state: 'Uttar Pradesh',
            district,
            block,
            department: department || 'General Administration',
            isActive: true, 
        });

        res.status(201).json({
            message: 'Official account created successfully',
            official: {
                id: official._id,
                name: official.name,
                role: official.role,
                department: official.department,
                location: `${official.district} - ${official.block || 'All Blocks'}`
            }
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
// @desc    Get all citizens (Scoped by Officer Jurisdiction)
// @route   GET /api/users/citizens
// @access  Private (Official/Admin)
export const getCitizens = async (req, res) => {
    try {
        const { role, district, block } = req.user;
        let query = { role: 'citizen' };

        if (role === 'official_block') {
            query.district = district;
            query.block = block;
        } else if (role === 'official_district') {
            query.district = district;
        }

        const citizens = await User.find(query).select('-password').sort({ createdAt: -1 });
        res.json(citizens);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching citizens', error: error.message });
    }
};

// @desc    Get all officials (Scoped by Officer Jurisdiction)
// @route   GET /api/users/officials
// @access  Private (Admin/District Official)
export const getOfficials = async (req, res) => {
    try {
        const { role, district } = req.user;
        let query = { role: { $in: ['official_block', 'official_district', 'official_state'] } };

        if (role !== 'admin' && role !== 'official_state') {
            query.district = district;
        }

        const officials = await User.find(query).select('-password').sort({ role: 1 });
        res.json(officials);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching officials', error: error.message });
    }
};
