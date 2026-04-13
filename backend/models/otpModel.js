import mongoose from "mongoose";

const otpSchema = mongoose.Schema(
    {
        mobile: {
            type: String,
        },
        email: {
            type: String,
        },
        otp: {
            type: String,
            required: true,
        },
        purpose: {
            type: String,
            enum: ['Registration', 'CitizenLogin', 'AdminLogin', 'PasswordReset'],
            required: true,
        },
        expiresAt: {
            type: Date,
            required: true,
        },
        attempts: {
            type: Number,
            default: 0
        }
    },
    {
        timestamps: true,
    }
);

// TTL Index to automatically delete expired OTPs from the database
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Otp = mongoose.model("Otp", otpSchema);

export default Otp;
