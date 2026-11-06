const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const mongoose = require("mongoose");
const JobOpening = require("../models/JobOpening");
const Candidate = require("../models/Candidate");
const Interview = require("../models/Interview");

const router = express.Router();
const uploadDir = path.join(__dirname, "..", "uploads", "resumes");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, uploadDir),
  filename: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    callback(null, `${Date.now()}-${cryptoSafeToken()}${extension}`);
  }
});

function cryptoSafeToken() {
  return require("crypto").randomBytes(12).toString("hex");
}

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    const allowed = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!allowed.includes(file.mimetype)) return callback(new Error("Resume must be PDF, DOC, or DOCX."));
    callback(null, true);
  }
});

function validObjectId(value) {
  return mongoose.isValidObjectId(value);
}

function parseSkills(value) {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  return String(value || "").split(",").map((item) => item.trim()).filter(Boolean);
}

router.get("/jobs", async (_req, res, next) => {
  try {
    const jobs = await JobOpening.find().sort({ createdAt: -1 });
    res.json({ success: true, jobs });
  } catch (error) { next(error); }
});

router.post("/jobs", async (req, res, next) => {
  try {
    const salaryMin = req.body.salaryMin === undefined || req.body.salaryMin === "" ? undefined : Number(req.body.salaryMin);
    const salaryMax = req.body.salaryMax === undefined || req.body.salaryMax === "" ? undefined : Number(req.body.salaryMax);
    if (salaryMin !== undefined && salaryMax !== undefined && salaryMax < salaryMin) {
      return res.status(400).json({ success: false, message: "Maximum salary cannot be less than minimum salary." });
    }
    const job = await JobOpening.create({
      title: req.body.title,
      department: req.body.department,
      location: req.body.location,
      employmentType: req.body.employmentType,
      description: req.body.description,
      requiredSkills: parseSkills(req.body.requiredSkills),
      salaryMin,
      salaryMax,
      vacancies: Number(req.body.vacancies || 1),
      status: req.body.status || "Open"
    });
    res.status(201).json({ success: true, job });
  } catch (error) { next(error); }
});

router.put("/jobs/:id", async (req, res, next) => {
  try {
    if (!validObjectId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid job opening ID." });
    const updates = {
      ...req.body,
      requiredSkills: parseSkills(req.body.requiredSkills),
      vacancies: Number(req.body.vacancies || 1),
      salaryMin: req.body.salaryMin === undefined || req.body.salaryMin === "" ? undefined : Number(req.body.salaryMin),
      salaryMax: req.body.salaryMax === undefined || req.body.salaryMax === "" ? undefined : Number(req.body.salaryMax)
    };
    const job = await JobOpening.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!job) return res.status(404).json({ success: false, message: "Job opening not found." });
    res.json({ success: true, job });
  } catch (error) { next(error); }
});

router.delete("/jobs/:id", async (req, res, next) => {
  try {
    if (!validObjectId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid job opening ID." });
    const candidateCount = await Candidate.countDocuments({ appliedJob: req.params.id });
    if (candidateCount > 0) return res.status(409).json({ success: false, message: "Close the job instead. It has candidate applications." });
    const job = await JobOpening.findByIdAndDelete(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: "Job opening not found." });
    res.json({ success: true, message: "Job opening deleted." });
  } catch (error) { next(error); }
});

router.get("/candidates", async (_req, res, next) => {
  try {
    const candidates = await Candidate.find().populate("appliedJob", "title department status").sort({ createdAt: -1 });
    res.json({ success: true, candidates });
  } catch (error) { next(error); }
});

router.post("/candidates", upload.single("resume"), async (req, res, next) => {
  try {
    if (!req.body.name || !req.body.email || !req.body.phone || !validObjectId(req.body.appliedJob)) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, message: "Name, email, phone and applied job are required." });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(req.body.email)) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, message: "Enter a valid candidate email." });
    }
    const candidate = await Candidate.create({
      name: req.body.name,
      email: req.body.email.toLowerCase(),
      phone: req.body.phone,
      appliedJob: req.body.appliedJob,
      experience: Number(req.body.experience || 0),
      skills: parseSkills(req.body.skills),
      resume: req.file ? {
        fileName: req.file.originalname,
        storedName: req.file.filename,
        mimeType: req.file.mimetype,
        size: req.file.size,
        uploadedAt: new Date()
      } : undefined,
      stageHistory: [{ stage: "Applied", changedAt: new Date(), note: "Application created" }]
    });
    res.status(201).json({ success: true, candidate });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    if (error?.code === 11000) return res.status(409).json({ success: false, message: "This candidate has already applied for the selected job." });
    next(error);
  }
});

router.put("/candidates/:id", upload.single("resume"), async (req, res, next) => {
  try {
    if (!validObjectId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid candidate ID." });
    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(404).json({ success: false, message: "Candidate not found." });
    }
    if (req.body.name) candidate.name = req.body.name;
    if (req.body.email) candidate.email = req.body.email.toLowerCase();
    if (req.body.phone) candidate.phone = req.body.phone;
    if (req.body.appliedJob && validObjectId(req.body.appliedJob)) candidate.appliedJob = req.body.appliedJob;
    if (req.body.experience !== undefined) candidate.experience = Number(req.body.experience);
    if (req.body.skills !== undefined) candidate.skills = parseSkills(req.body.skills);
    if (req.file) {
      if (candidate.resume?.storedName) {
        const oldPath = path.join(uploadDir, candidate.resume.storedName);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      candidate.resume = { fileName: req.file.originalname, storedName: req.file.filename, mimeType: req.file.mimetype, size: req.file.size, uploadedAt: new Date() };
    }
    await candidate.save();
    res.json({ success: true, candidate });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    if (error?.code === 11000) return res.status(409).json({ success: false, message: "This candidate has already applied for the selected job." });
    next(error);
  }
});

router.patch("/candidates/:id/stage", async (req, res, next) => {
  try {
    const stages = ["Applied", "Screening", "Shortlisted", "Interview", "Selected", "Rejected"];
    if (!stages.includes(req.body.stage)) return res.status(400).json({ success: false, message: "Invalid recruitment stage." });
    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) return res.status(404).json({ success: false, message: "Candidate not found." });
    candidate.stage = req.body.stage;
    candidate.stageHistory.push({ stage: req.body.stage, changedAt: new Date(), note: req.body.note || "" });
    await candidate.save();
    res.json({ success: true, candidate });
  } catch (error) { next(error); }
});

router.delete("/candidates/:id", async (req, res, next) => {
  try {
    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) return res.status(404).json({ success: false, message: "Candidate not found." });
    if (candidate.resume?.storedName) {
      const resumePath = path.join(uploadDir, candidate.resume.storedName);
      if (fs.existsSync(resumePath)) fs.unlinkSync(resumePath);
    }
    await Interview.deleteMany({ candidate: candidate._id });
    await Candidate.findByIdAndDelete(candidate._id);
    res.json({ success: true, message: "Candidate deleted." });
  } catch (error) { next(error); }
});

router.get("/resumes/:candidateId", async (req, res, next) => {
  try {
    const candidate = await Candidate.findById(req.params.candidateId);
    if (!candidate?.resume?.storedName) return res.status(404).json({ success: false, message: "Resume not found." });
    const resumePath = path.resolve(uploadDir, candidate.resume.storedName);
    if (path.dirname(resumePath) !== uploadDir || !fs.existsSync(resumePath)) return res.status(404).json({ success: false, message: "Resume not found." });
    res.setHeader("Content-Type", candidate.resume.mimeType || "application/octet-stream");
    res.setHeader("Content-Disposition", `inline; filename="${candidate.resume.fileName.replace(/["\\]/g, "_")}"`);
    res.sendFile(resumePath);
  } catch (error) { next(error); }
});

router.get("/interviews", async (_req, res, next) => {
  try {
    const interviews = await Interview.find().populate({ path: "candidate", populate: { path: "appliedJob", select: "title" } }).sort({ date: 1, time: 1 });
    res.json({ success: true, interviews });
  } catch (error) { next(error); }
});

router.post("/interviews", async (req, res, next) => {
  try {
    if (!validObjectId(req.body.candidate)) return res.status(400).json({ success: false, message: "Select an existing candidate." });
    const interview = await Interview.create(req.body);
    res.status(201).json({ success: true, interview });
  } catch (error) { next(error); }
});

router.put("/interviews/:id", async (req, res, next) => {
  try {
    const interview = await Interview.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!interview) return res.status(404).json({ success: false, message: "Interview not found." });
    res.json({ success: true, interview });
  } catch (error) { next(error); }
});

router.patch("/interviews/:id/status", async (req, res, next) => {
  try {
    if (!["Scheduled", "Completed", "Cancelled"].includes(req.body.status)) return res.status(400).json({ success: false, message: "Invalid interview status." });
    const interview = await Interview.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true, runValidators: true });
    if (!interview) return res.status(404).json({ success: false, message: "Interview not found." });
    res.json({ success: true, interview });
  } catch (error) { next(error); }
});

router.get("/dashboard", async (_req, res, next) => {
  try {
    const [openJobs, candidates, scheduledInterviews, selectedCandidates] = await Promise.all([
      JobOpening.countDocuments({ status: "Open" }),
      Candidate.countDocuments(),
      Interview.countDocuments({ status: "Scheduled" }),
      Candidate.countDocuments({ stage: "Selected" })
    ]);
    res.json({ success: true, stats: { openJobs, candidates, scheduledInterviews, selectedCandidates } });
  } catch (error) { next(error); }
});

router.use((error, _req, res, _next) => {
  if (error instanceof multer.MulterError) return res.status(400).json({ success: false, message: error.code === "LIMIT_FILE_SIZE" ? "Resume must be 5 MB or smaller." : error.message });
  res.status(400).json({ success: false, message: error.message || "Recruitment request failed." });
});

module.exports = router;
