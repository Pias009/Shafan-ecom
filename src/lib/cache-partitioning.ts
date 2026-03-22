import { RedisCache, CacheKeys } from './redis';

export interface PartitionConfig {
  enabled: boolean;
  partitions: string[];
  defaultPartition: string;
  isolationLevel: 'strict' | 'relaxed' | 'none';
}

export interface PartitionStats {
  partition: string;
  keyCount: number;
  memoryUsage: string;
  hitRate: number;
  lastAccessed: Date;
}

export class CachePartitioner {
  private config: PartitionConfig;
  private partitionStats: Map<string, PartitionStats> = new Map();

  constructor(config: Partial<PartitionConfig> = {}) {
    this.config = {
      enabled: true,
      partitions: ['default', 'store', 'user', 'system'],
      defaultPartition: 'default',
      isolationLevel: 'relaxed',
      ...config,
    };

    this.initializePartitions();
  }

  private initializePartitions(): void {
    for (const partition of this.config.partitions) {
      this.partitionStats.set(partition, {
        partition,
        keyCount: 0,
        memoryUsage: '0B',
        hitRate: 0,
        lastAccessed: new Date(),
      });
    }
  }

  // Generate partition-aware cache keys
  generateKey(
    baseKey: string,
    partition?: string,
    subPartition?: string
  ): string {
    if (!this.config.enabled) {
      return baseKey;
    }

    const effectivePartition = partition || this.config.defaultPartition;
    
    if (subPartition) {
      return `partition:${effectivePartition}:${subPartition}:${baseKey}`;
    }
    
    return `partition:${effectivePartition}:${baseKey}`;
  }

  // Store-specific partitioning
  forStore(storeCode: string, baseKey: string): string {
    return this.generateKey(baseKey, 'store', storeCode);
  }

  // User-specific partitioning
  forUser(userId: string, baseKey: string): string {
    return this.generateKey(baseKey, 'user', userId);
  }

  // Tenant-specific partitioning (for multi-tenant scenarios)
  forTenant(tenantId: string, baseKey: string): string {
    return this.generateKey(baseKey, 'tenant', tenantId);
  }

  // System-level partitioning
  forSystem(baseKey: string): string {
    return this.generateKey(baseKey, 'system');
  }

  // Get data from partition
  async getFromPartition<T>(
    baseKey: string,
    partition: string,
    subPartition?: string
  ): Promise<T | null> {
    const key = this.generateKey(baseKey, partition, subPartition);
    const result = await RedisCache.get<T>(key);
    
    // Update partition stats
    this.updatePartitionStats(partition, 'access');
    
    return result;
  }

  // Set data in partition
  async setInPartition(
    baseKey: string,
    value: any,
    partition: string,
    subPartition?: string,
    ttl?: number
  ): Promise<void> {
    const key = this.generateKey(baseKey, partition, subPartition);
    await RedisCache.set(key, value, ttl);
    
    // Update partition stats
    this.updatePartitionStats(partition, 'set');
  }

  // Delete data from partition
  async deleteFromPartition(
    baseKey: string,
    partition: string,
    subPartition?: string
  ): Promise<void> {
    const key = this.generateKey(baseKey, partition, subPartition);
    await RedisCache.del(key);
    
    // Update partition stats
    this.updatePartitionStats(partition, 'delete');
  }

  // Clear entire partition
  async clearPartition(partition: string, subPartition?: string): Promise<void> {
    const pattern = subPartition 
      ? `partition:${partition}:${subPartition}:*`
      : `partition:${partition}:*`;
    
    await RedisCache.delPattern(pattern);
    
    // Reset partition stats
    const stats = this.partitionStats.get(partition);
    if (stats) {
      stats.keyCount = 0;
      stats.lastAccessed = new Date();
    }
  }

  // Clear all partitions
  async clearAllPartitions(): Promise<void> {
    for (const partition of this.config.partitions) {
      await this.clearPartition(partition);
    }
  }

  // Get partition statistics
  async getPartitionStats(): Promise<PartitionStats[]> {
    const stats: PartitionStats[] = [];
    
    for (const partition of this.config.partitions) {
      const partitionStats = this.partitionStats.get(partition) || {
        partition,
        keyCount: 0,
        memoryUsage: '0B',
        hitRate: 0,
        lastAccessed: new Date(),
      };
      
      // Get actual key count from Redis
      const pattern = `partition:${partition}:*`;
      try {
        const keys = await (RedisCache as any).redis.keys(pattern);
        partitionStats.keyCount = keys.length;
      } catch (error) {
        console.error(`Error getting keys for partition ${partition}:`, error);
      }
      
      stats.push({ ...partitionStats });
    }
    
    return stats;
  }

  // Get partition usage summary
  async getPartitionSummary() {
    const stats = await this.getPartitionStats();
    const totalKeys = stats.reduce((sum, s) => sum + s.keyCount, 0);
    
    return {
      totalPartitions: stats.length,
      totalKeys,
      partitions: stats.map(s => ({
        ...s,
        percentage: totalKeys > 0 ? (s.keyCount / totalKeys) * 100 : 0,
      })),
      recommendations: this.generatePartitionRecommendations(stats),
    };
  }

  private generatePartitionRecommendations(stats: PartitionStats[]): string[] {
    const recommendations: string[] = [];
    const totalKeys = stats.reduce((sum, s) => sum + s.keyCount, 0);
    
    // Check for unbalanced partitions
    for (const stat of stats) {
      const percentage = totalKeys > 0 ? (stat.keyCount / totalKeys) * 100 : 0;
      
      if (percentage > 70) {
        recommendations.push(
          `Partition "${stat.partition}" has ${percentage.toFixed(1)}% of all keys. Consider splitting it.`
        );
      }
      
      if (stat.keyCount > 10000) {
        recommendations.push(
          `Partition "${stat.partition}" has ${stat.keyCount} keys. Consider implementing sub-partitions.`
        );
      }
    }
    
    // Check for unused partitions
    const unusedPartitions = stats.filter(s => s.keyCount === 0);
    if (unusedPartitions.length > 0 && this.config.partitions.length > 2) {
      recommendations.push(
        `Unused partitions: ${unusedPartitions.map(p => p.partition).join(', ')}. Consider removing them.`
      );
    }
    
    return recommendations;
  }

  private updatePartitionStats(partition: string, operation: 'access' | 'set' | 'delete'): void {
    const stats = this.partitionStats.get(partition);
    if (stats) {
      stats.lastAccessed = new Date();
      
      if (operation === 'set') {
        stats.keyCount++;
      } else if (operation === 'delete') {
        stats.keyCount = Math.max(0, stats.keyCount - 1);
      }
    }
  }

  // Migration utilities
  async migrateToPartition(
    oldKey: string,
    newPartition: string,
    newSubPartition?: string
  ): Promise<boolean> {
    try {
      // Get old data
      const data = await RedisCache.get(oldKey);
      if (!data) {
        return false;
      }
      
      // Generate new key
      const baseKey = this.extractBaseKey(oldKey);
      const newKey = this.generateKey(baseKey, newPartition, newSubPartition);
      
      // Copy data to new key
      await RedisCache.set(newKey, data);
      
      // Delete old key
      await RedisCache.del(oldKey);
      
      return true;
    } catch (error) {
      console.error('Migration failed:', error);
      return false;
    }
  }

  private extractBaseKey(fullKey: string): string {
    // Extract base key from partitioned key
    const parts = fullKey.split(':');
    if (parts[0] === 'partition' && parts.length >= 3) {
      return parts.slice(2).join(':');
    }
    return fullKey;
  }

  // Isolation level enforcement
  async isAccessAllowed(
    requestedPartition: string,
    userPartition?: string
  ): Promise<boolean> {
    if (this.config.isolationLevel === 'none') {
      return true;
    }
    
    if (this.config.isolationLevel === 'relaxed') {
      // Allow access to system and default partitions
      if (requestedPartition === 'system' || requestedPartition === 'default') {
        return true;
      }
      
      // User can only access their own partition
      if (requestedPartition === 'user' && userPartition) {
        return true;
      }
    }
    
    if (this.config.isolationLevel === 'strict') {
      // Strict isolation - only exact matches
      return requestedPartition === userPartition;
    }
    
    return true;
  }
}

// Enhanced CacheKeys with partitioning support
export class PartitionedCacheKeys {
  constructor(private partitioner: CachePartitioner) {}

  // Product-related cache keys
  product(id: string, storeCode?: string): string {
    if (storeCode) {
      return this.partitioner.forStore(storeCode, `product:${id}`);
    }
    return this.partitioner.generateKey(`product:${id}`, 'default');
  }

  productList(storeCode: string, page: number, limit: number): string {
    return this.partitioner.forStore(
      storeCode,
      `products:page:${page}:limit:${limit}`
    );
  }

  productSearch(query: string, storeCode: string): string {
    return this.partitioner.forStore(
      storeCode,
      `products:search:${query}`
    );
  }

  // Category cache keys
  categories(storeCode: string): string {
    return this.partitioner.forStore(storeCode, `categories`);
  }

  // User session cache keys
  userSession(userId: string): string {
    return this.partitioner.forUser(userId, `session`);
  }

  userCart(userId: string): string {
    return this.partitioner.forUser(userId, `cart`);
  }

  // Store cache keys
  storeConfig(storeCode: string): string {
    return this.partitioner.forStore(storeCode, `config`);
  }

  // API rate limiting
  rateLimit(ip: string, endpoint: string): string {
    return this.partitioner.generateKey(`ratelimit:${ip}:${endpoint}`, 'system');
  }

  // General cache keys
  banner(type: string): string {
    return this.partitioner.generateKey(`banner:${type}`, 'system');
  }

  offerBanners(storeCode: string): string {
    return this.partitioner.forStore(storeCode, `offer:banners`);
  }

  // Helper to get non-partitioned key (for backward compatibility)
  getBaseKey(key: string): string {
    return key.replace(/^partition:[^:]+:/, '').replace(/^partition:[^:]+:[^:]+:/, '');
  }
}

// Factory for creating partitioned cache instances
export class CachePartitionFactory {
  private static instances: Map<string, CachePartitioner> = new Map();

  static getPartitioner(name: string = 'default'): CachePartitioner {
    if (!this.instances.has(name)) {
      const config: Partial<PartitionConfig> = {
        partitions: ['default', 'store', 'user', 'system', 'tenant'],
        defaultPartition: 'default',
        isolationLevel: 'relaxed',
      };
      
      this.instances.set(name, new CachePartitioner(config));
    }
    
    return this.instances.get(name)!;
  }

  static getPartitionedKeys(name: string = 'default'): PartitionedCacheKeys {
    const partitioner = this.getPartitioner(name);
    return new PartitionedCacheKeys(partitioner);
  }

  static async cleanupUnusedPartitions(): Promise<void> {
    // Convert Map to array for iteration
    const entries = Array.from(this.instances.entries());
    for (const [name, partitioner] of entries) {
      const stats = await partitioner.getPartitionStats();
      const unused = stats.filter(s => s.keyCount === 0);
      
      if (unused.length === stats.length) {
        // All partitions are unused, remove instance
        this.instances.delete(name);
      }
    }
  }
}

// Default export with sensible defaults
export const defaultPartitioner = CachePartitionFactory.getPartitioner();
export const partitionedCacheKeys = CachePartitionFactory.getPartitionedKeys();

// Utility function to migrate existing cache to partitions
export async function migrateExistingCacheToPartitions(): Promise<{
  migrated: number;
  failed: number;
}> {
  const partitioner = defaultPartitioner;
  let migrated = 0;
  let failed = 0;

  try {
    // Get all existing cache keys
    const allKeys = await (RedisCache as any).redis.keys('*');
    
    console.log(`Found ${allKeys.length} keys to migrate`);
    
    for (const key of allKeys) {
      try {
        // Skip already partitioned keys
        if (key.startsWith('partition:')) {
          continue;
        }
        
        // Determine partition based on key pattern
        let partition = 'default';
        let subPartition: string | undefined;
        
        if (key.startsWith('product:')) {
          partition = 'store';
          // Extract store code if available
          const match = key.match(/products:([^:]+):/);
          if (match) {
            subPartition = match[1];
          }
        } else if (key.startsWith('user:')) {
          partition = 'user';
          const match = key.match(/user:([^:]+):/);
          if (match) {
            subPartition = match[1];
          }
        } else if (key.startsWith('store:')) {
          partition = 'store';
          const match = key.match(/store:([^:]+):/);
          if (match) {
            subPartition = match[1];
          }
        }
        
        // Migrate the key
        const success = await partitioner.migrateToPartition(key, partition, subPartition);
        
        if (success) {
          migrated++;
          if (migrated % 100 === 0) {
            console.log(`Migrated ${migrated} keys...`);
          }
        } else {
          failed++;
        }
      } catch (error) {
        console.error(`Failed to migrate key ${key}:`, error);
        failed++;
      }
    }
    
    console.log(`Migration complete: ${migrated} migrated, ${failed} failed`);
    
    return { migrated, failed };
  } catch (error) {
    console.error('Migration failed:', error);
    return { migrated, failed };
  }
}