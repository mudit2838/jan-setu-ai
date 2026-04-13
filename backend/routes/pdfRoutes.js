import express from 'express';
import { generateComplaintPDF } from '../controllers/pdfController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Route to generate and download PDF receipt for a specific complaint
// We want citizens to download their own, and officials to download any.
router.route('/:id/pdf').get(protect, generateComplaintPDF);

export default router;
