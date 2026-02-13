/**
 * Processing Progress Logger
 *
 * Tracks and persists meeting processing progress for real-time UI updates.
 * Integrates with the existing performance monitoring to log progress at each stage.
 */

import { db } from '@/lib/db';
import { meetings, ProcessingStep, ProcessingLogEntry } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';

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
  const currentProgress = currentStageInfo.progress;

  // Calculate remaining progress percentage
  const remainingProgress = 100 - currentProgress;

  // Estimate remaining time based on progress ratio and average durations
  // Add remaining steps' average durations
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

interface LogProgressOptions {
  meetingId: string;
  step: ProcessingStep;
  message?: string;
  durationMs?: number;
  error?: string;
}

/**
 * Log processing progress for a meeting
 * Updates the database with current step, progress %, and appends to logs
 */
export async function logProcessingProgress({
  meetingId,
  step,
  message,
  durationMs,
  error,
}: LogProgressOptions): Promise<void> {
  const stageInfo = PROCESSING_STAGES[step];
  const logEntry: ProcessingLogEntry = {
    timestamp: new Date().toISOString(),
    step,
    message: message || stageInfo.label,
    duration_ms: durationMs,
  };

  try {
    await db
      .update(meetings)
      .set({
        processingStep: step,
        processingProgress: stageInfo.progress,
        processingLogs: sql`${meetings.processingLogs} || ${JSON.stringify([logEntry])}::jsonb`,
        processingError: error || null,
        ...(step === 'completed' || step === 'failed'
          ? { processingCompletedAt: new Date() }
          : {}),
        updatedAt: new Date(),
      })
      .where(eq(meetings.id, meetingId));
  } catch (err) {
    // Log but don't throw - progress logging shouldn't break processing
    console.error('[ProcessingProgress] Failed to update progress:', err);
  }
}

/**
 * Start processing for a meeting
 * Resets progress and sets initial state
 */
export async function startProcessing(meetingId: string): Promise<void> {
  try {
    await db
      .update(meetings)
      .set({
        status: 'processing',
        processingStep: 'webhook_received',
        processingProgress: 5,
        processingLogs: [
          {
            timestamp: new Date().toISOString(),
            step: 'webhook_received',
            message: 'Processing started',
          },
        ],
        processingStartedAt: new Date(),
        processingCompletedAt: null,
        processingError: null,
        updatedAt: new Date(),
      })
      .where(eq(meetings.id, meetingId));
  } catch (err) {
    console.error('[ProcessingProgress] Failed to start processing:', err);
  }
}

/**
 * Mark processing as complete
 */
export async function completeProcessing(
  meetingId: string,
  options?: { durationMs?: number }
): Promise<void> {
  await logProcessingProgress({
    meetingId,
    step: 'completed',
    message: `Processing complete${options?.durationMs ? ` in ${(options.durationMs / 1000).toFixed(1)}s` : ''}`,
    durationMs: options?.durationMs,
  });

  // Also update meeting status
  try {
    await db
      .update(meetings)
      .set({
        status: 'ready',
        updatedAt: new Date(),
      })
      .where(eq(meetings.id, meetingId));
  } catch (err) {
    console.error('[ProcessingProgress] Failed to complete processing:', err);
  }
}

/**
 * Mark processing as failed
 */
export async function failProcessing(meetingId: string, error: string): Promise<void> {
  await logProcessingProgress({
    meetingId,
    step: 'failed',
    message: `Processing failed: ${error}`,
    error,
  });

  // Also update meeting status
  try {
    await db
      .update(meetings)
      .set({
        status: 'failed',
        updatedAt: new Date(),
      })
      .where(eq(meetings.id, meetingId));
  } catch (err) {
    console.error('[ProcessingProgress] Failed to mark processing as failed:', err);
  }
}

/**
 * Get current processing status for a meeting
 */
export async function getProcessingStatus(meetingId: string) {
  const result = await db.query.meetings.findFirst({
    where: eq(meetings.id, meetingId),
    columns: {
      id: true,
      status: true,
      processingStep: true,
      processingProgress: true,
      processingLogs: true,
      processingStartedAt: true,
      processingCompletedAt: true,
      processingError: true,
    },
  });

  return result;
}
