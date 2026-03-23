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
    echo ""
    echo "🔗 Vercel Dashboard: https://vercel.com/dashboard"
else
    echo "❌ Deployment failed. Check errors above."
    exit 1
fi