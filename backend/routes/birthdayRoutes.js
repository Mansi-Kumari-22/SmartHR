const express = require("express");
const Employee = require("../models/Employee");
const BirthdayEmailLog = require("../models/BirthdayEmailLog");
const BirthdaySettings = require("../models/BirthdaySettings");
const { sendEmail, smtpConfigured } = require("../services/emailService");
const { birthdayTemplate } = require("../services/emailTemplate");
const { processBirthdayEmails, getKolkataParts } = require("../services/birthdayService");

const router = express.Router();

router.get("/settings", async (req, res) => {
    const settings = await BirthdaySettings.findOne() || await BirthdaySettings.create({});
    res.json({
        success: true,
        settings,
        smtpConfigured: smtpConfigured(),
        smtpStatus: {
            host: Boolean(String(process.env.SMTP_HOST || "").trim()),
            port: Boolean(Number(process.env.SMTP_PORT || 587)),
            user: Boolean(String(process.env.SMTP_USER || "").trim()),
            pass: Boolean(String(process.env.SMTP_PASS || "").trim()),
            from: Boolean(String(process.env.SMTP_FROM || "").trim())
        }
    });
});

router.put("/settings", async (req, res) => {
    const settings = await BirthdaySettings.findOneAndUpdate(
        {},
        { $set: { subject: req.body.subject || "Happy Birthday, {employeeName}!", message: req.body.message || "", enabled: req.body.enabled !== false } },
        { new: true, upsert: true, runValidators: true }
    );
    res.json({ success: true, settings });
});

router.get("/upcoming", async (req, res) => {
    const employees = await Employee.find({ status: { $in: ["Active", "active"] } });
    const today = getKolkataParts();
    const todayMonthDay = Number(`${today.month}${today.day}`);
    const upcoming = employees.map((employee) => {
        const birth = getKolkataParts(employee.dateOfBirth);
        const monthDay = Number(`${birth.month}${birth.day}`);
        const distance = monthDay >= todayMonthDay ? monthDay - todayMonthDay : 10000 + monthDay - todayMonthDay;
        return { ...employee.toObject(), fullName: employee.fullName || employee.name || "Unknown employee", _distance: distance, _monthDayString: birth.month + "-" + birth.day };
    }).filter((employee) => employee.dateOfBirth)
      .sort((a, b) => a._distance - b._distance).slice(0, 31)
      .map(({ _distance, _monthDayString, ...employee }) => ({ ...employee, birthdayMonthDay: _monthDayString }));
    res.json({ success: true, upcoming });
});

router.get("/logs", async (req, res) => {
    const logs = await BirthdayEmailLog.find().sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, logs });
});

router.get("/dashboard", async (req, res) => {
    const employees = await Employee.find();
    const totalEmployees = employees.length;
    const activeEmployees = employees.filter((employee) => String(employee.status).toLowerCase() === "active").length;
    const departments = employees.reduce((result, employee) => {
        result[employee.department] = (result[employee.department] || 0) + 1;
        return result;
    }, {});
    const today = getKolkataParts();
    const todayMonthDay = Number(`${today.month}${today.day}`);
    const upcoming = employees.map((employee) => {
        const birth = getKolkataParts(employee.dateOfBirth);
        const monthDay = Number(`${birth.month}${birth.day}`);
        const distance = monthDay >= todayMonthDay ? monthDay - todayMonthDay : 10000 + monthDay - todayMonthDay;
        return { employee, distance };
    }).filter(({ employee }) => String(employee.status).toLowerCase() === "active" && employee.dateOfBirth)
      .sort((a, b) => a.distance - b.distance)
      .map(({ employee }) => ({ ...employee.toObject(), fullName: employee.fullName || employee.name || "Unknown employee" }));
    const logs = await BirthdayEmailLog.find().sort({ createdAt: -1 }).limit(10);
    const todayKey = `${today.month}-${today.day}`;
    const todayBirthdays = upcoming.filter((employee) => {
        const birth = getKolkataParts(employee.dateOfBirth);
        return `${birth.month}-${birth.day}` === todayKey;
    }).length;
    const anniversaryEmployees = employees.filter((employee) => {
        if (String(employee.status).toLowerCase() !== "active" || !employee.dateOfJoining) return false;
        const joining = getKolkataParts(employee.dateOfJoining);
        return joining.month === today.month && joining.day === today.day && [1, 3, 5].includes(today.year - joining.year);
    });
    const upcomingWorkAnniversaries = employees.filter((employee) => {
        if (String(employee.status).toLowerCase() !== "active" || !employee.dateOfJoining) return false;
        const joining = getKolkataParts(employee.dateOfJoining);
        const current = new Date(Date.UTC(today.year, today.month - 1, today.day));
        let candidateYear = today.year;
        let candidate = new Date(Date.UTC(candidateYear, joining.month - 1, joining.day));
        let distance = Math.round((candidate - current) / 86400000);
        if (distance < 0) {
            candidateYear += 1;
            candidate = new Date(Date.UTC(candidateYear, joining.month - 1, joining.day));
            distance = Math.round((candidate - current) / 86400000);
        }
        const milestoneYears = candidate.getUTCFullYear() - joining.year;
        return distance >= 1 && distance <= 31 && [1, 3, 5].includes(milestoneYears);
    }).length;
    res.json({
        success: true,
        stats: {
            totalEmployees,
            activeEmployees,
            todayBirthdays,
            upcomingBirthdays: upcoming,
            upcomingWorkAnniversaries,
            todayWorkAnniversaries: anniversaryEmployees.length,
            departmentSummary: departments,
            logs
        }
    });
});

router.post("/test", async (req, res) => {
    const { email } = req.body;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ success: false, message: "Enter a valid test recipient email." });
    }
    const settings = await BirthdaySettings.findOne() || await BirthdaySettings.create({});
    const today = getKolkataParts();
    const subject = settings.subject.replace(/\{employeeName\}/g, "Employee");
    const log = await BirthdayEmailLog.create({
        employeeName: "Birthday Email Test",
        recipientEmail: email,
        birthdayDate: today.dateKey,
        subject,
        status: "failed",
        deliveryType: "test"
    });
    if (!smtpConfigured()) {
        log.status = "failed";
        log.error = "SMTP is not configured.";
        await log.save();
        return res.status(400).json({ success: false, message: "SMTP is not configured. Add SMTP credentials to backend/.env." });
    }
    try {
        const result = await sendEmail({
            to: email,
            subject,
            html: birthdayTemplate("Employee", settings.message, process.env.COMPANY_NAME || "SmartHR")
        });
        log.status = "sent";
        log.messageId = result.messageId;
        await log.save();
        res.json({ success: true, message: "Test birthday email sent successfully.", messageId: result.messageId });
    } catch (error) {
        log.status = "failed";
        log.error = error.message;
        await log.save();
        res.status(500).json({ success: false, message: error.message });
    }
});

router.post("/manual-test", async (req, res) => {
    const { employeeId } = req.body;
    if (!employeeId) {
        return res.status(400).json({ success: false, message: "Select a test employee." });
    }

    let employee;
    try {
        employee = await Employee.findById(employeeId);
    } catch (error) {
        return res.status(400).json({ success: false, message: "Invalid test employee." });
    }

    if (!employee) {
        return res.status(404).json({ success: false, message: "Test employee not found." });
    }
    if (!employee.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(employee.email)) {
        return res.status(400).json({ success: false, message: "The selected employee does not have a valid email address." });
    }

    const settings = await BirthdaySettings.findOne() || await BirthdaySettings.create({});
    const today = getKolkataParts();
    const employeeName = employee.fullName || employee.name || "Employee";
    const subject = settings.subject.replace(/\{employeeName\}/g, employeeName);
    const log = await BirthdayEmailLog.create({
        employee: employee._id,
        employeeName: `Manual Test - ${employeeName}`,
        recipientEmail: employee.email,
        birthdayDate: today.dateKey,
        subject,
        status: "failed",
        deliveryType: "test"
    });

    if (!smtpConfigured()) {
        log.status = "failed";
        log.error = "SMTP is not configured.";
        await log.save();
        return res.status(400).json({ success: false, message: "SMTP is not configured. Add SMTP credentials to backend/.env." });
    }

    try {
        const result = await sendEmail({
            to: employee.email,
            subject,
            html: birthdayTemplate(employeeName, settings.message, process.env.COMPANY_NAME || "SmartHR")
        });
        log.status = "sent";
        log.messageId = result.messageId;
        await log.save();
        res.json({
            success: true,
            message: `Manual birthday test email sent successfully to ${employeeName}.`,
            employeeName,
            recipientEmail: employee.email,
            messageId: result.messageId
        });
    } catch (error) {
        log.status = "failed";
        log.error = error.message;
        await log.save();
        res.status(500).json({ success: false, message: error.message });
    }
});

router.post("/run", async (req, res) => {
    const result = await processBirthdayEmails();
    res.json({ success: true, ...result });
});

module.exports = router;
