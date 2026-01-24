import Redis from 'ioredis';
import type { RedisOptions } from 'ioredis';

// Redis URL configuration
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// Singleton instance for lazy connection
let redisInstance: Redis | null = null;

/**
 * Parse Redis URL into connection options.
 * Handles both redis:// and rediss:// (TLS) URLs.
 */
function parseRedisUrl(url: string): RedisOptions {
  const parsed = new URL(url);
  const options: RedisOptions = {
    host: parsed.hostname || 'localhost',
    port: parseInt(parsed.port || '6379'),
    maxRetriesPerRequest: null, // Required for BullMQ
    enableReadyCheck: false,
  };

  if (parsed.password) {
    options.password = decodeURIComponent(parsed.password);
  }

  // Handle TLS for rediss:// URLs (e.g., Upstash, Railway)
  if (parsed.protocol === 'rediss:') {
    options.tls = {
      rejectUnauthorized: false, // Required for some providers
    };
  }

  return options;
}

/**
 * Get Redis client with lazy initialization.
 * Connection is only established when first called at runtime,
 * not during module load (which happens during Next.js build).
 *
 * For serverless: checks if connection is still alive and reconnects if needed.
 */
export function getRedis(): Redis {
  // Check if existing connection is closed/ended
  if (redisInstance && redisInstance.status === 'end') {
    console.log('Redis: Previous connection closed, creating new one');
    redisInstance = null;
  }

  if (!redisInstance) {
    const options = parseRedisUrl(redisUrl);
    redisInstance = new Redis({
      ...options,
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

/**
 * Connection options for BullMQ.
 * Returns fresh options each time - BullMQ creates its own connections.
 * Handles TLS for rediss:// URLs (Upstash, Railway, etc.)
 */
export function getRedisConnectionOptions(): RedisOptions {
  return parseRedisUrl(redisUrl);
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
