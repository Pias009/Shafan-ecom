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

export async function sendOrderEmail(to: string, subject: string, html: string, text?: string) {
  try {
    const mailer = await getMailer()
    if (!mailer) {
      console.log('Email config not provided. Skipping actual send.');
      return true
    }
    await mailer.sendMail({ from: process.env.SMTP_FROM || 'no-reply@example.com', to, subject, text, html });
    return true
  } catch (e) {
    console.error('Failed to send email', e)
    return false
  }
}
