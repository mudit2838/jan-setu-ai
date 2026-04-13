import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';
import Admin from '../models/adminModel.js';

export const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1];

            // Decode token id
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            req.user = await User.findById(decoded.id).select('-password');
            if (!req.user) {
                req.user = await Admin.findById(decoded.id).select('-password');
            }

            if (!req.user) {
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }

            return next();
        } catch (error) {
            console.error(error);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

export const official = (req, res, next) => {
    if (req.user && ['official_block', 'official_district', 'official_state', 'official_super', 'admin'].includes(req.user.role)) {
        next();
    } else {
        res.status(403).json({ message: 'Not authorized as an official' });
    }
};

export const admin = (req, res, next) => {
    if (req.user && (req.user.role === 'admin' || req.user.role === 'official_super')) {
        next();
    } else {
        res.status(403).json({ message: 'Not authorized as an admin' });
    }
};

export const superAdmin = (req, res, next) => {
    if (req.user && (req.user.role === 'official_super' || req.user.role === 'admin')) {
        next();
    } else {
        res.status(403).json({ message: 'Access Restricted: Master Identity Required' });
    }
};
