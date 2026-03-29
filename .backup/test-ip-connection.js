#!/usr/bin/env node

/**
 * MongoDB Atlas IP Connection Test
 * This script tests MongoDB Atlas connection with current IP configuration
 */

const { MongoClient } = require('mongodb');
require('dotenv').config();

async function testMongoDBConnection() {
  console.log('🔍 MongoDB Atlas IP Connection Test');
  console.log('=' .repeat(50));
  
  // Get connection string from environment
  const uri = process.env.DATABASE_URL;
  
  if (!uri) {
    console.error('❌ DATABASE_URL environment variable not found');
    console.log('Please check your .env file');
    return;
  }
  
  console.log('📋 Connection Details:');
  console.log(`- Cluster: ${uri.includes('cluster0') ? 'cluster0 (detected)' : 'unknown'}`);
  console.log(`- Using SRV: ${uri.includes('mongodb+srv://') ? 'Yes' : 'No'}`);
  console.log(`- Has TLS: ${uri.includes('tls=true') ? 'Yes' : 'No'}`);
  
  // Parse username from URI for display (mask password)
  const match = uri.match(/mongodb\+srv:\/\/([^:]+):/);
  if (match) {
    console.log(`- Username: ${match[1]}`);
  }
  
  console.log('\n🔗 Testing connection...');
  
  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 10000,
    maxPoolSize: 1,
  });

  try {
    const startTime = Date.now();
    await client.connect();
    const connectTime = Date.now() - startTime;
    
    console.log(`✅ Connection successful! (${connectTime}ms)`);
    
    // Test database access
    const db = client.db();
    const dbName = db.databaseName;
    console.log(`✅ Connected to database: "${dbName}"`);
    
    // List collections
    try {
      const collections = await db.listCollections().toArray();
      console.log(`✅ Collections accessible: ${collections.length}`);
      
      if (collections.length > 0) {
        console.log('\n📊 Collection list:');
        collections.slice(0, 5).forEach((col, i) => {
          console.log(`  ${i + 1}. ${col.name}`);
        });
        if (collections.length > 5) {
          console.log(`  ... and ${collections.length - 5} more`);
        }
      }
    } catch (colError) {
      console.log('⚠️ Could not list collections (permissions may be limited)');
    }
    
    // Run a simple ping command
    try {
      const pingResult = await db.command({ ping: 1 });
      console.log(`✅ Database ping: ${pingResult.ok === 1 ? 'OK' : 'Failed'}`);
    } catch (pingError) {
      console.log('⚠️ Ping command failed (normal for some configurations)');
    }
    
    console.log('\n🎉 IP Network Access Test PASSED!');
    console.log('Your current IP address is properly whitelisted in MongoDB Atlas.');
    
  } catch (error) {
    console.error('\n❌ Connection FAILED!');
    console.error(`Error: ${error.message}`);
    
    // Detailed error analysis
    console.log('\n🔍 Error Diagnosis:');
    
    if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
      console.log('  • DNS resolution failed');
      console.log('  • Possible causes:');
      console.log('    - Cluster name incorrect');
      console.log('    - Network DNS issues');
      console.log('    - Cluster may be deleted or renamed');
    } 
    else if (error.message.includes('ETIMEDOUT') || error.message.includes('timeout')) {
      console.log('  • Connection timeout');
      console.log('  • Possible causes:');
      console.log('    - IP address not whitelisted in MongoDB Atlas');
      console.log('    - Network firewall blocking connection');
      console.log('    - MongoDB Atlas cluster paused or stopped');
    }
    else if (error.message.includes('unauthorized') || error.message.includes('authentication')) {
      console.log('  • Authentication failed');
      console.log('  • Possible causes:');
      console.log('    - Incorrect username/password');
      console.log('    - Database user permissions insufficient');
      console.log('    - IP whitelisted but credentials wrong');
    }
    else if (error.message.includes('TLS') || error.message.includes('SSL')) {
      console.log('  • TLS/SSL handshake failed');
      console.log('  • Possible causes:');
      console.log('    - Node.js version incompatible');
      console.log('    - Missing root certificates');
      console.log('    - TLS configuration issue');
    }
    else {
      console.log('  • Unknown error - check MongoDB Atlas dashboard');
    }
    
    console.log('\n🚀 Recommended fixes:');
    console.log('  1. Check MongoDB Atlas → Network Access → Add your current IP');
    console.log('  2. Verify cluster is running (not paused)');
    console.log('  3. Test with: mongosh "your-connection-string"');
    console.log('  4. Try adding ?tlsAllowInvalidCertificates=true to connection string');
    
  } finally {
    try {
      await client.close();
      console.log('\n🔌 Connection closed');
    } catch (closeError) {
      // Ignore close errors
    }
  }
}

async function getCurrentIP() {
  try {
    console.log('\n🌐 Checking current public IP address...');
    
    // Try multiple IP services
    const services = [
      'https://api.ipify.org',
      'https://checkip.amazonaws.com',
      'https://ifconfig.me/ip'
    ];
    
    for (const service of services) {
      try {
        const response = await fetch(service);
        const ip = (await response.text()).trim();
        console.log(`✅ Your current public IP: ${ip}`);
        console.log(`   Add this IP to MongoDB Atlas Network Access`);
        return ip;
      } catch (e) {
        continue;
      }
    }
    
    console.log('⚠️ Could not determine public IP automatically');
    console.log('   Visit: https://whatismyipaddress.com/ to find your IP');
    
  } catch (error) {
    console.log('⚠️ IP check failed:', error.message);
  }
}

// Main execution
(async () => {
  await testMongoDBConnection();
  await getCurrentIP();
  
  console.log('\n📚 Next steps:');
  console.log('  1. Log into MongoDB Atlas (https://cloud.mongodb.com)');
  console.log('  2. Go to Network Access under Security');
  console.log('  3. Click "Add IP Address" → "Add Current IP Address"');
  console.log('  4. Wait 2 minutes, then test again');
  console.log('\n📄 For detailed instructions, see: MONGODB_ATLAS_IP_NETWORK_SETUP.md');
})();