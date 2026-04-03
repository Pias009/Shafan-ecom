/**
 * Email Types and Interfaces for Resend Email System
 */

export type EmailTemplate = 
  | 'magic-link'
  | 'welcome'
  | 'password-reset'
  | 'order-confirmation'
  | 'order-shipped'
  | 'order-delivered'
  | 'admin-login-alert'
  | 'user-signup-alert'
  | 'payment-receipt'
  | 'account-verification'
  | 'newsletter-welcome'
  | 'abandoned-cart'
  | 'order-status-update';

export interface EmailRecipient {
  email: string;
  name?: string;
}

export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
}

export interface EmailOptions {
  to: EmailRecipient | EmailRecipient[];
  subject: string;
  template: EmailTemplate;
  data: Record<string, any>;
  cc?: EmailRecipient | EmailRecipient[];
  bcc?: EmailRecipient | EmailRecipient[];
  replyTo?: string;
  attachments?: EmailAttachment[];
  tags?: Record<string, string>;
}

export interface EmailLog {
  id: string;
  template: EmailTemplate;
  recipient: string;
  subject: string;
  status: 'sent' | 'failed' | 'pending';
  error?: string;
  sentAt: Date;
  data?: Record<string, any>;
}

export interface MagicLinkData {
  email: string;
  name: string;
  magicLink: string;
  expiresIn: string;
}

export interface WelcomeData {
  email: string;
  name: string;
  loginUrl: string;
}

export interface OrderConfirmationData {
  orderId: string;
  customerName: string;
  customerEmail: string;
  orderDate: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  shippingAddress: string;
  trackingUrl?: string;
}

export interface PasswordResetData {
  email: string;
  name: string;
  resetLink: string;
  expiresIn: string;
}

export interface AdminLoginAlertData {
  adminEmail: string;
  adminName: string;
  loginTime: string;
  ipAddress: string;
  userAgent: string;
  location?: string;
}

export interface UserSignupAlertData {
  userEmail: string;
  userName: string;
  signupTime: string;
  source: string;
}

export interface EmailConfig {
  enabled: boolean;
  provider: 'resend' | 'smtp' | 'mock';
  fromEmail: string;
  fromName: string;
  logEnabled: boolean;
  testMode: boolean;
  testEmail?: string;
}