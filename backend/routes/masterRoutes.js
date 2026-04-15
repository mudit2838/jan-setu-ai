import express from 'express';
import { 
    registerMasterOfficial, 
    getAllOfficials, 
    getPerformanceLeaderboard, 
    toggleOfficialStatus, 
    getHeatmapData,
    getPublicStats,
    getPublicRecentComplaints
} from '../controllers/masterController.js';
import { protect, superAdmin, official } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public Transparency APIs
router.get('/public/stats', getPublicStats);
router.get('/public/heatmap', getHeatmapData); 
router.get('/public/leaderboard', getPerformanceLeaderboard);
router.get('/public/recent', getPublicRecentComplaints); // Anonymised live feed

// Master Provisioning - Exclusive to SuperAdmin
router.post('/register', protect, superAdmin, registerMasterOfficial);
router.get('/officials', protect, superAdmin, getAllOfficials);
router.patch('/official/:id/toggle', protect, superAdmin, toggleOfficialStatus);

// Regional Surveillance & Performance - Authorized Officials
router.get('/leaderboard', protect, official, getPerformanceLeaderboard);
router.get('/heatmap', protect, official, getHeatmapData);

export default router;
