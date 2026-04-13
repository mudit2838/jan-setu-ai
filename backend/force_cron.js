import mongoose from 'mongoose';
import Complaint from './models/complaintModel.js';

const forceEscalation = async () => {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/jansetu', { useNewUrlParser: true, useUnifiedTopology: true });
        
        // Find existing ticket
        const ticket = await Complaint.findOne({ title: 'Excessive garbage pileup near school' });
        
        if (!ticket) {
            console.log('Test ticket not found. Skipping Cron test.');
            return process.exit(0);
        }

        console.log(`Initial Level: ${ticket.assignedToLevel}`);
        
        // Fake the SLA expiration to force cron pickup
        ticket.slaDueDate = new Date(Date.now() - 1000 * 60 * 60 * 24); // 1 day in the past
        await ticket.save();

        console.log('Forced SLA Expiration. Running CRON Logic...');
        
        // Execute the exact cron block logic manually
        const previousLevel = ticket.assignedToLevel;
        let nextLevel = 'State';

        if (previousLevel === 'Local') {
            nextLevel = 'District';
            // Mock District SLA
            ticket.assignedToLevel = nextLevel;
            ticket.status = 'Escalated - Pending Action';
            ticket.slaDueDate = new Date(Date.now() + 1000 * 60 * 60 * 24); // +24h
        } else if (previousLevel === 'District') {
            nextLevel = 'State';
            ticket.assignedToLevel = nextLevel;
            ticket.status = 'State Re-Review Required';
            ticket.slaDueDate = null; 
        }

        ticket.escalationHistory.push({ fromLevel: previousLevel, toLevel: nextLevel, escalatedAt: new Date(), reason: 'SLA Breach' });
        await ticket.save();

        console.log(`New Level: ${ticket.assignedToLevel}`);
        console.log(`New Status: ${ticket.status}`);
        console.log(`New Deadline: ${ticket.slaDueDate}`);

        process.exit(0);

    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

forceEscalation();
