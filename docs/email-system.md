# Email System Documentation

## Overview

The Shafan Store email system is built using **Resend** as the primary email provider with **SMTP fallback**. It provides a unified interface for sending transactional emails including magic links, user signup/login alerts, admin panel login notifications, order confirmations, and password resets.

## Architecture

```
src/lib/email/
├── types.ts              # TypeScript interfaces and types
├── config.ts             # Configuration and environment settings
├── service.ts            # Main email service with Resend integration
├── templates/            # React Email templates
│   ├── BaseTemplate.tsx
│   ├── MagicLinkTemplate.tsx
│   ├── WelcomeTemplate.tsx
│   ├── OrderConfirmationTemplate.tsx
│   ├── AdminLoginAlertTemplate.tsx
│   └── PasswordResetTemplate.tsx
└── (legacy email.ts)     # Unified interface with fallback
```

## Environment Configuration

### Required Environment Variables

Add these to your `.env` file:

```bash
# Resend Configuration (Primary)
RESEND_API_KEY="re_YourApiKeyHere"
RESEND_FROM_EMAIL="noreply@shafan-store.com"
RESEND_FROM_NAME="Shafan Store"

# Email Service Control
EMAIL_ENABLED="true"
EMAIL_LOG_ENABLED="true"

# SMTP Fallback (Optional)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM='"Shafan Store" <noreply@shafan-store.com>'

# Admin Email for Notifications
ADMIN_EMAIL="admin@shafan-store.com"
```

### Environment-Specific Behavior

- **Development**: Emails are logged to console, can be redirected to a test email
- **Staging**: Real emails sent, logging disabled
- **Production**: Real emails sent, logging disabled, strict security checks

## Available Email Templates

### 1. Magic Link Email
**Purpose**: Passwordless authentication for users
**Template**: `MagicLinkTemplate`
**Trigger**: User requests magic link login
**Data Required**: `email`, `name`, `magicLink`, `expiresIn`

### 2. Welcome Email
**Purpose**: New user onboarding
**Template**: `WelcomeTemplate`
**Trigger**: User signs up successfully
**Data Required**: `email`, `name`, `loginUrl`

### 3. Password Reset Email
**Purpose**: Password recovery
**Template**: `PasswordResetTemplate`
**Trigger**: User requests password reset
**Data Required**: `email`, `name`, `resetLink`, `expiresIn`

### 4. Order Confirmation Email
**Purpose**: Order receipt and confirmation
**Template**: `OrderConfirmationTemplate`
**Trigger**: Order is successfully placed
**Data Required**: `orderId`, `customerName`, `customerEmail`, `orderDate`, `items`, `totalAmount`, `shippingAddress`, `trackingUrl`

### 5. Admin Login Alert Email
**Purpose**: Security notification for admin logins
**Template**: `AdminLoginAlertTemplate`
**Trigger**: Admin user logs into admin panel
**Data Required**: `adminEmail`, `adminName`, `loginTime`, `ipAddress`, `userAgent`, `location`

## Usage Examples

### 1. Using Convenience Functions

```typescript
import { 
  sendMagicLinkEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendOrderConfirmationEmail,
  sendAdminLoginAlertEmail
} from '@/lib/email/service';

// Send magic link
await sendMagicLinkEmail(
  'user@example.com',
  'John Doe',
  'https://shafan-store.com/auth/magic-link?token=abc123',
  '15 minutes'
);

// Send welcome email
await sendWelcomeEmail(
  'user@example.com',
  'John Doe',
  'https://shafan-store.com/dashboard'
);

// Send password reset
await sendPasswordResetEmail(
  'user@example.com',
  'John Doe',
  'https://shafan-store.com/auth/reset-password?token=xyz789',
  '1 hour'
);
```

### 2. Using the Generic Email Service

```typescript
import { emailService } from '@/lib/email/service';

// Send custom email with any template
const result = await emailService.sendEmail({
  to: { email: 'user@example.com', name: 'John Doe' },
  subject: 'Your Order Has Shipped',
  template: 'order-shipped',
  data: {
    orderId: 'ORD-12345',
    trackingNumber: 'TRK-987654',
    estimatedDelivery: '2024-12-25',
  },
  cc: [{ email: 'support@shafan-store.com', name: 'Support Team' }],
});

if (result.success) {
  console.log('Email sent successfully:', result.messageId);
} else {
  console.error('Failed to send email:', result.error);
}
```

### 3. Using Legacy Interface (Backwards Compatible)

```typescript
import { sendEmail, sendPasswordResetEmail } from '@/lib/email';

// Generic HTML email
await sendEmail({
  to: 'user@example.com',
  subject: 'Test Email',
  html: '<h1>Hello World</h1><p>This is a test email.</p>',
  text: 'Hello World\nThis is a test email.',
});

// Specialized password reset (uses Resend template)
await sendPasswordResetEmail(
  'user@example.com',
  'John Doe',
  'https://shafan-store.com/auth/reset-password?token=xyz789'
);
```

## Integration with Existing Workflows

### Authentication Flows

The email system is automatically integrated with:

1. **Password Reset**: `src/app/api/auth/password/request-reset/route.ts`
2. **User Registration**: `src/app/api/auth/register/route.ts`
3. **Magic Link Authentication**: Available via API

### Order Management

Order confirmation emails can be triggered from:

1. **Checkout Completion**: `src/app/api/create-order/route.ts`
2. **Order Status Updates**: Admin panel order management

### Admin Security

Admin login alerts are triggered from:

1. **Admin Authentication**: `src/app/ueadmin/login/page.tsx`
2. **Super Admin Actions**: Security-sensitive operations

## Testing and Development

### Test API Endpoint

A test endpoint is available at `/api/email/test`:

```bash
# Get email service status and logs
GET /api/email/test

# Send test email
POST /api/email/test
Content-Type: application/json

{
  "template": "welcome",
  "email": "test@example.com",
  "name": "Test User"
}
```

Available templates: `magic-link`, `welcome`, `password-reset`, `order-confirmation`, `admin-login-alert`

### Development Mode

In development (`NODE_ENV=development`):

- Emails are logged to console
- Can redirect all emails to a test address using `DEV_EMAIL_REDIRECT`
- Resend API calls are mocked if no API key is configured

### Testing with Real Emails

1. Get a Resend API key from [resend.com](https://resend.com)
2. Add it to your `.env` file: `RESEND_API_KEY="re_..."`
3. Verify your domain in Resend dashboard
4. Test with the API endpoint

## Error Handling and Logging

### Email Logging

The system maintains an in-memory log of all email attempts:

```typescript
import { emailService } from '@/lib/email/service';

// Get recent logs
const logs = emailService.getLogs(50);
console.log('Email logs:', logs);

// Get service status
const status = emailService.getStatus();
console.log('Email service status:', status);
```

### Error Recovery

The system implements graceful degradation:

1. **Primary**: Resend API with React Email templates
2. **Fallback**: SMTP with HTML emails
3. **Final Fallback**: Console logging only

### Monitoring

Key metrics to monitor:

- Success/failure rates
- Delivery times
- Bounce rates
- Spam complaints

## Security Considerations

### 1. API Key Protection
- Resend API keys are stored in environment variables
- Never commit API keys to version control
- Use different keys for development/staging/production

### 2. Email Content Security
- All user input is sanitized before inclusion in emails
- No sensitive data in email bodies
- Use HTTPS for all links in emails

### 3. Rate Limiting
- Implement rate limiting on email endpoints
- Monitor for email abuse patterns
- Set daily sending limits in Resend dashboard

### 4. GDPR Compliance
- Include unsubscribe links in marketing emails
- Honor user email preferences
- Log email consent where required

## Deployment Checklist

### Vercel Deployment

1. Add environment variables in Vercel dashboard:
   - `RESEND_API_KEY`
   - `RESEND_FROM_EMAIL`
   - `RESEND_FROM_NAME`
   - `EMAIL_ENABLED`
   - `EMAIL_LOG_ENABLED`

2. Configure production domain in Resend dashboard

3. Test email functionality after deployment

### Render/Railway Deployment

1. Add environment variables in service settings
2. Configure domain verification in Resend
3. Set up monitoring and alerts

## Troubleshooting

### Common Issues

1. **Emails not sending**
   - Check `RESEND_API_KEY` is set and valid
   - Verify domain is verified in Resend
   - Check email logs: `GET /api/email/test`

2. **Emails going to spam**
   - Ensure SPF/DKIM/DMARC records are set up
   - Verify domain reputation
   - Monitor bounce rates in Resend dashboard

3. **Template rendering issues**
   - Check React Email component syntax
   - Verify all required props are provided
   - Test with different email clients

4. **Rate limiting errors**
   - Check Resend rate limits (currently 100 emails/day on free tier)
   - Implement queuing for bulk emails
   - Consider upgrading Resend plan

### Debugging Steps

1. Enable console logging: `EMAIL_LOG_ENABLED="true"`
2. Check service status: `GET /api/email/test`
3. Review recent logs in memory
4. Test with different email providers
5. Check network requests in browser dev tools

## Performance Optimization

### 1. Email Queueing
For high-volume applications, implement a queue system:

```typescript
// Example using Bull/Redis for queuing
import Queue from 'bull';

const emailQueue = new Queue('email', process.env.REDIS_URL);

emailQueue.process(async (job) => {
  const { template, data, recipient } = job.data;
  return await emailService.sendEmail({
    to: recipient,
    template,
    data,
  });
});

// Add email to queue instead of sending immediately
await emailQueue.add({
  template: 'welcome',
  data: { /* ... */ },
  recipient: { /* ... */ },
});
```

### 2. Template Caching
React Email templates are compiled on each send. For production optimization:

- Pre-compile templates during build
- Cache rendered HTML
- Use CDN for email assets

### 3. Batch Processing
For notification emails (newsletters, announcements):

- Use Resend batch API
- Implement pagination for large recipient lists
- Monitor sending progress

## Future Enhancements

### Planned Features

1. **Email Analytics Dashboard**
   - Open rates, click-through rates
   - Device/email client statistics
   - Geographic performance data

2. **A/B Testing**
   - Subject line testing
   - Template variant testing
   - Send time optimization

3. **Advanced Segmentation**
   - User behavior-based triggers
   - Personalized product recommendations
   - Dynamic content based on user profile

4. **Webhook Integration**
   - Delivery status webhooks
   - Bounce/complaint notifications
   - Real-time analytics updates

### Integration Opportunities

1. **Customer Support**
   - Auto-responders for support tickets
   - Satisfaction survey emails
   - Knowledge base recommendations

2. **Marketing Automation**
   - Abandoned cart recovery
   - Product review requests
   - Re-engagement campaigns

3. **Security Enhancements**
   - Two-factor authentication emails
   - Suspicious activity alerts
   - Password change confirmations

## Support and Maintenance

### Regular Maintenance Tasks

1. **Monthly**
   - Review email performance metrics
   - Update email templates for seasonal campaigns
   - Audit email list hygiene

2. **Quarterly**
   - Test all email templates
   - Review and update documentation
   - Check domain reputation

3. **Annually**
   - Review and update security practices
   - Assess email service provider costs/features
   - Train team members on email system

### Getting Help

- **Internal Documentation**: This document
- **Resend Documentation**: [https://resend.com/docs](https://resend.com/docs)
- **React Email Documentation**: [https://react.email/docs](https://react.email/docs)
- **Support Contact**: `tech-support@shafan-store.com`

---

*Last Updated: ${new Date().toISOString().split('T')[0]}*