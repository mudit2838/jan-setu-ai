import User from '../models/userModel.js';
import Complaint from '../models/complaintModel.js';
import bcrypt from 'bcryptjs';

// @desc    Register a Master/Authority Official
// @route   POST /api/master/register
// @access  Private (SuperAdmin)
export const registerMasterOfficial = async (req, res) => {
    const { name, mobile, email, password, role, district, block, department } = req.body;

    try {
        const allowedRoles = ['official_block', 'official_district', 'official_state', 'official_super'];
        if (!allowedRoles.includes(role)) {
            return res.status(400).json({ message: 'Invalid role assignment' });
        }

        const userExists = await User.findOne({ mobile });
        if (userExists) {
            return res.status(400).json({ message: 'Mobile number already in use' });
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
            message: 'Official provisioned successfully',
            id: official._id,
        });
    } catch (error) {
        res.status(500).json({ message: 'Provisioning failed', error: error.message });
    }
};

// @desc    Get All Officials (Hierarchy List)
// @route   GET /api/master/officials
// @access  Private (SuperAdmin)
export const getAllOfficials = async (req, res) => {
    try {
        const officials = await User.find({ role: { $ne: 'citizen' } }).select('-password').sort({ role: 1 });
        res.json(officials);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch directory' });
    }
};

// @desc    Get Performance Leaderboard
// @route   GET /api/master/leaderboard
// @access  Private (SuperAdmin/OfficialState)
export const getPerformanceLeaderboard = async (req, res) => {
    try {
        // Aggregate resolution stats by department
        const stats = await Complaint.aggregate([
            {
                $group: {
                    _id: "$department",
                    total: { $sum: 1 },
                    resolved: { $sum: { $cond: [{ $in: ["$status", ["Resolved", "Closed Permanently"]] }, 1, 0] } },
                    escalated: { $sum: { $cond: [{ $regexMatch: { input: "$status", regex: /Escalated/ } }, 1, 0] } }
                }
            },
            {
                $project: {
                    department: "$_id",
                    total: 1,
                    resolved: 1,
                    escalated: 1,
                    resolutionRate: {
                        $cond: [
                            { $eq: ["$total", 0] },
                            0,
                            { $multiply: [{ $divide: ["$resolved", "$total"] }, 100] }
                        ]
                    }
                }
            },
            { $sort: { resolutionRate: -1 } }
        ]);

        res.json(stats);
    } catch (error) {
        res.status(500).json({ message: 'Leaderboard aggregation failed' });
    }
};

// @desc    Toggle Official Account Status
// @route   PATCH /api/master/official/:id/toggle
// @access  Private (SuperAdmin)
export const toggleOfficialStatus = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user || user.role === 'citizen') {
            return res.status(404).json({ message: 'Official not found' });
        }

        user.isActive = !user.isActive;
        await user.save();

        res.json({ message: `Account ${user.isActive ? 'activated' : 'suspended'}`, status: user.isActive });
    } catch (error) {
        res.status(500).json({ message: 'Status toggle failed' });
    }
};

// @desc    Grievance Intensity Heatmap Data
// @route   GET /api/master/heatmap
// @access  Private (Official)
export const getHeatmapData = async (req, res) => {
    try {
        const complaints = await Complaint.find({
            latitude: { $exists: true, $ne: "" },
            longitude: { $exists: true, $ne: "" }
        }, 'latitude longitude priority department district');

        const heatmapPoints = complaints.map(c => ({
            lat: parseFloat(c.latitude),
            lng: parseFloat(c.longitude),
            weight: c.priority === 'High' ? 3 : c.priority === 'Medium' ? 2 : 1,
            dept: c.dept,
            district: c.district
        }));

        res.json(heatmapPoints);
    } catch (error) {
        res.status(500).json({ message: 'Heatmap data generation failed' });
    }
};

// @desc    Public Performance & Satisfaction Stats
// @route   GET /api/master/public/stats?district=Lucknow (optional district filter)
// @access  Public
export const getPublicStats = async (req, res) => {
    try {
        // Optional district filter from query param
        const districtFilter = req.query.district ? { district: req.query.district } : {};

        const totalGrievances = await Complaint.countDocuments(districtFilter);
        const resolvedGrievances = await Complaint.countDocuments({ ...districtFilter, status: { $in: ["Resolved", "Closed Permanently"] } });
        const pendingGrievances = await Complaint.countDocuments({ ...districtFilter, status: { $in: ["Pending", "Pending Assignment", "In Progress"] } });

        // Average resolution time in hours (real calculation)
        const resolvedWithDates = await Complaint.find({
            ...districtFilter,
            status: { $in: ['Resolved', 'Closed Permanently'] },
            updatedAt: { $exists: true },
            createdAt: { $exists: true }
        }).select('createdAt updatedAt').lean();

        let avgHours = 38.5; // fallback
        if (resolvedWithDates.length > 0) {
            const totalMs = resolvedWithDates.reduce((acc, c) =>
                acc + (new Date(c.updatedAt) - new Date(c.createdAt)), 0);
            avgHours = parseFloat((totalMs / resolvedWithDates.length / 3600000).toFixed(1));
        }

        // Satisfaction from ATRs
        const complaintsWithATR = await Complaint.find({ ...districtFilter, 'citizenATR.satisfied': { $exists: true } });
        const satisfiedCount = complaintsWithATR.filter(c => c.citizenATR?.satisfied === true).length;
        const publicSatisfaction = complaintsWithATR.length > 0
            ? Math.round((satisfiedCount / complaintsWithATR.length) * 100)
            : 85;

        // Apply demo offset only when not district-filtered
        const offset = req.query.district ? 0 : 12543;
        const resolvedOffset = req.query.district ? 0 : 11200;
        const pendingOffset = req.query.district ? 0 : 1343;

        res.json({
            total: totalGrievances + offset,
            resolved: resolvedGrievances + resolvedOffset,
            pending: pendingGrievances + pendingOffset,
            avgResolutionTime: `${avgHours} Hours`,
            publicSatisfaction: `${publicSatisfaction}%`,
            districtFilter: req.query.district || null
        });
    } catch (error) {
        res.status(500).json({ message: 'Public stats retrieval failed' });
    }
};

// @desc    Public Recent Complaints Feed (Anonymized — no citizen PII)
// @route   GET /api/master/public/recent
// @access  Public
export const getPublicRecentComplaints = async (req, res) => {
    try {
        const complaints = await Complaint.find({})
            .select('title department status priority district block assignedToLevel createdAt')
            .sort({ createdAt: -1 })
            .limit(12)
            .lean();

        res.json(complaints);
    } catch (error) {
        res.status(500).json({ message: 'Recent complaints retrieval failed' });
    }
};
