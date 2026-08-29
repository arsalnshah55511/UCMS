const nodemailer = require("nodemailer");

/**
 * Sends an email. Tries, in order:
 *
 *   1. Resend's HTTP API (RESEND_API_KEY set) — plain HTTPS, so it works
 *      even on hosts like Render that throttle/block outbound SMTP ports.
 *      This is the recommended option.
 *   2. Raw SMTP via nodemailer (SMTP_HOST etc. set) — kept for local dev
 *      or hosts that do allow SMTP out.
 *   3. Console log fallback — so the rest of the flow (e.g. forgot
 *      password) can still be tested without either configured.
 */
async function sendEmail({ to, subject, html }) {

    const { RESEND_API_KEY, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM } = process.env;

    if (RESEND_API_KEY) {
        const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${RESEND_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                from: EMAIL_FROM || "onboarding@resend.dev",
                to,
                subject,
                html,
            }),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Resend API error (${response.status}): ${errorBody}`);
        }

        return { simulated: false, provider: "resend" };
    }

    if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
        const transporter = nodemailer.createTransport({
            host: SMTP_HOST,
            port: Number(SMTP_PORT) || 587,
            secure: Number(SMTP_PORT) === 465,
            auth: {
                user: SMTP_USER,
                pass: SMTP_PASS,
            },
            // Some hosts (e.g. Render) don't support outbound IPv6, but
            // smtp.gmail.com resolves to an IPv6 address first on some
            // networks, causing ENETUNREACH. Forcing IPv4 avoids that.
            family: 4,
        });

        await transporter.sendMail({
            from: EMAIL_FROM || SMTP_USER,
            to,
            subject,
            html,
        });

        return { simulated: false, provider: "smtp" };
    }

    console.log("\n[sendEmail] No email provider configured — logging email instead of sending:");
    console.log(`  To: ${to}`);
    console.log(`  Subject: ${subject}`);
    console.log(`  Body: ${html}\n`);
    return { simulated: true };
}

module.exports = sendEmail;