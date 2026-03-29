# MongoDB Atlas Connection Fix Guide

## Problem Analysis
**Error**: `PrismaClientKnownRequestError` with "received fatal alert: InternalError"
**Root Cause**: TLS/SSL handshake failure when connecting to MongoDB Atlas

## Symptoms
- Connection timeout with "No available servers"
- TLS handshake error: "received fatal alert: InternalError"
- All connection strategies fail

## Most Likely Causes

### 1. IP Whitelisting (Most Common)
MongoDB Atlas requires IP addresses to be whitelisted.

**Solution**:
1. Log into [MongoDB Atlas](https://cloud.mongodb.com)
2. Go to Network Access
3. Add current IP address (or 0.0.0.0/0 for all IPs - NOT recommended for production)
4. Wait 1-2 minutes for changes to propagate

### 2. Node.js TLS Compatibility
Some Node.js versions have TLS compatibility issues with MongoDB Atlas.

**Solution**:
```bash
# Check Node.js version
node --version

# Update to LTS version if needed
# Recommended: Node.js 18.x or 20.x LTS
```

### 3. System Time Incorrect
TLS certificates require accurate system time.

**Solution**:
```bash
# Check system time
date

# Sync time (Linux)
sudo ntpdate -s time.nist.gov
```

### 4. Network/Firewall Issues
Corporate networks or firewalls may block MongoDB Atlas connections.

**Solution**:
- Try from a different network (mobile hotspot, home network)
- Check firewall rules
- Contact network administrator

### 5. MongoDB Atlas Cluster Issues
Cluster might be paused, stopped, or misconfigured.

**Solution**:
1. Check cluster status in MongoDB Atlas dashboard
2. Ensure cluster is running (not paused)
3. Verify database user credentials

## Immediate Fixes Applied

### 1. Updated Connection String
Modified `.env` file with enhanced parameters:
```env
DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority&tls=true&tlsAllowInvalidCertificates=false&serverSelectionTimeoutMS=10000"
```

### 2. Enhanced Prisma Client
Created `src/lib/prisma-connection.ts` with:
- Better error handling
- Connection health checks
- Retry logic with exponential backoff
- Detailed error messages

### 3. Database Health Monitoring
Created `src/lib/db-health.ts` for:
- Connection status monitoring
- Automatic retry mechanisms
- Detailed error reporting

## How to Use the Fix

### Option 1: Use Enhanced Prisma Client
```typescript
import { prisma, checkPrismaConnection, retryConnection } from '@/lib/prisma-connection';

// Check connection health
const health = await checkPrismaConnection();
if (!health.success) {
  console.error('Database connection failed:', health.error);
  
  // Try to reconnect
  const reconnected = await retryConnection(3, 1000);
  if (!reconnected) {
    throw new Error('Cannot connect to database');
  }
}
```

### Option 2: Fallback to Demo Data
If MongoDB Atlas is unavailable, implement a fallback:

```typescript
// In your API routes or components
import { prisma } from '@/lib/prisma';
import { demoProducts } from '@/lib/demo-data';

async function getProducts() {
  try {
    return await prisma.product.findMany();
  } catch (error) {
    console.error('Database error, using demo data:', error);
    return demoProducts;
  }
}
```

## Testing Your Connection

Run the diagnostic test:
```bash
node test-connection-simple.js
```

Or run comprehensive tests:
```bash
node test-all-connections.js
```

## If Nothing Works

### 1. Create Local MongoDB Fallback
```bash
# Install MongoDB locally
sudo apt-get install mongodb

# Update DATABASE_URL in .env
DATABASE_URL="mongodb://localhost:27017/shafan-ecommerce"
```

### 2. Use Prisma with SQLite (Temporary)
Change `prisma/schema.prisma`:
```prisma
datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}
```

### 3. Contact Support
- MongoDB Atlas Support: https://support.mongodb.com
- Prisma Documentation: https://www.prisma.io/docs

## Prevention for Future

1. **Implement Connection Pooling**: Use Prisma's connection pooling
2. **Add Health Checks**: Regular database health monitoring
3. **Use Environment-Specific Configs**: Different settings for dev/prod
4. **Implement Circuit Breaker**: Prevent cascading failures
5. **Regular Backups**: Ensure data recovery options

## Files Created/Modified

1. `.env` - Updated DATABASE_URL with TLS parameters
2. `src/lib/prisma.ts` - Enhanced error handling
3. `src/lib/prisma-connection.ts` - Comprehensive connection management
4. `src/lib/db-health.ts` - Health monitoring utilities
5. `test-connection-simple.js` - Basic connection test
6. `test-all-connections.js` - Comprehensive connection strategies test
7. `MONGODB_CONNECTION_FIX.md` - This documentation

## Next Steps

1. **Immediate**: Check MongoDB Atlas IP whitelisting
2. **Short-term**: Test from different network
3. **Long-term**: Implement connection resilience patterns
4. **Monitoring**: Set up alerts for database connectivity issues

## Support Contact

If issues persist, provide:
- Full error message
- Node.js version
- Operating system
- Network environment (corporate/home)
- MongoDB Atlas cluster details