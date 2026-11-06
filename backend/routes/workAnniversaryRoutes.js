const express = require("express");
const Employee = require("../models/Employee");
const BirthdayEmailLog = require("../models/BirthdayEmailLog");
const { sendEmail, smtpConfigured } = require("../services/emailService");
const { workAnniversaryTemplate } = require("../services/emailTemplate");
const { processWorkAnniversaryEmails, getCompletedYears, MILESTONES } = require("../services/workAnniversaryService");

const router = express.Router();

function getKolkataDateKey() {
    const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit"
    }).formatToParts(new Date());
    const value = Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));
    return `${value.year}-${value.month}-${value.day}`;
}

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

    const joiningValue = employee.dateOfJoining || employee.joiningDate;
    if (!joiningValue) {
        return res.status(400).json({ success: false, message: "The selected employee does not have a Date of Joining." });
    }
    const completedYears = getCompletedYears(joiningValue);
    if (!completedYears) {
        return res.status(400).json({ success: false, message: "The selected employee has no completed work anniversary years yet." });
    }
    if (!MILESTONES.includes(completedYears)) {
        return res.status(400).json({ success: false, message: `Manual testing is available only for the 1st, 3rd, or 5th work anniversary. Completed years: ${completedYears}.` });
    }

    const employeeName = employee.fullName || employee.name || "Employee";
    const subject = `Happy ${completedYears}-Year Work Anniversary, ${employeeName}!`;
    const log = await BirthdayEmailLog.create({
        employee: employee._id,
        employeeName: `Manual Work Anniversary Test - ${employeeName}`,
        recipientEmail: employee.email,
        birthdayDate: getKolkataDateKey(),
        subject,
        status: "failed",
        deliveryType: "test",
        emailType: "work-anniversary",
        milestoneYears: completedYears
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
            html: workAnniversaryTemplate(employeeName, completedYears, process.env.COMPANY_NAME || "SmartHR")
        });
        log.status = "sent";
        log.messageId = result.messageId;
        await log.save();
        res.json({
            success: true,
            message: `Manual work anniversary test email sent successfully to ${employeeName}.`,
            employeeName,
            recipientEmail: employee.email,
            completedYears,
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
    const result = await processWorkAnniversaryEmails();
    res.json({ success: true, ...result, milestones: MILESTONES });
});

module.exports = router;
