import Complaint from '../models/complaintModel.js';
import axios from 'axios';
import { sendNotification } from '../services/notificationService.js';

// Helper to determine initial deadline (Local Level)
const calculateInitialDeadline = (priority) => {
    const now = new Date();
    switch (priority) {
        case 'High':
        case 'Critical':
            return new Date(now.setDate(now.getDate() + 1)); // 24 hours
        case 'Medium':
            return new Date(now.setDate(now.getDate() + 3)); // 3 days
        case 'Low':
            return new Date(now.setDate(now.getDate() + 7)); // 7 days
        default:
            return new Date(now.setDate(now.getDate() + 3));
    }
};

// @desc    Submit a new complaint (Citizen)
// @route   POST /api/complaints
// @access  Private (Citizen)
export const submitComplaint = async (req, res) => {
    const { title, description, district, block, village, latitude, longitude, issueImage } = req.body;

    try {
        if (!title || !description || !district || !block) {
            return res.status(400).json({ message: 'Title, description, district, and block are mandatory.' });
        }

        // 1. Call Redesigned Python AI Service for advanced NLP analysis
        let category = 'Uncategorized';
        let department = 'General Administration';
        let priority = 'Medium'; 

        try {
            const aiResponse = await axios.post('http://127.0.0.1:8000/api/analyze', {
                complaint_text: `${title} ${description}`,
                complaint_id: "TEMP_INIT_ID" 
            });

            department = aiResponse.data.department;
            // NORMALIZE PRIORITY: AI returns "CRITICAL"/"HIGH", Model expects "Critical"/"High"
            const rawPriority = aiResponse.data.priority || 'MEDIUM';
            priority = rawPriority.charAt(0).toUpperCase() + rawPriority.slice(1).toLowerCase();

            category = department; 
            console.log(`🤖 AI Analysis: [${department}] Priority: [${priority}]`);
        } catch (aiError) {
            console.error('AI NLP Analysis failed, using defaults.', aiError.message);
        }

        // 2. Calculate Strict Deadline based on mapped priority
        const resolutionDeadline = calculateInitialDeadline(priority);

        // 3. Create Complaint (Auto-routes to Block Level)
        const complaint = await Complaint.create({
            citizen: req.user._id,
            title,
            description,
            state: 'Uttar Pradesh', // Fixed as per rules
            district,
            block,
            village,
            latitude,
            longitude,
            issueImage,
            category,
            department,
            priority,
            assignedToLevel: 'Local', // Auto-routes to lowest level first
            status: 'Pending',
            slaDueDate: resolutionDeadline,
            ipAddress: req.ip || req.connection.remoteAddress
        });

        res.status(201).json({
            message: 'Complaint submitted and auto-routed successfully.',
            complaint
        });

        // 4. Send Confirmation Notification (Async - do not block response)
        const message = `Bharat JanSetu: Your complaint #${complaint._id.toString().slice(-6).toUpperCase()} has been filed and routed to the ${complaint.assignedToLevel} level for ${complaint.department} department. Track it on the portal.`;
        sendNotification(req.user.mobile, req.user.email, message);

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get logged in citizen's complaints
// @route   GET /api/complaints/my
// @access  Private
export const getMyComplaints = async (req, res) => {
    try {
        const complaints = await Complaint.find({ citizen: req.user._id }).sort({ createdAt: -1 });
        res.json(complaints);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get complaints for Admin/Official Dashboard (Strict Scoping by Department & Location)
// @route   GET /api/complaints/admin
// @access  Private (Official)
export const getAdminComplaints = async (req, res) => {
    try {
        const { role, district, block, department } = req.user;
        let query = { department }; // Default scoping by department

        if (role === 'official_block') {
            query.district = district;
            query.block = block;
        } else if (role === 'official_district') {
            query.district = district;
        } else if (role === 'official_state') {
            // Already scoped by department
        } else if (role === 'admin') {
            query = {}; // Super-Admin sees everything
        } else {
            return res.status(403).json({ message: 'Unauthorized role for this dashboard.' });
        }

        const complaints = await Complaint.find(query)
            .populate('citizen', 'name mobile')
            .sort({ priority: -1, createdAt: -1 });

        res.json(complaints);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const getAdminAnalytics = async (req, res) => {
    try {
        const { role, district, block, department } = req.user;
        let filter = { department };

        if (role === 'official_block') {
            filter.district = district;
            filter.block = block;
        } else if (role === 'official_district') {
            filter.district = district;
        } else if (role === 'official_state') {
            // Scoped by department
        } else if (role === 'admin') {
            filter = {};
        }

        // 1. Status Breakdown
        const statusData = await Complaint.aggregate([
            { $match: filter },
            { $group: { _id: "$status", value: { $sum: 1 } } }
        ]);

        // 2. Priority Breakdown
        const priorityData = await Complaint.aggregate([
            { $match: filter },
            { $group: { _id: "$priority", value: { $sum: 1 } } }
        ]);

        // 3. Category Breakdown (Sub-categories within the department)
        const categoryData = await Complaint.aggregate([
            { $match: filter },
            { $group: { _id: "$category", value: { $sum: 1 } } }
        ]);

        const formatData = (data) => data.map(item => ({ name: item._id || 'Unassigned', value: item.value }));

        res.json({
            statusData: formatData(statusData),
            categoryData: formatData(categoryData),
            priorityData: formatData(priorityData)
        });

    } catch (error) {
        res.status(500).json({ message: 'Error fetching analytics', error: error.message });
    }
};
