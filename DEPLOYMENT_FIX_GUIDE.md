# Vercel Admin Login Fix Guide

## Problem
Master admin login (`pvs178380@gmail.com` / `pias900`) not working on Vercel deployment.

## Root Causes Identified

### 1. NEXTAUTH_URL Mismatch
- `.env` has: `NEXTAUTH_URL="https://shafan-ecom.vercel.app/"`
- Preview deployments use different URLs: `https://shafan-ecom-*.vercel.app`
- This breaks email verification links and session cookies

### 2. Missing Admin User in Production Database
- Seed script (`prisma/seed.ts`) creates master admin
- Seed may not have been run on production database
- Production database may have different credentials

### 3. Database Connection Issues
- MongoDB Atlas IP whitelist may not include Vercel IPs
- Database URL may be incorrect in Vercel environment variables

## Solutions

### Solution 1: Fix NEXTAUTH_URL Dynamically

Update your Vercel environment variables:

```bash
# For production (main domain)
NEXTAUTH_URL=https://shafan-ecom.vercel.app

# For preview deployments (auto-detect)
NEXTAUTH_URL=https://${VERCEL_URL}
```

Or update the code to handle dynamic URLs:

```typescript
// In your auth configuration
const getBaseUrl = () => {
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL;
  }
  return 'http://localhost:3000';
};

export const authOptions: NextAuthOptions = {
  // ...
  callbacks: {
    async session({ session }) {
      // Ensure session has correct base URL
      return session;
    },
  },
};
```

### Solution 2: Run Seed Script on Production

SSH into your Vercel deployment or use Vercel CLI to run:

```bash
# 1. Set DATABASE_URL environment variable
export DATABASE_URL="your_production_mongodb_url"

# 2. Run the seed script
npx prisma db push
npx prisma db seed

# Or use the provided fix script
node scripts/fix-vercel-admin.js
```

### Solution 3: Create Admin via API (Emergency)

If you can't access the database directly, create an API endpoint to create admin:

```bash
curl -X POST https://your-vercel-app.vercel.app/api/admin/create-master \
  -H "Content-Type: application/json" \
  -d '{"email":"pvs178380@gmail.com","password":"pias900"}'
```

## Immediate Fix Steps

### Step 1: Update Vercel Environment Variables
1. Go to Vercel Dashboard → Project → Settings → Environment Variables
2. Update `NEXTAUTH_URL` to: `https://${VERCEL_URL}`
3. Add `VERCEL_URL` as a system variable (auto-set by Vercel)

### Step 2: Run Database Seed on Production
```bash
# Using Vercel CLI
vercel env pull .env.production.local
npx prisma db seed
```

### Step 3: Test Admin Login
1. Visit: `https://your-vercel-app.vercel.app/ueadmin/login`
2. Use credentials:
   - Email: `pvs178380@gmail.com`
   - Password: `pias900`
3. Should see "Master Admin Detected" with bypass option

## Verification Script

Run the diagnostic script locally (pointed to production DB):

```bash
DATABASE_URL="your_production_db_url" node scripts/fix-vercel-admin.js
```

## Common Error Messages & Fixes

### "Invalid credentials" (401)
- Password hash mismatch
- User doesn't exist in database
- **Fix**: Run seed script or reset password

### "Account locked for X minutes" (403)
- Too many failed login attempts
- **Fix**: Reset lock with `scripts/reset-master-admin.js`

### "Database connection failed" (P1001)
- MongoDB Atlas IP whitelist issue
- **Fix**: Add Vercel IP ranges (0.0.0.0/0 for testing)

### "NEXTAUTH_URL must be absolute"
- URL configuration issue
- **Fix**: Set correct `NEXTAUTH_URL` environment variable

## Prevention for Future Deployments

1. **Add to package.json**:
```json
"scripts": {
  "deploy": "npm run build && vercel --prod",
  "deploy:seed": "vercel --prod && vercel env pull .env.production && npx prisma db seed"
}
```

2. **Automate in Vercel**:
   - Add `prisma db seed` to Build Command
   - Or use Vercel Deploy Hooks

3. **Environment Validation**:
   - Add check in `src/lib/auth.ts` to validate config on startup

## Emergency Access

If all else fails, create a temporary admin via MongoDB Atlas UI:

1. Login to MongoDB Atlas
2. Navigate to your cluster → Collections
3. Find `User` collection
4. Insert document:
```json
{
  "email": "pvs178380@gmail.com",
  "name": "Master Admin",
  "role": "SUPERADMIN",
  "passwordHash": "$2a$10$...", // bcrypt hash of "pias900"
  "loginAttempts": 0,
  "lockUntil": null,
  "mfaEnabled": true
}
```

To generate password hash:
```bash
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('pias900', 10).then(console.log)"
```

## Support
If issues persist, check:
- Vercel Deployment Logs
- MongoDB Atlas Logs
- Browser Console for errors
- Network tab for API responses