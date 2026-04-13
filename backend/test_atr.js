import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Complaint from './models/complaintModel.js';
import User from './models/userModel.js';
import { submitFeedback } from './controllers/actionController.js';

dotenv.config();

const testATR = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('\n=======================================');
        console.log('🚀 INITIATING ATR ESCALATION SIMULATOR');
        console.log('=======================================\n');

        // 1. Create a mock Citizen and Official
        const citizen = new User({
            name: 'Test Citizen ATR',
            mobile: `999${Math.floor(Math.random() * 10000000)}`,
            password: 'password',
            role: 'citizen',
            district: 'Lucknow',
            block: 'Lucknow'
        });
        await citizen.save();

        const localOfficial = new User({
            name: 'Test Local Official ATR',
            mobile: `999${Math.floor(Math.random() * 10000000)}`,
            password: 'password',
            role: 'official_block', // Note: backend auth uses official_block historically
            district: 'Lucknow',
            block: 'Lucknow'
        });
        await localOfficial.save();

        // 2. Create a "Resolved" complaint assigned to the Local Official
        const complaint = new Complaint({
            citizen: citizen._id,
            title: 'Mock Broken Pipe',
            description: 'Testing ATR Loop',
            district: 'Lucknow',
            block: 'Lucknow',
            assignedToLevel: 'Local',
            assignedOfficer: localOfficial._id,
            status: 'Resolved',
            officerRemarks: 'I have patched the pipe with tape.',
            priority: 'Medium'
        });
        await complaint.save();

        console.log(`[1] Created Complaint: ${complaint._id}`);
        console.log(`    Status: ${complaint.status}`);
        console.log(`    Level:  ${complaint.assignedToLevel}`);
        console.log(`    Remarks: "${complaint.officerRemarks}"\n`);

        // 3. Simulate Citizen Submitting "Not Satisfied" Feedback
        console.log(`[2] Citizen logs in and clicks "Reject & Re-open"...`);

        // Mocking the Express req/res objects
        const req = {
            params: { id: complaint._id.toString() },
            user: { _id: citizen._id },
            body: {
                satisfactionLevel: 'Not Satisfied',
                comments: 'This is unacceptable. Tape does not fix a water main. Reopen this!'
            }
        };

        const res = {
            status: function (code) {
                this.statusCode = code;
                return this;
            },
            json: function (data) {
                console.log(`[3] Server Response (${this.statusCode}):`, data.message);
            }
        };

        // Trigger the controller logic directly
        await submitFeedback(req, res);

        // 4. Verify Final Database State
        const updatedComplaint = await Complaint.findById(complaint._id);

        console.log('\n=======================================');
        console.log('📊 ESCALATION RESULTS VALIDATION ');
        console.log('=======================================');
        console.log(`Title:           ${updatedComplaint.title}`);
        console.log(`New Level:       ${updatedComplaint.assignedToLevel}  <-- EXPECTED: District`);
        console.log(`New Status:      ${updatedComplaint.status}  <-- EXPECTED: Escalated - Pending Action`);
        console.log(`Assigned To:     ${updatedComplaint.assignedOfficer ? 'Someone' : 'None (Unassigned for new District Officer)'}`);
        console.log(`ATR Comments:    "${updatedComplaint.citizenATR.comments}"`);
        console.log(`Escalation Logs: ${updatedComplaint.escalationHistory.length}`);
        if (updatedComplaint.escalationHistory.length > 0) {
            console.log(`Last Esc Reason: "${updatedComplaint.escalationHistory[0].reason}"`);
        }
        console.log('=======================================\n');

        // Cleanup
        await Complaint.findByIdAndDelete(complaint._id);
        await User.findByIdAndDelete(citizen._id);
        await User.findByIdAndDelete(localOfficial._id);
        console.log('Cleaned up testing data. Exiting.');
        process.exit(0);

    } catch (error) {
        console.error('Error during test:', error);
        process.exit(1);
    }
};

testATR();
