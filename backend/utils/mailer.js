const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    return null; // Email not configured — caller should handle gracefully
  }
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: Number(process.env.EMAIL_PORT) === 465,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
  return transporter;
}

/**
 * Sends an email. If email isn't configured (no EMAIL_HOST/USER/PASS in .env),
 * logs to console instead of throwing — so the rest of the app keeps working
 * in local dev without an email account set up.
 */
async function sendMail({ to, subject, html }) {
  const t = getTransporter();
  if (!t) {
    console.warn(`[mailer] Email not configured — would have sent "${subject}" to ${to}`);
    return { sent: false, reason: 'not_configured' };
  }

  try {
    await t.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to,
      subject,
      html
    });
    return { sent: true };
  } catch (err) {
    console.error(`[mailer] Failed to send email to ${to}:`, err.message);
    return { sent: false, reason: err.message };
  }
}

module.exports = { sendMail };
