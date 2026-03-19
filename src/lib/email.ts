import nodemailer, { Transporter } from 'nodemailer'

type SMTPConfig = {
  host?: string;
  port?: number;
  user?: string;
  pass?: string;
}

async function createTransport(): Promise<Transporter | null> {
  const has = Boolean(process.env.SMTP_HOST && process.env.SMTP_PORT);
  if (!has) return null;
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  return transporter
}

async function getMailer(): Promise<Transporter | null> {
  if (process.env.SMTP_HOST) {
    return await createTransport()
  }
  return null
}

export async function sendEmail({ to, subject, html, text }: { to: string, subject: string, html: string, text?: string }) {
  try {
    const mailer = await getMailer();
    if (!mailer) {
      console.warn("⚠️ SMTP environment variables missing. Email was NOT sent.");
      return false;
    }
    
    await mailer.sendMail({
      from: process.env.SMTP_FROM || `"Shafan Store" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text,
      html,
    });
    
    return true;
  } catch (err) {
    console.error("❌ Email failed to send:", err);
    return false;
  }
}

// Backwards compatibility for order emails
export async function sendOrderEmail(to: string, subject: string, html: string, text?: string) {
  return sendEmail({ to, subject, html, text });
}

