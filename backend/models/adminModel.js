import mongoose from "mongoose";

const adminSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        mobile: {
            type: String,
            required: true,
            unique: true,
            validate: {
                validator: function(v) {
                    return v.length === 10 && /^\d+$/.test(v);
                },
                message: props => `${props.value} is not a valid 10-digit mobile number!`
            }
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        password: {
            type: String,
            required: true,
        },
        role: {
            type: String,
            enum: ['admin'],
            default: 'admin',
        },
        // Role Location Scope (if needed conceptually, usually "state")
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
        department: {
            type: String,
            default: 'General Administration'
        },
        // Account Status
        isActive: {
            type: Boolean,
            default: true, // Admins don't need OTP verification to activate inherently since created by script
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

const Admin = mongoose.model("Admin", adminSchema);

export default Admin;
