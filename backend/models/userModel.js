import mongoose from "mongoose";

const userSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        mobile: {
            type: String,
            required: true,
            unique: true,
        },
        email: {
            type: String,
        },
        password: {
            type: String,
        },
        // Role can be 'citizen', 'official_block', 'official_district', 'official_state', 'official_super'
        role: {
            type: String,
            enum: ['citizen', 'official_block', 'official_district', 'official_state', 'official_super'],
            default: 'citizen',
        },
        // Address Hierarchy
        state: {
            type: String,
            default: 'Uttar Pradesh',
        },
        district: {
            type: String,
        },
        block: {
            type: String,
        },
        village: {
            type: String,
        },
        pincode: {
            type: String,
        },
        addressLine: {
            type: String,
        },
        department: {
            type: String, // Assigned if role is official_block/district/state
        },
        // Account Status
        isActive: {
            type: Boolean,
            default: false, // Must verify OTP to become active
        },
        failedLoginAttempts: {
            type: Number,
            default: 0,
        },
        isLocked: {
            type: Boolean,
            default: false,
        },
        lockUntil: {
            type: Date,
        }
    },
    {
        timestamps: true,
    }
);

const User = mongoose.model("User", userSchema);

export default User;
