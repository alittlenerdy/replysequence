import { db, meetings, transcripts } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { getZoomAccessToken, downloadTranscript } from '@/lib/transcript/downloader';
import { parseVTT } from '@/lib/transcript/vtt-parser';
import type { Meeting, TranscriptStatus } from '@/lib/db/schema';

/**
 * Configuration for transcript fetching
 */
const CONFIG = {
  maxRetries: 3,
  initialDelayMs: 2 * 60 * 1000, // 2 minutes
  maxDelayMs: 10 * 60 * 1000, // 10 minutes
  backoffMultiplier: 2,
};

/**
 * Result of fetching a transcript
 */
export interface FetchTranscriptResult {
  success: boolean;
  transcriptId?: string;
  status: TranscriptStatus;
  error?: string;
  retryAfterMs?: number;
  latency: {
    total: number;
    tokenFetch?: number;
    download?: number;
    parse?: number;
    dbWrite?: number;
  };
}

/**
 * Structured logging helper with latency tracking
 */
function log(
  level: 'info' | 'warn' | 'error',
  message: string,
  data: Record<string, unknown> = {}
): void {
  console.log(
    JSON.stringify({
      level,
      message,
      timestamp: new Date().toISOString(),
      component: 'fetch-zoom-transcript',
      ...data,
    })
  );
}

/**
 * Calculate exponential backoff delay
 */
function calculateBackoffDelay(attempt: number): number {
  const delay = CONFIG.initialDelayMs * Math.pow(CONFIG.backoffMultiplier, attempt - 1);
  return Math.min(delay, CONFIG.maxDelayMs);
}

/**
 * Sleep for a given number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check if error indicates transcript is not ready yet
 */
function isTranscriptNotReadyError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('not ready') ||
      message.includes('not found') ||
      message.includes('404') ||
      message.includes('processing')
    );
  }
  return false;
}

/**
 * Fetch and store transcript for a meeting
 * Implements retry logic with exponential backoff
 *
 * @param meetingId - Internal meeting ID (UUID)
 * @returns FetchTranscriptResult with status and latency info
 */
export async function fetchTranscript(meetingId: string): Promise<FetchTranscriptResult> {
  const totalStart = Date.now();
  const latency: FetchTranscriptResult['latency'] = { total: 0 };

  log('info', 'Starting transcript fetch', { meetingId });

  // Get meeting record
  const [meeting] = await db
    .select()
    .from(meetings)
    .where(eq(meetings.id, meetingId))
    .limit(1);

  if (!meeting) {
    log('error', 'Meeting not found', { meetingId });
    latency.total = Date.now() - totalStart;
    return {
      success: false,
      status: 'failed',
      error: 'Meeting not found',
      latency,
    };
  }

  if (!meeting.transcriptDownloadUrl) {
    log('warn', 'No transcript URL available', { meetingId });
    latency.total = Date.now() - totalStart;
    return {
      success: false,
      status: 'failed',
      error: 'No transcript URL available',
      latency,
    };
  }

  // Check for existing transcript
  const [existingTranscript] = await db
    .select()
    .from(transcripts)
    .where(eq(transcripts.meetingId, meetingId))
    .limit(1);

  if (existingTranscript?.status === 'ready') {
    log('info', 'Transcript already exists and is ready', {
      meetingId,
      transcriptId: existingTranscript.id,
    });
    latency.total = Date.now() - totalStart;
    return {
      success: true,
      transcriptId: existingTranscript.id,
      status: 'ready',
      latency,
    };
  }

  // Create or get transcript record for tracking attempts
  let transcriptRecord = existingTranscript;
  if (!transcriptRecord) {
    const [newTranscript] = await db
      .insert(transcripts)
      .values({
        meetingId,
        content: '', // Will be filled after successful fetch
        status: 'pending',
        source: 'zoom',
      })
      .returning();
    transcriptRecord = newTranscript;
  }

  // Check if we've exceeded max retries
  if (transcriptRecord.fetchAttempts >= CONFIG.maxRetries) {
    log('error', 'Max retry attempts exceeded', {
      meetingId,
      transcriptId: transcriptRecord.id,
      attempts: transcriptRecord.fetchAttempts,
    });

    await db
      .update(transcripts)
      .set({
        status: 'failed',
        lastFetchError: 'Max retry attempts exceeded',
        updatedAt: new Date(),
      })
      .where(eq(transcripts.id, transcriptRecord.id));

    latency.total = Date.now() - totalStart;
    return {
      success: false,
      transcriptId: transcriptRecord.id,
      status: 'failed',
      error: 'Max retry attempts exceeded',
      latency,
    };
  }

  // Mark as fetching and increment attempt counter
  const currentAttempt = transcriptRecord.fetchAttempts + 1;
  await db
    .update(transcripts)
    .set({
      status: 'fetching',
      fetchAttempts: currentAttempt,
      updatedAt: new Date(),
    })
    .where(eq(transcripts.id, transcriptRecord.id));

  log('info', 'Fetching transcript', {
    meetingId,
    transcriptId: transcriptRecord.id,
    attempt: currentAttempt,
    maxRetries: CONFIG.maxRetries,
  });

  try {
    // Get OAuth access token
    const tokenStart = Date.now();
    const accessToken = await getZoomAccessToken();
    latency.tokenFetch = Date.now() - tokenStart;

    log('info', 'OAuth token acquired', {
      meetingId,
      latencyMs: latency.tokenFetch,
    });

    // Download transcript
    const downloadStart = Date.now();
    const vttContent = await downloadTranscript(
      meeting.transcriptDownloadUrl,
      accessToken
    );
    latency.download = Date.now() - downloadStart;

    log('info', 'Transcript downloaded', {
      meetingId,
      contentLength: vttContent.length,
      latencyMs: latency.download,
    });

    // Parse VTT content
    const parseStart = Date.now();
    const parsed = parseVTT(vttContent);
    latency.parse = Date.now() - parseStart;

    log('info', 'Transcript parsed', {
      meetingId,
      wordCount: parsed.wordCount,
      segmentCount: parsed.segments.length,
      latencyMs: latency.parse,
    });

    // Save to database
    const dbStart = Date.now();
    await db
      .update(transcripts)
      .set({
        content: parsed.fullText,
        vttContent,
        speakerSegments: parsed.segments,
        wordCount: parsed.wordCount,
        status: 'ready',
        lastFetchError: null,
        updatedAt: new Date(),
      })
      .where(eq(transcripts.id, transcriptRecord.id));

    // Update meeting status to ready
    await db
      .update(meetings)
      .set({
        status: 'ready',
        updatedAt: new Date(),
      })
      .where(eq(meetings.id, meetingId));

    latency.dbWrite = Date.now() - dbStart;
    latency.total = Date.now() - totalStart;

    log('info', 'Transcript fetch completed successfully', {
      meetingId,
      transcriptId: transcriptRecord.id,
      wordCount: parsed.wordCount,
      latency,
    });

    return {
      success: true,
      transcriptId: transcriptRecord.id,
      status: 'ready',
      latency,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    latency.total = Date.now() - totalStart;

    // Check if this is a "not ready" error that should trigger retry
    if (isTranscriptNotReadyError(error)) {
      const retryAfterMs = calculateBackoffDelay(currentAttempt);

      log('warn', 'Transcript not ready, will retry', {
        meetingId,
        transcriptId: transcriptRecord.id,
        attempt: currentAttempt,
        retryAfterMs,
        error: errorMessage,
      });

      await db
        .update(transcripts)
        .set({
          status: 'pending', // Back to pending for retry
          lastFetchError: errorMessage,
          updatedAt: new Date(),
        })
        .where(eq(transcripts.id, transcriptRecord.id));

      return {
        success: false,
        transcriptId: transcriptRecord.id,
        status: 'pending',
        error: errorMessage,
        retryAfterMs,
        latency,
      };
    }

    // Permanent failure
    log('error', 'Transcript fetch failed', {
      meetingId,
      transcriptId: transcriptRecord.id,
      attempt: currentAttempt,
      error: errorMessage,
      latency,
    });

    await db
      .update(transcripts)
      .set({
        status: 'failed',
        lastFetchError: errorMessage,
        updatedAt: new Date(),
      })
      .where(eq(transcripts.id, transcriptRecord.id));

    // Update meeting status to failed
    await db
      .update(meetings)
      .set({
        status: 'failed',
        updatedAt: new Date(),
      })
      .where(eq(meetings.id, meetingId));

    return {
      success: false,
      transcriptId: transcriptRecord.id,
      status: 'failed',
      error: errorMessage,
      latency,
    };
  }
}

/**
 * Fetch transcript with automatic retry on "not ready" errors
 * Will wait and retry up to maxRetries times
 *
 * @param meetingId - Internal meeting ID (UUID)
 * @returns FetchTranscriptResult
 */
export async function fetchTranscriptWithRetry(meetingId: string): Promise<FetchTranscriptResult> {
  const startTime = Date.now();
  let lastResult: FetchTranscriptResult | null = null;

  for (let attempt = 1; attempt <= CONFIG.maxRetries; attempt++) {
    log('info', 'Transcript fetch attempt', {
      meetingId,
      attempt,
      maxRetries: CONFIG.maxRetries,
    });

    const result = await fetchTranscript(meetingId);
    lastResult = result;

    if (result.success) {
      log('info', 'Transcript fetch succeeded', {
        meetingId,
        attempt,
        totalLatencyMs: Date.now() - startTime,
      });
      return result;
    }

    // If it's a permanent failure (not a "retry later" situation), stop
    if (result.status === 'failed' && !result.retryAfterMs) {
      log('error', 'Transcript fetch permanently failed', {
        meetingId,
        attempt,
        error: result.error,
      });
      return result;
    }

    // If we have more attempts and a retry delay, wait and continue
    if (attempt < CONFIG.maxRetries && result.retryAfterMs) {
      log('info', 'Waiting before retry', {
        meetingId,
        attempt,
        delayMs: result.retryAfterMs,
      });

      await sleep(result.retryAfterMs);
    }
  }

  log('error', 'All transcript fetch attempts exhausted', {
    meetingId,
    totalLatencyMs: Date.now() - startTime,
  });

  return lastResult || {
    success: false,
    status: 'failed',
    error: 'All retry attempts exhausted',
    latency: { total: Date.now() - startTime },
  };
}

/**
 * Get transcript for a meeting by meeting ID
 * Returns null if transcript doesn't exist or isn't ready
 */
export async function getTranscript(meetingId: string): Promise<{
  content: string;
  vttContent: string | null;
  wordCount: number | null;
  segments: unknown[];
} | null> {
  const [transcript] = await db
    .select()
    .from(transcripts)
    .where(eq(transcripts.meetingId, meetingId))
    .limit(1);

  if (!transcript || transcript.status !== 'ready') {
    return null;
  }

  return {
    content: transcript.content,
    vttContent: transcript.vttContent,
    wordCount: transcript.wordCount,
    segments: transcript.speakerSegments || [],
  };
}
