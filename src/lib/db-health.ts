import { getDatabaseHealth } from "./prisma";

export interface DatabaseHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  message: string;
  timestamp: string;
  responseTime?: number;
  error?: any;
}

/**
 * Check database connection health
 * Uses the optimized health check from prisma.ts
 */
export async function checkDatabaseHealth(): Promise<DatabaseHealth> {
  const health = await getDatabaseHealth();
  
  // Convert the simple health status to our more detailed format
  if (health.status === 'healthy') {
    return {
      status: 'healthy',
      message: health.message,
      timestamp: health.timestamp,
      responseTime: health.responseTime,
    };
  } else {
    // For unhealthy status, check error details to determine if degraded or unhealthy
    let status: 'degraded' | 'unhealthy' = 'unhealthy';
    let message = health.message;
    
    if (health.error?.includes('timeout') || health.error?.includes('Timeout')) {
      message = 'Database connection timeout - check network or MongoDB Atlas configuration';
      status = 'degraded';
    } else if (health.error?.includes('TLS') || health.error?.includes('SSL')) {
      message = 'TLS/SSL handshake failed - check MongoDB Atlas TLS configuration';
      status = 'degraded';
    } else if (health.error?.includes('authentication')) {
      message = 'Authentication failed - check DATABASE_URL credentials';
      status = 'unhealthy';
    }
    
    return {
      status,
      message,
      timestamp: health.timestamp,
      responseTime: health.responseTime,
      error: health.error,
    };
  }
}

/**
 * Enhanced health check with retry logic
 */
export async function checkDatabaseHealthWithRetry(maxRetries = 2): Promise<DatabaseHealth> {
  for (let i = 0; i < maxRetries; i++) {
    const health = await checkDatabaseHealth();
    
    if (health.status === 'healthy') {
      return health;
    }
    
    if (i < maxRetries - 1) {
      console.log(`Health check attempt ${i + 1} failed, retrying...`);
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))); // Linear backoff
    }
  }
  
  // Final attempt
  return await checkDatabaseHealth();
}