/**
 * Email Service - Unified interface for sending emails
 * Uses Resend as primary provider with SMTP fallback
 */

import nodemailer, { Transporter } from 'nodemailer';
import { emailService } from './email/service';

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

/**
 * Unified email sending function
 * Tries Resend first, falls back to SMTP if Resend is not configured
 */
export async function sendEmail({ 
  to, 
  subject, 
  html, 
  text 
}: { 
  to: string, 
  subject: string, 
  html: string, 
  text?: string 
}): Promise<boolean> {
  try {
    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey && resendApiKey !== 're_') {
      try {
        const result = await emailService.sendEmail({
          to: { email: to },
          subject,
          html,
          text,
        });
        
        if (result.success) {
          console.log(`✅ Email sent via Resend to ${to}`);
          return true;
        }
      } catch (resendError) {
        console.warn('Resend failed, falling back to SMTP:', resendError);
      }
    }

    const mailer = await getMailer();
    if (!mailer) {
      console.warn("⚠️ No email provider configured. Email was NOT sent.");
      return false;
    }
    
    await mailer.sendMail({
      from: process.env.SMTP_FROM || `"SHANFA STORE" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text,
      html,
    });
    
    console.log(`✅ Email sent via SMTP to ${to}`);
    return true;
  } catch (err) {
    console.error("❌ Email failed to send:", err);
    return false;
  }
}

export async function sendOrderEmail(to: string, subject: string, html: string, text?: string) {
  return sendEmail({ to, subject, html, text });
}
