const cron = require("node-cron");
const Employee = require("../models/Employee");
const BirthdayEmailLog = require("../models/BirthdayEmailLog");
const { sendEmail, smtpConfigured } = require("./emailService");
const { workAnniversaryTemplate } = require("./emailTemplate");

const MILESTONES = [1, 3, 5];

function getKolkataParts(date = new Date()) {
    const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit"
    }).formatToParts(date);
    const value = Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));
    return { year: Number(value.year), month: value.month, day: value.day, dateKey: `${value.year}-${value.month}-${value.day}` };
}

function getJoiningDate(employee) {
    return employee.dateOfJoining || employee.joiningDate || employee.joinDateISO || employee.joinDate || null;
}

function getCompletedYears(joiningValue, todayValue = new Date()) {
    if (!joiningValue) return null;
    const joining = new Date(joiningValue);
    if (Number.isNaN(joining.getTime())) return null;
    const joiningParts = getKolkataParts(joining);
    const todayParts = getKolkataParts(todayValue);
    const completedYears = todayParts.year - joiningParts.year;
    return completedYears >= 1 ? completedYears : null;
}

async function processWorkAnniversaryEmails() {
    const today = getKolkataParts();
    const employees = await Employee.find(
        { status: { $in: ["Active", "active"] } },
        { fullName: 1, name: 1, email: 1, dateOfJoining: 1, joiningDate: 1, status: 1 }
    );
    let processed = 0;
    let sent = 0;
    let failed = 0;

    for (const employee of employees) {
        if (!employee.email) continue;
        const joiningValue = getJoiningDate(employee);
        if (!joiningValue) continue;
        const joiningParts = getKolkataParts(new Date(joiningValue));
        if (joiningParts.month !== today.month || joiningParts.day !== today.day) continue;
        const completedYears = getCompletedYears(joiningValue);
        if (!MILESTONES.includes(completedYears)) continue;

        const existing = await BirthdayEmailLog.findOne({
            employee: employee._id,
            milestoneYears: completedYears,
            deliveryType: "automatic",
            emailType: "work-anniversary",
            status: { $in: ["pending", "sent"] }
        });
        if (existing) continue;

        const employeeName = employee.fullName || employee.name || "Employee";
        const subject = `Happy ${completedYears}-Year Work Anniversary, ${employeeName}!`;
        let log;
        try {
            log = await BirthdayEmailLog.create({
                employee: employee._id,
                employeeName,
                recipientEmail: employee.email,
                birthdayDate: today.dateKey,
                subject,
                status: "pending",
                deliveryType: "automatic",
                emailType: "work-anniversary",
                milestoneYears: completedYears
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
                html: workAnniversaryTemplate(employeeName, completedYears, process.env.COMPANY_NAME || "SmartHR")
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
        message: sent
            ? `${sent} work anniversary email(s) sent successfully; ${failed} failed.`
            : "Work anniversary check completed. No milestone emails were sent successfully."
    };
}

function startWorkAnniversaryScheduler() {
    BirthdayEmailLog.syncIndexes()
        .catch((error) => console.error("Unable to synchronize work anniversary indexes:", error.message));
    cron.schedule("1 0 * * *", () => {
        processWorkAnniversaryEmails()
            .then((result) => console.log(`[Work anniversary scheduler 00:01 Asia/Kolkata] ${result.message}`))
            .catch((error) => console.error("[Work anniversary scheduler] Error:", error.message));
    }, { timezone: "Asia/Kolkata", name: "smarthr-work-anniversary-email" });
    console.log("Work anniversary email scheduler registered for 00:01 Asia/Kolkata.");
}

module.exports = { startWorkAnniversaryScheduler, processWorkAnniversaryEmails, getCompletedYears, MILESTONES };
