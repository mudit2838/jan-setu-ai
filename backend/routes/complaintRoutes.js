import express from 'express';
import { 
    submitComplaint, 
    getMyComplaints, 
    getAdminComplaints, 
    getAdminAnalytics, 
    getRecentComplaints, 
    getWeeklyVolume, 
    getDepartmentLoad, 
    getActiveEscalations,
    getDistrictStats 
} from '../controllers/complaintController.js';
import { updateComplaintStatus, submitFeedback } from '../controllers/actionController.js';
import { generateComplaintPDF } from '../controllers/pdfController.js';
import { protect, official } from '../middleware/authMiddleware.js';

const router = express.Router();

// Citizen Routes
router.route('/').post(protect, submitComplaint);
router.route('/my').get(protect, getMyComplaints);

// Official/Admin Routes
router.route('/admin').get(protect, official, getAdminComplaints);
router.route('/analytics').get(protect, official, getAdminAnalytics);
router.route('/recent').get(protect, official, getRecentComplaints);
router.route('/weekly').get(protect, official, getWeeklyVolume);
router.route('/departments/load').get(protect, official, getDepartmentLoad);
router.route('/escalations/active').get(protect, official, getActiveEscalations);
router.route('/districts/stats').get(protect, official, getDistrictStats);

// Actions (Officer updates status/proof)
router.route('/:id/status').put(protect, official, updateComplaintStatus);

// Actions (Citizen provides feedback)
router.route('/:id/feedback').post(protect, submitFeedback);

// Generate PDF Receipt (Accessible by the citizen or any official)
router.route('/:id/pdf').get(protect, generateComplaintPDF);

export default router;
