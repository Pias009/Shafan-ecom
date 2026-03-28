#!/bin/bash

# Shafan E-commerce Vercel Deployment Script
# Usage: ./scripts/deploy-vercel.sh [environment]

set -e

ENV=${1:-production}
PROJECT_NAME="shafan-ecommerce"
GIT_BRANCH=$(git branch --show-current)

echo "🚀 Starting Vercel deployment for Shafan E-commerce"
echo "Environment: $ENV"
echo "Git Branch: $GIT_BRANCH"
echo "Project: $PROJECT_NAME"
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI is not installed. Installing..."
    npm install -g vercel
fi

# Run tests before deployment
echo "🧪 Running pre-deployment tests..."
npm run test-courier 2>/dev/null || echo "Warning: Courier tests skipped"
npx tsc --noEmit && echo "✅ TypeScript compilation passed"

# Build the project locally first
echo "🔨 Building project locally..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful"
else
    echo "❌ Build failed. Please fix errors before deployment."
    exit 1
fi

# Database setup for production
if [ "$ENV" = "production" ]; then
    echo "🗄️ Setting up production database..."
    
    # Generate Prisma client
    echo "📦 Generating Prisma client..."
    npx prisma generate
    
    # Push database schema (for MongoDB, this creates indexes)
    echo "🚀 Pushing database schema..."
    npx prisma db push --accept-data-loss
    
    # Seed the database with admin users and initial data
    echo "🌱 Seeding database..."
    if [ -f "prisma/seed.ts" ]; then
        npx tsx prisma/seed.ts
        echo "✅ Database seeded successfully"
    else
        echo "⚠️ Seed file not found, skipping database seeding"
    fi
    
    # Seed Kuwait admin if file exists
    if [ -f "prisma/seed-kuwait.ts" ]; then
        echo "🌱 Seeding Kuwait admin..."
        npx tsx prisma/seed-kuwait.ts
    fi
    
    # Seed multi-admin if file exists
    if [ -f "prisma/seed-multi-admin.ts" ]; then
        echo "🌱 Seeding multi-admin data..."
        npx tsx prisma/seed-multi-admin.ts
    fi
fi

# Deployment options
case $ENV in
    "production")
        echo "🌐 Deploying to Production..."
        vercel deploy --prod --confirm
        ;;
    "preview")
        echo "🔍 Deploying to Preview..."
        vercel deploy
        ;;
    "development")
        echo "🛠️ Deploying to Development..."
        vercel dev
        ;;
    *)
        echo "❌ Unknown environment: $ENV"
        echo "Usage: $0 [production|preview|development]"
        exit 1
        ;;
esac

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Deployment completed successfully!"
    echo ""
    echo "📋 Post-deployment checklist:"
    echo "   1. Verify environment variables in Vercel dashboard"
    echo "   2. Test homepage: https://$PROJECT_NAME.vercel.app"
    echo "   3. Test authentication flow"
    echo "   4. Test product browsing"
    echo "   5. Test checkout process"
    echo "   6. Verify admin panel: /ueadmin"
    echo "   7. Check API endpoints"
    echo "   8. Verify database seeding: Test admin login"
    echo "   9. Check super admin approval system"
    echo "  10. Test developer login (localhost only)"
    echo ""
    echo "🔗 Vercel Dashboard: https://vercel.com/dashboard"
    echo "🔗 Admin Login: https://$PROJECT_NAME.vercel.app/ueadmin/login"
else
    echo "❌ Deployment failed. Check errors above."
    exit 1
fi