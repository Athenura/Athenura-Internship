import mongoose from "mongoose";

const internSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    mobile: {
        type: String,
        required: true,
        unique: true
    },
    dob: {
        type: String,
        required: true,
    },
    gender: {
        type: String,
        required: true,
    },
    state: {
        type: String,
        required: true,
    },
    city: {
        type: String,
        required: true,
    },
    address: {
        type: String,
        required: true,
    },
    pinCode: {
        type: String,
        required: true,
    },
    college: {
        type: String,
        required: true,
    },
    course: {
        type: String,
        required: true,
    },
    educationLevel: {
        type: String,
        required: true,
    },
    domain: {
        type: String,
        required: true,
    },
    contactMethod: {
        type: String,
        required: true,
    },
    resumeUrl: {
        type: String,
        required: true,
    },
    duration: {
        type: String,
        required: true,
    },
    prevInternship: {
        type: String,
        required: true,
        enums: ['Yes', 'No'],
        default: 'No'
    },
    prevInternshipDesc: {
        type: String,
        default: ''
    },
    performance: {
        type: String,
        enums: ['Excellent', 'Good', 'Average', 'Poor'],
        default: 'Average'
    },
    status: {
        type: String,
        enums: ["Selected", "Rejected", "Applied", "Mailed"],
        default: 'Applied'
    },
    uniqueId: {
        type: String,
    },
    comment: {
        type: String
    },
    TpoName: {
        type: String
    },
    TpoEmail: {
        type: String
    },
    TpoNumber: {
        type: String
    },
    joiningDate: {
        type: String
    },
    updatedByHR: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // reference to the HR (User collection)
    },
    hrComments: [
        {
            stage: {
                type: String,
                enum: ['Resume Shortlisted', 'Interviewing', 'Telephonic', 'Emailing', 'Selected',],
                required: true
            },
            text: { type: String }, // optional notes
            commentedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // HR user
            date: { type: Date, default: Date.now }
        }
    ],
    updatedByIncharge: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "InternHead", // reference to the HR (User collection)
    },
    comments: [
        {
            text: {
                type: String,
                required: true,
            },
            commentedBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "InternHead", // or "HR" / "Admin" / "Intern" depending on your logic
            },
            date: {
                type: Date,
                default: Date.now,
            },
        },

    ],

    extendedDays: {
        type: Number,
        default: 0
    },

    totalMeetings: { type: Number, default: 0 },
    meetingsAttended: { type: Number, default: 0 },
    leavesTaken: { type: Number, default: 0 },

    certificateNumber: {
        type: String,
        unique: true,
        sparse: true
    },
    certificateIssuedAt: {
        type: Date,
    },
    certificateStatus: {
        type: String,
        enum: ["pending", "issued"],
        default: "pending"
    },


}, { timestamps: true });

const Intern = mongoose.model('Intern', internSchema);
export default Intern;






