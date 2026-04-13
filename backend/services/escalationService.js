import cron from 'node-cron';
import Complaint from '../models/complaintModel.js';

// Helper to calculate the next deadline after escalation
const calculateEscalationDeadline = (priority) => {
    const now = new Date();
    switch (priority) {
        case 'High':
        case 'Critical':
            return new Date(now.setDate(now.getDate() + 1)); // +24 hours for next level
        case 'Medium':
            return new Date(now.setDate(now.getDate() + 2)); // +48 hours for next level
        case 'Low':
            return new Date(now.setDate(now.getDate() + 3)); // +72 hours for next level
        default:
            return new Date(now.setDate(now.getDate() + 3));
    }
};

const escalateComplaints = async () => {
    try {
        console.log(`[CRON] Running SLA Escalation Check at ${new Date().toISOString()}`);

        const now = new Date();

        const overdueComplaints = await Complaint.find({
            status: { $in: ['Pending', 'In Progress', 'Escalated - Pending Action'] },
            slaDueDate: { $lt: now },
            assignedToLevel: { $in: ['Local', 'District'] }
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
            } else if (previousLevel === 'District') {
                nextLevel = 'State';
            }

            complaint.assignedToLevel = nextLevel;
            complaint.status = 'Escalated - Pending Action';
            complaint.slaDueDate = calculateEscalationDeadline(complaint.priority);

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

export const startEscalationCron = () => {
    // Run every minute during development to test, usually runs hourly (0 * * * *)
    cron.schedule('* * * * *', escalateComplaints);
    console.log('[CRON] Escalation Matrix CRON initialized.');
};
