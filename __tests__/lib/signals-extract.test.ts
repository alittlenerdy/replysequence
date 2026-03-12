import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock claude-api before importing extract module
vi.mock('@/lib/claude-api', () => ({
  callClaudeAPI: vi.fn(),
  calculateCost: vi.fn().mockReturnValue(0.001),
  log: vi.fn(),
}));

// Mock context-store
vi.mock('@/lib/context-store', () => ({
  insertSignals: vi.fn().mockResolvedValue([{ id: 'mock-signal-id' }]),
  getDealContext: vi.fn().mockResolvedValue(null),
  updateHealthScore: vi.fn().mockResolvedValue(null),
}));

// Mock downstream consumers
vi.mock('@/lib/signals/next-steps', () => ({
  generateNextSteps: vi.fn().mockResolvedValue({ success: true, nextSteps: [], count: 0 }),
}));

vi.mock('@/lib/signals/risk-detector', () => ({
  detectRisks: vi.fn().mockResolvedValue({ success: true, risks: [], count: 0, overallRiskLevel: 'low' }),
}));

vi.mock('@/lib/map/generate', () => ({
  generateMap: vi.fn().mockResolvedValue({ success: true, stepCount: 0, commitmentSteps: 0, recommendedSteps: 0 }),
}));

vi.mock('@/lib/health-score/calculate', () => ({
  calculateHealthScore: vi.fn().mockReturnValue({ score: 50, label: 'neutral', breakdown: {} }),
}));

import { extractSignals, parseSignalResponse } from '@/lib/signals/extract';
import { callClaudeAPI } from '@/lib/claude-api';
import { insertSignals } from '@/lib/context-store';

const mockCallClaudeAPI = vi.mocked(callClaudeAPI);
const mockInsertSignals = vi.mocked(insertSignals);

describe('parseSignalResponse', () => {
  it('parses valid JSON response', () => {
    const json = JSON.stringify({
      signals: [
        { type: 'commitment', value: 'Send proposal by Friday', confidence: 0.9 },
      ],
    });
    const result = parseSignalResponse(json);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('commitment');
    expect(result[0].value).toBe('Send proposal by Friday');
    expect(result[0].confidence).toBe(0.9);
  });

  it('strips markdown code fences', () => {
    const json = '```json\n{"signals": [{"type": "risk", "value": "Budget freeze", "confidence": 0.7}]}\n```';
    const result = parseSignalResponse(json);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('risk');
  });

  it('returns empty array for invalid JSON', () => {
    const result = parseSignalResponse('not json at all');
    expect(result).toEqual([]);
  });

  it('returns empty array for invalid signal types', () => {
    const json = JSON.stringify({
      signals: [{ type: 'invalid_type', value: 'test', confidence: 0.5 }],
    });
    const result = parseSignalResponse(json);
    expect(result).toEqual([]);
  });

  it('returns empty array for out-of-range confidence', () => {
    const json = JSON.stringify({
      signals: [{ type: 'risk', value: 'test', confidence: 1.5 }],
    });
    const result = parseSignalResponse(json);
    expect(result).toEqual([]);
  });

  it('parses signals with optional speaker and quote', () => {
    const json = JSON.stringify({
      signals: [
        {
          type: 'stakeholder',
          value: 'VP of Engineering needs sign-off',
          confidence: 0.85,
          speaker: 'Jane Doe',
          quote: 'Our VP of Engineering, Sarah, will need to approve this',
        },
      ],
    });
    const result = parseSignalResponse(json);
    expect(result).toHaveLength(1);
    expect(result[0].speaker).toBe('Jane Doe');
    expect(result[0].quote).toContain('VP of Engineering');
  });

  it('parses multiple signal types in one batch', () => {
    const json = JSON.stringify({
      signals: [
        { type: 'commitment', value: 'Follow-up demo Thursday', confidence: 0.92 },
        { type: 'objection', value: 'Price too high', confidence: 0.8 },
        { type: 'timeline', value: 'Need deployed before Q3', confidence: 0.75 },
        { type: 'budget', value: 'Budget is $50k', confidence: 0.95 },
      ],
    });
    const result = parseSignalResponse(json);
    expect(result).toHaveLength(4);
    const types = result.map((s) => s.type);
    expect(types).toContain('commitment');
    expect(types).toContain('objection');
    expect(types).toContain('timeline');
    expect(types).toContain('budget');
  });

  it('handles empty signals array', () => {
    const json = JSON.stringify({ signals: [] });
    const result = parseSignalResponse(json);
    expect(result).toEqual([]);
  });
});

describe('extractSignals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns empty signals for short transcripts', async () => {
    const result = await extractSignals({
      meetingId: 'meeting-1',
      transcript: 'Too short',
    });
    expect(result.success).toBe(true);
    expect(result.signals).toEqual([]);
    expect(result.signalCount).toBe(0);
    expect(mockCallClaudeAPI).not.toHaveBeenCalled();
  });

  it('calls Claude API and writes signals to database', async () => {
    mockCallClaudeAPI.mockResolvedValue({
      content: JSON.stringify({
        signals: [
          { type: 'commitment', value: 'Send contract by Friday', confidence: 0.9 },
          { type: 'risk', value: 'Budget freeze Q2', confidence: 0.7 },
        ],
      }),
      inputTokens: 500,
      outputTokens: 100,
      cacheCreationTokens: 0,
      cacheReadTokens: 0,
      stopReason: 'end_turn',
    });

    const result = await extractSignals({
      meetingId: 'meeting-1',
      transcript: 'A'.repeat(100), // Long enough to pass minimum length check
      meetingTopic: 'Sales Demo',
      dealContextId: 'deal-1',
    });

    expect(result.success).toBe(true);
    expect(result.signalCount).toBe(2);
    expect(result.signals[0].type).toBe('commitment');
    expect(result.signals[1].type).toBe('risk');
    expect(result.inputTokens).toBe(500);
    expect(result.outputTokens).toBe(100);

    // Verify database write
    expect(mockInsertSignals).toHaveBeenCalledWith({
      meetingId: 'meeting-1',
      dealContextId: 'deal-1',
      signals: expect.arrayContaining([
        expect.objectContaining({ type: 'commitment' }),
        expect.objectContaining({ type: 'risk' }),
      ]),
    });
  });

  it('does not write to database when no signals extracted', async () => {
    mockCallClaudeAPI.mockResolvedValue({
      content: JSON.stringify({ signals: [] }),
      inputTokens: 500,
      outputTokens: 20,
      cacheCreationTokens: 0,
      cacheReadTokens: 0,
      stopReason: 'end_turn',
    });

    const result = await extractSignals({
      meetingId: 'meeting-1',
      transcript: 'A'.repeat(100),
    });

    expect(result.success).toBe(true);
    expect(result.signalCount).toBe(0);
    expect(mockInsertSignals).not.toHaveBeenCalled();
  });

  it('handles Claude API errors gracefully', async () => {
    mockCallClaudeAPI.mockRejectedValue(new Error('API rate limit'));

    const result = await extractSignals({
      meetingId: 'meeting-1',
      transcript: 'A'.repeat(100),
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('API rate limit');
    expect(result.signals).toEqual([]);
  });

  it('handles malformed JSON response gracefully', async () => {
    mockCallClaudeAPI.mockResolvedValue({
      content: 'This is not JSON',
      inputTokens: 500,
      outputTokens: 20,
      cacheCreationTokens: 0,
      cacheReadTokens: 0,
      stopReason: 'end_turn',
    });

    const result = await extractSignals({
      meetingId: 'meeting-1',
      transcript: 'A'.repeat(100),
    });

    expect(result.success).toBe(true);
    expect(result.signalCount).toBe(0);
    expect(mockInsertSignals).not.toHaveBeenCalled();
  });

  it('includes meeting topic in prompt when provided', async () => {
    mockCallClaudeAPI.mockResolvedValue({
      content: JSON.stringify({ signals: [] }),
      inputTokens: 500,
      outputTokens: 20,
      cacheCreationTokens: 0,
      cacheReadTokens: 0,
      stopReason: 'end_turn',
    });

    await extractSignals({
      meetingId: 'meeting-1',
      transcript: 'A'.repeat(100),
      meetingTopic: 'Q2 Budget Review',
    });

    expect(mockCallClaudeAPI).toHaveBeenCalledWith(
      expect.objectContaining({
        userPrompt: expect.stringContaining('Q2 Budget Review'),
      }),
    );
  });
});
