/**
 * Tests for onboarding progress API (app/api/onboarding/progress/route.ts)
 *
 * Covers: no connections (step 1/2), platform connected, email connected,
 * step regression when connections removed.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---- Mocks ----

// Mock Clerk auth
const mockAuth = vi.fn();
vi.mock('@clerk/nextjs/server', () => ({
  auth: () => mockAuth(),
}));

// Mock rate limiter (always allow)
vi.mock('@/lib/security/rate-limit', () => ({
  rateLimit: vi.fn(() => ({ success: true, remaining: 29 })),
  RATE_LIMITS: { AUTH: { max: 30, windowMs: 60000 } },
  getClientIdentifier: vi.fn(() => '127.0.0.1'),
  getRateLimitHeaders: vi.fn(() => ({})),
}));

vi.mock('@/lib/api-validation', () => ({
  parseBody: vi.fn(),
}));

// Mock DB: we need fine-grained control per test
const mockOnboardingSelect = vi.fn();
const mockUserSelect = vi.fn();
const mockOnboardingInsert = vi.fn();
const mockPromiseAll = vi.fn();

vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn((_fields?: unknown) => ({
      from: vi.fn((table: unknown) => ({
        where: vi.fn(() => ({
          limit: vi.fn(() => {
            // Route through different mocks based on call order
            // The GET handler calls: onboarding select, then user select, then Promise.all of 9 queries
            return Promise.resolve([]);
          }),
        })),
      })),
    })),
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: mockOnboardingInsert,
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn().mockResolvedValue(undefined),
      })),
    })),
  },
}));

vi.mock('@/lib/db/schema', () => ({
  userOnboarding: { clerkId: 'clerkId' },
  users: { id: 'id', clerkId: 'clerkId' },
  zoomConnections: { id: 'id', userId: 'userId' },
  teamsConnections: { id: 'id', userId: 'userId' },
  meetConnections: { id: 'id', userId: 'userId' },
  calendarConnections: { id: 'id', userId: 'userId' },
  outlookCalendarConnections: { id: 'id', userId: 'userId' },
  emailConnections: { id: 'id', userId: 'userId', email: 'email', provider: 'provider' },
  hubspotConnections: { id: 'id', userId: 'userId' },
  sheetsConnections: { id: 'id', userId: 'userId' },
  salesforceConnections: { id: 'id', userId: 'userId' },
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((...args: unknown[]) => args),
}));

// We need to deeply mock the db to control the GET handler's Promise.all
// The handler does: onboarding select, user select, then Promise.all([9 connection queries])
// Let's re-mock db with a stateful implementation

import { db } from '@/lib/db';
import { GET } from '@/app/api/onboarding/progress/route';
import { NextRequest } from 'next/server';

// ---- Helpers ----

function createGetRequest(): NextRequest {
  return new NextRequest('http://localhost:3000/api/onboarding/progress', {
    method: 'GET',
  });
}

/**
 * Configure the db mock for the GET handler flow.
 * The handler makes these sequential db calls:
 * 1. db.select().from(userOnboarding).where().limit(1) -> onboarding record
 * 2. db.select({id}).from(users).where().limit(1) -> user record
 * 3. Promise.all([ 9x db.select().from(connectionTable).where().limit(1) ])
 */
function setupDbMocks(config: {
  onboarding: unknown[] | null;
  user: unknown[] | null;
  connections: {
    zoom: unknown[];
    teams: unknown[];
    meet: unknown[];
    googleCal: unknown[];
    outlookCal: unknown[];
    email: unknown[];
    hubspot: unknown[];
    salesforce: unknown[];
    sheets: unknown[];
  };
}) {
  let callIndex = 0;

  const selectResults = [
    config.onboarding || [],
    config.user || [],
    // The 9 connection queries run via Promise.all but each is a separate limit() call
    config.connections.zoom,
    config.connections.teams,
    config.connections.meet,
    config.connections.googleCal,
    config.connections.outlookCal,
    config.connections.email,
    config.connections.hubspot,
    config.connections.salesforce,
    config.connections.sheets,
  ];

  // Override the db.select mock to track calls
  (db.select as ReturnType<typeof vi.fn>).mockImplementation((_fields?: unknown) => ({
    from: vi.fn(() => ({
      where: vi.fn(() => ({
        limit: vi.fn(() => {
          const result = selectResults[callIndex] || [];
          callIndex++;
          return Promise.resolve(result);
        }),
      })),
    })),
  }));
}

const emptyConnections = {
  zoom: [],
  teams: [],
  meet: [],
  googleCal: [],
  outlookCal: [],
  email: [],
  hubspot: [],
  salesforce: [],
  sheets: [],
};

// ---- Tests ----

describe('Onboarding Progress GET', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ userId: 'clerk-user-1' });
  });

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const response = await GET(createGetRequest());
    expect(response.status).toBe(401);
  });

  it('creates a new onboarding record when none exists', async () => {
    // First select for onboarding returns empty (no record)
    (db.select as ReturnType<typeof vi.fn>).mockImplementation(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve([])),
        })),
      })),
    }));

    mockOnboardingInsert.mockResolvedValue([{
      id: 'onb-1',
      clerkId: 'clerk-user-1',
      currentStep: 1,
      platformConnected: null,
      calendarConnected: false,
      emailConnected: false,
      draftGenerated: false,
      emailPreference: 'review',
      completedAt: null,
    }]);

    const response = await GET(createGetRequest());
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.currentStep).toBe(1);
  });

  it('returns no connections when user has none', async () => {
    setupDbMocks({
      onboarding: [{
        id: 'onb-1',
        clerkId: 'clerk-user-1',
        currentStep: 2,
        platformConnected: null,
        completedAt: null,
      }],
      user: [{ id: 'user-db-1' }],
      connections: emptyConnections,
    });

    const response = await GET(createGetRequest());
    expect(response.status).toBe(200);
    const body = await response.json();

    expect(body.connectedPlatforms).toEqual([]);
    expect(body.platformConnected).toBeNull();
    expect(body.emailConnected).toBe(false);
    expect(body.currentStep).toBe(2);
  });

  it('shows platformConnected when Zoom is connected', async () => {
    setupDbMocks({
      onboarding: [{
        id: 'onb-1',
        clerkId: 'clerk-user-1',
        currentStep: 3,
        platformConnected: 'zoom',
        completedAt: null,
      }],
      user: [{ id: 'user-db-1' }],
      connections: {
        ...emptyConnections,
        zoom: [{ id: 'zoom-conn-1' }],
      },
    });

    const response = await GET(createGetRequest());
    expect(response.status).toBe(200);
    const body = await response.json();

    expect(body.connectedPlatforms).toContain('zoom');
    expect(body.platformConnected).toBe('zoom');
    expect(body.currentStep).toBe(3);
  });

  it('shows emailConnected when Gmail is connected', async () => {
    setupDbMocks({
      onboarding: [{
        id: 'onb-1',
        clerkId: 'clerk-user-1',
        currentStep: 4,
        platformConnected: 'zoom',
        completedAt: null,
      }],
      user: [{ id: 'user-db-1' }],
      connections: {
        ...emptyConnections,
        zoom: [{ id: 'zoom-1' }],
        email: [{ id: 'email-1', email: 'user@gmail.com', provider: 'gmail' }],
      },
    });

    const response = await GET(createGetRequest());
    expect(response.status).toBe(200);
    const body = await response.json();

    expect(body.emailConnected).toBe(true);
    expect(body.connectedEmail).toBe('user@gmail.com');
    expect(body.emailProvider).toBe('gmail');
  });

  it('regresses step when platform connection is removed', async () => {
    // User was at step 4 but platform connection was removed
    setupDbMocks({
      onboarding: [{
        id: 'onb-1',
        clerkId: 'clerk-user-1',
        currentStep: 4,
        platformConnected: 'zoom',
        completedAt: null,  // Not completed
      }],
      user: [{ id: 'user-db-1' }],
      connections: emptyConnections,  // All connections gone
    });

    const response = await GET(createGetRequest());
    expect(response.status).toBe(200);
    const body = await response.json();

    // Step should regress to 2 (connect platform step)
    expect(body.currentStep).toBe(2);
    expect(body.connectedPlatforms).toEqual([]);
    expect(body.platformConnected).toBeNull();
  });
});
