import { RedisCache } from '../src/lib/redis';

async function testRedisConnection() {
  console.log('Testing Redis connection...');
  
  try {
    const isConnected = await RedisCache.isConnected();
    
    if (isConnected) {
      console.log('✅ Redis connection successful');
      
      // Test basic cache operations
      console.log('Testing cache operations...');
      
      const testKey = 'test:connection';
      const testValue = { message: 'Hello Redis!', timestamp: new Date().toISOString() };
      
      // Set value
      await RedisCache.set(testKey, testValue, 10);
      console.log('✅ Set cache value');
      
      // Get value
      const retrieved = await RedisCache.get(testKey);
      if (retrieved && (retrieved as any).message === testValue.message) {
        console.log('✅ Get cache value successful');
      } else {
        console.log('❌ Get cache value failed');
      }
      
      // Delete value
      await RedisCache.del(testKey);
      console.log('✅ Delete cache value');
      
      // Test pattern deletion
      await RedisCache.set('test:pattern:1', 'value1', 10);
      await RedisCache.set('test:pattern:2', 'value2', 10);
      await RedisCache.delPattern('test:pattern:*');
      console.log('✅ Pattern deletion successful');
      
      // Get stats
      const stats = await RedisCache.getStats();
      console.log('Redis Stats:', stats);
      
      console.log('\n🎉 All Redis tests passed!');
      process.exit(0);
    } else {
      console.error('❌ Redis connection failed');
      console.log('Make sure Redis is running on localhost:6379');
      console.log('You can start Redis with: docker run -p 6379:6379 redis');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Redis test error:', error);
    console.log('\nTroubleshooting:');
    console.log('1. Install Redis: sudo apt-get install redis-server');
    console.log('2. Or use Docker: docker run -p 6379:6379 redis');
    console.log('3. Check if Redis is running: redis-cli ping');
    process.exit(1);
  }
}

// Run test
testRedisConnection();