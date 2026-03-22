# Vercel Deployment Checklist - Shafan E-commerce

## 🚀 Pre-Deployment Checklist

### 1. Environment Variables (Required)
Set these in Vercel Project Settings → Environment Variables:

#### Core Authentication
- `NEXTAUTH_URL` = Your production URL (e.g., https://shafan-store.vercel.app)
- `NEXTAUTH_SECRET` = Strong random string (min 32 chars)

#### Database
- `DATABASE_URL` = MongoDB Atlas connection string

#### Payment Processing
- `STRIPE_SECRET_KEY` = Live Stripe secret key
- `STRIPE_WEBHOOK_SECRET` = Stripe webhook signing secret
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` = Stripe publishable key

#### Email Service (SMTP)
- `SMTP_HOST` = smtp.gmail.com (or your provider)
- `SMTP_PORT` = 587
- `SMTP_USER` = Your email
- `SMTP_PASS` = App-specific password
- `SMTP_FROM` = "Shafan Store <your-email@gmail.com>"

#### Cloudinary (Image Uploads)
- `CLOUDINARY_CLOUD_NAME` = Your Cloudinary cloud name
- `CLOUDINARY_API_KEY` = Cloudinary API key
- `CLOUDINARY_API_SECRET` = Cloudinary API secret

#### Redis (Caching)
- `REDIS_URL` = Upstash Redis URL (recommended for Vercel)

#### Optional Configuration
- `ADMIN_EMAIL` = Admin notification email
- `ACTIVE_ADMIN_PANELS` = "true" (to enable admin access)
- `KUWAIT_STORE_CODE` = "KUW" (for Kuwait store)

### 2. Database Preparation
- [ ] MongoDB Atlas cluster is running
- [ ] Database user with read/write permissions created
- [ ] Run Prisma migrations: `npx prisma db push`
- [ ] Seed initial data: `npx prisma db seed`

### 3. External Services Setup
- [ ] **Stripe**: Create live account, get API keys, configure webhook
- [ ] **Cloudinary**: Create account for image hosting
- [ ] **Email Service**: Configure SMTP (Gmail/Resend/SendGrid)
- [ ] **Redis**: Set up Upstash Redis for Vercel

### 4. Domain & SSL
- [ ] Custom domain configured in Vercel
- [ ] SSL certificate automatically provisioned by Vercel
- [ ] DNS records properly configured

## 🔧 Build Configuration

### Next.js Configuration (`next.config.ts`)
Already optimized for Vercel:
- Image optimization with remote patterns
- Experimental package imports optimization
- AVIF/WebP image formats

### Package.json Scripts
- `build`: Next.js build
- `start`: Next.js production server
- `postinstall`: Prisma generate (auto-runs on Vercel)

## 🛡️ Security Audit Summary

### ✅ Security Strengths
1. **Authentication**: NextAuth.js with JWT sessions
2. **Admin Protection**: MFA required, role-based access control
3. **API Security**: Input validation, proper error handling
4. **Payment Security**: Stripe integration with webhook verification
5. **Database**: MongoDB with Prisma ORM (type-safe queries)

### ⚠️ Recommendations
1. **Rate Limiting**: Implement API rate limiting (consider Upstash Redis)
2. **CORS**: Configure proper CORS for API routes
3. **Content Security Policy**: Add CSP headers
4. **Monitoring**: Set up error tracking (Sentry/LogRocket)

## 📦 Vercel-Specific Configuration

### Build Settings
- **Framework Preset**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next` (default)
- **Install Command**: `npm install`

### Environment Variables
- Set all variables from `.env.example` in Vercel dashboard
- Mark sensitive variables as "Encrypted"
- Use different values for Production vs Preview

### Serverless Functions
- **Memory**: 1024MB (recommended for e-commerce)
- **Max Duration**: 10-30 seconds for API routes
- **Regions**: Choose closest to your customers (e.g., Middle East)

## 🚨 Deployment Steps

### Step 1: Connect Repository
1. Connect your GitHub/GitLab/Bitbucket repository to Vercel
2. Select the main branch for production deployments

### Step 2: Configure Project
1. Set framework to Next.js
2. Add all environment variables
3. Configure custom domain (if needed)

### Step 3: First Deployment
1. Trigger manual deployment from main branch
2. Monitor build logs for errors
3. Test critical paths after deployment

### Step 4: Post-Deployment Verification
1. **Homepage**: Loads without errors
2. **Authentication**: Sign up/login works
3. **Products**: Product listing and details load
4. **Cart**: Add to cart functionality
5. **Checkout**: Payment flow completes
6. **Admin Panel**: Accessible at `/ueadmin`
7. **API Routes**: All endpoints respond correctly

## 🔄 Continuous Deployment

### Branch Protection
- **Main Branch**: Auto-deploys to production
- **Preview Branches**: Feature branches deploy to preview URLs
- **Deployment Checks**: Require successful builds before merging

### Monitoring
1. **Vercel Analytics**: Monitor performance metrics
2. **Error Tracking**: Integrate with error monitoring service
3. **Uptime Monitoring**: Set up status checks
4. **Performance**: Use Vercel Speed Insights

## 🐛 Troubleshooting Common Issues

### Build Failures
1. **TypeScript Errors**: Run `npx tsc --noEmit` locally first
2. **Missing Dependencies**: Check `package.json` for all required packages
3. **Environment Variables**: Verify all required vars are set in Vercel

### Runtime Issues
1. **Database Connection**: Check `DATABASE_URL` and network access
2. **Redis Connection**: Verify `REDIS_URL` and Upstash configuration
3. **Stripe Errors**: Validate API keys and webhook configuration
4. **Image Uploads**: Cloudinary credentials correct

### Performance Issues
1. **Cold Starts**: Consider increasing memory allocation
2. **Large Builds**: Enable build caching in Vercel
3. **Image Optimization**: Use Next.js Image component with Cloudinary

## 📞 Support & Maintenance

### Regular Maintenance Tasks
- [ ] Update dependencies monthly
- [ ] Monitor Stripe webhook failures
- [ ] Review error logs weekly
- [ ] Backup database regularly
- [ ] Test checkout flow monthly

### Emergency Contacts
- **Vercel Support**: https://vercel.com/support
- **Stripe Support**: https://stripe.com/contact
- **MongoDB Support**: https://www.mongodb.com/support

---

## ✅ Final Deployment Sign-off

Before going live:
- [ ] All environment variables configured
- [ ] Database seeded with test data
- [ ] Payment gateway tested in live mode
- [ ] Email notifications working
- [ ] Admin panel accessible and secure
- [ ] Performance tests passed
- [ ] Mobile responsiveness verified
- [ ] SEO meta tags configured
- [ ] Analytics tracking implemented

**Deployment Ready**: ✅ YES / NO