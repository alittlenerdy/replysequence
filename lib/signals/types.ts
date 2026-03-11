import { z } from 'zod';

/**
 * The 6 signal types extracted from meeting transcripts.
 * Used by Signal Extraction Engine → Conversation Context Store pipeline.
 */
export const SIGNAL_TYPES = [
  'commitment',
  'risk',
  'stakeholder',
  'objection',
  'timeline',
  'budget',
] as const;

export type SignalType = (typeof SIGNAL_TYPES)[number];

/**
 * Zod schema for a single extracted signal.
 * Validates data coming from Claude API before database insertion.
 */
export const signalSchema = z.object({
  type: z.enum(SIGNAL_TYPES),
  value: z.string().min(1).max(2000),
  confidence: z.number().min(0).max(1),
  speaker: z.string().max(255).optional(),
  quote: z.string().max(5000).optional(),
});

export type Signal = z.infer<typeof signalSchema>;

/**
 * Schema for validating a batch of signals from one extraction run.
 */
export const signalBatchSchema = z.object({
  signals: z.array(signalSchema).max(100),
});

export type SignalBatch = z.infer<typeof signalBatchSchema>;
