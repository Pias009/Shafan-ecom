# MongoDB Atlas IP Troubleshooting Guide

## Quick Diagnosis Results

Based on the connection test, here's your current situation:

### ✅ What We Know:
1. **Your Current IP**: `165.101.132.236`
2. **Connection String**: Configured in `.env` file
3. **Cluster**: `cluster0.4utvsjg.mongodb.net`
4. **Issue**: IP likely not whitelisted in MongoDB Atlas

### ❌ Symptoms Detected:
- DNS resolution failed for cluster
- Prisma connection test failed
- Direct connection timeout

## Immediate Action Required

### Step 1: Whitelist Your IP in MongoDB Atlas

1. **Log into MongoDB Atlas**:
   - Go to: https://cloud.mongodb.com
   - Sign in with your credentials

2. **Navigate to Network Access**:
   - In left sidebar: **Security → Network Access**

3. **Add Your IP**:
   - Click **"Add IP Address"**
   - Click **"Add Current IP Address"** (auto-detects `165.101.132.236`)
   - Click **"Confirm"**

4. **Wait 2-5 minutes** for changes to propagate

### Step 2: Test Connection After Whitelisting

Run the test again:
```bash
node test-simple-ip-check.js
```

Or use the quick test:
```bash
node -e "
const {PrismaClient} = require('@prisma/client');
const prisma = new PrismaClient();
prisma.\$connect().then(() => {
  console.log('✅ Connected!');
  prisma.\$disconnect();
}).catch(err => {
  console.error('❌ Failed:', err.message);
  if (err.message.includes('timeout')) {
    console.log('🔍 IP likely not whitelisted');
  }
});
"
```

## Common Issues & Solutions

### Issue 1: "IP Already Whitelisted but Still Can't Connect"

**Possible Causes**:
1. **Dynamic IP Changed**: Your ISP may have changed your IP
2. **Multiple IPs Needed**: Some networks use multiple outgoing IPs
3. **Firewall Blocking**: Local firewall blocking port 27017

**Solutions**:
1. **Check current IP again**:
   ```bash
   curl ifconfig.me
   ```
2. **Add IP range instead of single IP**:
   - If your IP is `165.101.132.236`, try `165.101.132.0/24`
   - This covers 256 IPs in your subnet
3. **Allow all IPs temporarily for testing**:
   - Add `0.0.0.0/0` to MongoDB Atlas
   - Test connection
   - Remove `0.0.0.0/0` after confirming it works

### Issue 2: "Connection Works Locally but Fails on Vercel/Render"

**Solution**:
1. **Get deployment platform IP ranges**:
   - **Vercel**: https://vercel.com/docs/security/ip-addresses
   - **Render**: https://render.com/docs/ip-addresses
   
2. **Add all required IP ranges** to MongoDB Atlas

3. **Example Vercel IPs** (check for updates):
   ```
   76.76.21.0/24
   147.182.128.0/20
   ```

### Issue 3: "Authentication Failed Even After IP Whitelisting"

**Solution**:
1. **Verify credentials** in connection string:
   ```bash
   echo $DATABASE_URL | grep -o 'mongodb+srv://[^:]*:[^@]*'
   ```
   
2. **Reset database user password** in MongoDB Atlas:
   - Security → Database Access
   - Edit user → Reset password

3. **Update `.env` file** with new password

### Issue 4: "TLS/SSL Handshake Failed"

**Solution**:
1. **Update Node.js** to LTS version (18.x or 20.x)
   ```bash
   node --version
   ```

2. **Modify connection string** to allow invalid certificates (temporary):
   ```
   mongodb+srv://...?tlsAllowInvalidCertificates=true
   ```

3. **Install root certificates**:
   ```bash
   # Ubuntu/Debian
   sudo apt-get install ca-certificates
   
   # macOS
   brew install ca-certificates
   ```

## Advanced Troubleshooting

### 1. Check MongoDB Atlas Cluster Status

1. Go to MongoDB Atlas → Clusters
2. Ensure cluster is **"Active"** (not paused)
3. Check if any alerts are present

### 2. Test with MongoDB Shell (mongosh)

```bash
# Install mongosh if not available
npm install -g mongosh

# Test connection
mongosh "mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority"
```

### 3. Network Diagnostic Commands

```bash
# Check DNS resolution
nslookup cluster0.4utvsjg.mongodb.net

# Test network route
traceroute cluster0.4utvsjg.mongodb.net

# Check if port is accessible
telnet cluster0.4utvsjg.mongodb.net 27017

# Check SSL/TLS connection
openssl s_client -connect cluster0.4utvsjg.mongodb.net:27017 -tls1_2
```

### 4. Prisma-Specific Debugging

```bash
# Regenerate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Check Prisma engine logs
PRISMA_CLIENT_ENGINE_TYPE=library npx prisma --debug
```

## Emergency Fix Script

Create `fix-mongodb-ip.sh`:

```bash
#!/bin/bash
# Emergency MongoDB Atlas IP Fix Script

echo "🔧 MongoDB Atlas IP Emergency Fix"
echo "================================"

# Get current IP
CURRENT_IP=$(curl -s ifconfig.me)
echo "Current IP: $CURRENT_IP"

echo ""
echo "📋 Steps to fix:"
echo "1. Go to: https://cloud.mongodb.com"
echo "2. Navigate: Security → Network Access"
echo "3. Click: 'Add IP Address'"
echo "4. Enter: $CURRENT_IP/32"
echo "5. Description: 'Emergency fix - $(date)'"
echo "6. Click: 'Confirm'"
echo ""
echo "⏳ Wait 2 minutes, then test:"
echo "node test-simple-ip-check.js"
```

## Prevention & Best Practices

### 1. Use Static IPs Where Possible
- Consider VPN with static IP
- Business internet plans often include static IPs
- Cloud VPS with static IP for development

### 2. Automate IP Updates
For dynamic IP environments, consider:
- MongoDB Atlas API to update IP programmatically
- Scheduled script to check and update IP
- Webhook service to notify on IP change

### 3. Environment-Specific IP Lists

**Development**:
```
- Developer home IPs
- Office IP ranges
- 127.0.0.1/32 (localhost)
```

**Staging**:
```
- Vercel preview IPs
- CI/CD platform IPs
- Testing environment IPs
```

**Production**:
```
- Vercel production IPs
- Load balancer IPs
- Monitoring service IPs
```

### 4. Monitoring & Alerts

Set up alerts for:
- Failed authentication attempts
- IP address changes
- Connection timeouts
- Cluster health issues

## Quick Reference Commands

```bash
# Get your current IP
curl ifconfig.me
curl ipinfo.io/ip
curl icanhazip.com

# Test MongoDB connection
node test-simple-ip-check.js

# Test with mongosh
mongosh "$DATABASE_URL"

# Check Node.js TLS compatibility
node -p "require('tls').getCiphers().join('\n')" | head -20

# Check if port 27017 is open
nc -zv cluster0.4utvsjg.mongodb.net 27017

# Prisma diagnostics
npx prisma --version
npx prisma db pull
npx prisma studio
```

## When to Contact Support

Contact MongoDB Atlas support if:
1. IP whitelisted but still can't connect after 10 minutes
2. Cluster shows as "Paused" and won't resume
3. Database user credentials don't work after reset
4. TLS errors persist across multiple networks

## Summary

The most likely issue is that your IP `165.101.132.236` is not whitelisted in MongoDB Atlas. Follow these steps:

1. **Immediate fix**: Add `165.101.132.236` to MongoDB Atlas Network Access
2. **Wait 2-5 minutes** for propagation
3. **Test connection**: `node test-simple-ip-check.js`
4. **If still failing**: Try the troubleshooting steps above

Remember: IP whitelisting is a security feature, not a bug. It ensures only authorized networks can access your database.