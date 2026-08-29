const nodemailer = require("nodemailer");

/**
 * Sends an email via SMTP using credentials from the environment.
 *
 * Requires these .env variables to actually send mail:
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM
 *
 * If they aren't set (e.g. local development without a mail provider
 * configured yet), this falls back to logging the email to the console
 * instead of throwing — so the rest of the forgot-password flow can
 * still be tested end-to-end without real SMTP credentials.
 */
async function sendEmail({ to, subject, html }) {

    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM } = process.env;

    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
        console.log("\n[sendEmail] SMTP not configured — logging email instead of sending:");
        console.log(`  To: ${to}`);
        console.log(`  Subject: ${subject}`);
        console.log(`  Body: ${html}\n`);
        return { simulated: true };
    }

    const transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: Number(SMTP_PORT) || 587,
        secure: Number(SMTP_PORT) === 465,
        auth: {
            user: SMTP_USER,
            pass: SMTP_PASS,
        },
    });

    await transporter.sendMail({
        from: EMAIL_FROM || SMTP_USER,
        to,
        subject,
        html,
    });

    return { simulated: false };
}

module.exports = sendEmail;