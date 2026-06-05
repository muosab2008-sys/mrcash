import nodemailer from 'nodemailer';

export async function sendCustomEmail(to: string, subject: string, text: string, html: string) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: `"MrCash Support" <${process.env.SMTP_USER}>`,
    to,
    subject,
    text,
    html,
  });
}
