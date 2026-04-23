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
  | 'order-status-update'
  | 'admin-invite';

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
  template?: EmailTemplate;
  data?: Record<string, any>;
  html?: string;
  text?: string;
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
    id?: string;
    name: string;
    quantity: number;
    price: number;
    brand?: string;
    imageUrl?: string;
  }>;
  totalAmount: number;
  shippingAddress: string;
  trackingUrl?: string;
  paymentStatus?: 'Paid' | 'Cash on Delivery';
  paymentMethod?: string;
  estimatedDelivery?: string;
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
  email: string;
  name?: string;
  signupTime: string;
  ipAddress?: string;
}

export interface AdminInviteData {
  email: string;
  inviterName?: string;
  setupUrl: string;
  role: string;
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