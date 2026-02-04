/**
 * Rate Limiting Utility
 *
 * Simple token bucket rate limiter for API endpoints.
 * Uses in-memory storage (works for single-instance deployments).
 * For production scale, consider Redis-based implementation.
 */

interface RateLimitConfig {
  /** Maximum requests allowed in the window */
  limit: number;
  /** Time window in seconds */
  window: number;
}

interface RateLimitEntry {
  tokens: number;
  lastRefill: number;
}

// In-memory storage for rate limit entries
const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up old entries periodically (every 5 minutes)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    const maxAge = 10 * 60 * 1000; // 10 minutes

    for (const [key, entry] of rateLimitStore.entries()) {
      if (now - entry.lastRefill > maxAge) {
        rateLimitStore.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

// Default configurations for different endpoint types
export const RATE_LIMITS = {
  // Standard API endpoints: 100 requests per minute
  API: { limit: 100, window: 60 },
  // Authentication endpoints: 10 requests per minute
  AUTH: { limit: 10, window: 60 },
  // Webhook endpoints: 500 requests per minute (higher for automated systems)
  WEBHOOK: { limit: 500, window: 60 },
  // GDPR exports: 5 per hour
  GDPR: { limit: 5, window: 3600 },
  // Strict: 20 requests per minute
  STRICT: { limit: 20, window: 60 },
} as const;

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp when limit resets
}

/**
 * Check if a request should be rate limited
 *
 * @param identifier - Unique identifier for the client (IP, user ID, etc.)
 * @param config - Rate limit configuration
 * @returns Rate limit result with remaining tokens and reset time
 */
export function rateLimit(
  identifier: string,
  config: RateLimitConfig = RATE_LIMITS.API
): RateLimitResult {
  const now = Date.now();
  const windowMs = config.window * 1000;
  const key = `${identifier}:${config.limit}:${config.window}`;

  let entry = rateLimitStore.get(key);

  if (!entry) {
    // First request from this identifier
    entry = {
      tokens: config.limit - 1,
      lastRefill: now,
    };
    rateLimitStore.set(key, entry);

    return {
      success: true,
      limit: config.limit,
      remaining: entry.tokens,
      reset: Math.floor((now + windowMs) / 1000),
    };
  }

  // Calculate tokens to add based on time elapsed
  const elapsed = now - entry.lastRefill;
  const tokensToAdd = Math.floor((elapsed / windowMs) * config.limit);

  if (tokensToAdd > 0) {
    entry.tokens = Math.min(config.limit, entry.tokens + tokensToAdd);
    entry.lastRefill = now;
  }

  // Check if request is allowed
  if (entry.tokens > 0) {
    entry.tokens -= 1;
    rateLimitStore.set(key, entry);

    return {
      success: true,
      limit: config.limit,
      remaining: entry.tokens,
      reset: Math.floor((entry.lastRefill + windowMs) / 1000),
    };
  }

  // Rate limit exceeded
  return {
    success: false,
    limit: config.limit,
    remaining: 0,
    reset: Math.floor((entry.lastRefill + windowMs) / 1000),
  };
}

/**
 * Get rate limit headers for response
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.reset.toString(),
    ...(result.success ? {} : { 'Retry-After': Math.max(0, result.reset - Math.floor(Date.now() / 1000)).toString() }),
  };
}

/**
 * Extract client identifier from request
 * Uses IP address with fallback to forwarded headers
 */
export function getClientIdentifier(request: Request): string {
  // Try various headers for client IP
  const headers = [
    'x-forwarded-for',
    'x-real-ip',
    'cf-connecting-ip', // Cloudflare
    'x-vercel-forwarded-for', // Vercel
  ];

  for (const header of headers) {
    const value = request.headers.get(header);
    if (value) {
      // x-forwarded-for can contain multiple IPs, take the first one
      return value.split(',')[0].trim();
    }
  }

  // Fallback to a generic identifier
  return 'unknown-client';
}
