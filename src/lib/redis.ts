/**
 * Redis removed fully as per user request.
 * All cache functions now return null or perform no action.
 */

// Cache key generators
export const CacheKeys = {
  product: (id: string) => `product:${id}`,
  productList: (storeCode: string, page: number, limit: number) => 
    `products:${storeCode}:page:${page}:limit:${limit}`,
  productSearch: (query: string, storeCode: string) => 
    `products:search:${storeCode}:${query}`,
  categories: (storeCode: string) => `categories:${storeCode}`,
  userSession: (userId: string) => `user:session:${userId}`,
  userCart: (userId: string) => `user:cart:${userId}`,
  storeConfig: (storeCode: string) => `store:config:${storeCode}`,
  rateLimit: (ip: string, endpoint: string) => `ratelimit:${ip}:${endpoint}`,
  banner: (type: string) => `banner:${type}`,
  offerBanners: (storeCode: string) => `offer:banners:${storeCode}`,
};

// Cache TTLs (in seconds)
export const CacheTTL = {
  SHORT: 60,
  MEDIUM: 300,
  LONG: 3600,
  VERY_LONG: 86400,
  USER_SESSION: 1800,
  PRODUCT: 1800,
  CATEGORIES: 3600,
};

// Mock Redis client that does nothing
export const redis: any = {
  get: async () => null,
  set: async () => {},
  del: async () => {},
  keys: async () => [],
  ping: async () => 'PONG',
  info: async () => '',
  dbSize: async () => 0,
  incr: async () => 1,
  expire: async () => true,
  ttl: async () => 0,
  on: () => {},
  connect: async () => {},
  disconnect: async () => {},
};

// Cache utility functions (Mocked)
export class RedisCache {
  static async get<T>(key: string): Promise<T | null> { return null; }
  static async set(key: string, value: any, ttl: number = CacheTTL.MEDIUM): Promise<void> {}
  static async del(key: string): Promise<void> {}
  static async delPattern(pattern: string): Promise<void> {}
  static async invalidateProducts(storeCode?: string): Promise<void> {}
  static async invalidateUser(userId: string): Promise<void> {}
  static async isConnected(): Promise<boolean> { return false; }
  static async getStats(): Promise<any> { return { connected: false, memory: null, keys: 0 }; }
}

// Rate limiting utility (Mocked - always allow)
export class RateLimiter {
  static async check(identifier: string, limit: number = 10, windowSeconds: number = 60): Promise<any> {
    return { allowed: true, remaining: limit, reset: 0 };
  }
}

// Cache middleware (Mocked - just runs handler)
export function withCache<T>(handler: () => Promise<T>, key: string, ttl: number = CacheTTL.MEDIUM): () => Promise<T> {
  return async () => await handler();
}

export default redis;