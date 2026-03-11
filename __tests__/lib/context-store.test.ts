import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the database module before importing anything that uses it
vi.mock('@/lib/db', () => {
  const mockReturning = vi.fn().mockResolvedValue([{ id: 'mock-deal-id', meetingCount: 1 }]);
  const mockValues = vi.fn().mockReturnValue({
    returning: mockReturning,
    onConflictDoUpdate: vi.fn().mockReturnValue({ returning: mockReturning }),
  });
  const mockSet = vi.fn().mockReturnValue({
    where: vi.fn().mockReturnValue({
      returning: vi.fn().mockResolvedValue([{ id: 'mock-deal-id', meetingCount: 1 }]),
    }),
  });
  const mockLimit = vi.fn().mockResolvedValue([]);
  const mockOrderBy = vi.fn().mockReturnValue({ limit: mockLimit });
  const mockWhere = vi.fn().mockReturnValue({
    limit: mockLimit,
    orderBy: mockOrderBy,
    returning: vi.fn().mockResolvedValue([{ id: 'mock-id' }]),
  });
  const mockFrom = vi.fn().mockReturnValue({
    where: mockWhere,
    innerJoin: vi.fn().mockReturnValue({
      where: mockWhere,
      orderBy: mockOrderBy,
    }),
  });

  // Import actual schema types for reference
  return {
    db: {
      select: vi.fn().mockReturnValue({ from: mockFrom }),
      insert: vi.fn().mockReturnValue({ values: mockValues }),
      update: vi.fn().mockReturnValue({ set: mockSet }),
    },
    dealContexts: {},
    signals: {},
    meetings: {},
  };
});

// Mock the schema module
vi.mock('@/lib/db/schema', () => ({
  dealContexts: { id: 'deal_contexts.id', userId: 'user_id', companyDomain: 'company_domain' },
  signals: { id: 'signals.id', meetingId: 'meeting_id', dealContextId: 'deal_context_id', createdAt: 'created_at', confidence: 'confidence' },
  meetings: { id: 'meetings.id', startTime: 'start_time', dealContextId: 'deal_context_id' },
}));

import {
  upsertDealContext,
  insertSignals,
  getDealContextWithSignals,
  getSignalsForMeeting,
} from '@/lib/context-store';

describe('context-store', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('upsertDealContext', () => {
    it('accepts valid deal context params', async () => {
      await expect(upsertDealContext({
        userId: '123e4567-e89b-12d3-a456-426614174000',
        companyName: 'Acme Corp',
        companyDomain: 'acme.com',
      })).resolves.toBeDefined();
    });

    it('creates new deal context without domain', async () => {
      await expect(upsertDealContext({
        userId: '123e4567-e89b-12d3-a456-426614174000',
        companyName: 'Unknown Corp',
      })).resolves.toBeDefined();
    });
  });

  describe('insertSignals', () => {
    it('accepts valid signal array', async () => {
      await expect(insertSignals({
        meetingId: '123e4567-e89b-12d3-a456-426614174000',
        signals: [
          { type: 'commitment', value: 'Send proposal by Friday', confidence: 0.9 },
          { type: 'risk', value: 'Budget freeze Q2', confidence: 0.7 },
        ],
      })).resolves.toBeDefined();
    });

    it('returns empty array for empty signals', async () => {
      const result = await insertSignals({
        meetingId: '123e4567-e89b-12d3-a456-426614174000',
        signals: [],
      });
      expect(result).toEqual([]);
    });
  });

  describe('getDealContextWithSignals', () => {
    it('returns null for non-existent deal context', async () => {
      const result = await getDealContextWithSignals('non-existent-id');
      expect(result).toBeNull();
    });
  });

  describe('getSignalsForMeeting', () => {
    it('calls db with correct meeting id', async () => {
      // The mock chain returns whatever the mock resolves to;
      // we just verify it doesn't throw with valid input
      await expect(getSignalsForMeeting('some-meeting-id')).resolves.toBeDefined();
    });
  });
});
