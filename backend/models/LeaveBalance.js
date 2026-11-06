const mongoose = require("mongoose");

const leaveBalanceSchema = new mongoose.Schema({
    employee: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
    leaveType: { type: String, enum: ["Casual Leave", "Sick Leave", "Earned Leave", "Unpaid Leave"], required: true },
    availableDays: { type: Number, required: true, min: 0, default: 0 },
    year: { type: Number, required: true }
}, { timestamps: true });

leaveBalanceSchema.index({ employee: 1, leaveType: 1, year: 1 }, { unique: true });
module.exports = mongoose.model("LeaveBalance", leaveBalanceSchema, "leavebalances");
