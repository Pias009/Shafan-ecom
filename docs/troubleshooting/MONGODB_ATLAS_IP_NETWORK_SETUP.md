# MongoDB Atlas IP Network Access Setup Guide

## Overview
This guide provides step-by-step instructions for setting up MongoDB Atlas connection with proper IP network access configuration. IP whitelisting is a critical security feature in MongoDB Atlas that controls which IP addresses can connect to your database.

## Current Configuration Analysis

### Current Connection String (from .env)
```
DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority&tls=true&tlsAllowInvalidCertificates=false&serverSelectionTimeoutMS=10000"
```

### Key Components:
- **Username**: username
- **Password**: password
- **Cluster**: cluster0.4utvsjg
- **Database**: shafan-ecommerce
- **Connection Type**: SRV (mongodb+srv://)

## Step-by-Step IP Network Access Setup

### Step 1: Log into MongoDB Atlas Dashboard
1. Go to [https://cloud.mongodb.com](https://cloud.mongodb.com)
2. Sign in with your MongoDB Atlas credentials
3. Select your project (likely "Shafan Ecommerce")

### Step 2: Navigate to Network Access
1. In the left sidebar, click **"Network Access"** under **Security**
2. You'll see the current IP access list

### Step 3: Add IP Addresses

#### Option A: Add Current IP Address (Recommended for Development)
1. Click **"Add IP Address"** button
2. Click **"Add Current IP Address"** - this automatically detects your current IP
3. Click **"Confirm"**
4. The IP will be added with a default description

#### Option B: Add Specific IP Address
1. Click **"Add IP Address"**
2. Enter the IP address in CIDR notation:
   - Single IP: `192.168.1.1/32`
   - IP Range: `192.168.1.0/24`
3. Add a description (e.g., "Office Network", "Home IP")
4. Click **"Confirm"**

#### Option C: Allow Access from Anywhere (NOT Recommended for Production)
1. Click **"Add IP Address"**
2. Enter: `0.0.0.0/0`
3. Add description: "Allow from anywhere"
4. Click **"Confirm"**
   
**⚠️ WARNING**: Option C is insecure and should only be used for testing or development.

### Step 4: Configure IP Access List for Different Environments

#### Development Environment:
```
- Your home IP address
- Office IP address (if applicable)
- Localhost: 127.0.0.1/32 (for local development)
```

#### Production Environment (Vercel/Render):
1. Get your deployment platform's IP ranges:
   - **Vercel**: Check [Vercel IP Ranges](https://vercel.com/docs/security/ip-addresses)
   - **Render**: Check [Render IP Ranges](https://render.com/docs/ip-addresses)
   
2. Add all required IP ranges to MongoDB Atlas

#### Example Vercel IP Ranges (may change):
```
76.76.21.0/24
147.182.128.0/20
```

### Step 5: Wait for Propagation
- IP changes take **1-2 minutes** to propagate
- You may need to wait up to 5 minutes in some cases

## Testing the Connection

### Test 1: Basic Connection Test
Create a test file to verify connection:

```javascript
// test-mongodb-ip-connection.js
const { MongoClient } = require('mongodb');

async function testConnection() {
  const uri = process.env.DATABASE_URL || "mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority";
  
  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  });

  try {
    console.log('Testing MongoDB Atlas connection...');
    await client.connect();
    console.log('✅ Connection successful!');
    
    // Test database access
    const db = client.db('database');
    const collections = await db.listCollections().toArray();
    console.log(`✅ Database accessible. Collections: ${collections.length}`);
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    
    // Specific error diagnosis
    if (error.message.includes('ENOTFOUND')) {
      console.log('🔍 Diagnosis: DNS resolution failed. Check cluster name.');
    } else if (error.message.includes('ETIMEDOUT')) {
      console.log('🔍 Diagnosis: Connection timeout. Check IP whitelisting.');
    } else if (error.message.includes('unauthorized')) {
      console.log('🔍 Diagnosis: Authentication failed. Check credentials.');
    } else if (error.message.includes('TLS')) {
      console.log('🔍 Diagnosis: TLS handshake issue. Try adding ?tlsAllowInvalidCertificates=true');
    }
  } finally {
    await client.close();
  }
}

testConnection();
```

### Test 2: Prisma-Specific Test
```javascript
// test-prisma-connection.js
const { PrismaClient } = require('@prisma/client');

async function testPrismaConnection() {
  const prisma = new PrismaClient({
    log: ['error', 'warn'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  });

  try {
    console.log('Testing Prisma connection to MongoDB...');
    
    // Simple query to test connection
    const result = await prisma.$queryRaw`db.runCommand({ ping: 1 })`;
    console.log('✅ Prisma connection successful!', result);
    
    // Test if we can access a collection
    const userCount = await prisma.user.count();
    console.log(`✅ User collection accessible. Count: ${userCount}`);
    
  } catch (error) {
    console.error('❌ Prisma connection failed:', error.message);
    
    // Check for IP whitelisting errors
    if (error.message.includes('timeout') || error.message.includes('ENOTFOUND')) {
      console.log('🔍 Likely IP whitelisting issue. Check MongoDB Atlas Network Access.');
    }
    
  } finally {
    await prisma.$disconnect();
  }
}

testPrismaConnection();
```

## Common IP Whitelisting Issues & Solutions

### Issue 1: "Connection Timeout" or "No Available Servers"
**Solution**: 
1. Verify IP is whitelisted in MongoDB Atlas
2. Check if IP address changed (dynamic IPs)
3. Add current IP again

### Issue 2: "Authentication Failed" after IP Change
**Solution**:
1. IP is whitelisted but credentials wrong
2. Reset database user password if needed
3. Verify connection string matches Atlas credentials

### Issue 3: Vercel/Render Deployment Fails
**Solution**:
1. Add deployment platform IP ranges
2. For Vercel, check [Vercel IP Ranges](https://vercel.com/docs/security/ip-addresses)
3. For Render, check [Render IP Ranges](https://render.com/docs/ip-addresses)

### Issue 4: Dynamic IP Changes (Home/Office)
**Solution**:
1. Use MongoDB Atlas **"Add Current IP Address"** feature regularly
2. Consider using a VPN with static IP
3. Use IP range instead of single IP

## Advanced Configuration

### 1. Multiple Environment Setup
Create different IP whitelists for different environments:

```bash
# Development IPs
- 192.168.1.100/32  # Developer 1
- 192.168.1.101/32  # Developer 2
- 127.0.0.1/32      # Localhost

# Staging IPs (Vercel Preview)
- 76.76.21.0/24     # Vercel IP range

# Production IPs (Vercel Production)
- 147.182.128.0/20  # Vercel production range
```

### 2. Automated IP Updates
For dynamic IP environments, use MongoDB Atlas API to update IP programmatically:

```javascript
// Example using MongoDB Atlas API
const updateIP = async (newIP) => {
  // API call to update IP whitelist
  // Requires API key with appropriate permissions
};
```

### 3. Security Best Practices
1. **Least Privilege**: Only whitelist necessary IPs
2. **Regular Audits**: Review IP whitelist monthly
3. **Remove Unused IPs**: Delete IPs no longer needed
4. **Use IP Ranges Carefully**: Avoid overly broad ranges like `0.0.0.0/0`

## Troubleshooting Checklist

### Connection Test Fails:
- [ ] IP address whitelisted in MongoDB Atlas
- [ ] Correct cluster name in connection string
- [ ] Database user credentials correct
- [ ] Network firewall allows outbound connections on port 27017
- [ ] MongoDB Atlas cluster is running (not paused)
- [ ] Wait 2-5 minutes after IP changes

### Prisma-Specific Issues:
- [ ] Prisma schema matches database
- [ ] DATABASE_URL environment variable set
- [ ] Node.js version compatible (18.x or 20.x LTS)
- [ ] Prisma client regenerated after schema changes

### Deployment Issues:
- [ ] Deployment platform IPs whitelisted
- [ ] Environment variables set in deployment platform
- [ ] Build process includes prisma generate
- [ ] Database accessible from deployment region

## Quick Fix Commands

### 1. Test Current IP:
```bash
curl ifconfig.me
# or
curl ipinfo.io/ip
```

### 2. Test MongoDB Connection:
```bash
node -e "
const {MongoClient} = require('mongodb');
const uri = process.env.DATABASE_URL;
const client = new MongoClient(uri, {serverSelectionTimeoutMS: 5000});
client.connect().then(() => {
  console.log('Connected!');
  client.close();
}).catch(err => {
  console.error('Failed:', err.message);
  process.exit(1);
});
"
```

### 3. Reset IP Whitelist (Emergency):
1. Go to MongoDB Atlas → Network Access
2. Delete all IP entries
3. Add `0.0.0.0/0` temporarily for testing
4. Test connection
5. Remove `0.0.0.0/0` and add proper IPs

## Monitoring & Maintenance

### Regular Tasks:
1. **Weekly**: Check for unauthorized IP entries
2. **Monthly**: Review and clean up unused IPs
3. **After Team Changes**: Update IPs when developers leave/join
4. **After Office Move**: Update office IP ranges

### Alert Setup:
1. Enable MongoDB Atlas alerts for:
   - Failed authentication attempts
   - Unusual connection patterns
   - IP address changes

## Conclusion

Proper IP network access configuration is essential for MongoDB Atlas security and connectivity. By following this guide, you can ensure your ecommerce application connects reliably while maintaining security best practices.

Remember:
1. Always use specific IPs instead of `0.0.0.0/0` in production
2. Keep your IP whitelist updated as your team and infrastructure changes
3. Test connections after every IP change
4. Monitor for connection issues proactively

For additional help, refer to:
- [MongoDB Atlas Network Access Documentation](https://www.mongodb.com/docs/atlas/security/ip-access-list/)
- [Prisma MongoDB Connection Guide](https://www.prisma.io/docs/orm/overview/databases/mongodb)
- [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables)