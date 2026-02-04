/**
 * Input Validation & Sanitization
 *
 * Provides validation schemas and sanitization utilities
 * to protect against XSS, injection, and malformed input.
 */

import { z } from 'zod';

// ============================================
// Sanitization Functions
// ============================================

/**
 * Strip HTML tags from a string to prevent XSS
 */
export function stripHtml(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'");
}

/**
 * Escape HTML entities to prevent XSS when displaying user input
 */
export function escapeHtml(input: string): string {
  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  return input.replace(/[&<>"'/]/g, (char) => htmlEntities[char] || char);
}

/**
 * Sanitize a string for safe database storage
 * Removes null bytes and trims whitespace
 */
export function sanitizeString(input: string, maxLength = 10000): string {
  return input
    .replace(/\0/g, '') // Remove null bytes
    .trim()
    .slice(0, maxLength);
}

/**
 * Validate and sanitize an email address
 */
export function sanitizeEmail(email: string): string | null {
  const trimmed = email.toLowerCase().trim();
  const emailSchema = z.string().email();
  const result = emailSchema.safeParse(trimmed);
  return result.success ? trimmed : null;
}

// ============================================
// Validation Schemas
// ============================================

/**
 * Common validation patterns
 */
export const patterns = {
  // UUID v4 pattern
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  // Safe string (alphanumeric, spaces, common punctuation)
  safeString: /^[\w\s.,!?'"()-]+$/,
  // Slug pattern
  slug: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
};

/**
 * Draft content validation
 */
export const draftSchema = z.object({
  subject: z
    .string()
    .min(1, 'Subject is required')
    .max(500, 'Subject too long')
    .transform((val) => sanitizeString(val)),
  body: z
    .string()
    .min(1, 'Body is required')
    .max(50000, 'Body too long')
    .transform((val) => sanitizeString(val)),
  meetingId: z.string().uuid('Invalid meeting ID'),
});

/**
 * Draft update validation
 */
export const draftUpdateSchema = z.object({
  id: z.string().uuid('Invalid draft ID'),
  subject: z
    .string()
    .min(1)
    .max(500)
    .transform((val) => sanitizeString(val))
    .optional(),
  body: z
    .string()
    .min(1)
    .max(50000)
    .transform((val) => sanitizeString(val))
    .optional(),
  status: z.enum(['pending', 'generating', 'generated', 'sent', 'failed']).optional(),
});

/**
 * Email send validation
 */
export const sendEmailSchema = z.object({
  draftId: z.string().uuid('Invalid draft ID'),
  to: z.string().email('Invalid email address'),
  subject: z.string().min(1).max(500).optional(),
  body: z.string().min(1).max(50000).optional(),
});

/**
 * Pagination validation
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  sort: z.enum(['asc', 'desc']).default('desc'),
});

/**
 * Date range validation
 */
export const dateRangeSchema = z.object({
  start: z.coerce.date().optional(),
  end: z.coerce.date().optional(),
});

/**
 * Search query validation
 */
export const searchSchema = z.object({
  q: z
    .string()
    .max(200)
    .transform((val) => sanitizeString(val))
    .optional(),
});

/**
 * Webhook payload validation (basic structure)
 */
export const webhookPayloadSchema = z.object({
  event: z.string().min(1).max(100),
  payload: z.record(z.string(), z.unknown()).optional(),
  download_token: z.string().optional(),
});

// ============================================
// Validation Helpers
// ============================================

export type ValidationError = {
  field: string;
  message: string;
};

/**
 * Validate data against a schema and return formatted errors
 */
export function validateData<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: ValidationError[] } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors: ValidationError[] = result.error.issues.map((err) => ({
    field: err.path.join('.') || 'unknown',
    message: err.message,
  }));

  return { success: false, errors };
}

/**
 * Check if a string contains potential XSS patterns
 */
export function containsXSS(input: string): boolean {
  const xssPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i, // onclick=, onload=, etc.
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /<link/i,
    /data:/i,
    /vbscript:/i,
  ];

  return xssPatterns.some((pattern) => pattern.test(input));
}

/**
 * Check if a string contains SQL injection patterns
 */
export function containsSQLInjection(input: string): boolean {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER)\b)/i,
    /(--)/, // SQL comment
    /(;)/, // Statement terminator
    /('.*?OR.*?'.*?=.*?')/i, // OR injection
  ];

  return sqlPatterns.some((pattern) => pattern.test(input));
}
