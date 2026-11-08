const https = require("https");
const path = require("path");
const nodemailer = require("nodemailer");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "..", ".env") });

function brevoConfigured() {
    return Boolean(
        String(process.env.BREVO_API_KEY || "").trim() &&
        String(process.env.BREVO_SENDER_EMAIL || process.env.SMTP_FROM || "").trim()
    );
}

function smtpConfigured() {
    return Boolean(
        String(process.env.SMTP_HOST || "").trim() &&
        String(process.env.SMTP_USER || "").trim() &&
        String(process.env.SMTP_PASS || "").trim() &&
        String(process.env.SMTP_FROM || "").trim()
    );
}

function emailConfigured() {
    return brevoConfigured() || smtpConfigured();
}

function getEmailProviderStatus() {
    return {
        provider: brevoConfigured() ? "brevo" : smtpConfigured() ? "smtp" : "none",
        brevoConfigured: brevoConfigured(),
        smtpConfigured: smtpConfigured(),
        configured: emailConfigured()
    };
}

function parseSender() {
    const explicitEmail = String(process.env.BREVO_SENDER_EMAIL || "").trim();
    const explicitName = String(process.env.BREVO_SENDER_NAME || process.env.COMPANY_NAME || "SmartHR").trim();
    if (explicitEmail) return { name: explicitName, email: explicitEmail };

    const from = String(process.env.SMTP_FROM || "").trim();
    const match = from.match(/^([^<]*?)\s*<([^<>]+)>$/);
    if (match) return { name: match[1].trim() || process.env.COMPANY_NAME || "SmartHR", email: match[2].trim() };
    return { name: String(process.env.COMPANY_NAME || "SmartHR").trim(), email: from };
}

function getSafeErrorMessage(error, provider = "email") {
    const raw = String(error && error.message ? error.message : error || "").replace(/\s+/g, " ").trim();
    if (!raw) return `${provider} delivery failed.`;
    if (/api[_ -]?key|authorization|password|smtp_pass|xsmtpsib|token/i.test(raw)) {
        return `${provider} delivery failed because the provider rejected authentication.`;
    }
    if (/timeout|timed out|ETIMEDOUT|ESOCKET|ECONN/i.test(raw)) {
        return `${provider} delivery timed out or could not reach the provider.`;
    }
    return raw.length > 300 ? `${raw.slice(0, 297)}...` : raw;
}

function sendBrevoEmail({ to, subject, html }) {
    const apiKey = String(process.env.BREVO_API_KEY || "").trim();
    const sender = parseSender();
    if (!sender.email) throw new Error("Brevo sender email is not configured.");

    const payload = JSON.stringify({
        sender,
        to: [{ email: String(to).trim() }],
        subject,
        htmlContent: html
    });

    return new Promise((resolve, reject) => {
        const request = https.request({
            hostname: "api.brevo.com",
            port: 443,
            path: "/v3/smtp/email",
            method: "POST",
            headers: {
                "api-key": apiKey,
                "Content-Type": "application/json",
                "Content-Length": Buffer.byteLength(payload)
            },
            timeout: 15000
        }, (response) => {
            let body = "";
            response.setEncoding("utf8");
            response.on("data", (chunk) => { body += chunk; });
            response.on("end", () => {
                let parsed = {};
                try { parsed = body ? JSON.parse(body) : {}; } catch (_) { parsed = {}; }
                if (response.statusCode < 200 || response.statusCode >= 300) {
                    const providerMessage = Array.isArray(parsed.message) ? parsed.message.join(", ") : parsed.message;
                    const safeMessage = providerMessage && !/api[_ -]?key|authorization|password|token/i.test(providerMessage)
                        ? providerMessage
                        : "Brevo rejected the request.";
                    reject(new Error(`Brevo delivery failed (${response.statusCode}): ${safeMessage}`));
                    return;
                }
                resolve({ provider: "brevo", messageId: parsed.messageId || null, accepted: [String(to).trim()] });
            });
        });
        request.on("timeout", () => {
            request.destroy(new Error("Brevo HTTPS API timed out."));
        });
        request.on("error", reject);
        request.end(payload);
    });
}

async function sendSmtpEmail({ to, subject, html }) {
    const transport = nodemailer.createTransport({
        host: String(process.env.SMTP_HOST || "").trim(),
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === "true",
        auth: {
            user: String(process.env.SMTP_USER || "").trim(),
            pass: String(process.env.SMTP_PASS || "").trim()
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000
    });
    const result = await transport.sendMail({
        from: String(process.env.SMTP_FROM || "").trim(),
        to: String(to).trim(),
        subject,
        html
    });
    const accepted = Array.isArray(result.accepted) ? result.accepted : [];
    if (!accepted.some((recipient) => String(recipient).toLowerCase() === String(to).toLowerCase())) {
        throw new Error("SMTP did not accept the recipient.");
    }
    return { ...result, provider: "smtp" };
}

async function sendEmail({ to, subject, html }) {
    if (!emailConfigured()) {
        throw new Error("Email is not configured. Set BREVO_API_KEY and BREVO_SENDER_EMAIL, or configure SMTP.");
    }
    if (brevoConfigured()) return sendBrevoEmail({ to, subject, html });
    return sendSmtpEmail({ to, subject, html });
}

module.exports = {
    sendEmail,
    smtpConfigured: emailConfigured,
    emailConfigured,
    brevoConfigured,
    getEmailProviderStatus,
    getSafeErrorMessage
};
