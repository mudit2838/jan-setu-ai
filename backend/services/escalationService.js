import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import Complaint from '../models/complaintModel.js';

const connection = new IORedis(process.env.REDIS_URL || {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379,
    maxRetriesPerRequest: null,
});

export const escalationQueue = new Queue('EscalationQueue', { connection });

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
        console.log(`[BullMQ] Running SLA Escalation Check at ${new Date().toISOString()}`);

        const now = new Date();

        const overdueComplaints = await Complaint.find({
            status: { $in: ['Pending', 'In Progress', 'Escalated - Pending Action'] },
            slaDueDate: { $lt: now },
            assignedToLevel: { $in: ['Local', 'District'] }
        }).limit(50); // Batch processing to prevent memory overflow

        if (overdueComplaints.length === 0) {
            console.log('[BullMQ] No SLA breaches found at this time.');
            return;
        }

        console.log(`[BullMQ] Processing batch of ${overdueComplaints.length} overdue complaints.`);

        for (let complaint of overdueComplaints) {
            const previousLevel = complaint.assignedToLevel;
            let nextLevel = previousLevel === 'Local' ? 'District' : 'State';

            // Strategic Priority Bumping: Escalate importance as it moves up levels
            let newPriority = complaint.priority;
            if (newPriority === 'Low') newPriority = 'Medium';
            else if (newPriority === 'Medium') newPriority = 'High';
            else if (newPriority === 'High') newPriority = 'Critical';

            // Atomic update to prevent multiple workers from escalating the same record
            const updated = await Complaint.findOneAndUpdate(
                { _id: complaint._id, assignedToLevel: previousLevel }, 
                {
                    $set: {
                        assignedToLevel: nextLevel,
                        status: 'Escalated - Pending Action',
                        priority: newPriority,
                        slaDueDate: calculateEscalationDeadline(newPriority)
                    },
                    $push: {
                        escalationHistory: {
                            fromLevel: previousLevel,
                            toLevel: nextLevel,
                            escalatedAt: new Date(),
                            reason: `SLA Breached at ${previousLevel} level.`
                        }
                    }
                },
                { new: true }
            );

            if (updated) {
                console.log(`[BullMQ] Successfully escalated Complaint ${complaint._id} to ${nextLevel}.`);
            }
        }

    } catch (error) {
        console.error('[BullMQ] Error running escalation checks:', error);
    }
};

// Worker definition
const worker = new Worker('EscalationQueue', async (job) => {
    if (job.name === 'escalate') {
        await escalateComplaints();
    }
}, { connection });

worker.on('failed', (job, err) => {
    console.error(`[BullMQ] Job ${job?.id} failed with error:`, err);
});

export const startEscalationCron = async () => {
    // Remove old repeatable jobs to avoid duplicates if redefining constraints
    const repeatableJobs = await escalationQueue.getRepeatableJobs();
    for (const job of repeatableJobs) {
        await escalationQueue.removeRepeatableByKey(job.key);
    }
    
    // Add repeatable job (every minute for dev purposes)
    await escalationQueue.add('escalate', {}, {
        repeat: {
            pattern: '* * * * *'
        }
    });

    console.log('[BullMQ] Escalation Matrix Worker initialized and repeatable job scheduled.');
};
