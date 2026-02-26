/**
 * Tests for webhook signature verification
 *
 * Covers: Zoom signature verification, challenge response generation,
 * and Zoom UUID normalization from lib/zoom/signature.ts.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import crypto from 'crypto';
import {
  verifyZoomSignature,
  generateChallengeResponse,
  normalizeZoomUuid,
} from '@/lib/zoom/signature';

// ============================================
// verifyZoomSignature
// ============================================

describe('verifyZoomSignature', () => {
  const WEBHOOK_SECRET = 'test-zoom-webhook-secret';

  // Ensure the env var is set for each test
  beforeEach(() => {
    process.env.ZOOM_WEBHOOK_SECRET_TOKEN = WEBHOOK_SECRET;
  });

  /**
   * Helper to generate a valid Zoom signature for testing.
   * Zoom format: v0=HMAC-SHA256(v0:{timestamp}:{body})
   */
  function generateValidSignature(body: string, timestamp: string): string {
    const message = `v0:${timestamp}:${body}`;
    const hash = crypto
      .createHmac('sha256', WEBHOOK_SECRET)
      .update(message)
      .digest('hex');
    return `v0=${hash}`;
  }

  describe('valid signature', () => {
    it('accepts a correctly signed request', () => {
      const body = JSON.stringify({ event: 'meeting.ended', payload: {} });
      const timestamp = '1700000000';
      const signature = generateValidSignature(body, timestamp);

      const result = verifyZoomSignature(body, signature, timestamp);
      expect(result).toBe(true);
    });

    it('accepts signature for any valid body content', () => {
      const body = 'arbitrary string content';
      const timestamp = '9999999999';
      const signature = generateValidSignature(body, timestamp);

      const result = verifyZoomSignature(body, signature, timestamp);
      expect(result).toBe(true);
    });
  });

  describe('invalid signature', () => {
    it('rejects when signature hash is wrong', () => {
      const body = JSON.stringify({ event: 'meeting.ended' });
      const timestamp = '1700000000';
      const badSignature = 'v0=0000000000000000000000000000000000000000000000000000000000000000';

      const result = verifyZoomSignature(body, badSignature, timestamp);
      expect(result).toBe(false);
    });

    it('rejects when body has been tampered with', () => {
      const originalBody = JSON.stringify({ event: 'meeting.ended' });
      const timestamp = '1700000000';
      const signature = generateValidSignature(originalBody, timestamp);

      // Tamper with the body
      const tamperedBody = JSON.stringify({ event: 'meeting.ended', hacked: true });

      const result = verifyZoomSignature(tamperedBody, signature, timestamp);
      expect(result).toBe(false);
    });

    it('rejects when timestamp differs', () => {
      const body = JSON.stringify({ event: 'meeting.ended' });
      const timestamp = '1700000000';
      const signature = generateValidSignature(body, timestamp);

      // Use a different timestamp for verification
      const result = verifyZoomSignature(body, signature, '9999999999');
      expect(result).toBe(false);
    });

    it('rejects when signature format is wrong (no v0= prefix)', () => {
      const body = JSON.stringify({ event: 'meeting.ended' });
      const timestamp = '1700000000';
      // Generate valid hash but without v0= prefix
      const message = `v0:${timestamp}:${body}`;
      const bareHash = crypto
        .createHmac('sha256', WEBHOOK_SECRET)
        .update(message)
        .digest('hex');

      const result = verifyZoomSignature(body, bareHash, timestamp);
      expect(result).toBe(false);
    });

    it('rejects empty signature', () => {
      const body = JSON.stringify({ event: 'meeting.ended' });
      const result = verifyZoomSignature(body, '', '1700000000');
      expect(result).toBe(false);
    });
  });

  describe('missing webhook secret', () => {
    it('returns false when ZOOM_WEBHOOK_SECRET_TOKEN is not set', () => {
      delete process.env.ZOOM_WEBHOOK_SECRET_TOKEN;

      const body = JSON.stringify({ event: 'meeting.ended' });
      const result = verifyZoomSignature(body, 'v0=something', '1700000000');
      expect(result).toBe(false);
    });
  });

  describe('timing-safe comparison edge cases', () => {
    it('handles signature length mismatch gracefully (returns false)', () => {
      const body = JSON.stringify({ event: 'meeting.ended' });
      const result = verifyZoomSignature(body, 'short', '1700000000');
      expect(result).toBe(false);
    });
  });
});

// ============================================
// generateChallengeResponse
// ============================================

describe('generateChallengeResponse', () => {
  const WEBHOOK_SECRET = 'test-zoom-webhook-secret';

  beforeEach(() => {
    process.env.ZOOM_WEBHOOK_SECRET_TOKEN = WEBHOOK_SECRET;
  });

  it('returns the plainToken unchanged', () => {
    const result = generateChallengeResponse('test-plain-token');
    expect(result.plainToken).toBe('test-plain-token');
  });

  it('returns a valid HMAC-SHA256 encrypted token', () => {
    const plainToken = 'zoom-challenge-token-123';
    const result = generateChallengeResponse(plainToken);

    // Manually compute expected hash
    const expected = crypto
      .createHmac('sha256', WEBHOOK_SECRET)
      .update(plainToken)
      .digest('hex');

    expect(result.encryptedToken).toBe(expected);
  });

  it('produces different encrypted tokens for different plain tokens', () => {
    const result1 = generateChallengeResponse('token-a');
    const result2 = generateChallengeResponse('token-b');

    expect(result1.encryptedToken).not.toBe(result2.encryptedToken);
  });

  it('throws when ZOOM_WEBHOOK_SECRET_TOKEN is not set', () => {
    delete process.env.ZOOM_WEBHOOK_SECRET_TOKEN;

    expect(() => generateChallengeResponse('some-token')).toThrow(
      'ZOOM_WEBHOOK_SECRET_TOKEN not configured'
    );
  });
});

// ============================================
// normalizeZoomUuid
// ============================================

describe('normalizeZoomUuid', () => {
  it('returns a simple UUID unchanged', () => {
    const uuid = 'abcd1234-ef56-7890-1234-567890abcdef';
    expect(normalizeZoomUuid(uuid)).toBe(uuid);
  });

  it('decodes URL-encoded characters', () => {
    const encoded = 'abc%2Fdef%3Dghi';
    const decoded = 'abc/def=ghi';
    expect(normalizeZoomUuid(encoded)).toBe(decoded);
  });

  it('trims whitespace', () => {
    expect(normalizeZoomUuid('  uuid-value  ')).toBe('uuid-value');
  });

  it('handles empty string', () => {
    expect(normalizeZoomUuid('')).toBe('');
  });

  it('handles UUIDs with leading slashes', () => {
    const uuid = '/abc123/def456';
    expect(normalizeZoomUuid(uuid)).toBe(uuid);
  });

  it('handles UUIDs with double slashes', () => {
    const uuid = '//abc123def456';
    expect(normalizeZoomUuid(uuid)).toBe(uuid);
  });

  it('handles malformed percent encoding gracefully', () => {
    // If decoding fails, original should be returned
    const malformed = 'abc%ZZdef';
    const result = normalizeZoomUuid(malformed);
    // Should not throw, should return original
    expect(result).toBe(malformed);
  });

  it('does not modify UUIDs without percent-encoded characters', () => {
    const uuid = 'abc/def=ghi+jkl';
    expect(normalizeZoomUuid(uuid)).toBe(uuid);
  });
});
