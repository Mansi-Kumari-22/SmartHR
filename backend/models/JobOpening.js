const mongoose = require("mongoose");

const jobOpeningSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  department: { type: String, required: true, trim: true },
  location: { type: String, required: true, trim: true },
  employmentType: { type: String, required: true, enum: ["Full Time", "Part Time", "Contract", "Internship"] },
  description: { type: String, required: true, trim: true },
  requiredSkills: [{ type: String, trim: true }],
  salaryMin: { type: Number, min: 0 },
  salaryMax: { type: Number, min: 0 },
  vacancies: { type: Number, required: true, min: 1, default: 1 },
  status: { type: String, enum: ["Open", "On Hold", "Closed"], default: "Open" }
}, { timestamps: true });

module.exports = mongoose.model("JobOpening", jobOpeningSchema);
