import { Worker, Job } from 'bullmq';
import { createRedisConnection } from '../redis';
import { db, transcripts, meetings } from '../db';
import { eq } from 'drizzle-orm';
import { parseVTT } from '../transcript/vtt-parser';
import { downloadTranscript } from '../transcript/downloader';
import {
  TranscriptJobData,
  TranscriptJobResult,
  TRANSCRIPT_QUEUE_NAME,
} from './transcript-queue';

// Create the worker
export function createTranscriptWorker(): Worker<TranscriptJobData, TranscriptJobResult> {
  const worker = new Worker<TranscriptJobData, TranscriptJobResult>(
    TRANSCRIPT_QUEUE_NAME,
    async (job: Job<TranscriptJobData, TranscriptJobResult>) => {
      const { meetingId, zoomMeetingId, transcriptDownloadUrl, accessToken } = job.data;

      console.log(JSON.stringify({
        level: 'info',
        message: 'Processing transcript job',
        jobId: job.id,
        meetingId,
        zoomMeetingId,
        attempt: job.attemptsMade + 1,
      }));

      try {
        // Update meeting status to processing
        await db
          .update(meetings)
          .set({ status: 'processing', updatedAt: new Date() })
          .where(eq(meetings.id, meetingId));

        // Download transcript from Zoom
        const vttContent = await downloadTranscript(transcriptDownloadUrl, accessToken);

        // Parse VTT to extract speaker segments
        const { fullText, segments, wordCount } = parseVTT(vttContent);

        // Store transcript in database
        const [transcript] = await db
          .insert(transcripts)
          .values({
            meetingId,
            content: fullText,
            speakerSegments: segments,
            source: 'zoom',
            wordCount,
          })
          .returning();

        // Update meeting status to completed
        await db
          .update(meetings)
          .set({ status: 'completed', updatedAt: new Date() })
          .where(eq(meetings.id, meetingId));

        console.log(JSON.stringify({
          level: 'info',
          message: 'Transcript processed successfully',
          jobId: job.id,
          meetingId,
          transcriptId: transcript.id,
          wordCount,
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
          attempt: job.attemptsMade + 1,
        }));

        // Update meeting status to failed on final attempt
        if (job.attemptsMade >= 3) {
          await db
            .update(meetings)
            .set({ status: 'failed', updatedAt: new Date() })
            .where(eq(meetings.id, meetingId));
        }

        throw error; // Re-throw to trigger retry
      }
    },
    {
      connection: createRedisConnection(),
      concurrency: 5, // Process up to 5 jobs concurrently
    }
  );

  // Worker event handlers
  worker.on('completed', (job) => {
    console.log(JSON.stringify({
      level: 'info',
      message: 'Job completed',
      jobId: job.id,
      meetingId: job.data.meetingId,
    }));
  });

  worker.on('failed', (job, error) => {
    console.log(JSON.stringify({
      level: 'error',
      message: 'Job failed',
      jobId: job?.id,
      meetingId: job?.data.meetingId,
      error: error.message,
    }));
  });

  worker.on('error', (error) => {
    console.log(JSON.stringify({
      level: 'error',
      message: 'Worker error',
      error: error.message,
    }));
  });

  return worker;
}

// Start worker (call this from a separate worker process)
let worker: Worker<TranscriptJobData, TranscriptJobResult> | null = null;

export function startWorker(): Worker<TranscriptJobData, TranscriptJobResult> {
  if (!worker) {
    worker = createTranscriptWorker();
    console.log(JSON.stringify({
      level: 'info',
      message: 'Transcript worker started',
    }));
  }
  return worker;
}

export async function stopWorker(): Promise<void> {
  if (worker) {
    await worker.close();
    worker = null;
    console.log(JSON.stringify({
      level: 'info',
      message: 'Transcript worker stopped',
    }));
  }
}
