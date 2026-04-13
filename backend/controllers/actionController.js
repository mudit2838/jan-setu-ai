import Complaint from '../models/complaintModel.js';
import Feedback from '../models/feedbackModel.js';
import { sendNotification } from '../services/notificationService.js';
import User from '../models/userModel.js'; // Needed to fetch citizen data for notifications if populate is not available

// @desc    Update Complaint Status (Officer)
// @route   PUT /api/complaints/:id/status
// @access  Private (Officer)
export const updateComplaintStatus = async (req, res) => {
    const { status, remarks, proofImage, newDepartment } = req.body;

    try {
        const complaint = await Complaint.findById(req.params.id);

        if (!complaint) {
            return res.status(404).json({ message: 'Complaint not found' });
        }

        // --- NEW: HUMAN-AI RE-ROUTING LOGIC ---
        if (newDepartment && newDepartment !== complaint.department) {
            console.log(`[MANUAL RE-ROUTE] Moving ticket from ${complaint.department} to ${newDepartment}`);
            complaint.department = newDepartment;
            complaint.category = newDepartment; // Sync category
            // Log this as a manual correction event
            complaint.officerRemarks = `[Auto-Log] Ticket manually re-routed to ${newDepartment}. Previous detection: ${complaint.department}`;
        }

        // Logic check: Only allow specific transitions (e.g., Pending -> In Progress -> Resolved)
        // If marking resolved, strictly require proof!
        if (status === 'Resolved' && !proofImage && !complaint.proofImage) {
            return res.status(400).json({ message: 'Proof of work (image/document URL) is mandatory to mark a complaint as Resolved.' });
        }

        if (status) complaint.status = status;
        if (remarks) complaint.officerRemarks = remarks;
        if (proofImage) complaint.proofImage = proofImage;

        // If accepting for the first time
        if (status === 'In Progress' && !complaint.assignedOfficer) {
            complaint.assignedOfficer = req.user._id;
        }

        const updatedComplaint = await complaint.save();

        res.json({
            message: `Complaint marked as ${status}`,
            complaint: updatedComplaint
        });

        // Async Notification for Citizen
        const citizen = await User.findById(complaint.citizen);
        if (citizen) {
            const message = `Bharat JanSetu Status Change: Complaint #${complaint._id.toString().slice(-6).toUpperCase()} is now ${status}. ${remarks ? 'Officer Remarks: ' + remarks : ''}`;
            sendNotification(citizen.mobile, citizen.email, message);
        }

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Submit Citizen Feedback for a Resolved Complaint
// @route   POST /api/complaints/:id/feedback
// @access  Private (Citizen)
export const submitFeedback = async (req, res) => {
    const { satisfactionLevel, comments, citizenProofImage } = req.body;

    try {
        const complaint = await Complaint.findById(req.params.id);

        if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

        if (complaint.citizen.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to submit feedback for this complaint' });
        }

        if (complaint.status !== 'Resolved' && complaint.status !== 'State Re-Review Required') {
            return res.status(400).json({ message: 'Feedback can only be submitted for Resolved complaints.' });
        }

        // Save the feedback record
        await Feedback.create({
            complaint: complaint._id,
            citizen: req.user._id,
            satisfactionLevel,
            comments,
            citizenProofImage
        });

        // Save the ATR to the Complaint Record directly to simplify frontend reads
        complaint.citizenATR = {
            satisfied: satisfactionLevel === 'Satisfied',
            comments: comments,
            reviewedAt: new Date()
        };

        // Feedback Logic Routing
        if (satisfactionLevel === 'Satisfied') {
            complaint.status = 'Closed Permanently';
        }
        else if (satisfactionLevel === 'Partially Satisfied') {
            complaint.status = 'Reopened - Citizen Feedback';
            // Timer restarts (short deadline - 48 hours)
            const now = new Date();
            complaint.slaDueDate = new Date(now.setDate(now.getDate() + 2));
        }
        else if (satisfactionLevel === 'Not Satisfied') {
            if (complaint.assignedToLevel === 'Local') {
                complaint.assignedToLevel = 'District';
                complaint.status = 'Escalated - Pending Action';
                complaint.assignedOfficer = null; // Unassign from local officer
                const now = new Date();
                complaint.slaDueDate = new Date(now.setDate(now.getDate() + 3)); // 3 day for dist
                complaint.escalationHistory.push({ fromLevel: 'Local', toLevel: 'District', escalatedAt: new Date(), reason: 'Citizen refused resolution (ATR)' });
            } else if (complaint.assignedToLevel === 'District') {
                complaint.assignedToLevel = 'State';
                complaint.status = 'Escalated - Pending Action';
                complaint.assignedOfficer = null;
                const now = new Date();
                complaint.slaDueDate = new Date(now.setDate(now.getDate() + 5));
                complaint.escalationHistory.push({ fromLevel: 'District', toLevel: 'State', escalatedAt: new Date(), reason: 'Citizen refused resolution (ATR)' });
            } else if (complaint.assignedToLevel === 'State') {
                complaint.status = 'State Re-Review Required';
                complaint.escalationHistory.push({ fromLevel: 'State', toLevel: 'State', escalatedAt: new Date(), reason: 'Citizen refused Top-Level resolution (ATR)' });
            }
        }

        await complaint.save();

        res.status(201).json({
            message: 'Feedback submitted and workflow updated successfully',
            newStatus: complaint.status,
            currentLevel: complaint.assignedToLevel
        });

        // Notification for Escalation if it happened
        if (complaint.status === 'Escalated - Pending Action') {
            const message = `Bharat JanSetu ESCALATION: Your complaint #${complaint._id.toString().slice(-6).toUpperCase()} has been auto-escalated to ${complaint.assignedToLevel} level for review.`;
            sendNotification(req.user.mobile, req.user.email, message);
        }

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
