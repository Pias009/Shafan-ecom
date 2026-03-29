#!/bin/bash

# MongoDB Atlas IP Emergency Fix Script
# This script helps diagnose and fix IP whitelisting issues

echo "🔧 MongoDB Atlas IP Emergency Fix"
echo "================================"
echo ""

# Check if we have necessary tools
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo "⚠️  $1 not found. Installing..."
        return 1
    fi
    return 0
}

# Get current IP
echo "🌐 Getting current public IP address..."
CURRENT_IP=$(curl -s --max-time 5 ifconfig.me || curl -s --max-time 5 ipinfo.io/ip || curl -s --max-time 5 icanhazip.com || echo "UNKNOWN")

if [ "$CURRENT_IP" = "UNKNOWN" ]; then
    echo "❌ Could not determine public IP. Check internet connection."
    exit 1
fi

echo "✅ Your current public IP: $CURRENT_IP"
echo ""

# Check MongoDB Atlas connection
echo "🔍 Testing MongoDB Atlas connection..."
if [ -f ".env" ]; then
    DATABASE_URL=$(grep DATABASE_URL .env | cut -d '=' -f2- | tr -d '"' | tr -d "'")
    if [ -n "$DATABASE_URL" ]; then
        echo "📋 Found DATABASE_URL in .env"
        
        # Extract cluster info
        CLUSTER=$(echo $DATABASE_URL | grep -o '@[^/]*' | cut -d '@' -f2)
        if [ -n "$CLUSTER" ]; then
            echo "📡 Cluster: $CLUSTER"
            
            # Test DNS
            echo "🔍 Testing DNS resolution..."
            if nslookup $CLUSTER > /dev/null 2>&1; then
                echo "✅ DNS resolution successful"
            else
                echo "⚠️  DNS resolution failed for $CLUSTER"
            fi
        fi
    else
        echo "⚠️  DATABASE_URL not found in .env"
    fi
else
    echo "⚠️  .env file not found"
fi

echo ""
echo "🚀 IMMEDIATE ACTION REQUIRED"
echo "============================"
echo ""
echo "1. 📱 Log into MongoDB Atlas:"
echo "   https://cloud.mongodb.com"
echo ""
echo "2. 🔒 Navigate to:"
echo "   Security → Network Access"
echo ""
echo "3. ➕ Click 'Add IP Address'"
echo ""
echo "4. 📝 Add this IP address:"
echo "   $CURRENT_IP/32"
echo ""
echo "5. 🏷️  Description (optional):"
echo "   \"$(date '+%Y-%m-%d %H:%M') - $(hostname)\""
echo ""
echo "6. ✅ Click 'Confirm'"
echo ""
echo "⏳ WAIT 2-5 MINUTES for changes to propagate"
echo ""
echo "7. 🔄 Test connection:"
echo "   node test-simple-ip-check.js"
echo ""

# Optional: Test after waiting
read -p "Do you want to test after waiting 2 minutes? (y/n): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "⏳ Waiting 120 seconds for IP changes to propagate..."
    sleep 120
    
    echo ""
    echo "🔄 Testing connection..."
    if [ -f "test-simple-ip-check.js" ]; then
        node test-simple-ip-check.js
    else
        echo "⚠️  test-simple-ip-check.js not found"
        echo "📋 Quick test:"
        node -e "
        const {PrismaClient} = require('@prisma/client');
        const prisma = new PrismaClient();
        prisma.\$connect().then(() => {
          console.log('✅ Connected to MongoDB Atlas!');
          console.log('🎉 IP whitelisting successful!');
          prisma.\$disconnect();
        }).catch(err => {
          console.error('❌ Connection failed:', err.message);
          if (err.message.includes('timeout') || err.message.includes('ENOTFOUND')) {
            console.log('🔍 IP may still not be whitelisted');
            console.log('🔍 Try adding 0.0.0.0/0 temporarily for testing');
          }
        });
        "
    fi
fi

echo ""
echo "📚 Additional Resources:"
echo "   - MONGODB_ATLAS_IP_NETWORK_SETUP.md (Detailed guide)"
echo "   - MONGODB_IP_TROUBLESHOOTING.md (Troubleshooting)"
echo "   - MONGODB_CONNECTION_FIX.md (Existing fixes)"
echo ""
echo "🔧 If still having issues:"
echo "   1. Try adding 0.0.0.0/0 temporarily"
echo "   2. Check cluster status in MongoDB Atlas"
echo "   3. Verify database user credentials"
echo "   4. Contact network administrator"
echo ""
echo "✅ Script complete. Follow the steps above to fix IP whitelisting."