/**
 * Tests for lib/security/validation.ts
 *
 * Covers: sanitization functions, Zod validation schemas,
 * XSS/SQL injection detection, and the validateData helper.
 */

import { describe, it, expect } from 'vitest';
import {
  stripHtml,
  escapeHtml,
  sanitizeString,
  sanitizeEmail,
  draftSchema,
  draftUpdateSchema,
  sendEmailSchema,
  paginationSchema,
  webhookPayloadSchema,
  validateData,
  containsXSS,
  containsSQLInjection,
  patterns,
} from '@/lib/security/validation';

// ============================================
// stripHtml
// ============================================

describe('stripHtml', () => {
  it('removes basic HTML tags', () => {
    expect(stripHtml('<b>bold</b>')).toBe('bold');
    expect(stripHtml('<p>paragraph</p>')).toBe('paragraph');
  });

  it('removes script tags and their contents', () => {
    expect(stripHtml('<script>alert("xss")</script>safe')).toBe('safe');
    expect(stripHtml('before<script type="text/javascript">evil()</script>after')).toBe('beforeafter');
  });

  it('decodes HTML entities', () => {
    expect(stripHtml('&lt;tag&gt;')).toBe('<tag>');
    expect(stripHtml('&amp;')).toBe('&');
    expect(stripHtml('&quot;hello&quot;')).toBe('"hello"');
    expect(stripHtml('&#x27;apostrophe&#x27;')).toBe("'apostrophe'");
  });

  it('handles nested tags', () => {
    expect(stripHtml('<div><span>text</span></div>')).toBe('text');
  });

  it('returns plain text unchanged', () => {
    expect(stripHtml('no html here')).toBe('no html here');
  });

  it('handles empty string', () => {
    expect(stripHtml('')).toBe('');
  });
});

// ============================================
// escapeHtml
// ============================================

describe('escapeHtml', () => {
  it('escapes ampersands', () => {
    expect(escapeHtml('a&b')).toBe('a&amp;b');
  });

  it('escapes angle brackets', () => {
    expect(escapeHtml('<script>')).toBe('&lt;script&gt;');
  });

  it('escapes quotes', () => {
    expect(escapeHtml('"hello"')).toBe('&quot;hello&quot;');
    expect(escapeHtml("'hello'")).toBe('&#x27;hello&#x27;');
  });

  it('escapes forward slashes', () => {
    expect(escapeHtml('a/b')).toBe('a&#x2F;b');
  });

  it('returns safe text unchanged', () => {
    expect(escapeHtml('safe text 123')).toBe('safe text 123');
  });

  it('handles empty string', () => {
    expect(escapeHtml('')).toBe('');
  });
});

// ============================================
// sanitizeString
// ============================================

describe('sanitizeString', () => {
  it('removes null bytes', () => {
    expect(sanitizeString('hello\0world')).toBe('helloworld');
  });

  it('trims whitespace', () => {
    expect(sanitizeString('  hello  ')).toBe('hello');
  });

  it('truncates to maxLength', () => {
    const long = 'a'.repeat(200);
    expect(sanitizeString(long, 100)).toHaveLength(100);
  });

  it('uses default maxLength of 10000', () => {
    const long = 'a'.repeat(20000);
    expect(sanitizeString(long)).toHaveLength(10000);
  });

  it('handles empty string', () => {
    expect(sanitizeString('')).toBe('');
  });

  it('handles string shorter than maxLength', () => {
    expect(sanitizeString('short', 1000)).toBe('short');
  });
});

// ============================================
// sanitizeEmail
// ============================================

describe('sanitizeEmail', () => {
  it('returns valid email in lowercase', () => {
    expect(sanitizeEmail('Test@Example.COM')).toBe('test@example.com');
  });

  it('trims whitespace', () => {
    expect(sanitizeEmail('  user@example.com  ')).toBe('user@example.com');
  });

  it('returns null for invalid email', () => {
    expect(sanitizeEmail('not-an-email')).toBeNull();
    expect(sanitizeEmail('missing@')).toBeNull();
    expect(sanitizeEmail('@missing.com')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(sanitizeEmail('')).toBeNull();
  });
});

// ============================================
// patterns
// ============================================

describe('patterns', () => {
  describe('uuid', () => {
    it('matches valid UUID v4', () => {
      expect(patterns.uuid.test('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    });

    it('rejects non-v4 UUIDs', () => {
      // Version byte must be 4
      expect(patterns.uuid.test('550e8400-e29b-31d4-a716-446655440000')).toBe(false);
    });

    it('rejects random strings', () => {
      expect(patterns.uuid.test('not-a-uuid')).toBe(false);
    });
  });

  describe('slug', () => {
    it('matches valid slugs', () => {
      expect(patterns.slug.test('hello-world')).toBe(true);
      expect(patterns.slug.test('abc123')).toBe(true);
    });

    it('rejects slugs with uppercase', () => {
      expect(patterns.slug.test('Hello')).toBe(false);
    });

    it('rejects slugs with spaces', () => {
      expect(patterns.slug.test('hello world')).toBe(false);
    });
  });
});

// ============================================
// draftSchema
// ============================================

describe('draftSchema', () => {
  it('validates correct input', () => {
    const result = draftSchema.safeParse({
      subject: 'Meeting Follow-up',
      body: 'Thanks for the great meeting.',
      meetingId: '550e8400-e29b-41d4-a716-446655440000',
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing subject', () => {
    const result = draftSchema.safeParse({
      body: 'Some body',
      meetingId: '550e8400-e29b-41d4-a716-446655440000',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty subject', () => {
    const result = draftSchema.safeParse({
      subject: '',
      body: 'Some body',
      meetingId: '550e8400-e29b-41d4-a716-446655440000',
    });
    expect(result.success).toBe(false);
  });

  it('rejects subject over 500 chars', () => {
    const result = draftSchema.safeParse({
      subject: 'x'.repeat(501),
      body: 'Some body',
      meetingId: '550e8400-e29b-41d4-a716-446655440000',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid meetingId', () => {
    const result = draftSchema.safeParse({
      subject: 'Valid subject',
      body: 'Some body',
      meetingId: 'not-a-uuid',
    });
    expect(result.success).toBe(false);
  });

  it('sanitizes subject and body (strips null bytes, trims)', () => {
    const result = draftSchema.safeParse({
      subject: '  Subject\0 ',
      body: '  Body\0 ',
      meetingId: '550e8400-e29b-41d4-a716-446655440000',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.subject).toBe('Subject');
      expect(result.data.body).toBe('Body');
    }
  });
});

// ============================================
// draftUpdateSchema
// ============================================

describe('draftUpdateSchema', () => {
  it('validates with only id', () => {
    const result = draftUpdateSchema.safeParse({
      id: '550e8400-e29b-41d4-a716-446655440000',
    });
    expect(result.success).toBe(true);
  });

  it('validates with id and optional fields', () => {
    const result = draftUpdateSchema.safeParse({
      id: '550e8400-e29b-41d4-a716-446655440000',
      subject: 'Updated subject',
      status: 'sent',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid status', () => {
    const result = draftUpdateSchema.safeParse({
      id: '550e8400-e29b-41d4-a716-446655440000',
      status: 'invalid_status',
    });
    expect(result.success).toBe(false);
  });
});

// ============================================
// sendEmailSchema
// ============================================

describe('sendEmailSchema', () => {
  it('validates correct send email input', () => {
    const result = sendEmailSchema.safeParse({
      draftId: '550e8400-e29b-41d4-a716-446655440000',
      to: 'user@example.com',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid email address', () => {
    const result = sendEmailSchema.safeParse({
      draftId: '550e8400-e29b-41d4-a716-446655440000',
      to: 'not-email',
    });
    expect(result.success).toBe(false);
  });

  it('allows optional subject and body overrides', () => {
    const result = sendEmailSchema.safeParse({
      draftId: '550e8400-e29b-41d4-a716-446655440000',
      to: 'user@example.com',
      subject: 'Custom subject',
      body: 'Custom body',
    });
    expect(result.success).toBe(true);
  });
});

// ============================================
// paginationSchema
// ============================================

describe('paginationSchema', () => {
  it('uses defaults when no input given', () => {
    const result = paginationSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(10);
      expect(result.data.sort).toBe('desc');
    }
  });

  it('coerces string numbers', () => {
    const result = paginationSchema.safeParse({ page: '3', limit: '25' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(3);
      expect(result.data.limit).toBe(25);
    }
  });

  it('rejects page < 1', () => {
    const result = paginationSchema.safeParse({ page: 0 });
    expect(result.success).toBe(false);
  });

  it('rejects limit > 100', () => {
    const result = paginationSchema.safeParse({ limit: 101 });
    expect(result.success).toBe(false);
  });
});

// ============================================
// webhookPayloadSchema
// ============================================

describe('webhookPayloadSchema', () => {
  it('validates a basic webhook payload', () => {
    const result = webhookPayloadSchema.safeParse({
      event: 'meeting.ended',
      payload: { meeting_id: '123' },
    });
    expect(result.success).toBe(true);
  });

  it('validates without optional payload', () => {
    const result = webhookPayloadSchema.safeParse({
      event: 'meeting.ended',
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing event', () => {
    const result = webhookPayloadSchema.safeParse({
      payload: { meeting_id: '123' },
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty event string', () => {
    const result = webhookPayloadSchema.safeParse({
      event: '',
    });
    expect(result.success).toBe(false);
  });
});

// ============================================
// validateData
// ============================================

describe('validateData', () => {
  it('returns success with valid data', () => {
    const result = validateData(draftSchema, {
      subject: 'Test',
      body: 'Body text',
      meetingId: '550e8400-e29b-41d4-a716-446655440000',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.subject).toBe('Test');
    }
  });

  it('returns errors with invalid data', () => {
    const result = validateData(draftSchema, {
      subject: '',
      body: '',
      meetingId: 'bad',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toHaveProperty('field');
      expect(result.errors[0]).toHaveProperty('message');
    }
  });

  it('returns structured error for each invalid field', () => {
    const result = validateData(draftSchema, {});
    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = result.errors.map(e => e.field);
      expect(fields).toContain('subject');
      expect(fields).toContain('body');
      expect(fields).toContain('meetingId');
    }
  });
});

// ============================================
// containsXSS
// ============================================

describe('containsXSS', () => {
  it('detects script tags', () => {
    expect(containsXSS('<script>alert(1)</script>')).toBe(true);
  });

  it('detects javascript: URIs', () => {
    expect(containsXSS('javascript:alert(1)')).toBe(true);
  });

  it('detects event handlers', () => {
    expect(containsXSS('onload=alert(1)')).toBe(true);
    expect(containsXSS('onclick = doEvil()')).toBe(true);
  });

  it('detects iframe tags', () => {
    expect(containsXSS('<iframe src="evil.com">')).toBe(true);
  });

  it('detects data: URIs', () => {
    expect(containsXSS('data:text/html,<script>alert(1)</script>')).toBe(true);
  });

  it('returns false for safe text', () => {
    expect(containsXSS('Hello, this is a normal sentence.')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(containsXSS('')).toBe(false);
  });
});

// ============================================
// containsSQLInjection
// ============================================

describe('containsSQLInjection', () => {
  it('detects SELECT statements', () => {
    expect(containsSQLInjection("SELECT * FROM users")).toBe(true);
  });

  it('detects DROP statements', () => {
    expect(containsSQLInjection("DROP TABLE users")).toBe(true);
  });

  it('detects SQL comments', () => {
    expect(containsSQLInjection("value -- comment")).toBe(true);
  });

  it('detects statement terminators', () => {
    expect(containsSQLInjection("value; DROP TABLE")).toBe(true);
  });

  it('returns false for normal text', () => {
    // Note: The regex is broad. Normal text without SQL keywords is safe.
    expect(containsSQLInjection('Hello world')).toBe(false);
  });
});
