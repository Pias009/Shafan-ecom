import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/**
 * Enhanced Prisma client with optimized MongoDB Atlas connection
 * Includes timeout settings, connection pooling, and better error handling
 */
function getOptimizedConnectionUrl(): string {
  const dbUrl = process.env.DATABASE_URL || "";
  
  if (!dbUrl) {
    throw new Error("DATABASE_URL environment variable is not set");
  }
  
  // If using MongoDB SRV connection, add optimized parameters
  if (dbUrl.includes('mongodb+srv://')) {
    try {
      const url = new URL(dbUrl);
      
      // Add optimized connection parameters for better performance and reliability
      url.searchParams.set('serverSelectionTimeoutMS', '10000'); // Faster server selection
      url.searchParams.set('socketTimeoutMS', '30000'); // Socket timeout
      url.searchParams.set('connectTimeoutMS', '10000'); // Connection timeout
      url.searchParams.set('maxPoolSize', '20'); // Increased pool size for better concurrency
      url.searchParams.set('minPoolSize', '5'); // Maintain minimum connections
      url.searchParams.set('maxIdleTimeMS', '60000'); // Close idle connections after 60s
      url.searchParams.set('waitQueueTimeoutMS', '5000'); // Wait queue timeout
      
      return url.toString();
    } catch (error) {
      console.warn('Failed to parse DATABASE_URL, using original:', error);
      return dbUrl;
    }
  }
  
  return dbUrl;
}

// Create optimized Prisma client
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    // Apply datasource URL with optimized parameters
    datasources: {
      db: {
        url: getOptimizedConnectionUrl(),
      },
    },
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/**
 * Test database connection with retry logic
 */
export async function testDatabaseConnection(maxRetries = 3): Promise<boolean> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      // Simple query to test connection - using findFirst on a collection that exists
      await prisma.user.findFirst({ take: 1 });
      console.log(`Database connection successful (attempt ${i + 1}/${maxRetries})`);
      return true;
    } catch (error: any) {
      console.error(`Connection attempt ${i + 1}/${maxRetries} failed:`, error.message);
      
      if (i < maxRetries - 1) {
        const delay = 1000 * Math.pow(2, i); // Exponential backoff: 1s, 2s, 4s
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  return false;
}

/**
 * Get database connection health status
 */
export async function getDatabaseHealth() {
  const startTime = Date.now();
  
  try {
    // Simple health check using findFirst
    await prisma.user.findFirst({ take: 1 });
    const responseTime = Date.now() - startTime;
    
    return {
      status: 'healthy' as const,
      message: 'Database connection successful',
      responseTime,
      timestamp: new Date().toISOString(),
    };
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    
    return {
      status: 'unhealthy' as const,
      message: `Database connection failed: ${error.message}`,
      responseTime,
      timestamp: new Date().toISOString(),
      error: error.message,
    };
  }
}

export default prisma;
