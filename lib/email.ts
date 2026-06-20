import nodemailer from "nodemailer";

// Official sender address for all outbound MrCash mail.
const OFFICIAL_FROM = '"MrCash" <noreply@mrcash.app>';

/**
 * Sends a transactional email through the custom SMTP relay configured via
 * SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS environment variables.
 */
export async function sendCustomEmail(
  to: string,
  subject: string,
  text: string,
  html: string,
  from: string = OFFICIAL_FROM,
) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const info = await transporter.sendMail({ from, to, subject, text, html });
  console.log(`[email] sent "${subject}" to ${to} (id: ${info.messageId})`);
  return info;
}

/**
 * Wraps body content in a consistent, professional dark-themed HTML shell that
 * matches the MrCash brand.
 */
export function renderEmailTemplate(opts: {
  heading: string;
  intro: string;
  buttonLabel: string;
  buttonUrl: string;
  footnote?: string;
}): string {
  const { heading, intro, buttonLabel, buttonUrl, footnote } = opts;
  return `
  <!DOCTYPE html>
  <html lang="en">
    <body style="margin:0;padding:0;background-color:#0f172a;font-family:Arial,Helvetica,sans-serif;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f172a;padding:40px 16px;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#111827;border:1px solid rgba(255,255,255,0.06);border-radius:20px;overflow:hidden;">
              <tr>
                <td style="padding:32px 32px 16px 32px;text-align:center;">
                  <div style="display:inline-block;font-size:24px;font-weight:800;font-style:italic;letter-spacing:-1px;color:#3B82F6;">MrCash</div>
                </td>
              </tr>
              <tr>
                <td style="padding:8px 32px 0 32px;">
                  <h1 style="margin:0 0 12px 0;font-size:22px;line-height:1.3;color:#ffffff;font-weight:700;">${heading}</h1>
                  <p style="margin:0 0 28px 0;font-size:15px;line-height:1.6;color:#94a3b8;">${intro}</p>
                </td>
              </tr>
              <tr>
                <td style="padding:0 32px 8px 32px;text-align:center;">
                  <a href="${buttonUrl}" target="_blank" style="display:inline-block;padding:14px 32px;background:linear-gradient(90deg,#3B82F6,#8B5CF6);color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;border-radius:14px;">${buttonLabel}</a>
                </td>
              </tr>
              <tr>
                <td style="padding:24px 32px 32px 32px;">
                  <p style="margin:0;font-size:12px;line-height:1.6;color:#64748b;word-break:break-all;">If the button doesn't work, copy and paste this link into your browser:<br/><a href="${buttonUrl}" style="color:#3B82F6;text-decoration:none;">${buttonUrl}</a></p>
                  ${footnote ? `<p style="margin:20px 0 0 0;font-size:12px;line-height:1.6;color:#475569;">${footnote}</p>` : ""}
                </td>
              </tr>
            </table>
            <p style="margin:24px 0 0 0;font-size:11px;color:#475569;">© ${new Date().getFullYear()} MrCash. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </body>
  </html>`;
}
