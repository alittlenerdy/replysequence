/**
 * Tests for lib/security/rate-limit.ts
 *
 * Covers: token bucket rate limiter behavior, different keys,
 * rate limit headers, and client identifier extraction.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  rateLimit,
  getRateLimitHeaders,
  getClientIdentifier,
  RATE_LIMITS,
} from '@/lib/security/rate-limit';

// We need to clear the in-memory store between tests.
// The store is module-scoped, so we'll use a fresh identifier per test.
let testCounter = 0;
function uniqueKey(): string {
  testCounter++;
  return `test-client-${testCounter}-${Date.now()}`;
}

describe('rateLimit', () => {
  describe('allows requests under the limit', () => {
    it('allows the first request and returns remaining tokens', () => {
      const key = uniqueKey();
      const result = rateLimit(key, { limit: 5, window: 60 });

      expect(result.success).toBe(true);
      expect(result.limit).toBe(5);
      expect(result.remaining).toBe(4); // 5 - 1 = 4
    });

    it('allows multiple requests up to the limit', () => {
      const key = uniqueKey();
      const config = { limit: 3, window: 60 };

      const r1 = rateLimit(key, config);
      const r2 = rateLimit(key, config);
      const r3 = rateLimit(key, config);

      expect(r1.success).toBe(true);
      expect(r1.remaining).toBe(2);
      expect(r2.success).toBe(true);
      expect(r2.remaining).toBe(1);
      expect(r3.success).toBe(true);
      expect(r3.remaining).toBe(0);
    });
  });

  describe('blocks requests over the limit', () => {
    it('blocks the request after tokens are exhausted', () => {
      const key = uniqueKey();
      const config = { limit: 2, window: 60 };

      rateLimit(key, config); // remaining: 1
      rateLimit(key, config); // remaining: 0

      const blocked = rateLimit(key, config);
      expect(blocked.success).toBe(false);
      expect(blocked.remaining).toBe(0);
    });

    it('returns a reset timestamp in the future', () => {
      const key = uniqueKey();
      const config = { limit: 1, window: 60 };

      rateLimit(key, config); // use up the single token
      const blocked = rateLimit(key, config);

      expect(blocked.success).toBe(false);
      expect(blocked.reset).toBeGreaterThan(Math.floor(Date.now() / 1000) - 1);
    });
  });

  describe('different keys are independent', () => {
    it('does not share rate limit state between different identifiers', () => {
      const keyA = uniqueKey();
      const keyB = uniqueKey();
      const config = { limit: 1, window: 60 };

      // Exhaust keyA
      rateLimit(keyA, config);
      const blockedA = rateLimit(keyA, config);

      // keyB should still be allowed
      const allowedB = rateLimit(keyB, config);

      expect(blockedA.success).toBe(false);
      expect(allowedB.success).toBe(true);
    });
  });

  describe('rate limit resets after window', () => {
    it('refills tokens after enough time has passed', () => {
      const key = uniqueKey();
      const config = { limit: 2, window: 1 }; // 1-second window

      // Use all tokens
      rateLimit(key, config);
      rateLimit(key, config);
      const blocked = rateLimit(key, config);
      expect(blocked.success).toBe(false);

      // Advance time by manipulating the entry via a fresh call after time passes
      // We use vi.useFakeTimers for this
      vi.useFakeTimers();
      vi.advanceTimersByTime(1500); // Advance 1.5 seconds (past the 1s window)

      const afterReset = rateLimit(key, config);
      expect(afterReset.success).toBe(true);

      vi.useRealTimers();
    });
  });

  describe('uses default API config', () => {
    it('defaults to RATE_LIMITS.API when no config provided', () => {
      const key = uniqueKey();
      const result = rateLimit(key);

      expect(result.limit).toBe(RATE_LIMITS.API.limit);
      expect(result.remaining).toBe(RATE_LIMITS.API.limit - 1);
    });
  });

  describe('RATE_LIMITS presets', () => {
    it('has correct API limits', () => {
      expect(RATE_LIMITS.API).toEqual({ limit: 100, window: 900 });
    });

    it('has correct AUTH limits', () => {
      expect(RATE_LIMITS.AUTH).toEqual({ limit: 30, window: 60 });
    });

    it('has correct WEBHOOK limits', () => {
      expect(RATE_LIMITS.WEBHOOK).toEqual({ limit: 200, window: 60 });
    });

    it('has correct GDPR limits', () => {
      expect(RATE_LIMITS.GDPR).toEqual({ limit: 5, window: 3600 });
    });

    it('has correct STRICT limits', () => {
      expect(RATE_LIMITS.STRICT).toEqual({ limit: 20, window: 60 });
    });
  });
});

// ============================================
// getRateLimitHeaders
// ============================================

describe('getRateLimitHeaders', () => {
  it('returns standard rate limit headers on success', () => {
    const headers = getRateLimitHeaders({
      success: true,
      limit: 100,
      remaining: 99,
      reset: 1700000000,
    });

    expect(headers['X-RateLimit-Limit']).toBe('100');
    expect(headers['X-RateLimit-Remaining']).toBe('99');
    expect(headers['X-RateLimit-Reset']).toBe('1700000000');
    expect(headers['Retry-After']).toBeUndefined();
  });

  it('includes Retry-After header when rate limited', () => {
    const futureReset = Math.floor(Date.now() / 1000) + 30;
    const headers = getRateLimitHeaders({
      success: false,
      limit: 100,
      remaining: 0,
      reset: futureReset,
    });

    expect(headers['X-RateLimit-Remaining']).toBe('0');
    expect(headers['Retry-After']).toBeDefined();
    expect(parseInt(headers['Retry-After'])).toBeGreaterThan(0);
  });
});

// ============================================
// getClientIdentifier
// ============================================

describe('getClientIdentifier', () => {
  it('extracts IP from x-forwarded-for header', () => {
    const request = new Request('http://localhost', {
      headers: { 'x-forwarded-for': '192.168.1.1, 10.0.0.1' },
    });
    expect(getClientIdentifier(request)).toBe('192.168.1.1');
  });

  it('extracts IP from x-real-ip header', () => {
    const request = new Request('http://localhost', {
      headers: { 'x-real-ip': '10.0.0.1' },
    });
    expect(getClientIdentifier(request)).toBe('10.0.0.1');
  });

  it('extracts IP from cf-connecting-ip header', () => {
    const request = new Request('http://localhost', {
      headers: { 'cf-connecting-ip': '172.16.0.1' },
    });
    expect(getClientIdentifier(request)).toBe('172.16.0.1');
  });

  it('extracts IP from x-vercel-forwarded-for header', () => {
    const request = new Request('http://localhost', {
      headers: { 'x-vercel-forwarded-for': '203.0.113.1' },
    });
    expect(getClientIdentifier(request)).toBe('203.0.113.1');
  });

  it('falls back to unknown-client when no headers present', () => {
    const request = new Request('http://localhost');
    expect(getClientIdentifier(request)).toBe('unknown-client');
  });

  it('prefers x-forwarded-for over other headers', () => {
    const request = new Request('http://localhost', {
      headers: {
        'x-forwarded-for': '1.1.1.1',
        'x-real-ip': '2.2.2.2',
      },
    });
    expect(getClientIdentifier(request)).toBe('1.1.1.1');
  });
});
