import { getRedis } from '../redis';

// Constants
const IDEMPOTENCY_PREFIX_ZOOM = 'idempotency:zoom:';
const IDEMPOTENCY_PREFIX_MEET = 'idempotency:meet:';
const TTL_SECONDS = 24 * 60 * 60; // 24 hours in seconds
const REDIS_TIMEOUT_MS = 5000; // 5 second timeout for Redis operations

// Platform type for idempotency
export type IdempotencyPlatform = 'zoom' | 'meet';

function getPrefix(platform: IdempotencyPlatform = 'zoom'): string {
  return platform === 'meet' ? IDEMPOTENCY_PREFIX_MEET : IDEMPOTENCY_PREFIX_ZOOM;
}

// Logger helper
function log(level: 'info' | 'warn' | 'error', message: string, data: Record<string, unknown> = {}): void {
  console.log(JSON.stringify({ level, message, timestamp: new Date().toISOString(), ...data }));
}

/**
 * Wrap a promise with a timeout - properly clears timeout on success
 */
function withTimeout<T>(promise: Promise<T>, timeoutMs: number, operation: string): Promise<T> {
  let timeoutId: NodeJS.Timeout;

  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => {
      log('error', `withTimeout: ${operation} timed out`, { timeoutMs });
      reject(new Error(`${operation} timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    clearTimeout(timeoutId);
  });
}

/**
 * Check if an event has already been processed (idempotency check)
 * @param eventId - Unique event identifier from webhook
 * @param platform - Platform for the event (zoom or meet)
 * @returns true if event was already processed, false otherwise
 */
export async function isEventProcessed(eventId: string, platform: IdempotencyPlatform = 'zoom'): Promise<boolean> {
  const key = `${getPrefix(platform)}${eventId}`;
  const exists = await getRedis().exists(key);
  return exists === 1;
}

/**
 * Mark an event as processed with 24-hour TTL
 * @param eventId - Unique event identifier from webhook
 * @param metadata - Optional metadata to store with the event
 * @param platform - Platform for the event (zoom or meet)
 */
export async function markEventProcessed(
  eventId: string,
  metadata?: Record<string, unknown>,
  platform: IdempotencyPlatform = 'zoom'
): Promise<void> {
  const key = `${getPrefix(platform)}${eventId}`;
  const value = JSON.stringify({
    processedAt: new Date().toISOString(),
    ...metadata,
  });

  await getRedis().setex(key, TTL_SECONDS, value);

  console.log(JSON.stringify({
    level: 'info',
    message: 'Event marked as processed',
    eventId,
    ttlSeconds: TTL_SECONDS,
  }));
}

/**
 * Atomic check-and-set for idempotency
 * Uses Redis SETNX for atomic operation
 * @param eventId - Unique event identifier from webhook
 * @param platform - Platform for the event (zoom or meet)
 * @returns true if this is the first time processing (acquired lock), false if already processed
 */
export async function acquireEventLock(eventId: string, platform: IdempotencyPlatform = 'zoom'): Promise<boolean> {
  const startTime = Date.now();
  const key = `${getPrefix(platform)}${eventId}`;
  const value = JSON.stringify({
    processedAt: new Date().toISOString(),
  });

  log('info', 'LOCK-1: acquireEventLock entry', {
    inputEventId: eventId,
    fullRedisKey: key,
    hasRedisUrl: !!process.env.REDIS_URL,
  });

  // Check if Redis is configured
  if (!process.env.REDIS_URL) {
    log('warn', 'LOCK-2: REDIS_URL not configured, skipping', { eventId });
    return true;
  }

  try {
    log('info', 'LOCK-2: About to call getRedis()', { eventId });
    const redis = getRedis();

    log('info', 'LOCK-3: Got Redis instance', {
      eventId,
      status: redis.status,
    });

    // If not connected, try to connect explicitly first
    if (redis.status !== 'ready' && redis.status !== 'connect') {
      log('info', 'LOCK-4: Redis not ready, connecting...', { status: redis.status });
      try {
        await withTimeout(redis.connect(), 5000, 'Redis connect');
        log('info', 'LOCK-4: Redis connect completed', { status: redis.status });
      } catch (connectError) {
        log('error', 'LOCK-4: Redis connect failed', {
          error: connectError instanceof Error ? connectError.message : String(connectError),
        });
        // Allow processing on connection failure
        return true;
      }
    }

    log('info', 'LOCK-5: About to execute SET command', {
      eventId,
      key,
      ttlSeconds: TTL_SECONDS,
      redisStatus: redis.status,
    });

    // SETNX with EX (set if not exists with expiry) - atomic operation with timeout
    const result = await withTimeout(
      redis.set(key, value, 'EX', TTL_SECONDS, 'NX'),
      REDIS_TIMEOUT_MS,
      'Redis SET'
    );

    const elapsed = Date.now() - startTime;
    log('info', 'LOCK-6: SET command completed', {
      eventId,
      result,
      elapsedMs: elapsed,
    });

    if (result === 'OK') {
      log('info', 'LOCK-7: Lock acquired successfully', { eventId, elapsedMs: elapsed });
      return true;
    }

    log('info', 'LOCK-7: Lock NOT acquired (duplicate)', { eventId, elapsedMs: elapsed });
    return false;
  } catch (error) {
    const elapsed = Date.now() - startTime;
    log('error', 'LOCK-ERROR: Redis operation failed', {
      eventId,
      error: error instanceof Error ? error.message : String(error),
      errorName: error instanceof Error ? error.name : 'unknown',
      elapsedMs: elapsed,
    });
    // Allow processing on Redis failure - better to process duplicate than fail
    return true;
  }
}

/**
 * Get event processing metadata if available
 * @param eventId - Unique event identifier from webhook
 * @param platform - Platform for the event (zoom or meet)
 * @returns Metadata object or null if not found
 */
export async function getEventMetadata(
  eventId: string,
  platform: IdempotencyPlatform = 'zoom'
): Promise<Record<string, unknown> | null> {
  const key = `${getPrefix(platform)}${eventId}`;
  const value = await getRedis().get(key);

  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

/**
 * Remove event from idempotency store (for reprocessing if needed)
 * Use with caution - mainly for testing or manual intervention
 * @param eventId - Unique event identifier from webhook
 * @param platform - Platform for the event (zoom or meet)
 */
export async function removeEventLock(eventId: string, platform: IdempotencyPlatform = 'zoom'): Promise<void> {
  const key = `${getPrefix(platform)}${eventId}`;
  await getRedis().del(key);

  console.log(JSON.stringify({
    level: 'info',
    message: 'Event lock removed',
    eventId,
  }));
}
