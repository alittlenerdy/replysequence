import { NextRequest, NextResponse } from 'next/server';
import { Job } from 'bullmq';
import { db, transcripts, meetings } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { parseVTT } from '@/lib/transcript/vtt-parser';
import { downloadTranscript } from '@/lib/transcript/downloader';
import {
  TranscriptJobData,
  TranscriptJobResult,
} from '@/lib/queue/transcript-queue';
import { getRedisConnectionOptions } from '@/lib/redis';
import { Queue } from 'bullmq';

// Disable body parsing for raw access
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 second timeout for processing

/**
 * Process transcript jobs from the queue
 * Called by cron job or manually to process pending jobs
 *
 * GET: Returns queue stats
 * POST: Processes up to N jobs from the queue
 */

/**
 * Create a fresh Queue instance for serverless.
 * Each request gets its own connection to avoid stale connection issues.
 * The connection will be closed when the function completes.
 */
async function createQueue(): Promise<Queue<TranscriptJobData, TranscriptJobResult>> {
  const q = new Queue<TranscriptJobData, TranscriptJobResult>('transcript-processing', {
    connection: getRedisConnectionOptions(),
  });

  // Wait for connection to be ready
  await q.waitUntilReady();
  return q;
}

export async function GET() {
  let q: Queue<TranscriptJobData, TranscriptJobResult> | null = null;
  try {
    q = await createQueue();
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      q.getWaitingCount(),
      q.getActiveCount(),
      q.getCompletedCount(),
      q.getFailedCount(),
      q.getDelayedCount(),
    ]);

    return NextResponse.json({
      success: true,
      stats: { waiting, active, completed, failed, delayed },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  } finally {
    if (q) {
      await q.close();
    }
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  // Parse request body for options
  let maxJobs = 5;
  try {
    const body = await request.json().catch(() => ({}));
    if (body.maxJobs && typeof body.maxJobs === 'number') {
      maxJobs = Math.min(body.maxJobs, 10); // Cap at 10 to avoid timeout
    }
  } catch {
    // Use default
  }

  console.log(JSON.stringify({
    level: 'info',
    message: 'Processing transcript jobs',
    maxJobs,
  }));

  const results: Array<{
    jobId: string;
    meetingId: string;
    success: boolean;
    error?: string;
  }> = [];

  let q: Queue<TranscriptJobData, TranscriptJobResult> | null = null;

  try {
    q = await createQueue();

    // Get waiting jobs
    const jobs = await q.getJobs(['waiting', 'delayed'], 0, maxJobs - 1);

    if (jobs.length === 0) {
      const [waiting, active, completed, failed, delayed] = await Promise.all([
        q.getWaitingCount(),
        q.getActiveCount(),
        q.getCompletedCount(),
        q.getFailedCount(),
        q.getDelayedCount(),
      ]);

      return NextResponse.json({
        success: true,
        message: 'No jobs to process',
        processed: 0,
        stats: { waiting, active, completed, failed, delayed },
      });
    }

    console.log(JSON.stringify({
      level: 'info',
      message: `Found ${jobs.length} jobs to process`,
    }));

    // Process each job
    for (const job of jobs) {
      if (!job.data) continue;

      const result = await processJob(job);
      results.push({
        jobId: job.id || 'unknown',
        meetingId: job.data.meetingId,
        success: result.success,
        error: result.error,
      });

      // Move job to completed or failed
      if (result.success) {
        await job.moveToCompleted(result, job.token || '', false);
      } else {
        // Check if we should retry
        const attempts = job.attemptsMade || 0;
        if (attempts < 3) {
          // Move back to delayed for retry
          const delay = Math.pow(2, attempts) * 1000; // Exponential backoff
          await job.moveToDelayed(Date.now() + delay, job.token || '');
        } else {
          await job.moveToFailed(new Error(result.error || 'Unknown error'), job.token || '', false);
        }
      }
    }

    const [waiting, active, completed, failed, delayed] = await Promise.all([
      q.getWaitingCount(),
      q.getActiveCount(),
      q.getCompletedCount(),
      q.getFailedCount(),
      q.getDelayedCount(),
    ]);

    console.log(JSON.stringify({
      level: 'info',
      message: 'Job processing completed',
      processed: results.length,
      succeeded: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      latencyMs: Date.now() - startTime,
    }));

    return NextResponse.json({
      success: true,
      processed: results.length,
      results,
      stats: { waiting, active, completed, failed, delayed },
      latencyMs: Date.now() - startTime,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    console.log(JSON.stringify({
      level: 'error',
      message: 'Job processing failed',
      error: errorMessage,
      latencyMs: Date.now() - startTime,
    }));

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        results,
        latencyMs: Date.now() - startTime,
      },
      { status: 500 }
    );
  } finally {
    if (q) {
      await q.close();
    }
  }
}

/**
 * Process a single transcript job
 */
async function processJob(
  job: Job<TranscriptJobData, TranscriptJobResult>
): Promise<TranscriptJobResult> {
  const { meetingId, zoomMeetingId, transcriptDownloadUrl, downloadToken } = job.data;
  const startTime = Date.now();

  console.log(JSON.stringify({
    level: 'info',
    message: 'Processing transcript job',
    jobId: job.id,
    meetingId,
    zoomMeetingId,
    attempt: (job.attemptsMade || 0) + 1,
  }));

  try {
    // Update meeting status to processing
    await db
      .update(meetings)
      .set({ status: 'processing', updatedAt: new Date() })
      .where(eq(meetings.id, meetingId));

    // Download transcript from Zoom using download token from webhook
    const downloadStart = Date.now();
    const vttContent = await downloadTranscript(transcriptDownloadUrl, downloadToken);
    console.log(JSON.stringify({
      level: 'info',
      message: 'Transcript downloaded',
      jobId: job.id,
      meetingId,
      contentLength: vttContent.length,
      latencyMs: Date.now() - downloadStart,
    }));

    // Parse VTT to extract speaker segments
    const parseStart = Date.now();
    const { fullText, segments, wordCount } = parseVTT(vttContent);
    console.log(JSON.stringify({
      level: 'info',
      message: 'Transcript parsed',
      jobId: job.id,
      meetingId,
      wordCount,
      segmentCount: segments.length,
      latencyMs: Date.now() - parseStart,
    }));

    // Store transcript in database (upsert)
    const dbStart = Date.now();
    const [existingTranscript] = await db
      .select()
      .from(transcripts)
      .where(eq(transcripts.meetingId, meetingId))
      .limit(1);

    let transcript;
    if (existingTranscript) {
      [transcript] = await db
        .update(transcripts)
        .set({
          content: fullText,
          vttContent,
          speakerSegments: segments,
          wordCount,
          status: 'ready',
          lastFetchError: null,
          updatedAt: new Date(),
        })
        .where(eq(transcripts.id, existingTranscript.id))
        .returning();
    } else {
      [transcript] = await db
        .insert(transcripts)
        .values({
          meetingId,
          content: fullText,
          vttContent,
          speakerSegments: segments,
          source: 'zoom',
          wordCount,
          status: 'ready',
        })
        .returning();
    }

    // Update meeting status to ready
    await db
      .update(meetings)
      .set({ status: 'ready', updatedAt: new Date() })
      .where(eq(meetings.id, meetingId));

    console.log(JSON.stringify({
      level: 'info',
      message: 'Transcript processed successfully',
      jobId: job.id,
      meetingId,
      transcriptId: transcript.id,
      wordCount,
      totalLatencyMs: Date.now() - startTime,
    }));

    return {
      success: true,
      transcriptId: transcript.id,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    console.log(JSON.stringify({
      level: 'error',
      message: 'Transcript processing failed',
      jobId: job.id,
      meetingId,
      error: errorMessage,
      attempt: (job.attemptsMade || 0) + 1,
      totalLatencyMs: Date.now() - startTime,
    }));

    // Update transcript record with error
    const [existingTranscript] = await db
      .select()
      .from(transcripts)
      .where(eq(transcripts.meetingId, meetingId))
      .limit(1);

    if (existingTranscript) {
      await db
        .update(transcripts)
        .set({
          status: 'failed',
          lastFetchError: errorMessage,
          fetchAttempts: (existingTranscript.fetchAttempts || 0) + 1,
          updatedAt: new Date(),
        })
        .where(eq(transcripts.id, existingTranscript.id));
    }

    // Update meeting status to failed on final attempt
    if ((job.attemptsMade || 0) >= 3) {
      await db
        .update(meetings)
        .set({ status: 'failed', updatedAt: new Date() })
        .where(eq(meetings.id, meetingId));
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}
