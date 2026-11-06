const mongoose = require("mongoose");

const stageHistorySchema = new mongoose.Schema({
  stage: { type: String, required: true },
  changedAt: { type: Date, default: Date.now },
  note: { type: String, trim: true }
}, { _id: false });

const candidateSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  phone: { type: String, required: true, trim: true },
  appliedJob: { type: mongoose.Schema.Types.ObjectId, ref: "JobOpening", required: true },
  experience: { type: Number, min: 0, default: 0 },
  skills: [{ type: String, trim: true }],
  resume: {
    fileName: String,
    storedName: String,
    mimeType: String,
    size: Number,
    uploadedAt: Date
  },
  stage: { type: String, enum: ["Applied", "Screening", "Shortlisted", "Interview", "Selected", "Rejected"], default: "Applied" },
  stageHistory: [stageHistorySchema]
}, { timestamps: true });

candidateSchema.index({ email: 1, appliedJob: 1 }, { unique: true });

module.exports = mongoose.model("Candidate", candidateSchema);
