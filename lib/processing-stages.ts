/**
 * Processing Stages Configuration
 *
 * Client-safe constants and utilities for processing progress UI.
 * Does NOT import database code - safe for browser use.
 */

import type { ProcessingStep } from '@/lib/db/schema';

// Processing stages with their progress percentages and average durations
export const PROCESSING_STAGES: Record<ProcessingStep, {
  progress: number;
  label: string;
  avgDurationMs: number; // Average time to complete this step
}> = {
  webhook_received: { progress: 5, label: 'Webhook received', avgDurationMs: 500 },
  meeting_fetched: { progress: 10, label: 'Finding meeting', avgDurationMs: 1000 },
  meeting_created: { progress: 15, label: 'Meeting record created', avgDurationMs: 500 },
  transcript_download: { progress: 30, label: 'Downloading transcript', avgDurationMs: 8000 },
  transcript_parse: { progress: 50, label: 'Parsing transcript', avgDurationMs: 3000 },
  transcript_stored: { progress: 60, label: 'Saving transcript', avgDurationMs: 1000 },
  draft_generation: { progress: 80, label: 'Generating follow-up draft', avgDurationMs: 12000 },
  completed: { progress: 100, label: 'Processing complete', avgDurationMs: 0 },
  failed: { progress: 0, label: 'Processing failed', avgDurationMs: 0 },
};

// Total estimated processing time in ms (sum of all stages except failed/completed)
export const TOTAL_ESTIMATED_MS = Object.entries(PROCESSING_STAGES)
  .filter(([key]) => key !== 'completed' && key !== 'failed')
  .reduce((sum, [, stage]) => sum + stage.avgDurationMs, 0);

/**
 * Calculate estimated time remaining based on current step and elapsed time
 */
export function calculateEstimatedRemaining(
  currentStep: ProcessingStep,
  elapsedMs: number
): { estimatedRemainingMs: number; estimatedTotalMs: number } {
  if (currentStep === 'completed' || currentStep === 'failed') {
    return { estimatedRemainingMs: 0, estimatedTotalMs: elapsedMs };
  }

  const currentStageInfo = PROCESSING_STAGES[currentStep];

  // Calculate remaining progress percentage
  const stepOrder = ['webhook_received', 'meeting_fetched', 'meeting_created',
    'transcript_download', 'transcript_parse', 'transcript_stored', 'draft_generation', 'completed'];

  const currentIndex = stepOrder.indexOf(currentStep);
  let remainingMs = 0;

  // Add time for remaining steps
  for (let i = currentIndex + 1; i < stepOrder.length - 1; i++) {
    const step = stepOrder[i] as ProcessingStep;
    remainingMs += PROCESSING_STAGES[step].avgDurationMs;
  }

  // Add partial time for current step (assume we're halfway through)
  remainingMs += currentStageInfo.avgDurationMs * 0.5;

  // Apply a small buffer (10%) for uncertainty
  remainingMs = Math.round(remainingMs * 1.1);

  return {
    estimatedRemainingMs: remainingMs,
    estimatedTotalMs: elapsedMs + remainingMs,
  };
}
