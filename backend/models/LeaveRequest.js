const mongoose = require("mongoose");

const leaveRequestSchema = new mongoose.Schema({
    employee: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
    leaveType: { type: String, enum: ["Casual Leave", "Sick Leave", "Earned Leave", "Unpaid Leave"], required: true },
    startDate: { type: String, required: true },
    endDate: { type: String, required: true },
    durationDays: { type: Number, required: true, min: 1 },
    reason: { type: String, required: true, trim: true },
    status: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending" },
    reviewedAt: { type: Date, default: null },
    reviewNote: { type: String, trim: true, default: "" }
}, { timestamps: true });

leaveRequestSchema.index({ employee: 1, startDate: 1, endDate: 1 });
module.exports = mongoose.model("LeaveRequest", leaveRequestSchema, "leaverequests");
