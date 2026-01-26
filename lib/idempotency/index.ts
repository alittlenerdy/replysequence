import { getRedis } from '../redis';

// Constants
const IDEMPOTENCY_PREFIX = 'idempotency:zoom:';
const TTL_SECONDS = 24 * 60 * 60; // 24 hours in seconds
const REDIS_TIMEOUT_MS = 3000; // 3 second timeout for Redis operations

/**
 * Wrap a promise with a timeout
 */
function withTimeout<T>(promise: Promise<T>, timeoutMs: number, operation: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${operation} timed out after ${timeoutMs}ms`)), timeoutMs)
    ),
  ]);
}

/**
 * Check if an event has already been processed (idempotency check)
 * @param eventId - Unique event identifier from Zoom webhook
 * @returns true if event was already processed, false otherwise
 */
export async function isEventProcessed(eventId: string): Promise<boolean> {
  const key = `${IDEMPOTENCY_PREFIX}${eventId}`;
  const exists = await getRedis().exists(key);
  return exists === 1;
}

/**
 * Mark an event as processed with 24-hour TTL
 * @param eventId - Unique event identifier from Zoom webhook
 * @param metadata - Optional metadata to store with the event
 */
export async function markEventProcessed(
  eventId: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  const key = `${IDEMPOTENCY_PREFIX}${eventId}`;
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
 * @param eventId - Unique event identifier from Zoom webhook
 * @returns true if this is the first time processing (acquired lock), false if already processed
 */
export async function acquireEventLock(eventId: string): Promise<boolean> {
  const key = `${IDEMPOTENCY_PREFIX}${eventId}`;
  const value = JSON.stringify({
    processedAt: new Date().toISOString(),
  });

  console.log(JSON.stringify({
    level: 'info',
    message: 'acquireEventLock: starting',
    eventId,
    hasRedisUrl: !!process.env.REDIS_URL,
  }));

  // Check if Redis is configured
  if (!process.env.REDIS_URL) {
    console.log(JSON.stringify({
      level: 'warn',
      message: 'acquireEventLock: REDIS_URL not configured, skipping idempotency check',
      eventId,
    }));
    return true; // Allow processing if Redis unavailable
  }

  try {
    // SETNX with EX (set if not exists with expiry) - atomic operation with timeout
    const result = await withTimeout(
      getRedis().set(key, value, 'EX', TTL_SECONDS, 'NX'),
      REDIS_TIMEOUT_MS,
      'Redis SET'
    );

    if (result === 'OK') {
      console.log(JSON.stringify({
        level: 'info',
        message: 'Event lock acquired',
        eventId,
      }));
      return true;
    }

    console.log(JSON.stringify({
      level: 'info',
      message: 'Event already processed (duplicate)',
      eventId,
    }));
    return false;
  } catch (error) {
    console.log(JSON.stringify({
      level: 'error',
      message: 'acquireEventLock: Redis operation failed',
      eventId,
      error: error instanceof Error ? error.message : String(error),
    }));
    // Allow processing on Redis failure - better to process duplicate than fail
    return true;
  }
}

/**
 * Get event processing metadata if available
 * @param eventId - Unique event identifier from Zoom webhook
 * @returns Metadata object or null if not found
 */
export async function getEventMetadata(
  eventId: string
): Promise<Record<string, unknown> | null> {
  const key = `${IDEMPOTENCY_PREFIX}${eventId}`;
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
 * @param eventId - Unique event identifier from Zoom webhook
 */
export async function removeEventLock(eventId: string): Promise<void> {
  const key = `${IDEMPOTENCY_PREFIX}${eventId}`;
  await getRedis().del(key);

  console.log(JSON.stringify({
    level: 'info',
    message: 'Event lock removed',
    eventId,
  }));
}
