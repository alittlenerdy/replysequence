import Redis from 'ioredis';
import type { RedisOptions } from 'ioredis';

// Redis URL configuration
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// Singleton instance for lazy connection
let redisInstance: Redis | null = null;

// Logger helper
function log(level: 'info' | 'warn' | 'error', message: string, data: Record<string, unknown> = {}): void {
  console.log(JSON.stringify({ level, message, timestamp: new Date().toISOString(), ...data }));
}

/**
 * Parse Redis URL into connection options.
 * Handles both redis:// and rediss:// (TLS) URLs.
 */
function parseRedisUrl(url: string): RedisOptions {
  const parsed = new URL(url);
  const options: RedisOptions = {
    host: parsed.hostname || 'localhost',
    port: parseInt(parsed.port || '6379'),
    // CRITICAL: Use finite retry limit, not null (which means infinite)
    maxRetriesPerRequest: 3,
    // Enable ready check to ensure connection is fully ready before commands
    enableReadyCheck: true,
    // Connection timeout - fail fast if can't connect
    connectTimeout: 5000,
    // Command timeout - don't let commands hang forever
    commandTimeout: 5000,
    // Disable offline queue - fail immediately if not connected
    enableOfflineQueue: false,
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
  log('info', 'getRedis: called', { hasExistingInstance: !!redisInstance, status: redisInstance?.status });

  // Check if existing connection is closed/ended
  if (redisInstance && (redisInstance.status === 'end' || redisInstance.status === 'close')) {
    log('warn', 'getRedis: Previous connection closed, creating new one', { status: redisInstance.status });
    redisInstance = null;
  }

  if (!redisInstance) {
    log('info', 'getRedis: Creating new Redis instance');
    const options = parseRedisUrl(redisUrl);

    log('info', 'getRedis: Redis options', {
      host: options.host,
      port: options.port,
      maxRetriesPerRequest: options.maxRetriesPerRequest,
      enableReadyCheck: options.enableReadyCheck,
      connectTimeout: options.connectTimeout,
      commandTimeout: options.commandTimeout,
      enableOfflineQueue: options.enableOfflineQueue,
      hasTls: !!options.tls,
    });

    redisInstance = new Redis({
      ...options,
      lazyConnect: true, // Don't connect until first command
      retryStrategy(times) {
        if (times > 3) {
          log('error', 'Redis: Max retries reached, stopping reconnection', { attempts: times });
          return null; // Stop retrying
        }
        const delay = Math.min(times * 200, 2000);
        log('info', 'Redis: Reconnecting', { attempt: times, delayMs: delay });
        return delay;
      },
    });

    redisInstance.on('error', (err) => {
      log('error', 'Redis: Connection error', { error: err.message });
    });

    redisInstance.on('connect', () => {
      log('info', 'Redis: TCP connected');
    });

    redisInstance.on('ready', () => {
      log('info', 'Redis: Ready for commands');
    });

    redisInstance.on('close', () => {
      log('warn', 'Redis: Connection closed');
    });

    redisInstance.on('reconnecting', () => {
      log('info', 'Redis: Reconnecting...');
    });

    log('info', 'getRedis: Redis instance created', { status: redisInstance.status });
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
