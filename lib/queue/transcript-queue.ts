import { Queue, Job } from 'bullmq';
import { getRedisConnectionOptions } from '../redis';

// Job data interface
export interface TranscriptJobData {
  meetingId: string;
  zoomMeetingId: string;
  transcriptDownloadUrl: string;
  // Download token provided by Zoom in the webhook payload (may be missing)
  downloadToken?: string;
}

// Job result interface
export interface TranscriptJobResult {
  success: boolean;
  transcriptId?: string;
  error?: string;
}

// Queue name constant
export const TRANSCRIPT_QUEUE_NAME = 'transcript-processing';

// Default job options
const defaultJobOptions = {
  attempts: 4, // 1 initial + 3 retries
  backoff: {
    type: 'exponential' as const,
    delay: 1000, // 1s, 2s, 4s exponential backoff
  },
  removeOnComplete: {
    count: 100, // Keep last 100 completed jobs
  },
  removeOnFail: {
    count: 500, // Keep last 500 failed jobs for debugging
  },
};

/**
 * Create a fresh Queue instance.
 * In serverless, each request should use a fresh connection.
 */
async function createTranscriptQueue(): Promise<Queue<TranscriptJobData, TranscriptJobResult>> {
  const queue = new Queue<TranscriptJobData, TranscriptJobResult>(
    TRANSCRIPT_QUEUE_NAME,
    {
      connection: getRedisConnectionOptions(),
      defaultJobOptions,
    }
  );
  await queue.waitUntilReady();
  return queue;
}

/**
 * Add a job to the queue.
 * Creates a fresh connection and closes it after adding the job.
 */
export async function addTranscriptJob(
  data: TranscriptJobData
): Promise<Job<TranscriptJobData, TranscriptJobResult>> {
  const queue = await createTranscriptQueue();

  try {
    const job = await queue.add('process-transcript', data, {
      jobId: `transcript-${data.meetingId}`, // Prevents duplicate jobs for same meeting
    });

    console.log(JSON.stringify({
      level: 'info',
      message: 'Transcript job added to queue',
      jobId: job.id,
      meetingId: data.meetingId,
      zoomMeetingId: data.zoomMeetingId,
    }));

    return job;
  } finally {
    await queue.close();
  }
}

/**
 * Get queue statistics.
 * Creates a fresh connection and closes it after getting stats.
 */
export async function getQueueStats() {
  const queue = await createTranscriptQueue();

  try {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
    ]);

    return { waiting, active, completed, failed, delayed };
  } finally {
    await queue.close();
  }
}
