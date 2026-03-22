import { NextRequest, NextResponse } from 'next/server';
import { CacheMetricsCollector } from '@/lib/cache-metrics';
import { defaultPartitioner } from '@/lib/cache-partitioning';
import { defaultCompressor } from '@/lib/cache-compression';
import { RedisCache } from '@/lib/redis';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');
    
    const metricsCollector = CacheMetricsCollector.getInstance();
    
    switch (action) {
      case 'metrics':
        const metrics = await metricsCollector.collectMetrics();
        return NextResponse.json({
          success: true,
          data: metrics,
          timestamp: new Date().toISOString(),
        });
        
      case 'alerts':
        const limit = parseInt(searchParams.get('limit') || '20');
        const alerts = metricsCollector.getRecentAlerts(limit);
        return NextResponse.json({
          success: true,
          data: alerts,
          count: alerts.length,
        });
        
      case 'partition-stats':
        const partitionStats = await defaultPartitioner.getPartitionStats();
        return NextResponse.json({
          success: true,
          data: partitionStats,
        });
        
      case 'compression-stats':
        const compressionStats = defaultCompressor.getStats();
        return NextResponse.json({
          success: true,
          data: compressionStats,
        });
        
      case 'redis-stats':
        const redisStats = await RedisCache.getStats();
        return NextResponse.json({
          success: true,
          data: redisStats,
        });
        
      case 'clear-alerts':
        metricsCollector.clearAlerts();
        return NextResponse.json({
          success: true,
          message: 'Alerts cleared',
        });
        
      case 'health':
        const [metricsData, redisStatsData, partitionStatsData] = await Promise.all([
          metricsCollector.collectMetrics(),
          RedisCache.getStats(),
          defaultPartitioner.getPartitionStats(),
        ]);
        
        const healthStatus = {
          redis: {
            connected: redisStatsData.connected,
            memory: redisStatsData.memory,
            keys: redisStatsData.keys,
          },
          cache: {
            hitRate: metricsData.hitRate,
            totalOperations: metricsData.totalOperations,
            alerts: metricsCollector.getRecentAlerts(5).length,
          },
          partitions: {
            count: partitionStatsData.length,
            totalKeys: partitionStatsData.reduce((sum: number, p: any) => sum + p.keyCount, 0),
          },
          overall: 'healthy' as 'healthy' | 'warning' | 'critical',
        };
        
        // Determine overall health
        if (!redisStatsData.connected) {
          healthStatus.overall = 'critical';
        } else if (metricsData.hitRate < 0.3) {
          healthStatus.overall = 'warning';
        } else if (parseFloat((redisStatsData.memory as string)?.replace(/[^0-9.]/g, '') || '0') > 500) {
          healthStatus.overall = 'warning';
        }
        
        return NextResponse.json({
          success: true,
          data: healthStatus,
        });
        
      default:
        // Return comprehensive monitoring data
        const [allMetrics, allAlerts, allPartitionStats, allRedisStats] = await Promise.all([
          metricsCollector.collectMetrics(),
          metricsCollector.getRecentAlerts(50),
          defaultPartitioner.getPartitionStats(),
          RedisCache.getStats(),
        ]);
        
        return NextResponse.json({
          success: true,
          data: {
            metrics: allMetrics,
            alerts: allAlerts,
            partitionStats: allPartitionStats,
            redisStats: allRedisStats,
            compressionStats: defaultCompressor.getStats(),
            recommendations: metricsCollector.getRecommendations(),
            timestamp: new Date().toISOString(),
          },
        });
    }
  } catch (error) {
    console.error('Cache monitoring API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch cache monitoring data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body.action;
    
    const metricsCollector = CacheMetricsCollector.getInstance();
    
    switch (action) {
      case 'clear-cache':
        const pattern = body.pattern || '*';
        await RedisCache.delPattern(pattern);
        
        // Also clear partition stats
        await defaultPartitioner.clearAllPartitions();
        
        return NextResponse.json({
          success: true,
          message: `Cache cleared for pattern: ${pattern}`,
        });
        
      case 'warm-cache':
        // Trigger cache warming - dynamic import with relative path
        const cacheWarmupModule = await import('../../../../../scripts/cache-warmup');
        const result = await cacheWarmupModule.warmCache();
        
        return NextResponse.json({
          success: true,
          message: 'Cache warming initiated',
          data: result,
        });
        
      case 'test-alert':
        // Generate a test alert
        metricsCollector.addAlert({
          type: 'high_miss_rate',
          message: 'Test alert: Cache miss rate is high',
          severity: 'medium',
          timestamp: new Date(),
          data: { test: true },
        });
        
        return NextResponse.json({
          success: true,
          message: 'Test alert generated',
        });
        
      default:
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid action',
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Cache monitoring POST error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to perform cache operation',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}