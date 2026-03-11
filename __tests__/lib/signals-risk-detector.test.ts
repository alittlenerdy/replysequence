import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/claude-api', () => ({
  callClaudeAPI: vi.fn(),
  log: vi.fn(),
}));

vi.mock('@/lib/context-store', () => ({
  updateAccumulatedContext: vi.fn().mockResolvedValue({ id: 'deal-1' }),
}));

import { detectRisks, parseRiskResponse } from '@/lib/signals/risk-detector';
import { callClaudeAPI } from '@/lib/claude-api';
import { updateAccumulatedContext } from '@/lib/context-store';

const mockCallClaudeAPI = vi.mocked(callClaudeAPI);
const mockUpdateContext = vi.mocked(updateAccumulatedContext);

describe('parseRiskResponse', () => {
  it('parses valid risk response', () => {
    const json = JSON.stringify({
      risks: [
        {
          risk: 'CFO approval required above $25k',
          severity: 'high',
          category: 'authority',
          mitigation: 'Request meeting with CFO',
        },
      ],
      overallRiskLevel: 'high',
    });
    const result = parseRiskResponse(json);
    expect(result.risks).toHaveLength(1);
    expect(result.overallRiskLevel).toBe('high');
    expect(result.risks[0].category).toBe('authority');
  });

  it('strips markdown code fences', () => {
    const json = '```json\n{"risks": [], "overallRiskLevel": "low"}\n```';
    const result = parseRiskResponse(json);
    expect(result.risks).toEqual([]);
    expect(result.overallRiskLevel).toBe('low');
  });

  it('returns empty for invalid JSON', () => {
    const result = parseRiskResponse('not json');
    expect(result.risks).toEqual([]);
    expect(result.overallRiskLevel).toBe('unknown');
  });

  it('rejects invalid severity', () => {
    const json = JSON.stringify({
      risks: [{ risk: 'Test', severity: 'extreme', category: 'budget', mitigation: 'Fix' }],
      overallRiskLevel: 'low',
    });
    const result = parseRiskResponse(json);
    expect(result.risks).toEqual([]);
  });

  it('rejects invalid category', () => {
    const json = JSON.stringify({
      risks: [{ risk: 'Test', severity: 'high', category: 'invalid', mitigation: 'Fix' }],
      overallRiskLevel: 'low',
    });
    const result = parseRiskResponse(json);
    expect(result.risks).toEqual([]);
  });

  it('parses multiple risks', () => {
    const json = JSON.stringify({
      risks: [
        { risk: 'Budget freeze', severity: 'critical', category: 'budget', mitigation: 'Defer' },
        { risk: 'No champion', severity: 'high', category: 'champion', mitigation: 'Find one' },
        { risk: 'Long eval', severity: 'medium', category: 'process', mitigation: 'Shorten' },
      ],
      overallRiskLevel: 'critical',
    });
    const result = parseRiskResponse(json);
    expect(result.risks).toHaveLength(3);
    expect(result.overallRiskLevel).toBe('critical');
  });
});

describe('detectRisks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns empty for no signals', async () => {
    const result = await detectRisks({
      meetingId: 'meeting-1',
      signals: [],
    });
    expect(result.success).toBe(true);
    expect(result.count).toBe(0);
    expect(result.overallRiskLevel).toBe('low');
    expect(mockCallClaudeAPI).not.toHaveBeenCalled();
  });

  it('calls Claude API and returns risks', async () => {
    mockCallClaudeAPI.mockResolvedValue({
      content: JSON.stringify({
        risks: [
          { risk: 'Budget freeze Q2', severity: 'high', category: 'budget', mitigation: 'Explore Q3 budget' },
        ],
        overallRiskLevel: 'high',
      }),
      inputTokens: 300,
      outputTokens: 100,
      cacheCreationTokens: 0,
      cacheReadTokens: 0,
      stopReason: 'end_turn',
    });

    const result = await detectRisks({
      meetingId: 'meeting-1',
      signals: [
        { type: 'risk', value: 'Budget freeze until Q2', confidence: 0.85 },
      ],
    });

    expect(result.success).toBe(true);
    expect(result.count).toBe(1);
    expect(result.risks[0].severity).toBe('high');
    expect(result.overallRiskLevel).toBe('high');
  });

  it('writes to deal context when dealContextId provided', async () => {
    mockCallClaudeAPI.mockResolvedValue({
      content: JSON.stringify({
        risks: [
          { risk: 'No champion identified', severity: 'medium', category: 'champion', mitigation: 'Identify one' },
        ],
        overallRiskLevel: 'medium',
      }),
      inputTokens: 300,
      outputTokens: 100,
      cacheCreationTokens: 0,
      cacheReadTokens: 0,
      stopReason: 'end_turn',
    });

    await detectRisks({
      meetingId: 'meeting-1',
      dealContextId: 'deal-1',
      signals: [{ type: 'stakeholder', value: 'No clear decision-maker', confidence: 0.7 }],
    });

    expect(mockUpdateContext).toHaveBeenCalledWith({
      dealContextId: 'deal-1',
      risks: expect.arrayContaining([expect.stringContaining('champion')]),
    });
  });

  it('handles API errors gracefully', async () => {
    mockCallClaudeAPI.mockRejectedValue(new Error('rate limit'));

    const result = await detectRisks({
      meetingId: 'meeting-1',
      signals: [{ type: 'risk', value: 'Something risky', confidence: 0.8 }],
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('rate limit');
  });
});
