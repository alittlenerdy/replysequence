/**
 * Tests for auto-send logic (lib/auto-send.ts)
 *
 * Covers: single-recipient send, 0/2+ recipient fallback, review preference,
 * race condition guard, and send failure revert.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---- Hoisted mocks ----

const {
  mockDbSelectFromWhereLimit,
  mockDbInsertValues,
  mockDbUpdate,
  mockSendEmail,
  mockClaimDraftForSending,
  mockRevertDraftFromSending,
  mockMarkDraftAsSent,
} = vi.hoisted(() => ({
  mockDbSelectFromWhereLimit: vi.fn(),
  mockDbInsertValues: vi.fn().mockResolvedValue(undefined),
  mockDbUpdate: vi.fn(),
  mockSendEmail: vi.fn(),
  mockClaimDraftForSending: vi.fn(),
  mockRevertDraftFromSending: vi.fn().mockResolvedValue(undefined),
  mockMarkDraftAsSent: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: (...args: unknown[]) => mockDbSelectFromWhereLimit(...args),
        })),
      })),
    })),
    insert: vi.fn(() => ({
      values: (...args: unknown[]) => mockDbInsertValues(...args),
    })),
    update: (...args: unknown[]) => mockDbUpdate(...args),
  },
  users: { id: 'id', clerkId: 'clerkId' },
}));

vi.mock('@/lib/db/schema', () => ({
  drafts: { id: 'id', subject: 'subject', body: 'body', status: 'status', trackingId: 'trackingId' },
  meetings: { id: 'id', hostEmail: 'hostEmail', participants: 'participants', topic: 'topic', platform: 'platform', startTime: 'startTime' },
  emailConnections: { userId: 'userId', isDefault: 'isDefault', id: 'id', email: 'email', provider: 'provider', accessTokenEncrypted: 'accessTokenEncrypted', refreshTokenEncrypted: 'refreshTokenEncrypted', accessTokenExpiresAt: 'accessTokenExpiresAt' },
  emailEvents: {},
  userOnboarding: { clerkId: 'clerkId', emailPreference: 'emailPreference' },
  hubspotConnections: { userId: 'userId', id: 'id' },
  salesforceConnections: { userId: 'userId', id: 'id' },
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((...args: unknown[]) => args),
  and: vi.fn((...args: unknown[]) => args),
}));

vi.mock('@/lib/email', () => ({
  sendEmail: (...args: unknown[]) => mockSendEmail(...args),
}));

vi.mock('@/lib/email-sender', () => ({
  sendViaConnectedAccount: vi.fn(),
}));

vi.mock('@/lib/email-tracking', () => ({
  injectTracking: vi.fn((body: string) => body),
}));

vi.mock('@/lib/hubspot', () => ({
  syncSentEmailToHubSpot: vi.fn().mockResolvedValue({ success: false }),
  refreshHubSpotToken: vi.fn(),
}));

vi.mock('@/lib/google-sheets', () => ({
  syncSentEmailToSheets: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/salesforce', () => ({
  syncSentEmailToSalesforce: vi.fn().mockResolvedValue({ success: false }),
  refreshSalesforceToken: vi.fn(),
}));

vi.mock('@/lib/encryption', () => ({
  decrypt: vi.fn((v: string) => v),
  encrypt: vi.fn((v: string) => v),
}));

vi.mock('@/lib/dashboard-queries', () => ({
  claimDraftForSending: (...args: unknown[]) => mockClaimDraftForSending(...args),
  revertDraftFromSending: (...args: unknown[]) => mockRevertDraftFromSending(...args),
  markDraftAsSent: (...args: unknown[]) => mockMarkDraftAsSent(...args),
}));

vi.mock('@/lib/sequence-scheduler', () => ({
  scheduleFollowUpSequence: vi.fn().mockResolvedValue(undefined),
}));

import { attemptAutoSend, determineAutoSendRecipient } from '@/lib/auto-send';

// ---- Helpers ----

function setupDbSelectSequence(results: unknown[][]) {
  let callIndex = 0;
  mockDbSelectFromWhereLimit.mockImplementation(() => {
    const result = results[callIndex] || [];
    callIndex++;
    return Promise.resolve(result);
  });
}

// ---- Tests ----

describe('determineAutoSendRecipient', () => {
  const hostEmail = 'host@example.com';

  it('returns the email when exactly 1 non-host participant', () => {
    const participants = [
      { user_name: 'Host', email: 'host@example.com' },
      { user_name: 'Attendee', email: 'attendee@example.com' },
    ];
    expect(determineAutoSendRecipient(participants, hostEmail)).toBe('attendee@example.com');
  });

  it('returns null when 0 non-host participants', () => {
    const participants = [{ user_name: 'Host', email: 'host@example.com' }];
    expect(determineAutoSendRecipient(participants, hostEmail)).toBeNull();
  });

  it('returns null when 2+ non-host participants', () => {
    const participants = [
      { user_name: 'Host', email: 'host@example.com' },
      { user_name: 'A', email: 'a@example.com' },
      { user_name: 'B', email: 'b@example.com' },
    ];
    expect(determineAutoSendRecipient(participants, hostEmail)).toBeNull();
  });

  it('returns null when participants is null', () => {
    expect(determineAutoSendRecipient(null, hostEmail)).toBeNull();
  });

  it('returns null when participants is empty array', () => {
    expect(determineAutoSendRecipient([], hostEmail)).toBeNull();
  });
});

describe('attemptAutoSend', () => {
  const params = { draftId: 'draft-1', meetingId: 'meeting-1', userId: 'user-1' };

  beforeEach(() => {
    vi.clearAllMocks();
    mockRevertDraftFromSending.mockResolvedValue(undefined);
    mockDbUpdate.mockImplementation(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn().mockResolvedValue([]),
        })),
      })),
    }));
  });

  it('auto-sends when single clear recipient and preference is auto_send', async () => {
    setupDbSelectSequence([
      [{ clerkId: 'clerk-1' }],
      [{ emailPreference: 'auto_send' }],
      [{
        hostEmail: 'host@example.com',
        participants: [
          { name: 'Host', email: 'host@example.com' },
          { name: 'Client', email: 'client@example.com' },
        ],
        topic: 'Sales Call',
        platform: 'zoom',
        startTime: new Date(),
      }],
      [{ id: 'draft-1', subject: 'Follow up', body: '<p>Hi</p>', status: 'generated', trackingId: null }],
      [], // no email connection
    ]);

    mockClaimDraftForSending.mockResolvedValue(true);
    mockSendEmail.mockResolvedValue({ success: true, messageId: 'msg-123' });

    const result = await attemptAutoSend(params);

    expect(result.autoSent).toBe(true);
    expect(result.recipientEmail).toBe('client@example.com');
    expect(result.messageId).toBe('msg-123');
    expect(mockMarkDraftAsSent).toHaveBeenCalledWith('draft-1', 'client@example.com');
  });

  it('falls back to review mode when 0 recipients', async () => {
    setupDbSelectSequence([
      [{ clerkId: 'clerk-1' }],
      [{ emailPreference: 'auto_send' }],
      [{
        hostEmail: 'host@example.com',
        participants: [{ name: 'Host', email: 'host@example.com' }],
        topic: 'Solo Meeting',
        platform: 'zoom',
        startTime: new Date(),
      }],
    ]);

    const result = await attemptAutoSend(params);

    expect(result.autoSent).toBe(false);
    expect(result.reason).toBe('ambiguous_recipient');
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it('falls back to review mode when 2+ recipients', async () => {
    setupDbSelectSequence([
      [{ clerkId: 'clerk-1' }],
      [{ emailPreference: 'auto_send' }],
      [{
        hostEmail: 'host@example.com',
        participants: [
          { name: 'Host', email: 'host@example.com' },
          { name: 'A', email: 'a@example.com' },
          { name: 'B', email: 'b@example.com' },
        ],
        topic: 'Group Call',
        platform: 'zoom',
        startTime: new Date(),
      }],
    ]);

    const result = await attemptAutoSend(params);

    expect(result.autoSent).toBe(false);
    expect(result.reason).toBe('ambiguous_recipient');
  });

  it('does not auto-send when user preference is review', async () => {
    setupDbSelectSequence([
      [{ clerkId: 'clerk-1' }],
      [{ emailPreference: 'review' }],
    ]);

    const result = await attemptAutoSend(params);

    expect(result.autoSent).toBe(false);
    expect(result.reason).toBe('user_preference_review');
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it('skips when draft claim fails (race condition guard)', async () => {
    setupDbSelectSequence([
      [{ clerkId: 'clerk-1' }],
      [{ emailPreference: 'auto_send' }],
      [{
        hostEmail: 'host@example.com',
        participants: [
          { name: 'Host', email: 'host@example.com' },
          { name: 'Client', email: 'client@example.com' },
        ],
        topic: 'Call',
        platform: 'zoom',
        startTime: new Date(),
      }],
      [{ id: 'draft-1', subject: 'Follow up', body: '<p>Hi</p>', status: 'sending', trackingId: null }],
    ]);

    mockClaimDraftForSending.mockResolvedValue(false);

    const result = await attemptAutoSend(params);

    expect(result.autoSent).toBe(false);
    expect(result.reason).toBe('draft_claimed_by_another');
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it('reverts draft to generated when send fails', async () => {
    setupDbSelectSequence([
      [{ clerkId: 'clerk-1' }],
      [{ emailPreference: 'auto_send' }],
      [{
        hostEmail: 'host@example.com',
        participants: [
          { name: 'Host', email: 'host@example.com' },
          { name: 'Client', email: 'client@example.com' },
        ],
        topic: 'Call',
        platform: 'zoom',
        startTime: new Date(),
      }],
      [{ id: 'draft-1', subject: 'Follow up', body: '<p>Hi</p>', status: 'generated', trackingId: null }],
      [], // no email connection
    ]);

    mockClaimDraftForSending.mockResolvedValue(true);
    mockSendEmail.mockResolvedValue({ success: false, error: 'SMTP error' });

    const result = await attemptAutoSend(params);

    expect(result.autoSent).toBe(false);
    expect(result.reason).toBe('send_failed');
    expect(mockRevertDraftFromSending).toHaveBeenCalledWith('draft-1');
    expect(mockMarkDraftAsSent).not.toHaveBeenCalled();
  });
});
