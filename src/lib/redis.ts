import { createClient, RedisClientType } from 'redis';

// Redis connection options
const redisOptions = {
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    reconnectStrategy: (retries: number) => {
      if (retries > 10) {
        console.error('Redis connection failed after 10 retries');
        return new Error('Max retries reached');
      }
      return Math.min(retries * 100, 3000);
    },
  },
};

// Global Redis client instance (similar to Prisma pattern)
const globalForRedis = globalThis as unknown as {
  redis?: RedisClientType;
};

// Create Redis client with proper typing
export const redis: RedisClientType = globalForRedis.redis || createClient(redisOptions);

// Connect to Redis if not already connected
if (!globalForRedis.redis) {
  redis.on('error', (err) => console.error('Redis Client Error:', err));
  redis.on('connect', () => console.log('Redis connected successfully'));
  redis.on('reconnecting', () => console.log('Redis reconnecting...'));
  
  // Connect in all environments
  redis.connect().catch((err) => {
    console.warn('Redis connection failed (will retry):', err.message);
  });
  
  globalForRedis.redis = redis;
}

// Cache key generators
export const CacheKeys = {
  // Product-related cache keys
  product: (id: string) => `product:${id}`,
  productList: (storeCode: string, page: number, limit: number) => 
    `products:${storeCode}:page:${page}:limit:${limit}`,
  productSearch: (query: string, storeCode: string) => 
    `products:search:${storeCode}:${query}`,
  
  // Category cache keys
  categories: (storeCode: string) => `categories:${storeCode}`,
  
  // User session cache keys
  userSession: (userId: string) => `user:session:${userId}`,
  userCart: (userId: string) => `user:cart:${userId}`,
  
  // Store cache keys
  storeConfig: (storeCode: string) => `store:config:${storeCode}`,
  
  // API rate limiting
  rateLimit: (ip: string, endpoint: string) => `ratelimit:${ip}:${endpoint}`,
  
  // General cache keys
  banner: (type: string) => `banner:${type}`,
  offerBanners: (storeCode: string) => `offer:banners:${storeCode}`,
};

// Cache TTLs (in seconds)
export const CacheTTL = {
  SHORT: 60,           // 1 minute
  MEDIUM: 300,         // 5 minutes
  LONG: 3600,          // 1 hour
  VERY_LONG: 86400,    // 24 hours
  USER_SESSION: 1800,  // 30 minutes
  PRODUCT: 1800,       // 30 minutes
  CATEGORIES: 3600,    // 1 hour
};

// Cache utility functions
export class RedisCache {
  // Check if Redis client is ready
  private static async ensureConnected(): Promise<boolean> {
    try {
      // Check if client exists
      if (!redis) {
        return false;
      }
      
      // For Redis v4+, check if client is open (property, not method)
      // @ts-ignore - Type definition issue with redis client
      const isOpen = redis.isOpen;
      if (!isOpen) {
        // Try to reconnect
        await redis.connect?.().catch(() => false);
        // @ts-ignore - Type definition issue with redis client
        return redis.isOpen || false;
      }
      return true;
    } catch {
      return false;
    }
  }

  // Get cached data with type safety
  static async get<T>(key: string): Promise<T | null> {
    try {
      const isConnected = await this.ensureConnected();
      if (!isConnected) {
        console.warn('Redis not connected, skipping cache get');
        return null;
      }
      
      const data = await redis.get(key);
      if (!data) return null;
      // Type assertion to handle string | {} union
      return JSON.parse(data as string) as T;
    } catch (error) {
      console.error(`Redis get error for key ${key}:`, error);
      return null;
    }
  }

  // Set cached data with TTL
  static async set(key: string, value: any, ttl: number = CacheTTL.MEDIUM): Promise<void> {
    try {
      const isConnected = await this.ensureConnected();
      if (!isConnected) {
        console.warn('Redis not connected, skipping cache set');
        return;
      }
      await redis.set(key, JSON.stringify(value), { EX: ttl });
    } catch (error) {
      console.error(`Redis set error for key ${key}:`, error);
    }
  }

  // Delete cache key
  static async del(key: string): Promise<void> {
    try {
      const isConnected = await this.ensureConnected();
      if (!isConnected) {
        console.warn('Redis not connected, skipping cache delete');
        return;
      }
      await redis.del(key);
    } catch (error) {
      console.error(`Redis delete error for key ${key}:`, error);
    }
  }

  // Delete multiple cache keys by pattern
  static async delPattern(pattern: string): Promise<void> {
    try {
      const isConnected = await this.ensureConnected();
      if (!isConnected) {
        console.warn('Redis not connected, skipping pattern delete');
        return;
      }
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(keys);
      }
    } catch (error) {
      console.error(`Redis delete pattern error for ${pattern}:`, error);
    }
  }

  // Invalidate all product-related cache
  static async invalidateProducts(storeCode?: string): Promise<void> {
    try {
      const pattern = storeCode ? `products:${storeCode}:*` : 'products:*';
      await this.delPattern(pattern);
      await this.delPattern('product:*');
    } catch (error) {
      console.error('Error invalidating product cache:', error);
    }
  }

  // Invalidate user-related cache
  static async invalidateUser(userId: string): Promise<void> {
    try {
      await this.del(CacheKeys.userSession(userId));
      await this.del(CacheKeys.userCart(userId));
    } catch (error) {
      console.error(`Error invalidating user cache for ${userId}:`, error);
    }
  }

  // Check if Redis is connected
  static async isConnected(): Promise<boolean> {
    try {
      await redis.ping();
      return true;
    } catch {
      return false;
    }
  }

  // Get cache statistics
  static async getStats(): Promise<{
    connected: boolean;
    memory: any;
    keys: number;
  }> {
    try {
      const connected = await this.isConnected();
      if (!connected) {
        return { connected: false, memory: null, keys: 0 };
      }

      const info = await redis.info();
      const memoryMatch = info.match(/used_memory_human:(\S+)/);
      const keys = await redis.dbSize();

      return {
        connected: true,
        memory: memoryMatch ? memoryMatch[1] : 'unknown',
        keys,
      };
    } catch (error) {
      console.error('Error getting Redis stats:', error);
      return { connected: false, memory: null, keys: 0 };
    }
  }
}

// Rate limiting utility
export class RateLimiter {
  static async check(
    identifier: string,
    limit: number = 10,
    windowSeconds: number = 60
  ): Promise<{ allowed: boolean; remaining: number; reset: number }> {
    const key = `ratelimit:${identifier}`;
    
    try {
      const current = await redis.incr(key);
      
      if (current === 1) {
        await redis.expire(key, windowSeconds);
      }
      
      const ttl = await redis.ttl(key);
      const remaining = Math.max(0, limit - current);
      
      return {
        allowed: current <= limit,
        remaining,
        reset: ttl,
      };
    } catch (error) {
      console.error('Rate limit check error:', error);
      // Allow request if Redis fails (fail-open strategy)
      return { allowed: true, remaining: limit, reset: 0 };
    }
  }
}

// Cache middleware for Next.js API routes
export function withCache<T>(
  handler: () => Promise<T>,
  key: string,
  ttl: number = CacheTTL.MEDIUM
): () => Promise<T> {
  return async () => {
    // Try to get from cache first
    const cached = await RedisCache.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Execute handler if cache miss
    const result = await handler();
    
    // Store in cache
    await RedisCache.set(key, result, ttl);
    
    return result;
  };
}

export default redis;