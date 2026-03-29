#!/bin/bash

echo "🚀 Deploying Admin Login Fixes to Vercel"
echo "========================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
  echo "❌ Error: Not in project root directory"
  exit 1
fi

echo "📦 Checking for changes..."
git status

echo ""
echo "📝 Staging changes..."
git add .

echo ""
echo "💾 Committing changes..."
git commit -m "FIX: Admin login redirect issue on Vercel

- Added middleware matcher configuration
- Fixed master admin MFA bypass in production  
- Updated cookie domain for Vercel deployments
- Enhanced session creation for master admin
- Added masterAdminBypass flag to JWT tokens"

echo ""
echo "📤 Pushing to GitHub (triggers Vercel deployment)..."
git push origin main

echo ""
echo "✅ Deployment initiated!"
echo ""
echo "📋 Next steps:"
echo "1. Wait for Vercel deployment to complete (check Vercel dashboard)"
echo "2. Test login at: https://shafan-ecom-beta.vercel.app/ueadmin/login"
echo "3. Run test: node test-admin-login.js"
echo "4. Check Vercel logs for middleware debug messages"
echo ""
echo "🔧 If deployment fails, check:"
echo "   - Vercel project settings"
echo "   - Environment variables"
echo "   - Build logs in Vercel dashboard"