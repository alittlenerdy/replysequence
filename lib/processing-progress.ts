/**
 * Processing Progress Logger
 *
 * Tracks and persists meeting processing progress for real-time UI updates.
 * Integrates with the existing performance monitoring to log progress at each stage.
 *
 * NOTE: This file contains server-side database operations.
 * For client-safe constants, import from '@/lib/processing-stages' instead.
 */

import { db } from '@/lib/db';
import { meetings, ProcessingStep, ProcessingLogEntry } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';

// Import client-safe constants for use in this file
import { PROCESSING_STAGES } from './processing-stages';

// Re-export client-safe constants for backward compatibility
// Server-side code can import from here, client-side should import from processing-stages
export {
  PROCESSING_STAGES,
  TOTAL_ESTIMATED_MS,
  calculateEstimatedRemaining,
} from './processing-stages';

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
