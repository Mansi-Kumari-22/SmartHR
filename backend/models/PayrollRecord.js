const mongoose = require("mongoose");

const payrollRecordSchema = new mongoose.Schema({
    employee: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
    payPeriod: { type: String, required: true },
    basicSalary: { type: Number, required: true, min: 0 },
    allowances: { type: Number, required: true, min: 0 },
    deductions: { type: Number, required: true, min: 0 },
    grossSalary: { type: Number, required: true, min: 0 },
    netSalary: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ["Draft", "Processed", "Paid"], default: "Draft" }
}, { timestamps: true });

payrollRecordSchema.index({ employee: 1, payPeriod: 1 }, { unique: true });
module.exports = mongoose.model("PayrollRecord", payrollRecordSchema, "payrollrecords");
