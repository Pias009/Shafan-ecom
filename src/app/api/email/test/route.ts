import { NextRequest, NextResponse } from 'next/server';
import { 
  sendMagicLinkEmail, 
  sendWelcomeEmail, 
  sendPasswordResetEmail,
  sendOrderConfirmationEmail,
  sendAdminLoginAlertEmail,
  sendOrderStatusEmail,
  emailService 
} from '@/lib/email/service';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Only allow admins or authenticated users in development
    if (process.env.NODE_ENV === 'production' && (!session || !session.user || session.user.role !== 'ADMIN')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { template, email, name, ...data } = body;

    if (!template || !email) {
      return NextResponse.json(
        { error: 'Missing required fields: template and email' },
        { status: 400 }
      );
    }

    let result;
    const testEmail = email || 'test@example.com';
    const testName = name || 'Test User';

    switch (template) {
      case 'magic-link':
        result = await sendMagicLinkEmail(
          testEmail,
          testName,
          'https://shanafaglobal.com/auth/magic-link?token=test-token',
          '15 minutes'
        );
        break;

      case 'welcome':
        result = await sendWelcomeEmail(
          testEmail,
          testName,
          'https://shanafaglobal.com/account'
        );
        break;

      case 'password-reset':
        result = await sendPasswordResetEmail(
          testEmail,
          testName,
          'https://shanafaglobal.com/auth/reset-password?token=test-token',
          '1 hour'
        );
        break;

      case 'order-confirmation':
        result = await sendOrderConfirmationEmail(
          'ORD-12345',
          testName,
          testEmail,
          new Date().toLocaleDateString(),
          [
            { name: 'Premium Wireless Headphones', quantity: 2, price: 29.99, imageUrl: 'https://res.cloudinary.com/dvdyut9xh/image/upload/v1776883172/ecommerce/products/p9t3hwu6uw2namqshrej_rxy07r_dqt0om.jpg' },
            { name: 'ACNE CONTROL BUNDLE', quantity: 1, price: 49.99, imageUrl: 'https://res.cloudinary.com/dvdyut9xh/image/upload/v1776883172/ecommerce/products/prod2.jpg' },
          ],
          109.97,
          '123 Main St, City, State 12345',
          'https://shanafaglobal.com/account/orders/ORD-12345',
          'Paid',
          'Credit Card',
          '2-3 business days'
        );
        break;

      case 'admin-login-alert':
        result = await sendAdminLoginAlertEmail(
          testEmail,
          testName,
          new Date().toLocaleString(),
          '192.168.1.100',
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'New York, US'
        );
        break;

      case 'order-status-update':
        result = await sendOrderStatusEmail(
          'ORD-12345',
          testEmail,
          testName,
          'Shipped',
          [{ nameSnapshot: 'Test Product', quantity: 1, unitPrice: 49.99 }],
          49.99,
          'AED',
          '123 Main St, New York, US'
        );
        break;

      default:
        return NextResponse.json(
          { error: `Unknown template: ${template}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: result.success,
      messageId: result.messageId,
      error: result.error,
      logs: emailService.getLogs(10),
      status: emailService.getStatus(),
    });

  } catch (error) {
    console.error('Error testing email:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Only allow admins or authenticated users in development
    if (process.env.NODE_ENV === 'production' && (!session || !session.user || session.user.role !== 'ADMIN')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const logs = emailService.getLogs(50);
    const status = emailService.getStatus();

    return NextResponse.json({
      status,
      logs,
      config: {
        enabled: process.env.EMAIL_ENABLED,
        provider: 'resend',
        fromEmail: process.env.RESEND_FROM_EMAIL,
        fromName: process.env.RESEND_FROM_NAME,
        nodeEnv: process.env.NODE_ENV,
      },
    });

  } catch (error) {
    console.error('Error getting email logs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}