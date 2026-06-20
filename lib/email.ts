import nodemailer from "nodemailer";

/**
 * Official outbound address for all MrCash transactional email.
 * Overridable via EMAIL_FROM but defaults to the brand no-reply mailbox.
 */
const FROM_NAME = "MrCash";
const FROM_ADDRESS = process.env.EMAIL_FROM || "noreply@mrcash.app";

let cachedTransporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (cachedTransporter) return cachedTransporter;

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;

  if (!host || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error("SMTP configuration is incomplete. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS.");
  }

  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // implicit TLS on 465, STARTTLS otherwise
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return cachedTransporter;
}

/**
 * Low-level sender. Always sends from the official MrCash no-reply address.
 */
export async function sendCustomEmail(to: string, subject: string, text: string, html: string) {
  const transporter = getTransporter();

  await transporter.sendMail({
    from: `"${FROM_NAME}" <${FROM_ADDRESS}>`,
    to,
    subject,
    text,
    html,
  });
}

/**
 * Shared dark-themed HTML shell used by every official MrCash email.
 */
function emailShell(title: string, bodyHtml: string): string {
  const year = new Date().getFullYear();
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
  </head>
  <body style="margin:0;padding:0;background-color:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f172a;padding:40px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#0a0a0a;border:1px solid rgba(255,255,255,0.06);border-radius:20px;overflow:hidden;">
            <tr>
              <td style="padding:32px 32px 8px 32px;text-align:center;">
                <span style="font-size:26px;font-weight:900;font-style:italic;letter-spacing:-1px;background:linear-gradient(90deg,#3B82F6,#8B5CF6);-webkit-background-clip:text;background-clip:text;color:#3B82F6;">MrCash</span>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px 32px 32px;color:#e2e8f0;">
                ${bodyHtml}
              </td>
            </tr>
          </table>
          <p style="max-width:480px;margin:24px auto 0 auto;color:#475569;font-size:12px;line-height:1.6;text-align:center;">
            This is an automated message from MrCash. Please do not reply to this email.<br />
            &copy; ${year} MrCash &middot; mrcash.app
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function ctaButton(label: string, href: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px auto;">
    <tr>
      <td style="border-radius:14px;background:linear-gradient(90deg,#3B82F6,#8B5CF6);">
        <a href="${href}" target="_blank" style="display:inline-block;padding:14px 36px;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;border-radius:14px;">${label}</a>
      </td>
    </tr>
  </table>`;
}

/**
 * Account activation / email verification message.
 */
export async function sendVerificationEmail(to: string, username: string, verifyUrl: string) {
  const html = emailShell(
    "Verify your MrCash account",
    `
      <h1 style="margin:0 0 12px 0;font-size:22px;font-weight:800;color:#ffffff;text-align:center;">Verify your email</h1>
      <p style="margin:0 0 8px 0;font-size:14px;line-height:1.6;color:#94a3b8;text-align:center;">Welcome, ${username}! You're one click away from activating your MrCash account and start earning rewards.</p>
      ${ctaButton("Activate My Account", verifyUrl)}
      <p style="margin:0;font-size:12px;line-height:1.6;color:#64748b;text-align:center;">This link expires in 24 hours. If the button doesn't work, copy and paste this URL into your browser:</p>
      <p style="margin:8px 0 0 0;font-size:12px;line-height:1.6;color:#3B82F6;text-align:center;word-break:break-all;">${verifyUrl}</p>
    `
  );

  const text = `Welcome to MrCash, ${username}!\n\nActivate your account using the link below (expires in 24 hours):\n${verifyUrl}`;

  await sendCustomEmail(to, "Verify your MrCash account", text, html);
}

/**
 * Password reset request message.
 */
export async function sendPasswordResetEmail(to: string, username: string, resetUrl: string) {
  const html = emailShell(
    "Reset your MrCash password",
    `
      <h1 style="margin:0 0 12px 0;font-size:22px;font-weight:800;color:#ffffff;text-align:center;">Reset your password</h1>
      <p style="margin:0 0 8px 0;font-size:14px;line-height:1.6;color:#94a3b8;text-align:center;">Hi ${username}, we received a request to reset your MrCash password. Click the button below to choose a new one.</p>
      ${ctaButton("Reset Password", resetUrl)}
      <p style="margin:0;font-size:12px;line-height:1.6;color:#64748b;text-align:center;">This link expires in 1 hour. If you didn't request this, you can safely ignore this email — your password will stay the same.</p>
      <p style="margin:8px 0 0 0;font-size:12px;line-height:1.6;color:#3B82F6;text-align:center;word-break:break-all;">${resetUrl}</p>
    `
  );

  const text = `Hi ${username},\n\nReset your MrCash password using the link below (expires in 1 hour):\n${resetUrl}\n\nIf you didn't request this, ignore this email.`;

  await sendCustomEmail(to, "Reset your MrCash password", text, html);
}
