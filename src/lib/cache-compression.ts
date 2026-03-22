import { gzip, gunzip } from 'zlib';
import { promisify } from 'util';

const gzipAsync = promisify(gzip);
const gunzipAsync = promisify(gunzip);

export interface CompressionConfig {
  enabled: boolean;
  threshold: number; // Minimum size in bytes to compress
  algorithm: 'gzip' | 'deflate' | 'brotli';
  compressionLevel: number; // 1-9 for gzip/deflate
}

export interface CompressionStats {
  compressed: number;
  uncompressed: number;
  savings: number;
  ratio: number;
}

export class CacheCompressor {
  private config: CompressionConfig;
  private stats: CompressionStats = {
    compressed: 0,
    uncompressed: 0,
    savings: 0,
    ratio: 0,
  };

  constructor(config: Partial<CompressionConfig> = {}) {
    this.config = {
      enabled: true,
      threshold: 1024, // 1KB
      algorithm: 'gzip',
      compressionLevel: 6,
      ...config,
    };
  }

  // Check if data should be compressed
  shouldCompress(data: string | Buffer): boolean {
    if (!this.config.enabled) return false;
    
    const size = Buffer.isBuffer(data) ? data.length : Buffer.byteLength(data);
    return size >= this.config.threshold;
  }

  // Compress data
  async compress(data: string | Buffer): Promise<Buffer> {
    if (!this.shouldCompress(data)) {
      return Buffer.isBuffer(data) ? data : Buffer.from(data);
    }

    const inputSize = Buffer.isBuffer(data) ? data.length : Buffer.byteLength(data);
    
    try {
      let compressed: Buffer;
      
      switch (this.config.algorithm) {
        case 'gzip':
          compressed = await gzipAsync(data, { level: this.config.compressionLevel });
          break;
        case 'deflate':
          compressed = await gzipAsync(data, { level: this.config.compressionLevel });
          break;
        default:
          throw new Error(`Unsupported compression algorithm: ${this.config.algorithm}`);
      }

      const outputSize = compressed.length;
      
      // Update statistics
      this.updateStats(inputSize, outputSize);
      
      return compressed;
    } catch (error) {
      console.error('Compression failed:', error);
      // Fallback to uncompressed data
      return Buffer.isBuffer(data) ? data : Buffer.from(data);
    }
  }

  // Decompress data
  async decompress(data: Buffer): Promise<string> {
    try {
      // Check if data is compressed (gzip magic number: 0x1F8B)
      if (data.length >= 2 && data[0] === 0x1F && data[1] === 0x8B) {
        const decompressed = await gunzipAsync(data);
        return decompressed.toString();
      }
      
      // Not compressed, return as string
      return data.toString();
    } catch (error) {
      console.error('Decompression failed:', error);
      // If decompression fails, try to parse as string
      return data.toString();
    }
  }

  // Compress and serialize object
  async compressObject<T>(obj: T): Promise<Buffer> {
    const jsonString = JSON.stringify(obj);
    return this.compress(jsonString);
  }

  // Decompress and parse object
  async decompressObject<T>(data: Buffer): Promise<T | null> {
    try {
      const jsonString = await this.decompress(data);
      return JSON.parse(jsonString) as T;
    } catch (error) {
      console.error('Failed to decompress object:', error);
      return null;
    }
  }

  // Update compression statistics
  private updateStats(inputSize: number, outputSize: number): void {
    this.stats.uncompressed += inputSize;
    this.stats.compressed += outputSize;
    this.stats.savings = this.stats.uncompressed - this.stats.compressed;
    this.stats.ratio = this.stats.uncompressed > 0 
      ? (this.stats.compressed / this.stats.uncompressed) * 100 
      : 0;
  }

  // Get compression statistics
  getStats(): CompressionStats {
    return { ...this.stats };
  }

  // Reset statistics
  resetStats(): void {
    this.stats = {
      compressed: 0,
      uncompressed: 0,
      savings: 0,
      ratio: 0,
    };
  }

  // Estimate compression ratio for given data
  async estimateCompression(data: string | Buffer): Promise<{
    originalSize: number;
    compressedSize: number;
    ratio: number;
    recommended: boolean;
  }> {
    const originalSize = Buffer.isBuffer(data) ? data.length : Buffer.byteLength(data);
    
    if (!this.shouldCompress(data)) {
      return {
        originalSize,
        compressedSize: originalSize,
        ratio: 1,
        recommended: false,
      };
    }

    try {
      const compressed = await this.compress(data);
      const compressedSize = compressed.length;
      const ratio = compressedSize / originalSize;
      
      return {
        originalSize,
        compressedSize,
        ratio,
        recommended: ratio < 0.9, // Recommend if compression saves at least 10%
      };
    } catch (error) {
      console.error('Compression estimation failed:', error);
      return {
        originalSize,
        compressedSize: originalSize,
        ratio: 1,
        recommended: false,
      };
    }
  }
}

// Default compressor instance
export const defaultCompressor = new CacheCompressor();

// Integration with RedisCache
export class CompressedRedisCache {
  static async setCompressed(
    key: string,
    value: any,
    ttl?: number,
    compressor: CacheCompressor = defaultCompressor
  ): Promise<void> {
    const compressed = await compressor.compressObject(value);
    
    // Store with compression marker
    const data = {
      _compressed: true,
      _algorithm: compressor['config'].algorithm,
      data: compressed.toString('base64'),
    };
    
    // Use RedisCache.set with JSON string
    const { RedisCache } = await import('./redis');
    await RedisCache.set(key, data, ttl);
  }

  static async getCompressed<T>(
    key: string,
    compressor: CacheCompressor = defaultCompressor
  ): Promise<T | null> {
    const { RedisCache } = await import('./redis');
    const data = await RedisCache.get<any>(key);
    
    if (!data) return null;
    
    // Check if data is compressed
    if (data._compressed && data.data) {
      const buffer = Buffer.from(data.data, 'base64');
      return compressor.decompressObject<T>(buffer);
    }
    
    // Not compressed, return as-is
    return data as T;
  }

  // Batch compression operations
  static async setManyCompressed(
    items: Array<{ key: string; value: any; ttl?: number }>,
    compressor: CacheCompressor = defaultCompressor
  ): Promise<void> {
    const { RedisCache } = await import('./redis');
    const pipeline = [];
    
    for (const item of items) {
      const compressed = await compressor.compressObject(item.value);
      const data = {
        _compressed: true,
        _algorithm: compressor['config'].algorithm,
        data: compressed.toString('base64'),
      };
      
      pipeline.push({ key: item.key, value: data, ttl: item.ttl });
    }
    
    // Note: RedisCache doesn't have batch set, but we can implement if needed
    for (const item of pipeline) {
      await RedisCache.set(item.key, item.value, item.ttl);
    }
  }
}

// Utility function to automatically compress large values
export async function withAutoCompression<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl?: number,
  compressor: CacheCompressor = defaultCompressor
): Promise<T> {
  // Try to get from cache first
  const cached = await CompressedRedisCache.getCompressed<T>(key, compressor);
  if (cached !== null) {
    return cached;
  }
  
  // Fetch fresh data
  const data = await fetchFn();
  
  // Store with compression
  await CompressedRedisCache.setCompressed(key, data, ttl, compressor);
  
  return data;
}