const mongoose = require("mongoose");

const reviewCategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 }
}, { _id: false });

const performanceReviewSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
  reviewer: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
  reviewPeriodStart: { type: String, required: true },
  reviewPeriodEnd: { type: String, required: true },
  cycleName: { type: String, required: true, trim: true },
  categories: { type: [reviewCategorySchema], validate: [(value) => value.length > 0, "At least one rating category is required"] },
  strengths: { type: String, trim: true },
  improvements: { type: String, trim: true },
  comments: { type: String, trim: true },
  status: { type: String, enum: ["Draft", "Submitted"], default: "Draft" },
  submittedAt: Date
}, { timestamps: true });

performanceReviewSchema.virtual("averageRating").get(function () {
  if (!this.categories?.length) return 0;
  return Number((this.categories.reduce((sum, item) => sum + item.rating, 0) / this.categories.length).toFixed(2));
});
performanceReviewSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("PerformanceReview", performanceReviewSchema);
