import Redis from 'ioredis';

// Redis URL configuration
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// Singleton instance for lazy connection
let redisInstance: Redis | null = null;

/**
 * Get Redis client with lazy initialization.
 * Connection is only established when first called at runtime,
 * not during module load (which happens during Next.js build).
 */
export function getRedis(): Redis {
  if (!redisInstance) {
    redisInstance = new Redis(redisUrl, {
      maxRetriesPerRequest: null, // Required for BullMQ
      enableReadyCheck: false,
      lazyConnect: true, // Don't connect until first command
      retryStrategy(times) {
        if (times > 10) {
          console.error('Redis: Max retries reached, stopping reconnection');
          return null; // Stop retrying
        }
        const delay = Math.min(times * 100, 3000);
        console.log(`Redis: Reconnecting in ${delay}ms (attempt ${times})`);
        return delay;
      },
    });

    redisInstance.on('error', (err) => {
      console.error('Redis connection error:', err.message);
    });

    redisInstance.on('connect', () => {
      console.log('Redis: Connected');
    });
  }

  return redisInstance;
}

// Connection options for BullMQ (avoids ioredis version mismatch)
export function getRedisConnectionOptions() {
  const url = new URL(redisUrl);
  return {
    host: url.hostname || 'localhost',
    port: parseInt(url.port || '6379'),
    password: url.password || undefined,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: true,
  };
}

// Health check function
export async function checkRedisConnection(): Promise<boolean> {
  try {
    const redis = getRedis();
    const pong = await redis.ping();
    return pong === 'PONG';
  } catch (error) {
    console.error('Redis connection failed:', error);
    return false;
  }
}

// Graceful shutdown
export async function closeRedisConnection(): Promise<void> {
  if (redisInstance) {
    await redisInstance.quit();
    redisInstance = null;
  }
}
