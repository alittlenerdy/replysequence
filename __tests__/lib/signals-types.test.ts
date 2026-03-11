import { describe, it, expect } from 'vitest';
import {
  signalSchema,
  SIGNAL_TYPES,
} from '@/lib/signals/types';

describe('signalSchema', () => {
  it('validates a valid commitment signal', () => {
    const result = signalSchema.safeParse({
      type: 'commitment',
      value: 'Will send contract by Friday',
      confidence: 0.85,
      speaker: 'Jane Doe',
      quote: 'I will have the contract over to you by end of day Friday',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid signal type', () => {
    const result = signalSchema.safeParse({
      type: 'invalid_type',
      value: 'test',
      confidence: 0.5,
    });
    expect(result.success).toBe(false);
  });

  it('rejects confidence outside 0-1 range', () => {
    const result = signalSchema.safeParse({
      type: 'risk',
      value: 'Budget concerns',
      confidence: 1.5,
    });
    expect(result.success).toBe(false);
  });

  it('allows optional speaker and quote fields', () => {
    const result = signalSchema.safeParse({
      type: 'objection',
      value: 'Price is too high',
      confidence: 0.7,
    });
    expect(result.success).toBe(true);
  });

  it('exports all 6 signal types', () => {
    expect(SIGNAL_TYPES).toEqual([
      'commitment', 'risk', 'stakeholder', 'objection', 'timeline', 'budget',
    ]);
  });
});
