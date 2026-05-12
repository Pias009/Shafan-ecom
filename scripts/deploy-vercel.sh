#!/bin/bash

# Deployment script for Vercel
# Usage: ./scripts/deploy-vercel.sh [preview|production]

TYPE=$1

if [ "$TYPE" == "production" ]; then
  echo "🚀 Deploying to PRODUCTION..."
  npx vercel --prod --yes
else
  echo "🧪 Deploying to PREVIEW..."
  npx vercel --yes
fi
