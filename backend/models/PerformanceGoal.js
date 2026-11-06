const mongoose = require("mongoose");

const performanceGoalSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  employee: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
  startDate: { type: String, required: true },
  dueDate: { type: String, required: true },
  priority: { type: String, enum: ["Low", "Medium", "High"], default: "Medium" },
  status: { type: String, enum: ["Not Started", "In Progress", "Completed"], default: "Not Started" },
  progress: { type: Number, min: 0, max: 100, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model("PerformanceGoal", performanceGoalSchema);
