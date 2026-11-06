const express = require("express");
const mongoose = require("mongoose");
const Employee = require("../models/Employee");
const PerformanceGoal = require("../models/PerformanceGoal");
const PerformanceReview = require("../models/PerformanceReview");
const EmployeeRecognition = require("../models/EmployeeRecognition");

const router = express.Router();
const categoryNames = ["Communication", "Teamwork", "Productivity", "Technical Skills", "Problem Solving"];

function validObjectId(value) {
  return mongoose.isValidObjectId(value);
}

router.get("/employees", async (_req, res, next) => {
  try {
    const employees = await Employee.find().select("_id employeeId fullName name email designation role department").sort({ fullName: 1, name: 1 });
    res.json({ success: true, employees });
  } catch (error) { next(error); }
});

router.get("/goals", async (req, res, next) => {
  try {
    const query = {};
    if (req.query.employeeId && validObjectId(req.query.employeeId)) query.employee = req.query.employeeId;
    if (req.query.status) query.status = req.query.status;
    const goals = await PerformanceGoal.find(query).populate("employee", "fullName name employeeId email department designation").sort({ createdAt: -1 });
    res.json({ success: true, goals });
  } catch (error) { next(error); }
});

router.post("/goals", async (req, res, next) => {
  try {
    if (!validObjectId(req.body.employee)) return res.status(400).json({ success: false, message: "Select an existing employee." });
    const goal = await PerformanceGoal.create({
      ...req.body,
      progress: Number(req.body.progress || 0)
    });
    res.status(201).json({ success: true, goal });
  } catch (error) { next(error); }
});

router.put("/goals/:id", async (req, res, next) => {
  try {
    const updates = { ...req.body };
    if (updates.progress !== undefined) updates.progress = Number(updates.progress);
    if (updates.status === "Completed" && updates.progress === undefined) updates.progress = 100;
    const goal = await PerformanceGoal.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!goal) return res.status(404).json({ success: false, message: "Goal not found." });
    res.json({ success: true, goal });
  } catch (error) { next(error); }
});

router.delete("/goals/:id", async (req, res, next) => {
  try {
    const goal = await PerformanceGoal.findByIdAndDelete(req.params.id);
    if (!goal) return res.status(404).json({ success: false, message: "Goal not found." });
    res.json({ success: true, message: "Goal deleted." });
  } catch (error) { next(error); }
});

router.get("/reviews", async (req, res, next) => {
  try {
    const query = {};
    if (req.query.employeeId && validObjectId(req.query.employeeId)) query.employee = req.query.employeeId;
    if (req.query.status) query.status = req.query.status;
    const reviews = await PerformanceReview.find(query)
      .populate("employee", "fullName name employeeId email department designation")
      .populate("reviewer", "fullName name employeeId email department designation")
      .sort({ createdAt: -1 });
    res.json({ success: true, reviews });
  } catch (error) { next(error); }
});

router.post("/reviews", async (req, res, next) => {
  try {
    if (!validObjectId(req.body.employee) || !validObjectId(req.body.reviewer)) {
      return res.status(400).json({ success: false, message: "Select an existing employee and reviewer." });
    }
    const categories = categoryNames.map((name) => {
      const supplied = Array.isArray(req.body.categories)
        ? req.body.categories.find((item) => item.name === name)
        : null;
      const rating = Number(supplied?.rating || 0);
      return { name, rating };
    });
    if (categories.some((item) => item.rating < 1 || item.rating > 5)) {
      return res.status(400).json({ success: false, message: "Every performance category must have a rating from 1 to 5." });
    }
    const duplicate = await PerformanceReview.findOne({
      employee: req.body.employee,
      cycleName: String(req.body.cycleName || "").trim(),
      reviewPeriodStart: req.body.reviewPeriodStart,
      reviewPeriodEnd: req.body.reviewPeriodEnd
    });
    if (duplicate) return res.status(409).json({ success: false, message: "A review already exists for this employee and review cycle." });
    const review = await PerformanceReview.create({
      employee: req.body.employee,
      reviewer: req.body.reviewer,
      reviewPeriodStart: req.body.reviewPeriodStart,
      reviewPeriodEnd: req.body.reviewPeriodEnd,
      cycleName: req.body.cycleName,
      categories,
      strengths: req.body.strengths || "",
      improvements: req.body.improvements || "",
      comments: req.body.comments || "",
      status: "Draft"
    });
    res.status(201).json({ success: true, review });
  } catch (error) { next(error); }
});

router.put("/reviews/:id", async (req, res, next) => {
  try {
    const updates = { ...req.body };
    delete updates.employee;
    delete updates.reviewer;
    if (Array.isArray(updates.categories)) {
      updates.categories = categoryNames.map((name) => {
        const supplied = updates.categories.find((item) => item.name === name);
        return { name, rating: Number(supplied?.rating || 0) };
      });
      if (updates.categories.some((item) => item.rating < 1 || item.rating > 5)) {
        return res.status(400).json({ success: false, message: "Every performance category must have a rating from 1 to 5." });
      }
    }
    const review = await PerformanceReview.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!review) return res.status(404).json({ success: false, message: "Performance review not found." });
    res.json({ success: true, review });
  } catch (error) { next(error); }
});

router.patch("/reviews/:id/submit", async (req, res, next) => {
  try {
    const review = await PerformanceReview.findById(req.params.id);
    if (!review) return res.status(404).json({ success: false, message: "Performance review not found." });
    if (review.status === "Submitted") return res.status(409).json({ success: false, message: "This review has already been submitted." });
    if (review.categories.some((item) => item.rating < 1 || item.rating > 5)) {
      return res.status(400).json({ success: false, message: "Complete all ratings before submission." });
    }
    review.status = "Submitted";
    review.submittedAt = new Date();
    await review.save();
    res.json({ success: true, review });
  } catch (error) { next(error); }
});

router.delete("/reviews/:id", async (req, res, next) => {
  try {
    const review = await PerformanceReview.findByIdAndDelete(req.params.id);
    if (!review) return res.status(404).json({ success: false, message: "Performance review not found." });
    res.json({ success: true, message: "Performance review deleted." });
  } catch (error) { next(error); }
});

router.get("/recognition", async (req, res, next) => {
  try {
    const query = {};
    if (req.query.employeeId && validObjectId(req.query.employeeId)) query.employee = req.query.employeeId;
    if (req.query.type && ["Feedback", "Recognition"].includes(req.query.type)) query.type = req.query.type;
    const records = await EmployeeRecognition.find(query)
      .populate("employee", "fullName name employeeId email department designation")
      .populate("reviewer", "fullName name employeeId email department designation")
      .sort({ feedbackDate: -1, createdAt: -1 });
    res.json({ success: true, records });
  } catch (error) { next(error); }
});

router.post("/recognition", async (req, res, next) => {
  try {
    if (!validObjectId(req.body.employee) || !validObjectId(req.body.reviewer)) {
      return res.status(400).json({ success: false, message: "Select an existing employee and reviewer." });
    }
    if (!["Feedback", "Recognition"].includes(req.body.type)) return res.status(400).json({ success: false, message: "Select Feedback or Recognition." });
    const record = await EmployeeRecognition.create(req.body);
    res.status(201).json({ success: true, record });
  } catch (error) { next(error); }
});

router.delete("/recognition/:id", async (req, res, next) => {
  try {
    const record = await EmployeeRecognition.findByIdAndDelete(req.params.id);
    if (!record) return res.status(404).json({ success: false, message: "Record not found." });
    res.json({ success: true, message: "Record deleted." });
  } catch (error) { next(error); }
});

router.get("/dashboard", async (_req, res, next) => {
  try {
    const [reviews, goals, employeeCount] = await Promise.all([
      PerformanceReview.find({ status: "Submitted" }).populate("employee", "fullName name employeeId department"),
      PerformanceGoal.find(),
      Employee.countDocuments()
    ]);
    const employeeIds = new Set(reviews.map((review) => String(review.employee?._id || ""))).size;
    let totalRatings = 0;
    let ratingCount = 0;
    reviews.forEach((review) => review.categories.forEach((category) => {
      totalRatings += category.rating;
      ratingCount += 1;
    }));
    const summaries = {};
    reviews.forEach((review) => {
      if (!review.employee) return;
      const key = String(review.employee._id);
      if (!summaries[key]) summaries[key] = { employee: review.employee, ratings: [], average: 0 };
      review.categories.forEach((category) => summaries[key].ratings.push(category.rating));
    });
    Object.values(summaries).forEach((summary) => {
      summary.average = summary.ratings.length ? Number((summary.ratings.reduce((sum, rating) => sum + rating, 0) / summary.ratings.length).toFixed(2)) : 0;
    });
    res.json({
      success: true,
      stats: {
        employeesWithReviews: employeeIds,
        employeeCount,
        averageRating: ratingCount ? Number((totalRatings / ratingCount).toFixed(2)) : 0,
        goalsCompleted: goals.filter((goal) => goal.status === "Completed").length,
        goalsInProgress: goals.filter((goal) => goal.status === "In Progress").length,
        employeeSummaries: Object.values(summaries)
      }
    });
  } catch (error) { next(error); }
});

module.exports = router;
