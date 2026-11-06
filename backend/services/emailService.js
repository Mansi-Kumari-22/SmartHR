const nodemailer = require("nodemailer");
const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");

const envPath = path.join(__dirname, "..", ".env");

function loadSMTPEnvironment() {
    dotenv.config({ path: envPath, override: true, quiet: true });
    if (fs.existsSync(envPath)) {
        const fileValues = dotenv.parse(fs.readFileSync(envPath));
        for (const [key, value] of Object.entries(fileValues)) {
            if (key.startsWith("SMTP_") && String(value || "").trim()) {
                process.env[key] = String(value).trim();
            }
        }
    }
}

function smtpConfigured() {
    loadSMTPEnvironment();
    return Boolean(
        String(process.env.SMTP_HOST || "").trim() &&
        String(process.env.SMTP_USER || "").trim() &&
        String(process.env.SMTP_PASS || "").trim() &&
        String(process.env.SMTP_FROM || "").trim()
    );
}

function createTransport() {
    if (!smtpConfigured()) return null;
    return nodemailer.createTransport({
        host: String(process.env.SMTP_HOST || "").trim(),
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === "true",
        auth: {
            user: String(process.env.SMTP_USER || "").trim(),
            pass: String(process.env.SMTP_PASS || "").trim()
        },
        connectionTimeout: 15000,
        greetingTimeout: 15000,
        socketTimeout: 20000
    });
}

async function sendEmail({ to, subject, html }) {
    const transport = createTransport();
    if (!transport) throw new Error("SMTP is not configured. Add SMTP_HOST, SMTP_USER, SMTP_PASS and SMTP_FROM to backend/.env.");
    await transport.verify();
    const result = await transport.sendMail({
        from: String(process.env.SMTP_FROM || "").trim(),
        to: String(to).trim(),
        subject,
        html
    });
    const accepted = Array.isArray(result.accepted) ? result.accepted : [];
    if (!accepted.some((recipient) => String(recipient).toLowerCase() === String(to).toLowerCase())) {
        const rejected = Array.isArray(result.rejected) ? result.rejected.join(", ") : "unknown recipient";
        throw new Error(`SMTP did not accept the recipient ${to}. Rejected: ${rejected}`);
    }
    return result;
}

module.exports = { sendEmail, smtpConfigured };
