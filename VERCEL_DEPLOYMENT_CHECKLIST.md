# Vercel Deployment Checklist - Shanfa Global E-commerce

## 📋 Pre-Deployment Checklist

### 1. Repository Setup
- [ ] Ensure all code is committed to Git
- [ ] Verify `.gitignore` excludes sensitive files (`.env`, `.env.local`, `.env.*.local`)
- [ ] Push all changes to your Git repository (GitHub/GitLab/Bitbucket)

### 2. Environment Variables Setup

#### Required Environment Variables (Copy to Vercel Dashboard)

**Core Configuration:**
```
NODE_ENV=production
NEXT_PUBLIC_VERCEL_ENV=production
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=<generate-with-openssl-rand-base64-32>
```

**Database:**
```
DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
```

**Authentication:**
```
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=<generate-with-openssl-rand-base64-32>
MASTER_ADMIN_EMAIL=your-master-admin@email.com
MASTER_ADMIN_PASSWORD=secure-password
MASTER_ADMIN_ENABLED=true
```

**Admin Panel:**
```
ACTIVE_ADMIN_PANELS=true
ADMIN_EMAIL=admin@yourdomain.com
```

**Demo Users (Optional):**
```
DEMO_SUPERADMIN_EMAIL=superadmin@example.com
DEMO_SUPERADMIN_PASSWORD=superadmin123
DEMO_ADMIN_EMAIL=admin@example.com
DEMO_ADMIN_PASSWORD=admin123
```

**Kuwait Store:**
```
KUWAIT_STORE_CODE=KUW
KUWAIT_ADMIN_EMAIL=kuwait-admin@example.com
KUWAIT_ADMIN_PASSWORD=secure-password
NEXT_PUBLIC_KUWAIT_ADMIN_EMAIL=kuwait-admin@example.com
NEXT_PUBLIC_KUWAIT_ADMIN_PASSWORD=demoadmin
```

**Stripe Payment:**
```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

**Tabby Payment (UAE, KSA, Kuwait):**
```
TABBY_API_KEY=your-tabby-api-key
TABBY_MERCHANT_CODE=your-merchant-code
TABBY_WEBHOOK_SECRET=your-webhook-secret
```

**Tamara Payment (UAE, Saudi Arabia):**
```
TAMARA_ACCESS_TOKEN=your-tamara-token
TAMARA_WEBHOOK_SECRET=your-webhook-secret
```

**Email Service (Resend):**
```
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@yourdomain.com
RESEND_FROM_NAME=Shafan Store
EMAIL_ENABLED=true
EMAIL_LOG_ENABLED=true
```

**Email Service (SMTP - Alternative):**
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password
SMTP_FROM="Shafan Store <your-email@gmail.com>"
```

**Cloudinary (Image Uploads):**
```
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

**Redis (Caching - Optional but Recommended):**
```
REDIS_URL=rediss://default:password@upstash-redis-url:6379
CACHE_TTL_SHORT=60
CACHE_TTL_MEDIUM=300
CACHE_TTL_LONG=3600
CACHE_TTL_USER_SESSION=1800
CACHE_TTL_PRODUCT=1800
```

**Security:**
```
SECRET_LOCK_PATH=/master-your-secret-path
MASTER_LOCK_ID=<generate-unique-id>
UNLOCK_TOKEN_SECRET=<generate-unique-secret>
```

**Rate Limiting:**
```
RATE_LIMIT_LOGIN_ATTEMPTS=5
RATE_LIMIT_LOGIN_WINDOW=300
RATE_LIMIT_API_REQUESTS=100
RATE_LIMIT_API_WINDOW=60
```

**Developer Access (Development Only):**
```
ALLOW_DEVELOPER_LOGIN=false
```

### 3. Vercel Project Setup

#### Step 1: Create New Project
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New Project"
3. Import your Git repository
4. Configure project settings:
   - **Framework Preset:** Next.js
   - **Root Directory:** `./` (leave as default)
   - **Build Command:** `npm run build` (auto-detected)
   - **Output Directory:** `.next` (auto-detected)
   - **Install Command:** `npm install` (auto-detected)

#### Step 2: Configure Environment Variables
1. Go to Project Settings → Environment Variables
2. Add all required environment variables from the list above
3. Set environments:
   - **Production:** All production values
   - **Preview:** Use test/staging values
   - **Development:** Use local development values

#### Step 3: Configure Build Settings
1. Go to Project Settings → Build & Development
2. Verify settings:
   - **Node.js Version:** 20.x or higher
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next`
   - **Install Command:** `npm install`

### 4. Database Setup

#### MongoDB Atlas Configuration
1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Create a new cluster (if not already created)
3. Configure IP Whitelist:
   - Add Vercel's IP ranges (0.0.0.0/0 for all IPs, or specific Vercel IPs)
4. Create database user with read/write permissions
5. Get connection string and update `DATABASE_URL` in Vercel

#### Prisma Client Generation
- The `postinstall` script in `package.json` will automatically run `prisma generate`
- This ensures Prisma Client is generated during deployment

### 5. Payment Gateway Setup

#### Stripe
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Get API keys (switch to Live mode for production)
3. Set up webhook endpoint:
   - URL: `https://your-domain.vercel.app/api/payments/stripe/webhook`
   - Events: `checkout.session.completed`, `payment_intent.succeeded`, `payment_intent.failed`
4. Copy webhook secret to Vercel environment variables

#### Tabby (UAE, KSA, Kuwait)
1. Go to [Tabby Merchant Portal](https://merchant.tabby.ai)
2. Get API credentials
3. Configure webhook endpoint in Tabby dashboard
4. Add credentials to Vercel environment variables

#### Tamara (UAE, Saudi Arabia)
1. Go to [Tamara Dashboard](https://dashboard.tamara.co)
2. Get access token
3. Configure webhook endpoint
4. Add credentials to Vercel environment variables

### 6. Email Service Setup

#### Resend (Recommended)
1. Go to [Resend Dashboard](https://resend.com/)
2. Create API key
3. Verify sender domain
4. Add API key to Vercel environment variables

#### SMTP (Alternative)
1. Configure your email provider (Gmail, SendGrid, etc.)
2. Generate app-specific password (for Gmail)
3. Add SMTP credentials to Vercel environment variables

### 7. Image Upload Setup (Cloudinary)

1. Go to [Cloudinary Dashboard](https://cloudinary.com/)
2. Get API credentials
3. Add credentials to Vercel environment variables

### 8. Redis Cache Setup (Optional but Recommended)

#### Upstash (Recommended for Vercel)
1. Go to [Upstash Console](https://console.upstash.com/)
2. Create Redis database
3. Get connection URL
4. Add `REDIS_URL` to Vercel environment variables

### 9. Domain Configuration

#### Custom Domain (Optional)
1. Go to Project Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed by Vercel
4. Update `NEXTAUTH_URL` environment variable with your custom domain

### 10. Security Configuration

#### Generate Secure Secrets
```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32

# Generate MASTER_LOCK_ID
openssl rand -hex 32

# Generate UNLOCK_TOKEN_SECRET
openssl rand -hex 64
```

#### MongoDB IP Whitelist
- Add Vercel's IP ranges to MongoDB Atlas Network Access
- For simplicity, you can allow `0.0.0.0/0` (all IPs) during initial setup
- For production, use specific Vercel IPs

### 11. Post-Deployment Verification

#### Check Build Status
- [ ] Verify build completes successfully in Vercel
- [ ] Check for any build errors or warnings

#### Test Core Functionality
- [ ] Homepage loads correctly
- [ ] Product pages display properly
- [ ] User registration/login works
- [ ] Admin panel accessible at `/ueadmin`
- [ ] Admin login works with configured credentials

#### Test Payment Flow
- [ ] Stripe checkout creates payment intent
- [ ] Webhook receives payment confirmation
- [ ] Order is created after successful payment

#### Test Email Notifications
- [ ] User registration email sent
- [ ] Password reset email sent
- [ ] Order confirmation email sent

#### Test Admin Features
- [ ] Product creation works
- [ ] Product images upload to Cloudinary
- [ ] Order management works
- [ ] Dashboard analytics display

### 12. Monitoring & Logging

#### Vercel Analytics
- [ ] Enable Vercel Analytics in project settings
- [ ] Set up error tracking

#### MongoDB Monitoring
- [ ] Enable MongoDB Atlas monitoring
- [ ] Set up alerts for high CPU/memory usage

#### Application Monitoring
- [ ] Check `/api/health` endpoint
- [ ] Monitor `/api/performance/metrics` endpoint

### 13. Performance Optimization

#### Vercel Edge Network
- [ ] Deploy to multiple regions if needed (currently set to `dub1` - Dubai)
- [ ] Configure caching headers for static assets

#### Image Optimization
- [ ] Verify Next.js Image optimization is working
- [ ] Check Cloudinary image delivery

### 14. Backup & Recovery

#### Database Backups
- [ ] Enable MongoDB Atlas automated backups
- [ ] Set backup retention period (recommended: 7-30 days)

#### Code Backup
- [ ] Ensure Git repository is properly backed up
- [ ] Tag releases for easy rollback

### 15. Troubleshooting Common Issues

#### Build Failures
- Check Node.js version compatibility
- Verify all dependencies are installed
- Check for TypeScript errors

#### Runtime Errors
- Check Vercel Function Logs
- Verify environment variables are set correctly
- Check database connection

#### Authentication Issues
- Verify `NEXTAUTH_SECRET` is set
- Check `NEXTAUTH_URL` matches your domain
- Verify cookie settings for production

#### Payment Issues
- Verify API keys are correct (test vs live mode)
- Check webhook endpoint configuration
- Verify webhook secret matches

### 16. Production Checklist

#### Final Checks Before Going Live
- [ ] All environment variables are set for production
- [ ] Database is properly configured and accessible
- [ ] Payment gateways are in live mode
- [ ] Email service is verified and working
- [ ] SSL certificate is valid (automatic with Vercel)
- [ ] Custom domain is configured (if applicable)
- [ ] Admin credentials are secure and documented
- [ ] Backup strategy is in place
- [ ] Monitoring is configured
- [ ] Error tracking is enabled

#### Post-Launch Monitoring
- [ ] Monitor application performance
- [ ] Check error logs regularly
- [ ] Monitor database performance
- [ ] Track payment success rates
- [ ] Monitor email delivery rates

---

## 🚀 Quick Deployment Commands

### Deploy via Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

### Deploy via Git Push
```bash
# Push to main branch (triggers production deployment)
git push origin main

# Push to other branches (triggers preview deployment)
git push origin feature-branch
```

---

## 📞 Support Resources

- **Vercel Documentation:** https://vercel.com/docs
- **Next.js Documentation:** https://nextjs.org/docs
- **Prisma Documentation:** https://www.prisma.io/docs
- **MongoDB Atlas Documentation:** https://docs.atlas.mongodb.com
- **Stripe Documentation:** https://stripe.com/docs
- **Resend Documentation:** https://resend.com/docs

---

## ⚠️ Important Notes

1. **Never commit `.env` files** to version control
2. **Always use strong, unique secrets** for production
3. **Test thoroughly in preview environment** before production deployment
4. **Keep dependencies updated** regularly
5. **Monitor application performance** after deployment
6. **Have a rollback plan** in case of issues
7. **Keep backups** of database and configuration
8. **Document all credentials** securely (use password manager)

---

## 🔄 Deployment Workflow

```
Development → Preview Deployment → Testing → Production Deployment → Monitoring
```

1. **Development:** Work on feature branches
2. **Preview:** Deploy to Vercel preview environment
3. **Testing:** Test all functionality in preview
4. **Production:** Merge to main branch for production deployment
5. **Monitoring:** Monitor logs, performance, and errors

---

**Last Updated:** 2026-03-30
**Project:** Shanfa Global E-commerce Platform
**Framework:** Next.js 16.1.6 (App Router)
**Database:** MongoDB Atlas with Prisma ORM
**Deployment Target:** Vercel
