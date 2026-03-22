#!/usr/bin/env node

import { prisma } from '../src/lib/prisma';
import { RedisCache, CacheKeys, CacheTTL } from '../src/lib/redis';
import { StoreCache, ContentCache } from '../src/lib/session-cache';

interface CacheWarmupConfig {
  maxProducts: number;
  stores: string[];
  warmupDelay: number;
  retryAttempts: number;
}

const DEFAULT_CONFIG: CacheWarmupConfig = {
  maxProducts: 50,
  stores: ['GLOBAL', 'KUW'],
  warmupDelay: 100, // ms between operations
  retryAttempts: 3,
};

class CacheWarmupService {
  private config: CacheWarmupConfig;
  private warmedCount: number = 0;
  private errorCount: number = 0;

  constructor(config: Partial<CacheWarmupConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async warmup(): Promise<void> {
    console.log('🚀 Starting cache warmup...');
    
    try {
      // Check Redis connection
      const isConnected = await RedisCache.isConnected();
      if (!isConnected) {
        console.warn('⚠️ Redis not connected, skipping warmup');
        return;
      }

      // Warm up store configurations
      await this.warmupStoreConfigs();
      
      // Warm up popular products
      await this.warmupPopularProducts();
      
      // Warm up categories
      await this.warmupCategories();
      
      // Warm up banners
      await this.warmupBanners();
      
      // Warm up offer banners
      await this.warmupOfferBanners();

      console.log('✅ Cache warmup completed successfully');
    } catch (error) {
      console.error('❌ Cache warmup failed:', error);
      throw error;
    }
  }

  private async warmupStoreConfigs(): Promise<void> {
    console.log('📦 Warming up store configurations...');
    
    for (const storeCode of this.config.stores) {
      try {
        const store = await (prisma as any).store.findUnique({
          where: { code: storeCode },
        });

        if (store) {
          await StoreCache.setStoreConfig(storeCode, {
            id: store.id,
            code: store.code,
            name: store.name,
            country: store.country,
            currency: store.currency,
            active: store.active,
          });
          console.log(`  ✅ Store config cached: ${storeCode}`);
        }
      } catch (error) {
        console.error(`  ❌ Failed to cache store ${storeCode}:`, error);
      }
      
      await this.delay();
    }
  }

  private async warmupPopularProducts(): Promise<void> {
    console.log('🛍️ Warming up popular products...');
    
    for (const storeCode of this.config.stores) {
      try {
        // Get trending products
        const products = await (prisma as any).product.findMany({
          where: {
            active: true,
            trending: true,
          },
          include: {
            brand: true,
            category: true,
          },
          take: this.config.maxProducts,
          orderBy: {
            totalSales: 'desc',
          },
        });

        // Cache individual products
        for (const product of products) {
          try {
            const cacheKey = CacheKeys.product(product.id);
            const productData = {
              id: product.id,
              name: product.name,
              description: product.description || '',
              priceCents: product.priceCents,
              regularPriceCents: product.priceCents,
              salePriceCents: product.discountCents || null,
              currency: product.currency?.toUpperCase() || 'USD',
              images: product.images || [],
              mainImage: product.mainImage,
              stockQuantity: product.stockQuantity || 0,
              averageRating: product.averageRating || 0,
              brand: product.brand ? { name: product.brand.name } : null,
              category: product.category ? { name: product.category.name } : null,
            };

            await RedisCache.set(cacheKey, productData, CacheTTL.PRODUCT);
            
            if (products.indexOf(product) % 10 === 0) {
              console.log(`  📊 Cached ${products.indexOf(product) + 1}/${products.length} products for ${storeCode}`);
            }
            
            await this.delay();
          } catch (error) {
            console.error(`  ❌ Failed to cache product ${product.id}:`, error);
          }
        }

        // Cache product list
        const listKey = CacheKeys.productList(storeCode, 1, 20);
        const productList = products.slice(0, 20).map((p: any) => ({
          id: p.id,
          name: p.name,
          priceCents: p.priceCents,
          salePriceCents: p.discountCents || null,
          currency: p.currency?.toUpperCase() || 'USD',
          images: p.images || [],
          mainImage: p.mainImage,
          brand: p.brand ? { name: p.brand.name } : null,
        }));

        await RedisCache.set(listKey, productList, CacheTTL.MEDIUM);
        console.log(`  ✅ Product list cached for ${storeCode}: ${products.length} products`);
        
      } catch (error) {
        console.error(`  ❌ Failed to warmup products for ${storeCode}:`, error);
      }
    }
  }

  private async warmupCategories(): Promise<void> {
    console.log('📚 Warming up categories...');
    
    try {
      const categories = await (prisma as any).category.findMany({
        where: { active: true },
        orderBy: { name: 'asc' },
      });

      for (const storeCode of this.config.stores) {
        const cacheKey = CacheKeys.categories(storeCode);
        await RedisCache.set(cacheKey, categories, CacheTTL.LONG);
        console.log(`  ✅ Categories cached for ${storeCode}: ${categories.length} categories`);
        await this.delay();
      }
    } catch (error) {
      console.error('  ❌ Failed to warmup categories:', error);
    }
  }

  private async warmupBanners(): Promise<void> {
    console.log('🎨 Warming up banners...');
    
    try {
      const banners = await (prisma as any).banner.findMany({
        where: { active: true },
        orderBy: { priority: 'desc' },
        take: 10,
      });

      await ContentCache.setBanners('homepage', banners);
      console.log(`  ✅ Banners cached: ${banners.length} banners`);
    } catch (error) {
      console.error('  ❌ Failed to warmup banners:', error);
    }
  }

  private async warmupOfferBanners(): Promise<void> {
    console.log('🏷️ Warming up offer banners...');
    
    for (const storeCode of this.config.stores) {
      try {
        const offerBanners = await (prisma as any).offerBanner.findMany({
          where: {
            active: true,
            storeCode: storeCode === 'GLOBAL' ? null : storeCode,
          },
          orderBy: { priority: 'desc' },
          take: 5,
        });

        await ContentCache.setOfferBanners(storeCode, offerBanners);
        console.log(`  ✅ Offer banners cached for ${storeCode}: ${offerBanners.length} banners`);
        await this.delay();
      } catch (error) {
        console.error(`  ❌ Failed to warmup offer banners for ${storeCode}:`, error);
      }
    }
  }

  private async delay(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, this.config.warmupDelay));
  }

  async clearOldCache(): Promise<void> {
    console.log('🧹 Clearing old cache before warmup...');
    
    try {
      // Clear product cache older than 1 hour
      const pattern = 'product:*';
      const keys = await (RedisCache as any).redis.keys(pattern);
      
      if (keys.length > 0) {
        console.log(`  Clearing ${keys.length} old product cache entries`);
        await RedisCache.delPattern(pattern);
      }
      
      console.log('✅ Old cache cleared');
    } catch (error) {
      console.error('❌ Failed to clear old cache:', error);
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'warmup';
  
  const service = new CacheWarmupService({
    maxProducts: 100,
    warmupDelay: 50,
  });

  switch (command) {
    case 'warmup':
      await service.warmup();
      break;
      
    case 'clear':
      await service.clearOldCache();
      break;
      
    case 'full':
      await service.clearOldCache();
      await service.warmup();
      break;
      
    case 'stats':
      const stats = await RedisCache.getStats();
      console.log('📊 Cache Statistics:', stats);
      break;
      
    default:
      console.log('Usage: npx tsx scripts/cache-warmup.ts [command]');
      console.log('Commands:');
      console.log('  warmup   - Warm up cache (default)');
      console.log('  clear    - Clear old cache');
      console.log('  full     - Clear and warm up');
      console.log('  stats    - Show cache statistics');
      process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { CacheWarmupService };

// Convenience function for programmatic use
export async function warmCache(config?: Partial<CacheWarmupConfig>): Promise<{
  success: boolean;
  warmed: number;
  errors: number;
  duration: number;
}> {
  const startTime = Date.now();
  const service = new CacheWarmupService(config);
  
  try {
    await service.warmup();
    const duration = Date.now() - startTime;
    
    return {
      success: true,
      warmed: service['warmedCount'] || 0,
      errors: service['errorCount'] || 0,
      duration,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('Cache warmup failed:', error);
    
    return {
      success: false,
      warmed: service['warmedCount'] || 0,
      errors: service['errorCount'] || 1,
      duration,
    };
  }
}