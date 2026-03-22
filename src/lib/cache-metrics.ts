import { RedisCache } from './redis';

export interface CacheMetrics {
  hits: number;
  misses: number;
  hitRate: number;
  totalOperations: number;
  memoryUsage: string;
  keyCount: number;
  connected: boolean;
  lastUpdated: Date;
  byType: {
    product: { hits: number; misses: number };
    session: { hits: number; misses: number };
    banner: { hits: number; misses: number };
    other: { hits: number; misses: number };
  };
}

export interface CacheAlert {
  type: 'high_miss_rate' | 'low_memory' | 'disconnected' | 'high_latency';
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  data?: any;
}

export class CacheMetricsCollector {
  private static instance: CacheMetricsCollector;
  private metrics: CacheMetrics;
  private operationCounts: Map<string, number> = new Map();
  private hitCounts: Map<string, number> = new Map();
  private missCounts: Map<string, number> = new Map();
  private alerts: CacheAlert[] = [];
  
  // Alert thresholds
  private readonly ALERT_THRESHOLDS = {
    MISS_RATE: 0.7, // 70% miss rate triggers alert
    MEMORY_THRESHOLD: '500MB', // Alert if memory > 500MB
    LATENCY_THRESHOLD: 100, // 100ms latency threshold
  };

  private constructor() {
    this.metrics = this.getDefaultMetrics();
    this.startPeriodicCollection();
  }

  static getInstance(): CacheMetricsCollector {
    if (!CacheMetricsCollector.instance) {
      CacheMetricsCollector.instance = new CacheMetricsCollector();
    }
    return CacheMetricsCollector.instance;
  }

  private getDefaultMetrics(): CacheMetrics {
    return {
      hits: 0,
      misses: 0,
      hitRate: 0,
      totalOperations: 0,
      memoryUsage: '0B',
      keyCount: 0,
      connected: false,
      lastUpdated: new Date(),
      byType: {
        product: { hits: 0, misses: 0 },
        session: { hits: 0, misses: 0 },
        banner: { hits: 0, misses: 0 },
        other: { hits: 0, misses: 0 },
      },
    };
  }

  async collectMetrics(): Promise<CacheMetrics> {
    try {
      const stats = await RedisCache.getStats();
      
      // Update basic metrics
      this.metrics.connected = stats.connected;
      this.metrics.memoryUsage = stats.memory || '0B';
      this.metrics.keyCount = stats.keys || 0;
      
      // Calculate hit rate
      const totalOps = this.metrics.hits + this.metrics.misses;
      this.metrics.totalOperations = totalOps;
      this.metrics.hitRate = totalOps > 0 ? this.metrics.hits / totalOps : 0;
      
      this.metrics.lastUpdated = new Date();
      
      // Check for alerts
      await this.checkAlerts();
      
      return { ...this.metrics };
    } catch (error) {
      console.error('Error collecting cache metrics:', error);
      return this.metrics;
    }
  }

  recordHit(cacheType: 'product' | 'session' | 'banner' | 'other', key?: string): void {
    this.metrics.hits++;
    
    // Update type-specific counts
    if (this.metrics.byType[cacheType]) {
      this.metrics.byType[cacheType].hits++;
    }
    
    // Update key-specific counts
    if (key) {
      const currentHits = this.hitCounts.get(key) || 0;
      this.hitCounts.set(key, currentHits + 1);
      
      const currentOps = this.operationCounts.get(key) || 0;
      this.operationCounts.set(key, currentOps + 1);
    }
  }

  recordMiss(cacheType: 'product' | 'session' | 'banner' | 'other', key?: string): void {
    this.metrics.misses++;
    
    // Update type-specific counts
    if (this.metrics.byType[cacheType]) {
      this.metrics.byType[cacheType].misses++;
    }
    
    // Update key-specific counts
    if (key) {
      const currentMisses = this.missCounts.get(key) || 0;
      this.missCounts.set(key, currentMisses + 1);
      
      const currentOps = this.operationCounts.get(key) || 0;
      this.operationCounts.set(key, currentOps + 1);
    }
  }

  async getDetailedMetrics() {
    const metrics = await this.collectMetrics();
    
    // Get top keys by hits
    const topKeysByHits = Array.from(this.hitCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([key, hits]) => ({ key, hits }));
    
    // Get top keys by misses
    const topKeysByMisses = Array.from(this.missCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([key, misses]) => ({ key, misses }));
    
    // Calculate type hit rates
    const typeMetrics = Object.entries(metrics.byType).map(([type, data]) => {
      const total = data.hits + data.misses;
      return {
        type,
        hits: data.hits,
        misses: data.misses,
        hitRate: total > 0 ? data.hits / total : 0,
        total,
      };
    });

    return {
      ...metrics,
      typeMetrics,
      topKeysByHits,
      topKeysByMisses,
      alerts: this.getRecentAlerts(10),
      performance: await this.getPerformanceMetrics(),
    };
  }

  async getPerformanceMetrics() {
    // Simulate latency measurement
    const start = Date.now();
    await RedisCache.isConnected();
    const latency = Date.now() - start;

    return {
      latency,
      status: latency < 50 ? 'excellent' : 
              latency < 100 ? 'good' : 
              latency < 200 ? 'fair' : 'poor',
      recommendations: this.getRecommendations(),
    };
  }

  getRecommendations(): string[] {
    const recommendations: string[] = [];
    
    if (this.metrics.hitRate < 0.3) {
      recommendations.push('Consider increasing cache TTLs for frequently accessed data');
    }
    
    if (this.metrics.byType.product.misses > this.metrics.byType.product.hits * 2) {
      recommendations.push('Product cache miss rate is high - consider cache warming');
    }
    
    if (this.metrics.keyCount > 10000) {
      recommendations.push('Large number of cache keys - consider implementing cache eviction policy');
    }
    
    return recommendations;
  }

  private async checkAlerts(): Promise<void> {
    const metrics = await this.collectMetrics();
    
    // Check for high miss rate
    if (metrics.hitRate < (1 - this.ALERT_THRESHOLDS.MISS_RATE)) {
      this.addAlert({
        type: 'high_miss_rate',
        message: `Cache miss rate is high: ${(metrics.hitRate * 100).toFixed(1)}% hit rate`,
        severity: metrics.hitRate < 0.2 ? 'high' : 'medium',
        timestamp: new Date(),
        data: { hitRate: metrics.hitRate },
      });
    }
    
    // Check memory usage
    if (this.parseMemory(metrics.memoryUsage) > this.parseMemory(this.ALERT_THRESHOLDS.MEMORY_THRESHOLD)) {
      this.addAlert({
        type: 'low_memory',
        message: `Redis memory usage is high: ${metrics.memoryUsage}`,
        severity: 'medium',
        timestamp: new Date(),
        data: { memoryUsage: metrics.memoryUsage },
      });
    }
    
    // Check connection
    if (!metrics.connected) {
      this.addAlert({
        type: 'disconnected',
        message: 'Redis connection lost',
        severity: 'critical',
        timestamp: new Date(),
      });
    }
  }

  addAlert(alert: CacheAlert): void {
    // Don't add duplicate alerts within 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentDuplicate = this.alerts.some(a =>
      a.type === alert.type &&
      a.severity === alert.severity &&
      a.timestamp > fiveMinutesAgo
    );
    
    if (!recentDuplicate) {
      this.alerts.unshift(alert);
      // Keep only last 100 alerts
      if (this.alerts.length > 100) {
        this.alerts = this.alerts.slice(0, 100);
      }
      
      // Log high severity alerts
      if (alert.severity === 'high' || alert.severity === 'critical') {
        console.warn(`🚨 Cache Alert [${alert.severity.toUpperCase()}]: ${alert.message}`);
      }
    }
  }

  getRecentAlerts(limit: number = 20): CacheAlert[] {
    return this.alerts.slice(0, limit);
  }

  clearAlerts(): void {
    this.alerts = [];
  }

  private parseMemory(memoryStr: string): number {
    const match = memoryStr.match(/^(\d+(?:\.\d+)?)([KMGTP]?B)$/);
    if (!match) return 0;
    
    const [, value, unit] = match;
    const numValue = parseFloat(value);
    
    switch (unit) {
      case 'KB': return numValue * 1024;
      case 'MB': return numValue * 1024 * 1024;
      case 'GB': return numValue * 1024 * 1024 * 1024;
      case 'TB': return numValue * 1024 * 1024 * 1024 * 1024;
      default: return numValue; // bytes
    }
  }

  private startPeriodicCollection(): void {
    // Collect metrics every 5 minutes
    setInterval(() => {
      this.collectMetrics().catch(console.error);
    }, 5 * 60 * 1000);
    
    // Clear old operation counts hourly
    setInterval(() => {
      this.operationCounts.clear();
      this.hitCounts.clear();
      this.missCounts.clear();
    }, 60 * 60 * 1000);
  }

  resetMetrics(): void {
    this.metrics = this.getDefaultMetrics();
    this.operationCounts.clear();
    this.hitCounts.clear();
    this.missCounts.clear();
  }
}

// Enhanced RedisCache with metrics
export class InstrumentedRedisCache {
  private static metricsCollector = CacheMetricsCollector.getInstance();

  static async get<T>(key: string, cacheType: 'product' | 'session' | 'banner' | 'other' = 'other'): Promise<T | null> {
    const result = await RedisCache.get<T>(key);
    
    if (result !== null) {
      this.metricsCollector.recordHit(cacheType, key);
    } else {
      this.metricsCollector.recordMiss(cacheType, key);
    }
    
    return result;
  }

  static async set(key: string, value: any, ttl?: number): Promise<void> {
    await RedisCache.set(key, value, ttl);
  }

  static async del(key: string): Promise<void> {
    await RedisCache.del(key);
  }

  static async delPattern(pattern: string): Promise<void> {
    await RedisCache.delPattern(pattern);
  }

  static async getMetrics() {
    return this.metricsCollector.getDetailedMetrics();
  }

  static getAlerts(limit?: number) {
    return this.metricsCollector.getRecentAlerts(limit);
  }

  static clearAlerts() {
    return this.metricsCollector.clearAlerts();
  }

  static resetMetrics() {
    return this.metricsCollector.resetMetrics();
  }
}

// API endpoint helper
export async function getCacheMetricsForDashboard() {
  const collector = CacheMetricsCollector.getInstance();
  const metrics = await collector.getDetailedMetrics();
  
  return {
    summary: {
      hitRate: Math.round(metrics.hitRate * 100),
      totalOperations: metrics.totalOperations,
      memoryUsage: metrics.memoryUsage,
      keyCount: metrics.keyCount,
      connected: metrics.connected,
      status: metrics.connected ? 'healthy' : 'disconnected',
    },
    typeBreakdown: metrics.typeMetrics,
    alerts: metrics.alerts,
    performance: metrics.performance,
    recommendations: metrics.performance.recommendations,
    lastUpdated: metrics.lastUpdated,
  };
}

// Export singleton
export const cacheMetrics = CacheMetricsCollector.getInstance();