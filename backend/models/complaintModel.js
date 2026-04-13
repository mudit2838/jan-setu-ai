import mongoose from "mongoose";

const complaintSchema = mongoose.Schema(
    {
        citizen: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "User",
        },
        title: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        // Structured Location for explicit routing
        state: { type: String, default: 'Uttar Pradesh' },
        district: { type: String, required: true },
        block: { type: String, required: true },
        village: { type: String },

        // Optional Geo Tagging
        latitude: { type: String },
        longitude: { type: String },
        isGeoVerified: { type: Boolean, default: false }, // UP Bound Verification

        // Optional Media
        issueImage: { type: String },

        // Automatic AI Categorization mapping
        category: {
            type: String,
            default: 'Uncategorized'
        },
        department: {
            type: String,
        },
        priority: {
            type: String,
            enum: ['Low', 'Medium', 'High', 'Critical'],
            default: 'Low',
        },

        // Workflow / Resolution tracking
        assignedToLevel: {
            type: String,
            enum: ['Local', 'District', 'State'],
            default: 'Local', // Always routes lowest level first
        },
        assignedOfficer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        status: {
            type: String,
            enum: ['Pending', 'In Progress', 'Escalated - Pending Action', 'Resolved', 'Reopened - Citizen Feedback', 'State Re-Review Required', 'Closed Permanently'],
            default: 'Pending',
        },
        slaDueDate: {
            type: Date,
        },
        escalationHistory: [
            {
                fromLevel: String,
                toLevel: String,
                escalatedAt: Date,
                reason: String
            }
        ],

        // Officer action logs
        officerRemarks: { type: String },
        proofImage: { type: String },

        // Citizen Action Taken Report (ATR)
        citizenATR: {
            satisfied: { type: Boolean },
            comments: { type: String },
            reviewedAt: { type: Date }
        },

        // Tracking
        ipAddress: { type: String },
    },
    {
        timestamps: true,
    }
);

// --- Strategic Performance Indexes ---
// Citizen: Fetch personal complaints (Sorted by date)
complaintSchema.index({ citizen: 1, createdAt: -1 });

// Official: Scoped fetches (Block -> District -> State)
complaintSchema.index({ department: 1, district: 1, block: 1, createdAt: -1 });
complaintSchema.index({ department: 1, district: 1, createdAt: -1 });

// Analytics: Status, Priority, Category aggregations
complaintSchema.index({ status: 1, department: 1, district: 1 });
complaintSchema.index({ priority: 1, department: 1, district: 1 });
complaintSchema.index({ category: 1, department: 1, district: 1 });

// Escalation Worker: Find overdue Pending tickets
complaintSchema.index({ slaDueDate: 1, status: 1 });

const Complaint = mongoose.model("Complaint", complaintSchema);

export default Complaint;
