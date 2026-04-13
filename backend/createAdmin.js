import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import Admin from './models/adminModel.js';

dotenv.config();

const createAdmin = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB!');

        const name = 'Admin User';
        const mobile = '9999999999';
        const email = 'admin@up.gov.in';
        const rawPassword = 'mudit123';

        // Check if admin already exists
        const adminExists = await Admin.findOne({ 
            $or: [{ mobile }, { email }] 
        });

        if (adminExists) {
            console.log('⚠️ Admin with this mobile or email already exists.');
            process.exit();
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(rawPassword, salt);

        const newAdmin = await Admin.create({
            name,
            mobile,
            email,
            password: hashedPassword,
            role: 'admin',
            state: 'Uttar Pradesh',
            district: 'State Secretariat',
            department: 'General Administration'
        });

        console.log('🚀 Admin created successfully!');
        console.log('---------------------------');
        console.log(`Name:  ${newAdmin.name}`);
        console.log(`Email: ${newAdmin.email} (Required for Official Login)`);
        console.log(`Mobile: ${newAdmin.mobile} (10-digits verified)`);
        console.log(`Role:  ${newAdmin.role}`);
        console.log('---------------------------');

        process.exit();
    } catch (error) {
        console.error('❌ Failed to create admin:', error.message);
        process.exit(1);
    }
};

createAdmin();
