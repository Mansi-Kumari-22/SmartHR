const mongoose = require("mongoose");

const interviewSchema = new mongoose.Schema({
  candidate: { type: mongoose.Schema.Types.ObjectId, ref: "Candidate", required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  interviewer: { type: String, required: true, trim: true },
  interviewType: { type: String, required: true, enum: ["In Person", "Video", "Phone"] },
  notes: { type: String, trim: true },
  feedback: { type: String, trim: true },
  status: { type: String, enum: ["Scheduled", "Completed", "Cancelled"], default: "Scheduled" }
}, { timestamps: true });

module.exports = mongoose.model("Interview", interviewSchema);
