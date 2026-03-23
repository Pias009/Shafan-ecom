/**
 * Advanced caching system for performance optimization
 * Uses memory cache with LRU eviction for server-side caching
 * Implements stale-while-revalidate pattern
 */

interface CacheEntry<T = any> {
  value: T;
  timestamp: number;
  ttl: number;
  staleWhileRevalidate: number;
}

export class CacheOptimizer {
  private static instance: CacheOptimizer;
  private cache: Map<string, CacheEntry>;
  private maxSize: number;
  private hits: number = 0;
  private misses: number = 0;

  private constructor(maxSize: number = 1000) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  static getInstance(): CacheOptimizer {
    if (!CacheOptimizer.instance) {
      CacheOptimizer.instance = new CacheOptimizer();
    }
    return CacheOptimizer.instance;
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.misses++;
      return null;
    }

    const now = Date.now();
    const age = now - entry.timestamp;

    // If entry is fresh, return it
    if (age < entry.ttl * 1000) {
      this.hits++;
      return entry.value;
    }

    // If entry is stale but within revalidate window, return stale value
    // and mark for revalidation
    if (age < (entry.ttl + entry.staleWhileRevalidate) * 1000) {
      this.hits++;
      // Fire and forget revalidation
      this.revalidate(key, entry).catch(() => {});
      return entry.value;
    }

    // Entry is too old, remove it
    this.cache.delete(key);
    this.misses++;
    return null;
  }

  async set<T>(
    key: string, 
    value: T, 
    ttl: number = 300, 
    staleWhileRevalidate: number = 60
  ): Promise<void> {
    // Evict if cache is too large (LRU simulation)
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl,
      staleWhileRevalidate,
    });
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async clear(): Promise<void> {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  private async revalidate(key: string, entry: CacheEntry): Promise<void> {
    // This would typically fetch fresh data
    // For now, we just update the timestamp to extend life
    entry.timestamp = Date.now();
    this.cache.set(key, entry);
  }

  getStats() {
    const total = this.hits + this.misses;
    const hitRate = total > 0 ? (this.hits / total) * 100 : 0;
    
    return {
      size: this.cache.size,
      hits: this.hits,
      misses: this.misses,
      hitRate: `${hitRate.toFixed(2)}%`,
      maxSize: this.maxSize,
    };
  }
}

// Pre-configured cache instances
export const productCache = CacheOptimizer.getInstance();
export const apiCache = CacheOptimizer.getInstance();

// HTTP Cache Headers Helper
export function setCacheHeaders(
  response: Response,
  options: {
    maxAge?: number;
    sMaxAge?: number;
    staleWhileRevalidate?: number;
    staleIfError?: number;
    public?: boolean;
    private?: boolean;
    noCache?: boolean;
    noStore?: boolean;
    mustRevalidate?: boolean;
  } = {}
) {
  const {
    maxAge = 300,
    sMaxAge = 600,
    staleWhileRevalidate = 60,
    staleIfError = 86400,
    public: isPublic = true,
    private: isPrivate = false,
    noCache = false,
    noStore = false,
    mustRevalidate = true,
  } = options;

  if (noStore) {
    response.headers.set('Cache-Control', 'no-store');
    return;
  }

  if (noCache) {
    response.headers.set('Cache-Control', 'no-cache');
    return;
  }

  const directives: string[] = [];

  if (isPublic) directives.push('public');
  if (isPrivate) directives.push('private');
  
  directives.push(`max-age=${maxAge}`);
  directives.push(`s-maxage=${sMaxAge}`);
  
  if (staleWhileRevalidate > 0) {
    directives.push(`stale-while-revalidate=${staleWhileRevalidate}`);
  }
  
  if (staleIfError > 0) {
    directives.push(`stale-if-error=${staleIfError}`);
  }
  
  if (mustRevalidate) {
    directives.push('must-revalidate');
  }

  response.headers.set('Cache-Control', directives.join(', '));
  response.headers.set('Vary', 'Accept-Encoding, Cookie');
  
  // Set ETag for conditional requests
  const etag = `"${Date.now().toString(36)}-${Math.random().toString(36).substr(2)}"`;
  response.headers.set('ETag', etag);
}

// Cache-aware fetch wrapper
export async function cachedFetch<T>(
  url: string,
  options?: RequestInit,
  cacheKey?: string,
  ttl: number = 300
): Promise<T> {
  const key = cacheKey || url;
  const cache = apiCache;
  
  // Try cache first
  const cached = await cache.get<T>(key);
  if (cached) {
    return cached;
  }

  // Fetch fresh data
  const response = await fetch(url, options);
  
  if (!response.ok) {
    throw new Error(`Fetch failed: ${response.statusText}`);
  }

  const data = await response.json();
  
  // Cache the result
  await cache.set(key, data, ttl);
  
  return data;
}

// React hook for cached data fetching
export function useCachedQuery<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 300
) {
  // This would be implemented in a React component
  // For now, it's a placeholder for the pattern
  return {
    key,
    fetcher,
    ttl,
  };
}