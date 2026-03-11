import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/claude-api', () => ({
  callClaudeAPI: vi.fn(),
  log: vi.fn(),
}));

vi.mock('@/lib/context-store', () => ({
  getSignalsForMeeting: vi.fn().mockResolvedValue([]),
}));

vi.mock('@/lib/map/store', () => ({
  createMap: vi.fn().mockResolvedValue({ id: 'map-1', title: 'Test MAP' }),
}));

import { generateMap, parseMapResponse } from '@/lib/map/generate';
import { callClaudeAPI } from '@/lib/claude-api';
import { getSignalsForMeeting } from '@/lib/context-store';
import { createMap } from '@/lib/map/store';

const mockCallClaudeAPI = vi.mocked(callClaudeAPI);
const mockGetSignals = vi.mocked(getSignalsForMeeting);
const mockCreateMap = vi.mocked(createMap);

// ── parseMapResponse ─────────────────────────────────────────────────

describe('parseMapResponse', () => {
  it('parses valid MAP JSON', () => {
    const json = JSON.stringify({
      title: 'Acme Corp — Pilot Plan',
      summary: 'Both teams agreed on a pilot timeline.',
      steps: [
        {
          title: 'Send pricing proposal',
          description: 'Include volume discounts',
          owner: 'Seller',
          dueDate: 'Within 48 hours',
          sourceType: 'commitment',
          sourceQuote: "I'll send the updated pricing by Thursday",
        },
      ],
    });
    const result = parseMapResponse(json);
    expect(result).not.toBeNull();
    expect(result!.title).toBe('Acme Corp — Pilot Plan');
    expect(result!.steps).toHaveLength(1);
    expect(result!.steps[0].sourceType).toBe('commitment');
  });

  it('strips markdown code fences', () => {
    const json = '```json\n{"title":"Test","summary":"Sum","steps":[]}\n```';
    const result = parseMapResponse(json);
    expect(result).not.toBeNull();
    expect(result!.title).toBe('Test');
  });

  it('returns null for invalid JSON', () => {
    expect(parseMapResponse('not json')).toBeNull();
  });

  it('returns null for missing required fields', () => {
    const json = JSON.stringify({ steps: [] }); // missing title and summary
    expect(parseMapResponse(json)).toBeNull();
  });

  it('rejects invalid sourceType', () => {
    const json = JSON.stringify({
      title: 'Test',
      summary: 'Sum',
      steps: [{ title: 'Step', sourceType: 'invalid', description: '', owner: '', dueDate: '' }],
    });
    expect(parseMapResponse(json)).toBeNull();
  });

  it('parses steps with all source types', () => {
    const json = JSON.stringify({
      title: 'Full Plan',
      summary: 'Comprehensive plan',
      steps: [
        { title: 'Step 1', sourceType: 'commitment', description: '', owner: 'Seller', dueDate: 'Tomorrow' },
        { title: 'Step 2', sourceType: 'next_step', description: '', owner: 'Buyer', dueDate: 'This week' },
        { title: 'Step 3', sourceType: 'risk_mitigation', description: '', owner: 'Both', dueDate: 'ASAP' },
        { title: 'Step 4', sourceType: 'recommended', description: '', owner: 'Seller', dueDate: 'TBD' },
      ],
    });
    const result = parseMapResponse(json);
    expect(result!.steps).toHaveLength(4);
    expect(result!.steps.map((s) => s.sourceType)).toEqual([
      'commitment', 'next_step', 'risk_mitigation', 'recommended',
    ]);
  });

  it('handles empty steps array', () => {
    const json = JSON.stringify({ title: 'Empty', summary: 'No steps', steps: [] });
    const result = parseMapResponse(json);
    expect(result).not.toBeNull();
    expect(result!.steps).toEqual([]);
  });
});

// ── generateMap ──────────────────────────────────────────────────────

describe('generateMap', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns empty when no signals provided and none in DB', async () => {
    mockGetSignals.mockResolvedValue([]);

    const result = await generateMap({ meetingId: 'meeting-1' });

    expect(result.success).toBe(true);
    expect(result.stepCount).toBe(0);
    expect(mockCallClaudeAPI).not.toHaveBeenCalled();
  });

  it('generates MAP from provided signals', async () => {
    mockCallClaudeAPI.mockResolvedValue({
      content: JSON.stringify({
        title: 'Acme — Deal Plan',
        summary: 'Following our sales call...',
        steps: [
          { title: 'Send proposal', description: 'Updated pricing', owner: 'Seller', dueDate: 'Friday', sourceType: 'commitment', sourceQuote: "I'll send it by Friday" },
          { title: 'Schedule demo', description: 'With engineering', owner: 'Buyer', dueDate: 'Next week', sourceType: 'next_step' },
        ],
      }),
      inputTokens: 400,
      outputTokens: 200,
      cacheCreationTokens: 0,
      cacheReadTokens: 0,
      stopReason: 'end_turn',
    });

    const result = await generateMap({
      meetingId: 'meeting-1',
      dealContextId: 'deal-1',
      signals: [
        { type: 'commitment', value: 'Send proposal by Friday', confidence: 0.9 },
        { type: 'timeline', value: 'Demo next week', confidence: 0.8 },
      ],
    });

    expect(result.success).toBe(true);
    expect(result.stepCount).toBe(2);
    expect(result.commitmentSteps).toBe(1);
    expect(result.title).toBe('Acme — Deal Plan');
    expect(mockCreateMap).toHaveBeenCalledWith(expect.objectContaining({
      meetingId: 'meeting-1',
      dealContextId: 'deal-1',
      title: 'Acme — Deal Plan',
    }));
  });

  it('does not call Claude when signals have no MAP-relevant types', async () => {
    // All signals are of a type that's still relevant (all 6 types are relevant)
    // This test verifies with empty signals
    const result = await generateMap({
      meetingId: 'meeting-1',
      signals: [],
    });

    expect(result.success).toBe(true);
    expect(result.stepCount).toBe(0);
    expect(mockCallClaudeAPI).not.toHaveBeenCalled();
  });

  it('handles Claude API errors gracefully', async () => {
    mockCallClaudeAPI.mockRejectedValue(new Error('timeout'));

    const result = await generateMap({
      meetingId: 'meeting-1',
      signals: [{ type: 'commitment', value: 'Something', confidence: 0.9 }],
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('timeout');
  });

  it('handles malformed Claude response gracefully', async () => {
    mockCallClaudeAPI.mockResolvedValue({
      content: 'This is not valid JSON at all',
      inputTokens: 400,
      outputTokens: 20,
      cacheCreationTokens: 0,
      cacheReadTokens: 0,
      stopReason: 'end_turn',
    });

    const result = await generateMap({
      meetingId: 'meeting-1',
      signals: [{ type: 'commitment', value: 'Something', confidence: 0.9 }],
    });

    expect(result.success).toBe(true);
    expect(result.stepCount).toBe(0);
    expect(mockCreateMap).not.toHaveBeenCalled();
  });

  it('does not persist when steps array is empty', async () => {
    mockCallClaudeAPI.mockResolvedValue({
      content: JSON.stringify({ title: 'No Steps', summary: 'Nothing actionable', steps: [] }),
      inputTokens: 400,
      outputTokens: 50,
      cacheCreationTokens: 0,
      cacheReadTokens: 0,
      stopReason: 'end_turn',
    });

    const result = await generateMap({
      meetingId: 'meeting-1',
      signals: [{ type: 'risk', value: 'Minor concern', confidence: 0.5 }],
    });

    expect(result.success).toBe(true);
    expect(result.stepCount).toBe(0);
    expect(mockCreateMap).not.toHaveBeenCalled();
  });

  it('counts commitment vs recommended steps correctly', async () => {
    mockCallClaudeAPI.mockResolvedValue({
      content: JSON.stringify({
        title: 'Mixed Plan',
        summary: 'Plan with mixed sources',
        steps: [
          { title: 'A', description: '', owner: '', dueDate: '', sourceType: 'commitment' },
          { title: 'B', description: '', owner: '', dueDate: '', sourceType: 'commitment' },
          { title: 'C', description: '', owner: '', dueDate: '', sourceType: 'next_step' },
          { title: 'D', description: '', owner: '', dueDate: '', sourceType: 'recommended' },
        ],
      }),
      inputTokens: 400,
      outputTokens: 150,
      cacheCreationTokens: 0,
      cacheReadTokens: 0,
      stopReason: 'end_turn',
    });

    const result = await generateMap({
      meetingId: 'meeting-1',
      signals: [
        { type: 'commitment', value: 'A', confidence: 0.9 },
        { type: 'commitment', value: 'B', confidence: 0.8 },
        { type: 'timeline', value: 'C', confidence: 0.7 },
      ],
    });

    expect(result.commitmentSteps).toBe(2);
    expect(result.recommendedSteps).toBe(1);
    expect(result.stepCount).toBe(4);
  });
});
