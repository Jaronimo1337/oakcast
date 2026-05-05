const nodemailer = require("nodemailer");

function toBool(value, fallback = false) {
  if (value === undefined || value === null || value === "") return fallback;
  return /^(1|true|yes|on)$/i.test(String(value).trim());
}

function getMailerConfig() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = toBool(process.env.SMTP_SECURE, port === 465);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || user;
  const inquiryTo = process.env.INQUIRY_TO || "info@oakcaststudio.com";
  return { host, port, secure, user, pass, from, inquiryTo };
}

function canSendMail() {
  const cfg = getMailerConfig();
  return Boolean(cfg.host && cfg.port && cfg.user && cfg.pass && cfg.from && cfg.inquiryTo);
}

function createTransport() {
  const cfg = getMailerConfig();
  return nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: {
      user: cfg.user,
      pass: cfg.pass
    }
  });
}

async function sendInquiryEmail(inquiry) {
  if (!canSendMail()) return false;
  const cfg = getMailerConfig();
  const transporter = createTransport();
  const name = inquiry.customer_name || "Unknown";
  const email = inquiry.email || "unknown@example.com";
  const message = inquiry.message || "";

  await transporter.sendMail({
    from: cfg.from,
    to: cfg.inquiryTo,
    replyTo: email,
    subject: `New inquiry from ${name}`,
    text: [
      `Name: ${name}`,
      `Email: ${email}`,
      "",
      "Message:",
      message
    ].join("\n"),
    html: `
      <h2>New inquiry from website</h2>
      <p><strong>Name:</strong> ${escapeHtml(name)}</p>
      <p><strong>Email:</strong> ${escapeHtml(email)}</p>
      <p><strong>Message:</strong></p>
      <pre style="white-space: pre-wrap; font-family: inherit;">${escapeHtml(message)}</pre>
    `
  });

  return true;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

module.exports = {
  canSendMail,
  sendInquiryEmail
};
