const mongoose = require("mongoose");

const attendanceRecordSchema = new mongoose.Schema({
    employee: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
    date: { type: String, required: true },
    checkIn: { type: String, trim: true, default: "" },
    checkOut: { type: String, trim: true, default: "" },
    status: { type: String, enum: ["Present", "Absent", "Late", "Remote"], required: true },
    workingHours: { type: Number, min: 0, default: 0 },
    notes: { type: String, trim: true, default: "" }
}, { timestamps: true });

attendanceRecordSchema.index({ employee: 1, date: 1 }, { unique: true });
module.exports = mongoose.model("AttendanceRecord", attendanceRecordSchema, "attendancerecords");
