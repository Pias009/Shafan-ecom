import { RedisCache, CacheKeys, CacheTTL, RateLimiter } from './redis';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth';

// User session caching
export class SessionCache {
  // Cache user session data
  static async getUserSession(userId: string) {
    const cacheKey = CacheKeys.userSession(userId);
    return RedisCache.get<any>(cacheKey);
  }

  // Set user session data
  static async setUserSession(userId: string, sessionData: any) {
    const cacheKey = CacheKeys.userSession(userId);
    await RedisCache.set(cacheKey, sessionData, CacheTTL.USER_SESSION);
  }

  // Invalidate user session
  static async invalidateUserSession(userId: string) {
    const cacheKey = CacheKeys.userSession(userId);
    await RedisCache.del(cacheKey);
  }

  // Cache user cart
  static async getUserCart(userId: string) {
    const cacheKey = CacheKeys.userCart(userId);
    return RedisCache.get<any>(cacheKey);
  }

  // Set user cart
  static async setUserCart(userId: string, cartData: any) {
    const cacheKey = CacheKeys.userCart(userId);
    await RedisCache.set(cacheKey, cartData, CacheTTL.SHORT); // Short TTL for cart
  }

  // Invalidate user cart
  static async invalidateUserCart(userId: string) {
    const cacheKey = CacheKeys.userCart(userId);
    await RedisCache.del(cacheKey);
  }

  // Cache user permissions/roles
  static async getUserPermissions(userId: string) {
    const cacheKey = `user:permissions:${userId}`;
    return RedisCache.get<string[]>(cacheKey);
  }

  // Set user permissions
  static async setUserPermissions(userId: string, permissions: string[]) {
    const cacheKey = `user:permissions:${userId}`;
    await RedisCache.set(cacheKey, permissions, CacheTTL.LONG);
  }
}

// Authentication rate limiting
export class AuthRateLimiter {
  static async checkLoginAttempt(email: string): Promise<{
    allowed: boolean;
    remaining: number;
    reset: number;
  }> {
    const identifier = `login:${email}`;
    return RateLimiter.check(identifier, 5, 300); // 5 attempts per 5 minutes
  }

  static async checkPasswordReset(email: string): Promise<{
    allowed: boolean;
    remaining: number;
    reset: number;
  }> {
    const identifier = `password_reset:${email}`;
    return RateLimiter.check(identifier, 3, 3600); // 3 attempts per hour
  }

  static async checkMFAAttempt(userId: string): Promise<{
    allowed: boolean;
    remaining: number;
    reset: number;
  }> {
    const identifier = `mfa:${userId}`;
    return RateLimiter.check(identifier, 5, 300); // 5 attempts per 5 minutes
  }
}

// Store configuration caching
export class StoreCache {
  static async getStoreConfig(storeCode: string) {
    const cacheKey = CacheKeys.storeConfig(storeCode);
    return RedisCache.get<any>(cacheKey);
  }

  static async setStoreConfig(storeCode: string, config: any) {
    const cacheKey = CacheKeys.storeConfig(storeCode);
    await RedisCache.set(cacheKey, config, CacheTTL.VERY_LONG);
  }

  static async invalidateStoreConfig(storeCode: string) {
    const cacheKey = CacheKeys.storeConfig(storeCode);
    await RedisCache.del(cacheKey);
  }
}

// Banner and content caching
export class ContentCache {
  static async getBanners(type: string) {
    const cacheKey = CacheKeys.banner(type);
    return RedisCache.get<any[]>(cacheKey);
  }

  static async setBanners(type: string, banners: any[]) {
    const cacheKey = CacheKeys.banner(type);
    await RedisCache.set(cacheKey, banners, CacheTTL.MEDIUM);
  }

  static async getOfferBanners(storeCode: string) {
    const cacheKey = CacheKeys.offerBanners(storeCode);
    return RedisCache.get<any[]>(cacheKey);
  }

  static async setOfferBanners(storeCode: string, banners: any[]) {
    const cacheKey = CacheKeys.offerBanners(storeCode);
    await RedisCache.set(cacheKey, banners, CacheTTL.MEDIUM);
  }

  static async invalidateBanners(type?: string) {
    if (type) {
      await RedisCache.del(CacheKeys.banner(type));
    } else {
      await RedisCache.delPattern('banner:*');
    }
  }

  static async invalidateOfferBanners(storeCode?: string) {
    if (storeCode) {
      await RedisCache.del(CacheKeys.offerBanners(storeCode));
    } else {
      await RedisCache.delPattern('offer:banners:*');
    }
  }
}

// API response caching middleware
export function withApiCache<T>(
  handler: () => Promise<T>,
  cacheKey: string,
  ttl: number = CacheTTL.MEDIUM
): () => Promise<T> {
  return async () => {
    // Check cache first
    const cached = await RedisCache.get<T>(cacheKey);
    if (cached !== null) {
      return cached;
    }

    // Execute handler
    const result = await handler();
    
    // Cache the result
    await RedisCache.set(cacheKey, result, ttl);
    
    return result;
  };
}

// Cache invalidation utilities
export class CacheInvalidator {
  static async invalidateUserRelatedCache(userId: string) {
    await SessionCache.invalidateUserSession(userId);
    await SessionCache.invalidateUserCart(userId);
    await RedisCache.del(`user:permissions:${userId}`);
  }

  static async invalidateStoreRelatedCache(storeCode: string) {
    await StoreCache.invalidateStoreConfig(storeCode);
    await ContentCache.invalidateOfferBanners(storeCode);
    await RedisCache.delPattern(`products:${storeCode}:*`);
    await RedisCache.delPattern(`categories:${storeCode}:*`);
  }

  static async invalidateAllContentCache() {
    await ContentCache.invalidateBanners();
    await ContentCache.invalidateOfferBanners();
    await RedisCache.delPattern('banner:*');
    await RedisCache.delPattern('offer:banners:*');
  }
}

// Helper to get cached session with server component
export async function getCachedServerSession() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return null;
  }

  // Try to get from cache first
  const cachedSession = await SessionCache.getUserSession(session.user.id);
  if (cachedSession) {
    return { ...session, cachedData: cachedSession };
  }

  // If not in cache, fetch and cache
  const userData = {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: session.user.role,
    permissions: [], // You would fetch these from your database
  };

  await SessionCache.setUserSession(session.user.id, userData);
  
  return { ...session, cachedData: userData };
}