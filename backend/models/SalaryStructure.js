const mongoose = require("mongoose");

const salaryStructureSchema = new mongoose.Schema({
    employee: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true, unique: true },
    basicSalary: { type: Number, required: true, min: 0 },
    allowances: { type: Number, min: 0, default: 0 },
    deductions: { type: Number, min: 0, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model("SalaryStructure", salaryStructureSchema, "salarystructures");
