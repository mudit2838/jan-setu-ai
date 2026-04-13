import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from './models/userModel.js';
import Admin from './models/adminModel.js';
import Complaint from './models/complaintModel.js';

dotenv.config();

const seedDB = async () => {
    try {
        console.log('Connecting to Production MongoDB Atlas...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to Atlas!');

        // 1. CLEAR EXISTING DATA (If any happens to be there)
        await User.deleteMany();
        await Admin.deleteMany();
        await Complaint.deleteMany();
        console.log('🗑️ Cleared existing records.');

        // 2. CREATE GOVERNING OFFICIALS & ADMIN
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('mudit123', salt);

        const adminUser = await Admin.create({
            name: 'Mudit Kumar',
            mobile: '9999999999',
            email: 'admin@up.gov.in',
            password: hashedPassword,
            role: 'admin',
            district: 'State Secretariat',
            block: 'Gov Core'
        });

        const localOfficial = await User.create({
            name: 'Local Officer Sharma',
            mobile: '8888888888',
            email: 'local@up.gov.in',
            password: hashedPassword,
            role: 'official_block',
            district: 'Lucknow',
            block: 'Sadar',
            isActive: true
        });

        const districtOfficial = await User.create({
            name: 'DM Gupta (Lucknow)',
            mobile: '7777777777',
            email: 'dm@up.gov.in',
            password: hashedPassword,
            role: 'official_district',
            district: 'Lucknow',
            block: 'Lucknow Headquarter',
            isActive: true
        });

        const stateOfficial = await User.create({
            name: 'State Minister Verma',
            mobile: '6666666666',
            email: 'state@up.gov.in',
            password: hashedPassword,
            role: 'official_state',
            district: 'Uttar Pradesh',
            block: 'Secretariat',
            isActive: true
        });

        // 3. CREATE CITIZENS
        const citizens = [];
        for (let i = 0; i < 5; i++) {
            citizens.push(await User.create({
                name: `Citizen ${i + 1}`,
                mobile: `900000000${i}`,
                password: hashedPassword,
                role: 'citizen',
                district: 'Lucknow',
                block: 'Sadar'
            }));
        }

        console.log('👤 Created 4 Officials and 5 Citizens.');

        // 4. GENERATE 50 REALISTIC COMPLAINTS
        const departments = [
            'Public Works Department (PWD)', 'Jal Shakti (Water Res)', 'Health & Family Welfare',
            'Energy (UPPCL)', 'Panchayati Raj', 'Transport / Traffic', 'Environment & Forest',
            'Education', 'Women & Child Dev', 'Police / Home'
        ];

        const titles = [
            'Massive Pothole on Main Road causing accidents', 'Sewer pipe burst leaking contaminated water',
            'Streetlights not working for exactly 3 blocks', 'Garbage dump overflowing near public school',
            'Transformer caught fire and no electricity for 2 days', 'Hospital denying emergency bed to patient',
            'Illegal encroachment blocking primary highway', 'Bribe requested by local station contractor',
            'Stray cattle causing major hazard on expressway', 'Contaminated drinking water supply in village'
        ];

        const complaints = [];
        const now = new Date();

        for (let i = 0; i < 40; i++) {
            const citizen = citizens[Math.floor(Math.random() * citizens.length)];
            const statusType = Math.random();
            let status = 'Pending';
            let assignedToLevel = 'Local';
            let priority = 'Low';
            let slaDueDate = new Date();

            // Randomize Status
            if (statusType < 0.4) {
                status = 'Resolved';
            } else if (statusType < 0.6) {
                status = 'In Progress';
            } else if (statusType < 0.8) {
                status = 'Escalated - Pending Action';
                assignedToLevel = 'District';
            } else {
                status = 'Pending';
            }

            // Assign Priority dynamically
            const pRan = Math.random();
            if (pRan > 0.8) priority = 'Critical';
            else if (pRan > 0.5) priority = 'High';
            else if (pRan > 0.2) priority = 'Medium';

            // Randomize past dates
            const daysAgo = Math.floor(Math.random() * 30);
            const createdDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));

            slaDueDate = new Date(createdDate.getTime() + (7 * 24 * 60 * 60 * 1000)); // Local SLA

            complaints.push({
                citizen: citizen._id,
                title: titles[Math.floor(Math.random() * titles.length)] + ` - Zone ${i}`,
                description: `This is a highly detailed generated description for a civic issue submitted by ${citizen.name} regarding immediate intervention required. The problem has persisted for ${daysAgo} days and is causing significant distress to the local community in the assigned ward. Immediate action is requested to resolve the highlighted infrastructure failure.`,
                district: 'Lucknow',
                block: 'Sadar',
                village: 'Sector ' + Math.floor(Math.random() * 20),
                category: 'Infrastructure',
                department: departments[Math.floor(Math.random() * departments.length)],
                priority: priority,
                status: status,
                assignedToLevel: assignedToLevel,
                createdAt: createdDate,
                slaDueDate: slaDueDate
            });
        }

        await Complaint.insertMany(complaints);
        console.log(`📈 Successfully generated 40 highly realistic Complaints for the Dashboard.`);

        console.log('\n=============================================');
        console.log('🎉 SEEDING COMPLETE! YOUR PRODUCTION DB IS READY!');
        console.log('Login inside your app with:');
        console.log('Mobile: 9999999999 (Admin) | Pass: mudit123');
        console.log('Mobile: 8888888888 (Local Officer) | Pass: mudit123');
        console.log('=============================================\n');

        process.exit();
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
};

seedDB();
