import express from 'express';
import { submitComplaint, getMyComplaints, getAdminComplaints, getAdminAnalytics } from '../controllers/complaintController.js';
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

// Actions (Officer updates status/proof)
router.route('/:id/status').put(protect, official, updateComplaintStatus);

// Actions (Citizen provides feedback)
router.route('/:id/feedback').post(protect, submitFeedback);

// Generate PDF Receipt (Accessible by the citizen or any official)
router.route('/:id/pdf').get(protect, generateComplaintPDF);

export default router;
