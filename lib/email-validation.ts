/**
 * Email validation gate — validates recipient emails before sending.
 *
 * Two-tier validation:
 *   1. Basic: regex format check + MX record lookup (free, no API key needed)
 *   2. Deep: Abstract API validation (optional, requires ABSTRACT_API_KEY)
 *
 * Results are cached in-memory for 24 hours to avoid redundant lookups.
 */

import dns from 'dns';
import { promisify } from 'util';

const resolveMx = promisify(dns.resolveMx);

// ── Types ────────────────────────────────────────────────────────────────────

export type Deliverability = 'deliverable' | 'undeliverable' | 'risky' | 'unknown';

export interface EmailValidationResult {
  valid: boolean;
  reason?: string;
  deliverability: Deliverability;
}

// ── In-memory cache (24h TTL) ────────────────────────────────────────────────

interface CacheEntry {
  result: EmailValidationResult;
  expiresAt: number;
}

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const validationCache = new Map<string, CacheEntry>();

function getCached(email: string): EmailValidationResult | null {
  const entry = validationCache.get(email.toLowerCase());
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    validationCache.delete(email.toLowerCase());
    return null;
  }
  return entry.result;
}

function setCache(email: string, result: EmailValidationResult): void {
  // Cap cache size to prevent unbounded memory growth
  if (validationCache.size > 10_000) {
    // Evict oldest entries
    const entries = [...validationCache.entries()];
    entries.sort((a, b) => a[1].expiresAt - b[1].expiresAt);
    for (let i = 0; i < 2000; i++) {
      validationCache.delete(entries[i][0]);
    }
  }
  validationCache.set(email.toLowerCase(), {
    result,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}

// ── Basic validation (regex + MX) ────────────────────────────────────────────

/**
 * RFC 5322-ish regex — catches most invalid formats without being overly strict.
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Known disposable/temporary email domains (small blocklist).
 */
const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com', 'guerrillamail.com', 'tempmail.com', 'throwaway.email',
  'yopmail.com', 'sharklasers.com', 'guerrillamailblock.com', 'grr.la',
  'dispostable.com', 'trashmail.com', 'tempail.com', 'fakeinbox.com',
]);

async function basicValidation(email: string): Promise<EmailValidationResult> {
  // Format check
  if (!EMAIL_REGEX.test(email)) {
    return { valid: false, reason: 'Invalid email format', deliverability: 'undeliverable' };
  }

  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) {
    return { valid: false, reason: 'Missing domain', deliverability: 'undeliverable' };
  }

  // Disposable domain check
  if (DISPOSABLE_DOMAINS.has(domain)) {
    return { valid: true, reason: 'Disposable email domain', deliverability: 'risky' };
  }

  // MX record lookup
  try {
    const mxRecords = await resolveMx(domain);
    if (!mxRecords || mxRecords.length === 0) {
      return { valid: false, reason: 'Domain has no MX records', deliverability: 'undeliverable' };
    }
    return { valid: true, deliverability: 'unknown' };
  } catch (err: unknown) {
    const code = (err as NodeJS.ErrnoException)?.code;
    if (code === 'ENOTFOUND' || code === 'ENODATA') {
      return { valid: false, reason: 'Domain does not exist', deliverability: 'undeliverable' };
    }
    // DNS timeout or transient error — don't block
    console.log(JSON.stringify({
      level: 'warn',
      message: 'MX lookup failed (non-blocking)',
      email: email.split('@')[1],
      error: err instanceof Error ? err.message : String(err),
    }));
    return { valid: true, deliverability: 'unknown' };
  }
}

// ── Abstract API deep validation ─────────────────────────────────────────────

interface AbstractApiResponse {
  email: string;
  deliverability: string; // 'DELIVERABLE' | 'UNDELIVERABLE' | 'RISKY' | 'UNKNOWN'
  is_valid_format: { value: boolean };
  is_disposable_email: { value: boolean };
  is_role_email: { value: boolean };
  is_mx_found: { value: boolean };
  is_smtp_valid: { value: boolean };
  is_catchall_email: { value: boolean };
}

function mapAbstractDeliverability(value: string): Deliverability {
  switch (value.toUpperCase()) {
    case 'DELIVERABLE': return 'deliverable';
    case 'UNDELIVERABLE': return 'undeliverable';
    case 'RISKY': return 'risky';
    default: return 'unknown';
  }
}

async function abstractApiValidation(email: string): Promise<EmailValidationResult | null> {
  const apiKey = process.env.ABSTRACT_API_KEY;
  if (!apiKey) return null;

  try {
    const url = `https://emailvalidation.abstractapi.com/v1/?api_key=${encodeURIComponent(apiKey)}&email=${encodeURIComponent(email)}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) {
      console.log(JSON.stringify({
        level: 'warn',
        message: 'Abstract API returned non-OK status',
        status: res.status,
        email: email.split('@')[1],
      }));
      return null;
    }

    const data: AbstractApiResponse = await res.json();
    const deliverability = mapAbstractDeliverability(data.deliverability);

    let reason: string | undefined;
    if (deliverability === 'undeliverable') {
      if (!data.is_valid_format.value) reason = 'Invalid email format';
      else if (!data.is_mx_found.value) reason = 'Domain has no mail server';
      else if (!data.is_smtp_valid.value) reason = 'Mailbox does not exist';
      else reason = 'Email is undeliverable';
    } else if (deliverability === 'risky') {
      if (data.is_disposable_email.value) reason = 'Disposable email address';
      else if (data.is_catchall_email.value) reason = 'Catch-all domain (delivery uncertain)';
      else if (data.is_role_email.value) reason = 'Role-based email (e.g. info@, admin@)';
      else reason = 'Delivery may be unreliable';
    }

    return {
      valid: deliverability !== 'undeliverable',
      reason,
      deliverability,
    };
  } catch (err) {
    console.log(JSON.stringify({
      level: 'warn',
      message: 'Abstract API validation failed (falling back to basic)',
      error: err instanceof Error ? err.message : String(err),
    }));
    return null;
  }
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Validate an email address before sending.
 *
 * - First checks the 24h cache
 * - Runs basic validation (regex + MX)
 * - If ABSTRACT_API_KEY is set, runs deep validation via Abstract API
 * - Falls back gracefully if Abstract API is unavailable
 */
export async function validateEmail(email: string): Promise<EmailValidationResult> {
  const normalized = email.trim().toLowerCase();

  // Check cache first
  const cached = getCached(normalized);
  if (cached) return cached;

  // Basic validation (regex + MX)
  const basic = await basicValidation(normalized);

  // If basic says undeliverable, no need for deep validation
  if (basic.deliverability === 'undeliverable') {
    setCache(normalized, basic);
    return basic;
  }

  // Try deep validation via Abstract API
  const deep = await abstractApiValidation(normalized);
  if (deep) {
    setCache(normalized, deep);
    return deep;
  }

  // No deep validation available — use basic result
  // Upgrade 'unknown' to 'deliverable' if MX records exist (basic passed)
  if (basic.deliverability === 'unknown' && basic.valid) {
    const result: EmailValidationResult = { valid: true, deliverability: 'deliverable' };
    setCache(normalized, result);
    return result;
  }

  setCache(normalized, basic);
  return basic;
}
