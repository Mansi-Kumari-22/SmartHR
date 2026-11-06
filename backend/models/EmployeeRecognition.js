const mongoose = require("mongoose");

const employeeRecognitionSchema = new mongoose.Schema({
  type: { type: String, enum: ["Feedback", "Recognition"], required: true },
  employee: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
  reviewer: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
  feedbackDate: { type: String, required: true },
  comments: { type: String, required: true, trim: true },
  achievement: { type: String, trim: true }
}, { timestamps: true });

module.exports = mongoose.model("EmployeeRecognition", employeeRecognitionSchema);
