#!/usr/bin/env node

/**
 * Simple MongoDB Atlas IP Connection Test
 * Uses existing Prisma setup to test connection
 */

require('dotenv').config();

async function testConnection() {
  console.log('🔍 Simple MongoDB Atlas IP Connection Test');
  console.log('=' .repeat(50));
  
  // Check if DATABASE_URL is set
  const dbUrl = process.env.DATABASE_URL;
  
  if (!dbUrl) {
    console.error('❌ DATABASE_URL not found in .env file');
    console.log('Please check your .env file has:');
    console.log('DATABASE_URL="mongodb+srv://username:password@cluster..."');
    return;
  }
  
  console.log('📋 Connection string found (first 60 chars):');
  console.log(`  ${dbUrl.substring(0, 60)}...`);
  
  // Extract cluster info
  const clusterMatch = dbUrl.match(/@([^/]+)\//);
  const cluster = clusterMatch ? clusterMatch[1] : 'unknown';
  console.log(`📡 Cluster: ${cluster}`);
  
  // Check if using SRV
  const isSrv = dbUrl.includes('mongodb+srv://');
  console.log(`🔗 Connection type: ${isSrv ? 'SRV (mongodb+srv://)' : 'Standard'}`);
  
  // Test 1: Check if we can resolve DNS
  console.log('\n🔍 Test 1: DNS Resolution');
  try {
    const { execSync } = require('child_process');
    const hostname = cluster.split('.')[0] + '.mongodb.net';
    console.log(`  Resolving: ${hostname}`);
    
    execSync(`nslookup ${hostname}`, { stdio: 'pipe' });
    console.log('  ✅ DNS resolution successful');
  } catch (dnsError) {
    console.log('  ❌ DNS resolution failed');
    console.log('  This could mean:');
    console.log('    - Internet connection issue');
    console.log('    - DNS server problem');
    console.log('    - Cluster name incorrect');
  }
  
  // Test 2: Check network connectivity
  console.log('\n🔍 Test 2: Network Connectivity');
  try {
    const { execSync } = require('child_process');
    console.log('  Testing connection to MongoDB Atlas...');
    
    // Try to connect with timeout
    const net = require('net');
    const socket = new net.Socket();
    const timeout = 5000;
    
    await new Promise((resolve, reject) => {
      socket.setTimeout(timeout);
      socket.on('timeout', () => {
        socket.destroy();
        reject(new Error('Connection timeout'));
      });
      
      socket.on('error', reject);
      
      socket.connect(27017, cluster, () => {
        socket.destroy();
        resolve();
      });
    });
    
    console.log('  ✅ Network route to cluster exists');
  } catch (netError) {
    console.log(`  ⚠️ Direct connection failed: ${netError.message}`);
    console.log('  This is normal - MongoDB Atlas uses SRV records');
  }
  
  // Test 3: Try using Prisma if available
  console.log('\n🔍 Test 3: Prisma Connection Test');
  try {
    // Try to load prisma
    const { PrismaClient } = require('@prisma/client');
    console.log('  Prisma client found, testing connection...');
    
    const prisma = new PrismaClient({
      log: ['error'],
      datasources: {
        db: {
          url: dbUrl
        }
      }
    });
    
    try {
      // Simple query to test connection
      await prisma.$queryRaw`SELECT 1`;
      console.log('  ✅ Prisma connection successful!');
      console.log('  🎉 Your IP is properly whitelisted in MongoDB Atlas!');
    } catch (prismaError) {
      console.log(`  ❌ Prisma connection failed: ${prismaError.message}`);
      
      // Analyze error
      if (prismaError.message.includes('timeout') || prismaError.message.includes('ENOTFOUND')) {
        console.log('  🔍 Likely cause: IP not whitelisted in MongoDB Atlas');
        console.log('  🔍 Solution: Add your IP to MongoDB Atlas Network Access');
      } else if (prismaError.message.includes('authentication')) {
        console.log('  🔍 Likely cause: Wrong credentials');
        console.log('  🔍 Solution: Check DATABASE_URL username/password');
      } else if (prismaError.message.includes('TLS')) {
        console.log('  🔍 Likely cause: TLS handshake issue');
        console.log('  🔍 Solution: Try adding ?tlsAllowInvalidCertificates=true to connection string');
      }
    } finally {
      await prisma.$disconnect();
    }
    
  } catch (loadError) {
    console.log('  ⚠️ Prisma not available for testing');
    console.log('  Install with: npm install @prisma/client');
  }
  
  // Get current IP
  console.log('\n🌐 Your Current Public IP Address:');
  try {
    const https = require('https');
    
    const getIP = () => new Promise((resolve, reject) => {
      const req = https.get('https://api.ipify.org', (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(data.trim()));
      });
      req.on('error', reject);
      req.setTimeout(5000, () => {
        req.destroy();
        reject(new Error('Timeout'));
      });
    });
    
    const ip = await getIP();
    console.log(`  📍 ${ip}`);
    console.log(`  📝 Add this IP to MongoDB Atlas Network Access`);
  } catch (ipError) {
    console.log('  ⚠️ Could not fetch IP automatically');
    console.log('  Visit: https://whatismyipaddress.com/');
  }
  
  console.log('\n📚 Next Steps:');
  console.log('  1. Log into MongoDB Atlas: https://cloud.mongodb.com');
  console.log('  2. Go to Network Access (under Security)');
  console.log('  3. Click "Add IP Address" → "Add Current IP Address"');
  console.log('  4. Wait 2 minutes for changes to propagate');
  console.log('  5. Run this test again');
  
  console.log('\n🚀 Quick Fix Commands:');
  console.log('  # Test with curl:');
  console.log('  curl ifconfig.me');
  console.log('  ');
  console.log('  # Check if mongodb driver is installed:');
  console.log('  npm list mongodb');
  console.log('  ');
  console.log('  # Install mongodb driver for direct testing:');
  console.log('  npm install mongodb');
}

// Run test
testConnection().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});