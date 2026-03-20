/**
 * Tests for usage limit enforcement (lib/usage-limits.ts)
 *
 * Covers: free tier at/under limit, pro/team unlimited, month boundary,
 * and user-not-found defaults.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---- Hoisted mocks ----

const { mockSelectChain } = vi.hoisted(() => ({
  mockSelectChain: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  db: {
    select: (...args: unknown[]) => mockSelectChain(...args),
    insert: vi.fn(() => ({
      values: vi.fn().mockResolvedValue(undefined),
    })),
  },
  users: { id: 'id', subscriptionTier: 'subscriptionTier' },
  usageLogs: { userId: 'userId', action: 'action', createdAt: 'createdAt' },
  meetings: { id: 'id', userId: 'userId' },
}));

vi.mock('@/lib/db/schema', () => ({}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((...args: unknown[]) => args),
  and: vi.fn((...args: unknown[]) => args),
  sql: vi.fn(() => 'count(*)'),
  gte: vi.fn((...args: unknown[]) => args),
}));

import { checkDraftLimit } from '@/lib/usage-limits';

// ---- Helpers ----

/**
 * Setup mock for the two sequential db.select() calls in checkDraftLimit:
 * 1. User lookup: db.select({subscriptionTier}).from(users).where().limit(1)
 * 2. Count query: db.select({count}).from(usageLogs).where() (no .limit)
 */
function setupMocks(userResult: unknown[], countResult: unknown[]) {
  let callIdx = 0;

  mockSelectChain.mockImplementation(() => ({
    from: vi.fn(() => ({
      where: vi.fn(() => {
        const idx = callIdx++;
        if (idx === 0) {
          // User query: has .limit()
          return { limit: vi.fn().mockResolvedValue(userResult) };
        }
        // Count query: returns a thenable (no .limit() call)
        return Promise.resolve(countResult);
      }),
    })),
  }));
}

// ---- Tests ----

describe('checkDraftLimit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns allowed: false when free tier user is at limit (5/5)', async () => {
    setupMocks([{ subscriptionTier: 'free' }], [{ count: 5 }]);

    const result = await checkDraftLimit('user-1');

    expect(result.allowed).toBe(false);
    expect(result.tier).toBe('free');
    expect(result.used).toBe(5);
    expect(result.limit).toBe(5);
    expect(result.remaining).toBe(0);
  });

  it('returns allowed: true when free tier user is under limit (3/5)', async () => {
    setupMocks([{ subscriptionTier: 'free' }], [{ count: 3 }]);

    const result = await checkDraftLimit('user-1');

    expect(result.allowed).toBe(true);
    expect(result.tier).toBe('free');
    expect(result.used).toBe(3);
    expect(result.remaining).toBe(2);
  });

  it('returns allowed: true and limit: -1 for pro tier (unlimited)', async () => {
    setupMocks([{ subscriptionTier: 'pro' }], []);

    const result = await checkDraftLimit('user-1');

    expect(result.allowed).toBe(true);
    expect(result.tier).toBe('pro');
    expect(result.limit).toBe(-1);
    expect(result.remaining).toBe(-1);
  });

  it('returns allowed: true and limit: -1 for team tier (unlimited)', async () => {
    setupMocks([{ subscriptionTier: 'team' }], []);

    const result = await checkDraftLimit('user-1');

    expect(result.allowed).toBe(true);
    expect(result.tier).toBe('team');
    expect(result.limit).toBe(-1);
    expect(result.remaining).toBe(-1);
  });

  it('defaults to free tier when user not found', async () => {
    setupMocks([], [{ count: 0 }]);

    const result = await checkDraftLimit('nonexistent-user');

    expect(result.tier).toBe('free');
    expect(result.allowed).toBe(true);
    expect(result.limit).toBe(5);
    expect(result.remaining).toBe(5);
  });

  it('returns allowed: true when free user has 0 drafts this month', async () => {
    setupMocks([{ subscriptionTier: 'free' }], [{ count: 0 }]);

    const result = await checkDraftLimit('user-1');

    expect(result.allowed).toBe(true);
    expect(result.used).toBe(0);
    expect(result.remaining).toBe(5);
  });
});
