# VERCEL DEPLOYMENT ENVIRONMENT CHECKLIST

## 🚀 Required Environment Variables

### Core Authentication
- [ ] `NEXTAUTH_URL` = Your production URL (e.g., https://shafan-store.vercel.app)
- [ ] `NEXTAUTH_SECRET` = Strong random string (min 32 chars) - generate with: `openssl rand -base64 32`

### Database (MongoDB Atlas)
- [ ] `DATABASE_URL` = MongoDB Atlas connection string
  - Format: `mongodb+srv://<username>:<password>@cluster.mongodb.net/<database>?retryWrites=true&w=majority`
  - Ensure IP whitelisting includes Vercel IP ranges (0.0.0.0/0 for testing)

### Payment Processing (Stripe)
- [ ] `STRIPE_SECRET_KEY` = Live Stripe secret key (starts with `sk_live_`)
- [ ] `STRIPE_WEBHOOK_SECRET` = Stripe webhook signing secret (wh_)
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` = Stripe publishable key (starts with `pk_live_`)

### Email Service (Resend)
- [ ] `RESEND_API_KEY` = Resend API key (starts with `re_`)
- [ ] `RESEND_FROM_EMAIL` = Verified sender email (e.g., Global@shafan-store.com)
- [ ] `RESEND_FROM_NAME` = Sender name (e.g., "Shafan Store")
- [ ] `EMAIL_ENABLED` = "true"
- [ ] `EMAIL_LOG_ENABLED` = "true" (for debugging)

### Cloudinary (Image Uploads)
- [ ] `CLOUDINARY_CLOUD_NAME` = Your Cloudinary cloud name
- [ ] `CLOUDINARY_API_KEY` = Cloudinary API key
- [ ] `CLOUDINARY_API_SECRET` = Cloudinary API secret

### Redis (Caching - Optional but Recommended)
- [ ] `REDIS_URL` = Upstash Redis URL (recommended for Vercel)
- [ ] `REDIS_TOKEN` = Upstash Redis REST token

### Application Configuration
- [ ] `ADMIN_EMAIL` = Primary admin notification email
- [ ] `ACTIVE_ADMIN_PANELS` = "true" (to enable admin access)
- [ ] `KUWAIT_STORE_CODE` = "KUW" (for Kuwait store)
- [ ] `UAE_STORE_CODE` = "UAE" (for UAE store)
- [ ] `NODE_ENV` = "production"

## 🔧 Database Preparation Steps

### 1. MongoDB Atlas Setup
- [ ] Create MongoDB Atlas account
- [ ] Create cluster (Shared/M10 recommended)
- [ ] Create database user with read/write permissions
- [ ] Whitelist IP addresses (0.0.0.0/0 for all or Vercel IP ranges)
- [ ] Get connection string

### 2. Apply Database Schema
```bash
# Run Prisma migrations
npx prisma db push

# Seed initial data
npx prisma db seed
```

### 3. Verify Database Connection
```bash
# Test connection
node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.$connect().then(() => console.log('Connected')).catch(e => console.error(e))"
```

## 📦 External Services Setup

### Stripe Configuration
- [ ] Create Stripe account (live mode)
- [ ] Get API keys from Dashboard → Developers → API keys
- [ ] Configure webhook endpoint: `https://your-domain.com/api/payments/stripe/webhook`
- [ ] Select events: `checkout.session.completed`, `payment_intent.succeeded`, `payment_intent.payment_failed`
- [ ] Test webhook signature

### Cloudinary Setup
- [ ] Create Cloudinary account
- [ ] Get cloud name, API key, and API secret from Dashboard
- [ ] Configure upload preset if needed

### Resend Email Setup
- [ ] Create Resend account
- [ ] Verify sending domain (shafan-store.com)
- [ ] Get API key
- [ ] Test email sending

## 🛡️ Security Verification

### API Security
- [ ] All API routes have proper authentication checks
- [ ] Admin routes enforce MFA and role-based access
- [ ] Input validation with Zod on all endpoints
- [ ] CORS properly configured for production domains
- [ ] Rate limiting implemented (consider Upstash Redis)

### Data Protection
- [ ] Sensitive data encrypted (passwords hashed with bcrypt)
- [ ] JWT tokens use secure signing
- [ ] HTTP-only cookies for session management
- [ ] No sensitive data in client-side storage

### Payment Security
- [ ] Stripe webhook signature verification implemented
- [ ] No card data stored locally
- [ ] PCI compliance through Stripe Elements

## 🌐 Domain & SSL Configuration

### Custom Domain (Optional)
- [ ] Purchase domain (shafan-store.com)
- [ ] Add domain in Vercel project settings
- [ ] Configure DNS records:
  - A record: `@` → Vercel IP
  - CNAME: `www` → cname.vercel-dns.com
- [ ] Wait for SSL certificate provisioning (automatic)

### SSL Verification
- [ ] HTTPS enforced (automatic with Vercel)
- [ ] SSL certificate valid (check with SSL Labs)
- [ ] HSTS headers configured

## 🧪 Pre-Deployment Testing

### Local Testing
- [ ] `npm run build` succeeds
- [ ] `npm run lint` passes
- [ ] `npx tsc --noEmit` passes (no TypeScript errors)
- [ ] All API endpoints respond correctly
- [ ] Authentication flows work
- [ ] Payment simulation works

### Integration Testing
- [ ] Database connection works
- [ ] Email sending works (test mode)
- [ ] Image upload to Cloudinary works
- [ ] Stripe payment intent creation works

## 🚀 Vercel Deployment Steps

### 1. Connect Repository
- [ ] Connect GitHub/GitLab/Bitbucket repository to Vercel
- [ ] Select main branch for production deployments
- [ ] Configure build settings:
  - Framework: Next.js
  - Build Command: `npm run build`
  - Output Directory: `.next`
  - Install Command: `npm install`

### 2. Environment Variables
- [ ] Add all required environment variables in Vercel dashboard
- [ ] Mark sensitive variables as "Encrypted"
- [ ] Set different values for Production vs Preview environments

### 3. Deploy
- [ ] Trigger manual deployment from main branch
- [ ] Monitor build logs for errors
- [ ] Verify deployment URL is accessible

### 4. Post-Deployment Verification
- [ ] Homepage loads without errors
- [ ] Product listing displays correctly
- [ ] User registration works
- [ ] Login authentication works
- [ ] Add to cart functionality works
- [ ] Checkout flow initiates
- [ ] Admin panel accessible at `/ueadmin`
- [ ] All API endpoints respond correctly

## 📊 Monitoring & Maintenance

### Immediate Post-Deployment
- [ ] Set up error tracking (Sentry/LogRocket)
- [ ] Configure analytics (Google Analytics/Vercel Analytics)
- [ ] Set up uptime monitoring (UptimeRobot)
- [ ] Configure backup for database

### Regular Maintenance
- [ ] Weekly: Review error logs
- [ ] Monthly: Update dependencies
- [ ] Monthly: Test checkout flow
- [ ] Quarterly: Security audit
- [ ] Annually: Renew domain and SSL

## 🆘 Emergency Contacts

### Technical Support
- **Vercel Support**: https://vercel.com/support
- **Stripe Support**: https://stripe.com/contact
- **MongoDB Support**: https://www.mongodb.com/support
- **Cloudinary Support**: https://support.cloudinary.com
- **Resend Support**: https://resend.com/contact

### Development Team
- Primary Developer: [Name/Contact]
- Backup Developer: [Name/Contact]
- System Admin: [Name/Contact]

---

## ✅ FINAL DEPLOYMENT SIGN-OFF

**Before going live to customers:**

- [ ] All environment variables configured and tested
- [ ] Database seeded with initial products and admin users
- [ ] Payment gateway tested in live mode with small transaction
- [ ] Email notifications working for critical flows
- [ ] Admin panel secure and accessible only to authorized users
- [ ] Performance tests passed (Lighthouse score > 80)
- [ ] Mobile responsiveness verified on multiple devices
- [ ] SEO meta tags configured
- [ ] Analytics tracking implemented
- [ ] Legal pages (Privacy Policy, Terms of Service) added
- [ ] Backup and recovery plan documented

**Deployment Approval:**
- [ ] Technical Lead: ___________________ Date: _________
- [ ] Project Manager: ___________________ Date: _________
- [ ] Security Officer: ___________________ Date: _________

**GO LIVE APPROVED: ✅ YES / NO**