import express from 'express';
import { registerCitizen, registerOfficial, getCitizens, getOfficials } from '../controllers/userController.js';
import { loginCitizen, loginOfficial } from '../controllers/authController.js';
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

// Separate Login APIs
router.post('/login/citizen', loginCitizen);
router.post('/login/official', loginOfficial);

// Admin-Only Operations
router.post('/admin/register-official', protect, admin, registerOfficial);
router.get('/citizens', protect, getCitizens); // Scoped citizens
router.get('/officials', protect, getOfficials); // Scoped officials

export default router;
