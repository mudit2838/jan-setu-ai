import express from 'express';
import { registerCitizen, registerOfficial } from '../controllers/userController.js';
import { loginUser, authDigilockerUser } from '../controllers/authController.js';
import { getDistricts, getBlocks, getVillages } from '../utils/locationData.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public Location Helper APIs
router.get('/locations/districts', (req, res) => {
    res.json(getDistricts());
});

router.get('/locations/blocks/:district', (req, res) => {
    res.json(getBlocks(req.params.district));
});

router.get('/locations/villages/:district/:block', (req, res) => {
    res.json(getVillages(req.params.district, req.params.block));
});

// Citizen Registration API (Direct)
router.post('/register', registerCitizen);

// Unified Login API (Direct - No OTP)
router.post('/login', loginUser);
router.post('/login/digilocker', authDigilockerUser);

// Admin-Only Operations
router.post('/admin/register-official', protect, admin, registerOfficial);

export default router;
