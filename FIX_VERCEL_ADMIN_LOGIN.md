# Fix for Vercel Admin Login Redirect Issue

## Problem
After deploying to Vercel, the admin panel (`/ueadmin`) keeps redirecting back to the login page even after successful login.

## Root Causes

### 1. NEXTAUTH_URL Mismatch
- **Local/Development**: `NEXTAUTH_URL=http://localhost:3000`
- **Production**: `NEXTAUTH_URL=https://shafan-ecom-beta.vercel.app`
- **Preview Deployment**: `NEXTAUTH_URL=https://shafan-ecom-17oxr9n5n-shanfaglobalit-7766s-projects.vercel.app`

The NEXTAUTH_URL in environment variables doesn't match the actual deployment URL, causing session cookie validation to fail.

### 2. Cookie Domain Configuration
Session cookies need to be set with the correct domain for Vercel deployments. Without proper configuration, cookies won't be sent with requests.

### 3. MFA Verification in Production
In production, SUPERADMIN cannot bypass MFA (unlike development). If `token.mfaVerified` is false, middleware redirects to login.

## Solutions Implemented

### 1. Updated NextAuth Configuration (`src/lib/auth.ts`)
Added proper cookie configuration for Vercel:
```typescript
cookies: {
  sessionToken: {
    name: process.env.NODE_ENV === 'production' 
      ? '__Secure-next-auth.session-token' 
      : 'next-auth.session-token',
    options: {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      domain: process.env.NODE_ENV === 'production' 
        ? '.vercel.app' // Allow all vercel subdomains
        : undefined,
    },
  },
},
```

### 2. Enhanced Middleware Debugging (`middleware.ts`)
Added detailed logging to diagnose token validation issues:
- Logs token presence and properties
- Logs environment variables
- Logs redirect reasons

### 3. Fixed CORS Issue (`src/components/GlobalInitializer.tsx`)
Improved error handling for ipapi.co requests:
- Added timeout to prevent hanging
- Added proper CORS headers
- Added fallback to default configuration
- Added console warnings for failed requests

## Required Vercel Environment Variables

### For Production (shafan-ecom-beta.vercel.app)
```
NEXTAUTH_URL=https://shafan-ecom-beta.vercel.app
NEXTAUTH_SECRET=land938reunocevueiu9e9bdvu9w
ACTIVE_ADMIN_PANELS=true
NODE_ENV=production
```

### For Preview Deployments
```
NEXTAUTH_URL=https://${VERCEL_URL}
NEXTAUTH_SECRET=land938reunocevueiu9e9bdvu9w
ACTIVE_ADMIN_PANELS=true
NODE_ENV=production
```

## Verification Steps

### 1. Check Current Deployment URL
```bash
# Run diagnostic script
node fix-vercel-auth.js
```

### 2. Test Admin Login
1. Navigate to `https://your-deployment.vercel.app/ueadmin/login`
2. Login with master admin credentials:
   - Email: `pvs178380@gmail.com`
   - Password: `pias900`
3. Complete MFA verification if required

### 3. Check Vercel Logs
```bash
# View deployment logs in Vercel dashboard
# Look for "MIDDLEWARE:" debug messages
```

### 4. Verify Session Persistence
1. After login, navigate to `/ueadmin/orders` or other admin pages
2. Refresh the page - should stay logged in
3. Check browser DevTools → Application → Cookies
   - Should see `__Secure-next-auth.session-token` cookie
   - Cookie domain should be `.vercel.app`

## Troubleshooting

### If still redirecting to login:

1. **Check NEXTAUTH_URL**:
   ```bash
   echo $NEXTAUTH_URL
   # Should match exact deployment URL
   ```

2. **Check MFA Verification**:
   - Admin users must have `mfaVerified: true` in their token
   - In production, even SUPERADMIN needs MFA verification

3. **Check Database Connection**:
   ```bash
   node diagnostic-check.js
   # Verify database is accessible
   ```

4. **Check Environment Variables**:
   - `ACTIVE_ADMIN_PANELS` must be `"true"` (string)
   - `NODE_ENV` should be `"production"` for Vercel deployments

## Quick Fix Script
Run the comprehensive fix script:
```bash
node scripts/fix-vercel-admin.js
```

This will:
1. Verify database connection
2. Check/update master admin account
3. Test password verification
4. Provide deployment-specific recommendations

## Expected Outcome
After applying these fixes:
1. CORS error with ipapi.co will be handled gracefully (won't break the app)
2. Admin login will persist across page navigation
3. Session cookies will be properly set for Vercel domain
4. Middleware will correctly validate admin tokens