import Complaint from '../models/complaintModel.js';
import axios from 'axios';
import { sendNotification } from '../services/notificationService.js';
import { broadcast } from '../services/sseManager.js';

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
            const aiResponse = await axios.post(`${process.env.AI_SERVICE_URL || 'http://ai-service:8000'}/api/analyze`, {
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

        // 3. Geo-Sanity Check (Uttar Pradesh Boundaries)
        let isGeoVerified = false;
        if (latitude && longitude) {
            const latNum = parseFloat(latitude);
            const lngNum = parseFloat(longitude);
            // UP Approx Bounds: 23-31 North, 77-85 East
            if (latNum >= 23 && latNum <= 31 && lngNum >= 77 && lngNum <= 85) {
                isGeoVerified = true;
            }
        }

        // 4. Create Complaint (Auto-routes to Block Level)
        const complaint = await Complaint.create({
            citizen: req.user._id,
            title,
            description,
            state: 'Uttar Pradesh', 
            district,
            block,
            village,
            latitude,
            longitude,
            isGeoVerified, // Flag for official confidence
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

        // Broadcast real-time update to all connected official dashboards
        broadcast('NEW_COMPLAINT', {
            id: complaint._id,
            shortId: complaint._id.toString().slice(-6).toUpperCase(),
            title: complaint.title,
            department: complaint.department,
            priority: complaint.priority,
            district: complaint.district
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
        let matchQuery = { department }; 

        // Mapping role to jurisdictional target level and visibility scope
        let targetLevel = 'Local';
        
        if (role === 'admin' || role === 'official_super') {
            matchQuery = {}; // Global visibility for master admins
            targetLevel = 'Any';
        } else {
            // All other official roles are strictly siloed by their current assignment level
            if (role === 'official_block') {
                matchQuery.district = district;
                matchQuery.block = block;
                matchQuery.assignedToLevel = 'Local';
                targetLevel = 'Local';
            } else if (role === 'official_district') {
                matchQuery.district = district;
                matchQuery.assignedToLevel = 'District';
                targetLevel = 'District';
            } else if (role === 'official_state') {
                matchQuery.assignedToLevel = 'State';
                targetLevel = 'State';
            } else {
                return res.status(403).json({ message: 'Unauthorized role for this dashboard.' });
            }
        }

        // Use Aggregation to calculate 'isActionable' flag and optimized sorting
        const complaints = await Complaint.aggregate([
            { $match: matchQuery },
            {
                $addFields: {
                    isActionable: { $eq: ["$assignedToLevel", targetLevel] },
                    priorityWeight: {
                        $switch: {
                            branches: [
                                { case: { $eq: ["$priority", "Critical"] }, then: 4 },
                                { case: { $eq: ["$priority", "High"] }, then: 3 },
                                { case: { $eq: ["$priority", "Medium"] }, then: 2 },
                                { case: { $eq: ["$priority", "Low"] }, then: 1 }
                            ],
                            default: 0
                        }
                    }
                }
            },
            // Sort Strategy: 1. Actionable for this level first, 2. Priority weight, 3. Newest first
            { $sort: { isActionable: -1, priorityWeight: -1, createdAt: -1 } }
        ]);

        // Populate manual fields after aggregation
        const populatedComplaints = await Complaint.populate(complaints, { path: 'citizen', select: 'name mobile' });

        res.json(populatedComplaints);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const getAdminAnalytics = async (req, res) => {
    try {
        const { role, district, block, department } = req.user;
        let filter = { department };

        if (role === 'admin' || role === 'official_super') {
            filter = {};
        } else {
            if (role === 'official_block') {
                filter.district = district;
                filter.block = block;
                filter.assignedToLevel = 'Local';
            } else if (role === 'official_district') {
                filter.district = district;
                filter.assignedToLevel = 'District';
            } else if (role === 'official_state') {
                filter.assignedToLevel = 'State';
            } else {
                return res.status(403).json({ message: 'Unauthorized role' });
            }
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

        const total = statusData.reduce((acc, curr) => acc + curr.value, 0);
        const pending = statusData
            .filter(s => ['Pending', 'In Progress', 'Escalated - Pending Action'].includes(s._id))
            .reduce((acc, curr) => acc + curr.value, 0);

        // 4. Real-time Citizen Satisfaction Calculation
        const feedbackStats = await Complaint.aggregate([
            { $match: { ...filter, satisfactionLevel: { $exists: true, $ne: null } } },
            { $group: {
                _id: null,
                avgSat: { $avg: {
                    $switch: {
                        branches: [
                            { case: { $eq: ["$satisfactionLevel", "Satisfied"] }, then: 100 },
                            { case: { $eq: ["$satisfactionLevel", "Partially Satisfied"] }, then: 50 },
                            { case: { $eq: ["$satisfactionLevel", "Not Satisfied"] }, then: 0 }
                        ],
                        default: 0
                    }
                }}
            }}
        ]);

        const avgSatisfaction = feedbackStats.length > 0 ? Math.round(feedbackStats[0].avgSat) : 85;

        // 5. Daily Delta (Today vs Yesterday)
        const today = new Date();
        today.setHours(0,0,0,0);
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);

        const todayCount = await Complaint.countDocuments({ ...filter, createdAt: { $gte: today, $lt: tomorrow } });
        const yesterdayCount = await Complaint.countDocuments({ ...filter, createdAt: { $gte: yesterday, $lt: today } });
        const dailyDelta = todayCount - yesterdayCount;

        res.json({
            statusData: formatData(statusData),
            categoryData: formatData(categoryData),
            priorityData: formatData(priorityData),
            metrics: {
                total,
                pending,
                avgResolutionTime: 3.5, // Logic for resolution time tracking can be added later
                citizenSatisfaction: avgSatisfaction, 
                dailyDelta: dailyDelta || 0
            }
        });

    } catch (error) {
        res.status(500).json({ message: 'Error fetching analytics', error: error.message });
    }
};

// @desc    Get 3 most recent complaints with jurisdiction flags
// @route   GET /api/complaints/recent
export const getRecentComplaints = async (req, res) => {
    try {
        const { role, district, block, department } = req.user;
        let query = { department };
        let targetLevel = 'Local';

        if (role === 'admin' || role === 'official_super') {
            query = {};
            targetLevel = 'Any';
        } else {
            if (role === 'official_block') {
                query.district = district;
                query.block = block;
                query.assignedToLevel = 'Local';
                targetLevel = 'Local';
            } else if (role === 'official_district') {
                query.district = district;
                query.assignedToLevel = 'District';
                targetLevel = 'District';
            } else if (role === 'official_state') {
                query.assignedToLevel = 'State';
                targetLevel = 'State';
            }
        }

        const complaints = await Complaint.aggregate([
            { $match: query },
            { $sort: { createdAt: -1 } },
            { $limit: parseInt(req.query.limit) || 3 },
            {
                $addFields: {
                    isActionable: { $eq: ["$assignedToLevel", targetLevel] }
                }
            }
        ]);

        const populatedComplaints = await Complaint.populate(complaints, { path: 'citizen', select: 'name mobile' });
        res.json(populatedComplaints);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching recent complaints', error: error.message });
    }
};

// @desc    Get weekly volume for last 8 weeks
// @route   GET /api/complaints/weekly
export const getWeeklyVolume = async (req, res) => {
    try {
        const { role, district, block } = req.user;
        let filter = {};

        if (role === 'official_block') {
            filter = { district, block };
        } else if (role === 'official_district') {
            filter = { district };
        }

        const eightWeeksAgo = new Date();
        eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);

        const volume = await Complaint.aggregate([
            { $match: { ...filter, createdAt: { $gte: eightWeeksAgo } } },
            {
                $group: {
                    _id: { $week: "$createdAt" },
                    count: { $sum: 1 },
                    date: { $first: "$createdAt" }
                }
            },
            { $sort: { "_id": 1 } },
            { $limit: 8 }
        ]);

        const formatted = volume.map(v => ({
            name: `Week ${v._id}`,
            value: v.count
        }));

        res.json(formatted);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching weekly volume', error: error.message });
    }
};

// @desc    Get load per department
// @route   GET /api/complaints/departments/load
export const getDepartmentLoad = async (req, res) => {
    try {
        const { role, district, block } = req.user;
        let filter = {};

        if (role === 'official_block') {
            filter = { district, block };
        } else if (role === 'official_district') {
            filter = { district };
        }

        const load = await Complaint.aggregate([
            { $match: filter },
            { $group: { _id: "$department", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);

        const formatted = load.map(l => ({
            name: l._id || 'General',
            count: l.count
        }));

        res.json(formatted);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching department load', error: error.message });
    }
};

// @desc    Get top 3 active escalations
// @route   GET /api/complaints/escalations/active
export const getActiveEscalations = async (req, res) => {
    try {
        const { role, district, block, department } = req.user;
        let query = { status: { $regex: /Escalated/i } };

        if (role !== 'admin') {
            query.department = department;
            if (role === 'official_block') { query.district = district; query.block = block; }
            if (role === 'official_district') { query.district = district; }
        }

        const escalations = await Complaint.find(query)
            .sort({ updatedAt: -1 })
            .limit(3);

        res.json(escalations);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching active escalations', error: error.message });
    }
};

// @desc    Get grievance distribution across blocks/districts
// @route   GET /api/complaints/districts/stats
export const getDistrictStats = async (req, res) => {
    try {
        const { role, district } = req.user;
        let match = {};
        let groupField = "$district";

        if (role === 'official_district' || role === 'official_block') {
            match.district = district;
            groupField = "$block";
        }

        const stats = await Complaint.aggregate([
            { $match: match },
            {
                $group: {
                    _id: groupField,
                    total: { $sum: 1 },
                    resolved: { $sum: { $cond: [{ $eq: ["$status", "Resolved"] }, 1, 0] } },
                    pending: { $sum: { $cond: [{ $in: ["$status", ["Pending", "In Progress", "Escalated - Pending Action"]] }, 1, 0] } }
                }
            },
            { $sort: { total: -1 } }
        ]);

        const formatted = stats.map(s => ({
            name: s._id || 'General',
            total: s.total,
            resolved: s.resolved,
            pending: s.pending,
            successRate: s.total > 0 ? Math.round((s.resolved / s.total) * 100) : 0
        }));

        res.json(formatted);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching district stats', error: error.message });
    }
};
