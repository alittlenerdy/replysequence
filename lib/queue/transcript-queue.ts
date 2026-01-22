import { Queue, Job } from 'bullmq';
import { getRedisConnectionOptions } from '../redis';

// Job data interface
export interface TranscriptJobData {
  meetingId: string;
  zoomMeetingId: string;
  transcriptDownloadUrl: string;
  // accessToken fetched fresh by worker - tokens expire quickly
}

// Job result interface
export interface TranscriptJobResult {
  success: boolean;
  transcriptId?: string;
  error?: string;
}

// Queue name constant
export const TRANSCRIPT_QUEUE_NAME = 'transcript-processing';

// Lazy singleton for the queue - only connects at runtime, not during build
let transcriptQueueInstance: Queue<TranscriptJobData, TranscriptJobResult> | null = null;

function getTranscriptQueue(): Queue<TranscriptJobData, TranscriptJobResult> {
  if (!transcriptQueueInstance) {
    transcriptQueueInstance = new Queue<TranscriptJobData, TranscriptJobResult>(
      TRANSCRIPT_QUEUE_NAME,
      {
        connection: getRedisConnectionOptions(),
        defaultJobOptions: {
          attempts: 4, // 1 initial + 3 retries
          backoff: {
            type: 'exponential',
            delay: 1000, // 1s, 2s, 4s exponential backoff
          },
          removeOnComplete: {
            count: 100, // Keep last 100 completed jobs
          },
          removeOnFail: {
            count: 500, // Keep last 500 failed jobs for debugging
          },
        },
      }
    );
  }
  return transcriptQueueInstance;
}

// Add a job to the queue
export async function addTranscriptJob(
  data: TranscriptJobData
): Promise<Job<TranscriptJobData, TranscriptJobResult>> {
  const queue = getTranscriptQueue();
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
}

// Get queue statistics
export async function getQueueStats() {
  const queue = getTranscriptQueue();
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    queue.getWaitingCount(),
    queue.getActiveCount(),
    queue.getCompletedCount(),
    queue.getFailedCount(),
    queue.getDelayedCount(),
  ]);

  return { waiting, active, completed, failed, delayed };
}

// Graceful shutdown
export async function closeTranscriptQueue(): Promise<void> {
  if (transcriptQueueInstance) {
    await transcriptQueueInstance.close();
    transcriptQueueInstance = null;
  }
}
