import mongoose from "mongoose";

const feedbackSchema = mongoose.Schema(
    {
        complaint: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "Complaint",
        },
        citizen: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "User",
        },
        satisfactionLevel: {
            type: String, // e.g., 'Satisfied', 'Partially Satisfied', 'Not Satisfied'
            required: true,
        },
        comments: {
            type: String,
        },
        citizenProofImage: { // In case situation is not actually resolved
            type: String,
        }
    },
    {
        timestamps: true,
    }
);

const Feedback = mongoose.model("Feedback", feedbackSchema);

export default Feedback;
