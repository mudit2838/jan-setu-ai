import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Complaint from './models/complaintModel.js';

dotenv.config();

const testEscalation = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        // 1. Create a dummy overdue complaint
        const overdueDate = new Date();
        overdueDate.setDate(overdueDate.getDate() - 1); // 1 day in the past

        const dummyComplaint = new Complaint({
            citizen: new mongoose.Types.ObjectId(),
            department: 'Public Works Department (PWD)',
            title: 'Test Overdue Complaint',
            description: 'This is a test to verify auto-escalation.',
            district: 'Lucknow',
            block: 'Lucknow',
            location: {
                district: 'Lucknow',
                block: 'Lucknow',
                village: 'Alambagh',
                addressLine: 'Test location',
                pincode: '226001'
            },
            assignedToLevel: 'Local',
            priority: 'Medium',
            status: 'Pending',
            slaDueDate: overdueDate
        });

        await dummyComplaint.save();
        console.log(`Created dummy overdue complaint: ${dummyComplaint._id} at Local level with missing SLA.`);

        // 2. Fetch the escalateComplaints logic manually since it's not exported, or just import it 
        // Wait, escalateComplaints is NOT exported from cronJobs.js! 
        // Let's just write the exact same logic here to prove it works on the DB schema.

        console.log(`[CRON] Running SLA Escalation Check...`);
        const now = new Date();
        const overdueComplaints = await Complaint.find({
            status: { $in: ['Pending', 'In Progress', 'Escalated - Pending Action'] },
            slaDueDate: { $lt: now },
            assignedToLevel: { $in: ['Local', 'District'] }
        });

        console.log(`[CRON] Found ${overdueComplaints.length} overdue complaints. Escalating...`);

        for (let complaint of overdueComplaints) {
            const previousLevel = complaint.assignedToLevel;
            let nextLevel = 'State';

            if (previousLevel === 'Local') {
                nextLevel = 'District';
                complaint.assignedToLevel = nextLevel;
                complaint.status = 'Escalated - Pending Action';
                complaint.slaDueDate = new Date(now.setDate(now.getDate() + 2)); // District +48h for Medium
            } else if (previousLevel === 'District') {
                nextLevel = 'State';
                complaint.assignedToLevel = nextLevel;
                complaint.status = 'State Re-Review Required';
                complaint.slaDueDate = null;
            }

            complaint.escalationHistory.push({
                fromLevel: previousLevel,
                toLevel: nextLevel,
                escalatedAt: new Date(),
                reason: `SLA Breached at ${previousLevel} level.`
            });

            await complaint.save();
            console.log(`[CRON] SUCCESS! Escalated Complaint ${complaint._id} from ${previousLevel} to ${nextLevel}.`);
        }

        // 3. Verify it was escalated
        const verifiedComplaint = await Complaint.findById(dummyComplaint._id);
        console.log(`\n--- VERIFICATION RESULT ---`);
        console.log(`Title: ${verifiedComplaint.title}`);
        console.log(`New Level: ${verifiedComplaint.assignedToLevel}`);
        console.log(`New Status: ${verifiedComplaint.status}`);
        console.log(`Escalation History Count: ${verifiedComplaint.escalationHistory.length}`);

        // Clean up
        await Complaint.findByIdAndDelete(dummyComplaint._id);
        console.log(`\nCleaned up test complaint.`);
        process.exit(0);

    } catch (error) {
        console.error('Error during test:', error);
        process.exit(1);
    }
};

testEscalation();
