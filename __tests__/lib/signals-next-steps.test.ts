import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/claude-api', () => ({
  callClaudeAPI: vi.fn(),
  log: vi.fn(),
}));

vi.mock('@/lib/context-store', () => ({
  updateAccumulatedContext: vi.fn().mockResolvedValue({ id: 'deal-1' }),
}));

import { generateNextSteps, parseNextStepsResponse } from '@/lib/signals/next-steps';
import { callClaudeAPI } from '@/lib/claude-api';
import { updateAccumulatedContext } from '@/lib/context-store';

const mockCallClaudeAPI = vi.mocked(callClaudeAPI);
const mockUpdateContext = vi.mocked(updateAccumulatedContext);

describe('parseNextStepsResponse', () => {
  it('parses valid next steps JSON', () => {
    const json = JSON.stringify({
      nextSteps: [
        {
          task: 'Send revised proposal',
          owner: 'Sales rep',
          deadline: 'Within 48 hours',
          source: 'explicit',
          confidence: 'high',
        },
      ],
    });
    const result = parseNextStepsResponse(json);
    expect(result).toHaveLength(1);
    expect(result[0].task).toBe('Send revised proposal');
    expect(result[0].source).toBe('explicit');
  });

  it('strips markdown code fences', () => {
    const json = '```json\n{"nextSteps": [{"task": "Follow up", "owner": "Rep", "deadline": "Tomorrow", "source": "predicted", "confidence": "medium"}]}\n```';
    const result = parseNextStepsResponse(json);
    expect(result).toHaveLength(1);
  });

  it('returns empty array for invalid JSON', () => {
    expect(parseNextStepsResponse('not json')).toEqual([]);
  });

  it('returns empty array for invalid source value', () => {
    const json = JSON.stringify({
      nextSteps: [{ task: 'Test', owner: 'A', deadline: 'B', source: 'wrong', confidence: 'high' }],
    });
    expect(parseNextStepsResponse(json)).toEqual([]);
  });

  it('handles empty nextSteps array', () => {
    expect(parseNextStepsResponse('{"nextSteps": []}')).toEqual([]);
  });
});

describe('generateNextSteps', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns empty for no signals', async () => {
    const result = await generateNextSteps({
      meetingId: 'meeting-1',
      signals: [],
    });
    expect(result.success).toBe(true);
    expect(result.count).toBe(0);
    expect(mockCallClaudeAPI).not.toHaveBeenCalled();
  });

  it('calls Claude API and returns next steps', async () => {
    mockCallClaudeAPI.mockResolvedValue({
      content: JSON.stringify({
        nextSteps: [
          { task: 'Send proposal', owner: 'Sales rep', deadline: 'Friday', source: 'explicit', confidence: 'high' },
          { task: 'Research competitor', owner: 'Sales rep', deadline: 'This week', source: 'predicted', confidence: 'medium' },
        ],
      }),
      inputTokens: 300,
      outputTokens: 100,
      cacheCreationTokens: 0,
      cacheReadTokens: 0,
      stopReason: 'end_turn',
    });

    const result = await generateNextSteps({
      meetingId: 'meeting-1',
      signals: [
        { type: 'commitment', value: 'Send proposal by Friday', confidence: 0.9 },
        { type: 'objection', value: 'Competitor mentioned', confidence: 0.7 },
      ],
    });

    expect(result.success).toBe(true);
    expect(result.count).toBe(2);
    expect(result.nextSteps[0].task).toBe('Send proposal');
  });

  it('writes to deal context when dealContextId provided', async () => {
    mockCallClaudeAPI.mockResolvedValue({
      content: JSON.stringify({
        nextSteps: [
          { task: 'Follow up', owner: 'Rep', deadline: 'Tomorrow', source: 'explicit', confidence: 'high' },
        ],
      }),
      inputTokens: 300,
      outputTokens: 100,
      cacheCreationTokens: 0,
      cacheReadTokens: 0,
      stopReason: 'end_turn',
    });

    await generateNextSteps({
      meetingId: 'meeting-1',
      dealContextId: 'deal-1',
      signals: [{ type: 'commitment', value: 'Follow up tomorrow', confidence: 0.9 }],
    });

    expect(mockUpdateContext).toHaveBeenCalledWith({
      dealContextId: 'deal-1',
      nextSteps: expect.arrayContaining([expect.stringContaining('Follow up')]),
    });
  });

  it('handles API errors gracefully', async () => {
    mockCallClaudeAPI.mockRejectedValue(new Error('timeout'));

    const result = await generateNextSteps({
      meetingId: 'meeting-1',
      signals: [{ type: 'risk', value: 'Budget freeze', confidence: 0.8 }],
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('timeout');
  });
});
