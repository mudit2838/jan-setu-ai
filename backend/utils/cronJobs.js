import cron from 'node-cron';
import Complaint from '../models/complaintModel.js';

// Helper to calculate the strict District SLA deadline after escalation
const calculateDistrictEscalationDeadline = (priority) => {
    const now = new Date();
    switch (priority) {
        case 'High':
        case 'Critical':
            return new Date(now.setDate(now.getDate() + 1)); // Strict +24 hours for District
        case 'Medium':
            return new Date(now.setDate(now.getDate() + 2)); // Strict +48 hours for District
        case 'Low':
            return new Date(now.setDate(now.getDate() + 3)); // Strict +72 hours for District
        default:
            return new Date(now.setDate(now.getDate() + 3));
    }
};

const escalateComplaints = async () => {
    try {
        console.log(`[CRON] Running SLA Escalation Check at ${new Date().toISOString()}`);

        const now = new Date();

        // Find all complaints that are not resolved, and whose SLA is overdue
        const overdueComplaints = await Complaint.find({
            status: { $in: ['Pending', 'In Progress', 'Escalated - Pending Action'] },
            slaDueDate: { $lt: now },
            assignedToLevel: { $in: ['Local', 'District'] } // State is final authority, no SLA escalation beyond it
        });

        if (overdueComplaints.length === 0) {
            console.log('[CRON] No SLA breaches found at this time.');
            return;
        }

        console.log(`[CRON] Found ${overdueComplaints.length} overdue complaints. Escalating...`);

        for (let complaint of overdueComplaints) {
            const previousLevel = complaint.assignedToLevel;
            let nextLevel = 'State';

            if (previousLevel === 'Local') {
                nextLevel = 'District';

                // Update Complaint for District SLA
                complaint.assignedToLevel = nextLevel;
                complaint.status = 'Escalated - Pending Action';
                complaint.slaDueDate = calculateDistrictEscalationDeadline(complaint.priority);

            } else if (previousLevel === 'District') {
                nextLevel = 'State';

                // State is Final Authority - No SLA deadline, Mandatory Resolution Flag
                complaint.assignedToLevel = nextLevel;
                complaint.status = 'State Re-Review Required';
                complaint.slaDueDate = null; // Halts the cron job for this ticket
            }

            // Log History
            complaint.escalationHistory.push({
                fromLevel: previousLevel,
                toLevel: nextLevel,
                escalatedAt: new Date(),
                reason: `SLA Breached at ${previousLevel} level.`
            });

            await complaint.save();
            console.log(`[CRON] Escalated Complaint ${complaint._id} from ${previousLevel} to ${nextLevel}.`);
        }

    } catch (error) {
        console.error('[CRON] Error running escalation checks:', error);
    }
};

// Schedule to run every hour at minute 0
export const initCronJobs = () => {
    cron.schedule('0 * * * *', escalateComplaints);
    console.log('[CRON] Escalation Matrix CRON initialized to run hourly.');
};
