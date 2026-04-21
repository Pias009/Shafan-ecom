/**
 * Email Service with Resend Provider
 * Handles sending transactional emails with logging and error handling
 */

import { Resend } from 'resend';
import { render } from '@react-email/render';
import { 
  EmailOptions, 
  EmailTemplate, 
  EmailRecipient,
  EmailLog 
} from './types';
import { getEmailConfig, getResendApiKey, shouldLogEmails, getEnvironmentConfig } from './config';

// Import email templates
import { MagicLinkTemplate } from './templates/MagicLinkTemplate';
import { WelcomeTemplate } from './templates/WelcomeTemplate';
import { OrderConfirmationTemplate } from './templates/OrderConfirmationTemplate';
import { AdminLoginAlertTemplate } from './templates/AdminLoginAlertTemplate';
import { PasswordResetTemplate } from './templates/PasswordResetTemplate';
import { OrderStatusUpdateTemplate } from './templates/OrderStatusUpdateTemplate';
import { AdminInviteTemplate } from './templates/AdminInviteTemplate';

export class EmailService {
  private resend: Resend | null = null;
  private config: ReturnType<typeof getEmailConfig>;
  private envConfig: ReturnType<typeof getEnvironmentConfig>;
  private logs: EmailLog[] = [];

  constructor() {
    this.config = getEmailConfig();
    this.envConfig = getEnvironmentConfig();
    
    if (this.config.enabled && this.config.provider === 'resend') {
      try {
        const apiKey = getResendApiKey();
        this.resend = new Resend(apiKey);
      } catch (error) {
        console.error('Failed to initialize Resend:', error);
        // Fallback to mock mode if Resend fails
        this.config.provider = 'mock';
      }
    }
  }

  /**
   * Send an email using the specified template and data
   */
  async sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const startTime = Date.now();
    
    try {
      // Check if email is enabled
      if (!this.config.enabled) {
        this.logEmail({
          template: options.template,
          recipient: this.getRecipientString(options.to),
          subject: options.subject,
          status: 'pending',
          error: 'Email service is disabled',
          sentAt: new Date(),
          data: options.data,
        });
        
        return {
          success: false,
          error: 'Email service is disabled',
        };
      }

      // Apply environment-specific redirects
      const processedOptions = this.processRecipientsForEnvironment(options);
      
      // Generate email content based on template
      const { html, text } = await this.generateEmailContent(
        processedOptions.template,
        processedOptions.data
      );

      // Prepare email payload
      const emailPayload = {
        from: `${this.config.fromName} <${this.config.fromEmail}>`,
        to: this.formatRecipients(processedOptions.to),
        subject: processedOptions.subject,
        html,
        text,
        cc: processedOptions.cc ? this.formatRecipients(processedOptions.cc) : undefined,
        bcc: processedOptions.bcc ? this.formatRecipients(processedOptions.bcc) : undefined,
        reply_to: processedOptions.replyTo,
        tags: processedOptions.tags,
      };

      let result;
      
      // Send email based on provider
      if (this.config.provider === 'resend' && this.resend) {
        // Resend expects either html or react, not both
        const resendPayload: any = {
          from: emailPayload.from,
          to: emailPayload.to,
          subject: emailPayload.subject,
          html: emailPayload.html,
        };
        
        // Add optional fields if they exist
        if (emailPayload.cc && emailPayload.cc.length > 0) {
          resendPayload.cc = emailPayload.cc;
        }
        if (emailPayload.bcc && emailPayload.bcc.length > 0) {
          resendPayload.bcc = emailPayload.bcc;
        }
        if (emailPayload.reply_to) {
          resendPayload.reply_to = emailPayload.reply_to;
        }
        if (emailPayload.tags) {
          resendPayload.tags = emailPayload.tags;
        }
        
        result = await this.resend.emails.send(resendPayload);
        
        if (result.error) {
          throw new Error(result.error.message);
        }
      } else if (this.config.provider === 'mock' || this.config.testMode) {
        // Mock sending for testing/development
        result = { id: `mock-${Date.now()}` };
        console.log('[Mock Email] Sent:', {
          to: emailPayload.to,
          subject: emailPayload.subject,
          template: options.template,
        });
      } else {
        throw new Error(`Unsupported email provider: ${this.config.provider}`);
      }

      const messageId = 'id' in result ? result.id : undefined;
      
      // Log successful email
      this.logEmail({
        template: options.template,
        recipient: this.getRecipientString(options.to),
        subject: options.subject,
        status: 'sent',
        sentAt: new Date(),
        data: options.data,
      });

      const duration = Date.now() - startTime;
      console.log(`Email sent successfully in ${duration}ms: ${options.template} to ${this.getRecipientString(options.to)}`);

      // Log successful email
      this.logEmail({
        template: options.template,
        recipient: this.getRecipientString(options.to),
        subject: options.subject,
        status: 'sent',
        sentAt: new Date(),
        data: options.data,
      });

      return {
        success: true,
        messageId,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Log failed email
      this.logEmail({
        template: options.template,
        recipient: this.getRecipientString(options.to),
        subject: options.subject,
        status: 'failed',
        error: errorMessage,
        sentAt: new Date(),
        data: options.data,
      });

      console.error('Failed to send email:', error);
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Generate email content based on template type
   */
  private async generateEmailContent(template: EmailTemplate, data: any): Promise<{ html: string; text: string }> {
    let reactComponent;
    
    switch (template) {
      case 'magic-link':
        reactComponent = MagicLinkTemplate(data);
        break;
      case 'welcome':
        reactComponent = WelcomeTemplate(data);
        break;
      case 'order-confirmation':
        reactComponent = OrderConfirmationTemplate(data);
        break;
      case 'admin-login-alert':
        reactComponent = AdminLoginAlertTemplate(data);
        break;
      case 'password-reset':
        reactComponent = PasswordResetTemplate(data);
        break;
      case 'order-status-update':
        reactComponent = OrderStatusUpdateTemplate(data);
        break;
      case 'admin-invite':
        reactComponent = AdminInviteTemplate(data);
        break;
      default:
        throw new Error(`Unsupported email template: ${template}`);
    }

    const html = await render(reactComponent);
    const text = await render(reactComponent, { plainText: true });
    
    return { html, text };
  }

  /**
   * Process recipients based on environment configuration
   */
  private processRecipientsForEnvironment(options: EmailOptions): EmailOptions {
    const { redirectAllTo, logToConsole } = this.envConfig;
    
    if (redirectAllTo && !this.config.testMode) {
      console.log(`[Email Redirect] Redirecting email to: ${redirectAllTo}`);
      
      return {
        ...options,
        to: { email: redirectAllTo, name: 'Test Recipient' },
        subject: `[REDIRECTED: ${this.getRecipientString(options.to)}] ${options.subject}`,
        bcc: undefined, // Remove BCC in redirect mode
      };
    }
    
    return options;
  }

  /**
   * Format recipients for Resend API
   */
  private formatRecipients(recipient: EmailRecipient | EmailRecipient[]): string[] {
    if (Array.isArray(recipient)) {
      return recipient.map(r => r.name ? `${r.name} <${r.email}>` : r.email);
    }
    
    return [recipient.name ? `${recipient.name} <${recipient.email}>` : recipient.email];
  }

  /**
   * Get recipient string for logging
   */
  private getRecipientString(recipient: EmailRecipient | EmailRecipient[]): string {
    if (Array.isArray(recipient)) {
      return recipient.map(r => r.email).join(', ');
    }
    
    return recipient.email;
  }

  /**
   * Log email sending attempt
   */
  private logEmail(log: Omit<EmailLog, 'id'>): void {
    if (!shouldLogEmails()) return;
    
    const emailLog: EmailLog = {
      ...log,
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
    
    this.logs.push(emailLog);
    
    // Keep only last 1000 logs in memory
    if (this.logs.length > 1000) {
      this.logs = this.logs.slice(-1000);
    }
    
    // Log to console in development
    if (this.envConfig.logToConsole) {
      console.log(`[Email Log] ${log.status.toUpperCase()}: ${log.template} to ${log.recipient}`);
      if (log.error) {
        console.log(`[Email Error] ${log.error}`);
      }
    }
  }

  /**
   * Get recent email logs
   */
  getLogs(limit: number = 50): EmailLog[] {
    return this.logs.slice(-limit).reverse();
  }

  /**
   * Clear email logs
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Get service status
   */
  getStatus(): {
    enabled: boolean;
    provider: string;
    testMode: boolean;
    totalSent: number;
    totalFailed: number;
  } {
    const sent = this.logs.filter(log => log.status === 'sent').length;
    const failed = this.logs.filter(log => log.status === 'failed').length;
    
    return {
      enabled: this.config.enabled,
      provider: this.config.provider,
      testMode: this.config.testMode,
      totalSent: sent,
      totalFailed: failed,
    };
  }
}

// Create singleton instance
export const emailService = new EmailService();

// Convenience functions for common email types
export const sendMagicLinkEmail = async (
  email: string,
  name: string,
  magicLink: string,
  expiresIn: string = '15 minutes'
) => {
  return emailService.sendEmail({
    to: { email, name },
    subject: 'Your Magic Link to Sign In - SHANFA STORE',
    template: 'magic-link',
    data: { email, name, magicLink, expiresIn },
  });
};

export const sendWelcomeEmail = async (
  email: string,
  name: string,
  loginUrl: string
) => {
  return emailService.sendEmail({
    to: { email, name },
    subject: 'Welcome to SHANFA STORE! 🎉',
    template: 'welcome',
    data: { email, name, loginUrl },
  });
};

export const sendOrderConfirmationEmail = async (
  orderId: string,
  customerName: string,
  customerEmail: string,
  orderDate: string,
  items: Array<{ name: string; quantity: number; price: number }>,
  totalAmount: number,
  shippingAddress: string,
  trackingUrl?: string
) => {
  return emailService.sendEmail({
    to: { email: customerEmail, name: customerName },
    subject: `Order Confirmed: #${orderId}`,
    template: 'order-confirmation',
    data: {
      orderId,
      customerName,
      customerEmail,
      orderDate,
      items,
      totalAmount,
      shippingAddress,
      trackingUrl,
    },
  });
};

export const sendAdminLoginAlertEmail = async (
  adminEmail: string,
  adminName: string,
  loginTime: string,
  ipAddress: string,
  userAgent: string,
  location?: string
) => {
  return emailService.sendEmail({
    to: { email: adminEmail, name: adminName },
    subject: 'Security Alert: Admin Login Detected',
    template: 'admin-login-alert',
    data: {
      adminEmail,
      adminName,
      loginTime,
      ipAddress,
      userAgent,
      location,
    },
  });
};

export const sendPasswordResetEmail = async (
  email: string,
  name: string,
  resetLink: string,
  expiresIn: string = '1 hour'
) => {
  return emailService.sendEmail({
    to: { email, name },
    subject: 'Reset Your SHANFA STORE Password',
    template: 'password-reset',
    data: { email, name, resetLink, expiresIn },
  });
};

export const sendUserSignupAlertEmail = async (
  userEmail: string,
  userName: string,
  signupTime: string,
  source: string = 'website'
) => {
  return emailService.sendEmail({
    to: { email: process.env.ADMIN_EMAIL || 'admin@shanfa-store.com', name: 'Admin' },
    subject: `New User Signup: ${userEmail}`,
    template: 'admin-login-alert',
    data: {
      adminEmail: process.env.ADMIN_EMAIL || 'admin@shanfa-store.com',
      adminName: 'Admin',
      loginTime: signupTime,
      ipAddress: 'N/A',
      userAgent: `Signup Source: ${source}`,
      location: 'Signup',
    },
  });
};

export const sendOrderStatusEmail = async (
  orderId: string,
  customerEmail: string,
  customerName: string,
  status: string,
  items: Array<{ nameSnapshot: string; quantity: number; unitPrice: number }>,
  total: number,
  currency: string,
  shippingAddress?: any
) => {
  const statusMessages: Record<string, { subject: string; message: string }> = {
    ORDER_CONFIRMED: {
      subject: `Order Confirmed: #${orderId}`,
      message: 'Your order has been confirmed and will be processed shortly.',
    },
    PROCESSING: {
      subject: `Order Processing: #${orderId}`,
      message: 'Your order is being prepared for shipment.',
    },
    READY_FOR_PICKUP: {
      subject: `Ready for Pickup: #${orderId}`,
      message: 'Your order is ready for pickup.',
    },
    ORDER_PICKED_UP: {
      subject: `Order Shipped: #${orderId}`,
      message: 'Your order has been picked up and is on its way.',
    },
    IN_TRANSIT: {
      subject: `Order In Transit: #${orderId}`,
      message: 'Your order is on its way to you.',
    },
    DELIVERED: {
      subject: `Order Delivered: #${orderId}`,
      message: 'Your order has been delivered. Thank you for shopping with us!',
    },
    CANCELLED: {
      subject: `Order Cancelled: #${orderId}`,
      message: 'Your order has been cancelled.',
    },
    REFUNDED: {
      subject: `Order Refunded: #${orderId}`,
      message: 'Your order has been refunded. The refund will be processed shortly.',
    },
  };

  const statusInfo = statusMessages[status] || { subject: `Order Update: #${orderId}`, message: 'Your order status has been updated.' };

  return emailService.sendEmail({
    to: { email: customerEmail, name: customerName },
    subject: statusInfo.subject,
    template: 'order-status-update',
    data: {
      orderId,
      customerName,
      status,
      message: statusInfo.message,
      items,
      total,
      currency,
      shippingAddress,
      trackingUrl: `https://shanfa-store.com/account/orders/${orderId}`,
    },
  });
};