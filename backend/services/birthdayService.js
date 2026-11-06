const cron = require("node-cron");
const Employee = require("../models/Employee");
const BirthdayEmailLog = require("../models/BirthdayEmailLog");
const BirthdaySettings = require("../models/BirthdaySettings");
const { sendEmail, smtpConfigured } = require("./emailService");
const { birthdayTemplate } = require("./emailTemplate");

function getKolkataParts(date = new Date()) {
    const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit"
    }).formatToParts(date);
    const value = Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));
    return { year: value.year, month: value.month, day: value.day, dateKey: `${value.year}-${value.month}-${value.day}` };
}

function birthdayMonthDay(date) {
    if (!date) return null;
    const birthDate = new Date(date);
    if (Number.isNaN(birthDate.getTime())) return null;
    const parts = getKolkataParts(birthDate);
    return `${parts.month}-${parts.day}`;
}

async function processBirthdayEmails() {
    const today = getKolkataParts();
    const settings = await BirthdaySettings.findOne() || await BirthdaySettings.create({});
    if (!settings.enabled) return { processed: 0, sent: 0, failed: 0, message: "Birthday emails are disabled. No emails were sent." };

    const employees = await Employee.find(
        { status: { $in: ["Active", "active"] } },
        { fullName: 1, name: 1, email: 1, dateOfBirth: 1, status: 1 }
    );
    let processed = 0;
    let sent = 0;
    let failed = 0;
    const pendingThisRun = new Set();

    for (const employee of employees) {
        if (!employee.email || !birthdayMonthDay(employee.dateOfBirth)) continue;
        const birthParts = getKolkataParts(employee.dateOfBirth);
        if (birthParts.month !== today.month || birthParts.day !== today.day) continue;

        const existingDelivery = await BirthdayEmailLog.findOne({
            employee: employee._id,
            birthdayDate: today.dateKey,
            deliveryType: "automatic"
        });
        if (
            existingDelivery &&
            (existingDelivery.status === "pending" || existingDelivery.status === "sent")
        ) continue;
        if (pendingThisRun.has(String(employee._id))) continue;
        pendingThisRun.add(String(employee._id));

        const employeeName = employee.fullName || employee.name || "Employee";
        const subject = settings.subject.replace(/\{employeeName\}/g, employeeName);
        let log;
        try {
            log = await BirthdayEmailLog.create({
            employee: employee._id,
            employeeName,
            recipientEmail: employee.email,
            birthdayDate: today.dateKey,
            subject,
            status: "pending",
            deliveryType: "automatic"
        });
        } catch (error) {
            if (error && error.code === 11000) continue;
            throw error;
        }
        processed++;

        if (!smtpConfigured()) {
            log.status = "failed";
            log.error = "SMTP is not configured.";
            await log.save();
            failed++;
            continue;
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
            sent++;
        } catch (error) {
            log.status = "failed";
            log.error = error.message;
            await log.save();
            failed++;
        }
    }
    return {
        processed,
        sent,
        failed,
        message: sent ? `${sent} birthday email(s) sent successfully; ${failed} failed.` : `Birthday check completed. No emails were sent successfully.`
    };
}

function startBirthdayScheduler() {
    BirthdayEmailLog.syncIndexes()
        .then(() => console.log("Birthday email indexes synchronized."))
        .catch((error) => console.error("Unable to synchronize birthday email indexes:", error.message));
    cron.schedule("1 0 * * *", () => {
        processBirthdayEmails().then((result) => {
            console.log(`[Birthday scheduler 00:01 Asia/Kolkata] ${result.message}`);
        }).catch((error) => console.error("[Birthday scheduler] Error:", error.message));
    }, { timezone: "Asia/Kolkata", name: "smarthr-birthday-email" });
    console.log("Birthday email scheduler registered for 00:01 Asia/Kolkata.");
}

module.exports = { startBirthdayScheduler, processBirthdayEmails, getKolkataParts };
