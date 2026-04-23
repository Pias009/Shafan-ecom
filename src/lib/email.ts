/**
 * Email Service - Unified interface for sending emails
 * Uses Resend as primary provider with SMTP fallback
 */

import nodemailer, { Transporter } from 'nodemailer';
import { emailService, sendPasswordResetEmail as sendResendPasswordResetEmail } from './email/service';

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
    // First try Resend if API key is configured
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

    // Fallback to SMTP
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

/**
 * Specialized function for password reset emails using Resend templates
 */
export async function sendPasswordResetEmail(
  email: string,
  name: string,
  resetLink: string,
  expiresIn: string = '1 hour'
): Promise<boolean> {
  try {
    const result = await sendResendPasswordResetEmail(email, name, resetLink, expiresIn);
    return result.success;
  } catch (error) {
    console.error('Failed to send password reset email via Resend:', error);
    
    // Fallback to generic email
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Reset Request</h2>
        <p>Hello ${name},</p>
        <p>You requested to reset your password. Click the link below to proceed:</p>
        <p><a href="${resetLink}">Reset Password</a></p>
        <p>This link will expire in ${expiresIn}.</p>
        <p>If you didn't request this, please ignore this email.</p>
      </div>
    `;
    
    return sendEmail({
      to: email,
      subject: 'Password Reset Request - SHANFA STORE',
      html,
    });
  }
}

/**
 * Specialized function for order confirmation emails
 */
export async function sendOrderConfirmationEmail(
  to: string,
  orderId: string,
  customerName: string,
  items: Array<{ name: string; quantity: number; price: number }>,
  totalAmount: number
): Promise<boolean> {
  const formattedTotal = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(totalAmount);
  
  const itemsHtml = items.map(item => `
    <tr>
      <td>${item.name}</td>
      <td>${item.quantity}</td>
      <td>${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(item.price)}</td>
    </tr>
  `).join('');
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Order Confirmation #${orderId}</h2>
      <p>Hello ${customerName},</p>
      <p>Thank you for your order! Here's a summary:</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <thead>
          <tr style="background-color: #f5f5f5;">
            <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Item</th>
            <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Quantity</th>
            <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>
      <p><strong>Total: ${formattedTotal}</strong></p>
      <p>We'll notify you when your order ships.</p>
    </div>
  `;
  
  return sendEmail({
    to,
    subject: `Order Confirmation #${orderId} - SHANFA STORE`,
    html,
  });
}

/**
 * Backwards compatibility for order emails
 */
export async function sendOrderEmail(to: string, subject: string, html: string, text?: string) {
  return sendEmail({ to, subject, html, text });
}

/**
 * Get email service status
 */
export function getEmailServiceStatus() {
  return emailService.getStatus();
}

/**
 * Get recent email logs
 */
export function getEmailLogs(limit: number = 20) {
  return emailService.getLogs(limit);
}
