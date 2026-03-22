# Redis Caching Strategy Implementation

## Overview
This e-commerce platform now includes a comprehensive Redis caching strategy to improve performance, reduce database load, and enhance user experience.

## What's Implemented

### 1. Redis Client Library (`src/lib/redis.ts`)
- **Global Redis client** with singleton pattern (similar to Prisma)
- **Cache key generators** for products, users, sessions, banners, etc.
- **Cache TTLs** with sensible defaults (1min to 24hrs)
- **Utility functions** for get, set, delete, and pattern-based deletion
- **Rate limiting** with configurable limits and windows
- **Cache statistics** and health checks

### 2. Product Caching (`src/lib/products.ts`)
- **Product listings** cached with pagination support
- **Individual products** cached by ID
- **Cache invalidation** when products are updated
- **Smart caching** with store-specific keys

### 3. Session & User Caching (`src/lib/session-cache.ts`)
- **User sessions** cached for faster authentication
- **User carts** cached for better performance
- **Rate limiting** for login attempts and password resets
- **Store configurations** cached globally
- **Banner/content** caching for faster page loads

### 4. Cache Warming (`scripts/cache-warmup.ts`)
- **Pre-load popular products** at application startup
- **Configurable warmup** for different stores
- **Retry logic** for failed cache operations
- **Statistics tracking** for warmed items

### 5. Cache Metrics & Monitoring (`src/lib/cache-metrics.ts`)
- **Hit/miss tracking** by cache type (product, session, banner, other)
- **Performance metrics** including hit rate and operation counts
- **Alert system** for high miss rates, memory issues, and disconnections
- **Periodic collection** every 5 minutes
- **Recommendations** for cache optimization

### 6. Cache Partitioning (`src/lib/cache-partitioning.ts`)
- **Multi-tenant support** with partition isolation
- **Store-specific partitioning** for data separation
- **User-specific caching** for personalized data
- **System-level partitions** for shared resources
- **Migration utilities** for existing cache data
- **Statistics and monitoring** per partition

### 7. Cache Compression (`src/lib/cache-compression.ts`)
- **Automatic compression** for large objects (>1KB)
- **Gzip compression** with configurable levels
- **Transparent decompression** on cache retrieval
- **Compression statistics** tracking savings
- **Estimation utilities** for compression effectiveness

### 8. Monitoring Alerts & API (`src/app/api/admin/cache-monitoring/route.ts`)
- **REST API endpoints** for cache monitoring
- **Real-time metrics** and health checks
- **Alert management** and clearing
- **Cache warming triggers**
- **Partition statistics** and compression stats

### 9. Environment Configuration
- **Redis URL** configuration in `.env.example`
- **Cache TTLs** as environment variables
- **Rate limiting** configuration
- **Partitioning settings** for multi-tenant scenarios
- **Compression thresholds** and algorithms

## Getting Started

### Option 1: Docker (Recommended)
```bash
# Start Redis with Docker Compose
docker-compose -f docker-compose.redis.yml up -d

# Check if Redis is running
docker ps | grep redis
```

### Option 2: Local Installation
```bash
# Install Redis on Ubuntu/Debian
sudo apt-get update
sudo apt-get install redis-server

# Start Redis service
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Check Redis status
redis-cli ping
```

### Option 3: Development (Fallback)
If Redis is not available, the system will gracefully degrade with:
- Cache operations will return `null` (cache miss)
- Database queries will execute normally
- Rate limiting will allow all requests (fail-open)

## Testing Redis Integration

```bash
# Test Redis connection
npx tsx scripts/test-redis.ts

# Build the project to ensure TypeScript compiles
npm run build

# Run development server with Redis
npm run dev
```

## Cache Keys Structure

```
product:{id}                    # Individual product
products:{store}:page:{page}    # Product listings
user:session:{userId}          # User session data
user:cart:{userId}             # User cart
store:config:{storeCode}       # Store configuration
banner:{type}                  # Banner content
offer:banners:{storeCode}      # Offer banners
ratelimit:{ip}:{endpoint}      # Rate limiting
```

## Cache TTLs (Time To Live)

| Cache Type | TTL | Description |
|------------|-----|-------------|
| SHORT | 60s | Temporary data, user carts |
| MEDIUM | 5min | Product listings, banners |
| LONG | 1hr | Store configs, categories |
| VERY_LONG | 24hrs | Static content |
| USER_SESSION | 30min | User session data |
| PRODUCT | 30min | Individual products |

## API Integration Examples

### Basic Caching
```typescript
import { RedisCache, CacheKeys } from '@/lib/redis';

// Get cached data
const cachedProducts = await RedisCache.get(CacheKeys.productList('global', 1, 20));

// Set cached data
await RedisCache.set(CacheKeys.product('123'), productData, 1800);
```

### With Cache Utility
```typescript
import { withApiCache } from '@/lib/session-cache';

const getProducts = withApiCache(
  () => fetchProductsFromDB(),
  CacheKeys.productList('global', 1, 20),
  300 // 5 minutes
);
```

### Rate Limiting
```typescript
import { AuthRateLimiter } from '@/lib/session-cache';

const limit = await AuthRateLimiter.checkLoginAttempt(email);
if (!limit.allowed) {
  throw new Error('Too many login attempts');
}
```

## Cache Invalidation

### Manual Invalidation
```typescript
import { invalidateProductCache } from '@/lib/products';
import { CacheInvalidator } from '@/lib/session-cache';

// Invalidate single product
await invalidateProductCache('product-123');

// Invalidate all user-related cache
await CacheInvalidator.invalidateUserRelatedCache('user-456');

// Invalidate all store-related cache
await CacheInvalidator.invalidateStoreRelatedCache('KUW');
```

### Automatic Invalidation
Cache is automatically invalidated when:
- Products are updated/deleted
- User sessions expire
- Store configurations change
- Banners are updated

## Monitoring & Debugging

### Check Redis Health
```bash
# Using redis-cli
redis-cli info memory
redis-cli info stats
redis-cli keys "*" | wc -l  # Count keys
```

### View Cache Statistics
The `RedisCache.getStats()` method returns:
- Connection status
- Memory usage
- Key count

### Redis Commander (Web UI)
Start with Docker Compose and visit: http://localhost:8081

## Performance Benefits

### Expected Improvements
1. **Database Load Reduction**: 70-80% reduction in product queries
2. **Page Load Times**: 40-60% faster product pages
3. **API Response Times**: 50-70% faster for cached endpoints
4. **Scalability**: Handle 5-10x more concurrent users

### Cache Hit Rates
Monitor with:
```typescript
const stats = await RedisCache.getStats();
console.log(`Cache keys: ${stats.keys}, Memory: ${stats.memory}`);
```

## Fallback Strategy

If Redis fails:
1. Cache operations return `null` (cache miss)
2. Database queries execute normally
3. Rate limiting allows all requests
4. System continues functioning without cache

## Production Deployment

### Cloud Redis Services
1. **Redis Cloud**: Update `REDIS_URL` in environment
2. **Upstash Redis**: Use REST API or Redis protocol
3. **AWS ElastiCache**: Configure with security groups

### Environment Variables
```bash
# Production Redis (example)
REDIS_URL=rediss://:password@redis-server.com:6379
CACHE_TTL_PRODUCT=3600
RATE_LIMIT_API_REQUESTS=1000
```

### Security Considerations
1. **Redis Password**: Always use in production
2. **Network Security**: Restrict Redis port access
3. **TLS/SSL**: Use `rediss://` for encrypted connections
4. **Memory Limits**: Configure `maxmemory` policy

## Troubleshooting

### Common Issues
1. **Connection refused**: Ensure Redis is running on port 6379
2. **Memory full**: Implement LRU eviction policy
3. **High latency**: Use connection pooling, monitor network
4. **Cache misses**: Check TTLs, invalidation logic

### Debug Commands
```bash
# Check Redis logs
docker logs shafan-redis

# Monitor Redis in real-time
redis-cli monitor

# Flush cache (development only)
redis-cli flushall
```

## Next Steps

1. **Implement cache warming** for popular products
2. **Add cache metrics** to monitoring dashboard
3. **Implement cache partitioning** for multi-tenant
4. **Add cache compression** for large objects
5. **Implement cache versioning** for schema changes

## Support
For issues with Redis implementation:
1. Check Redis server status
2. Verify environment variables
3. Review cache key patterns
4. Monitor memory usage
5. Check network connectivity