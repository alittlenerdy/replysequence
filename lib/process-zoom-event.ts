import { db, meetings, rawEvents } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { addTranscriptJob } from '@/lib/queue/transcript-queue';
import type { RawEvent, NewMeeting } from '@/lib/db/schema';
import type {
  MeetingEndedPayload,
  RecordingCompletedPayload,
  RecordingTranscriptCompletedPayload,
} from '@/lib/zoom/types';

/**
 * Result of processing a Zoom event
 */
export interface ProcessResult {
  success: boolean;
  meetingId?: string;
  action: 'created' | 'updated' | 'skipped' | 'failed';
  error?: string;
}

/**
 * Logger helper for structured JSON logging
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
      ...data,
    })
  );
}

/**
 * Process a raw Zoom webhook event and normalize it into a Meeting record.
 *
 * This function is idempotent - safe to run multiple times on the same event.
 * Uses upsert pattern to handle duplicate zoom_meeting_id.
 *
 * @param rawEvent - The raw event record from the database
 * @returns ProcessResult indicating what action was taken
 */
export async function processZoomEvent(rawEvent: RawEvent): Promise<ProcessResult> {
  const startTime = Date.now();

  log('info', 'Starting event processing', {
    rawEventId: rawEvent.id,
    eventType: rawEvent.eventType,
    zoomEventId: rawEvent.zoomEventId,
  });

  // Skip already processed events (idempotency)
  if (rawEvent.status === 'processed') {
    log('info', 'Event already processed, skipping', {
      rawEventId: rawEvent.id,
      eventType: rawEvent.eventType,
    });
    return { success: true, action: 'skipped' };
  }

  try {
    // Mark as processing
    await db
      .update(rawEvents)
      .set({ status: 'processing', updatedAt: new Date() })
      .where(eq(rawEvents.id, rawEvent.id));

    log('info', 'Event marked as processing', { rawEventId: rawEvent.id });

    let result: ProcessResult;

    // Route to appropriate handler based on event type
    switch (rawEvent.eventType) {
      case 'meeting.ended':
        result = await processMeetingEnded(rawEvent);
        break;
      case 'recording.completed':
        result = await processRecordingCompleted(rawEvent);
        break;
      case 'recording.transcript_completed':
        result = await processTranscriptCompleted(rawEvent);
        break;
      default:
        log('warn', 'Unknown event type, marking as processed', {
          rawEventId: rawEvent.id,
          eventType: rawEvent.eventType,
        });
        result = { success: true, action: 'skipped' };
    }

    // Mark as processed on success
    if (result.success) {
      await db
        .update(rawEvents)
        .set({
          status: 'processed',
          processedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(rawEvents.id, rawEvent.id));

      log('info', 'Event processing completed', {
        rawEventId: rawEvent.id,
        action: result.action,
        meetingId: result.meetingId,
        duration: Date.now() - startTime,
      });
    }

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Mark as failed
    await db
      .update(rawEvents)
      .set({
        status: 'failed',
        errorMessage,
        updatedAt: new Date(),
      })
      .where(eq(rawEvents.id, rawEvent.id));

    log('error', 'Event processing failed', {
      rawEventId: rawEvent.id,
      eventType: rawEvent.eventType,
      error: errorMessage,
      duration: Date.now() - startTime,
    });

    return { success: false, action: 'failed', error: errorMessage };
  }
}

/**
 * Process a meeting.ended event
 * Creates or updates a Meeting record with end time and basic metadata
 */
async function processMeetingEnded(rawEvent: RawEvent): Promise<ProcessResult> {
  const payload = rawEvent.payload as unknown as MeetingEndedPayload;
  const meetingObject = payload.payload?.object;

  if (!meetingObject?.uuid) {
    log('error', 'Invalid meeting.ended payload: missing uuid', {
      rawEventId: rawEvent.id,
    });
    return { success: false, action: 'failed', error: 'Missing meeting uuid' };
  }

  const zoomMeetingId = meetingObject.uuid;

  log('info', 'Processing meeting.ended', {
    rawEventId: rawEvent.id,
    zoomMeetingId,
    topic: meetingObject.topic,
  });

  // Check if meeting already exists
  const [existingMeeting] = await db
    .select()
    .from(meetings)
    .where(eq(meetings.zoomMeetingId, zoomMeetingId))
    .limit(1);

  const meetingData: Partial<NewMeeting> = {
    zoomMeetingId,
    hostEmail: meetingObject.host_email || 'unknown@unknown.com',
    topic: meetingObject.topic || 'Untitled Meeting',
    startTime: meetingObject.start_time ? new Date(meetingObject.start_time) : null,
    endTime: meetingObject.end_time ? new Date(meetingObject.end_time) : null,
    duration: meetingObject.duration || null,
    updatedAt: new Date(),
  };

  if (existingMeeting) {
    // Update existing meeting with end time data
    await db
      .update(meetings)
      .set(meetingData)
      .where(eq(meetings.id, existingMeeting.id));

    log('info', 'Meeting updated from meeting.ended', {
      rawEventId: rawEvent.id,
      meetingId: existingMeeting.id,
      zoomMeetingId,
    });

    return { success: true, meetingId: existingMeeting.id, action: 'updated' };
  } else {
    // Create new meeting - status stays 'pending' until recording.completed
    const [newMeeting] = await db
      .insert(meetings)
      .values({
        ...meetingData,
        zoomMeetingId,
        hostEmail: meetingData.hostEmail!,
        status: 'pending',
      } as NewMeeting)
      .returning();

    log('info', 'Meeting created from meeting.ended', {
      rawEventId: rawEvent.id,
      meetingId: newMeeting.id,
      zoomMeetingId,
    });

    return { success: true, meetingId: newMeeting.id, action: 'created' };
  }
}

/**
 * Process a recording.completed event
 * Updates Meeting record with recording/transcript URLs and fetches transcript
 */
async function processRecordingCompleted(rawEvent: RawEvent): Promise<ProcessResult> {
  const startTime = Date.now();
  const payload = rawEvent.payload as unknown as RecordingCompletedPayload;
  const recordingObject = payload.payload?.object;

  if (!recordingObject?.uuid) {
    log('error', 'Invalid recording.completed payload: missing uuid', {
      rawEventId: rawEvent.id,
    });
    return { success: false, action: 'failed', error: 'Missing recording uuid' };
  }

  const zoomMeetingId = recordingObject.uuid;

  // Find transcript and recording files
  const transcriptFile = recordingObject.recording_files?.find(
    (f) => f.file_type === 'TRANSCRIPT' && f.status === 'completed'
  );
  const videoFile = recordingObject.recording_files?.find(
    (f) => f.file_type === 'MP4' && f.status === 'completed'
  );

  log('info', 'Processing recording.completed', {
    rawEventId: rawEvent.id,
    zoomMeetingId,
    hasTranscript: !!transcriptFile,
    hasVideo: !!videoFile,
  });

  // Check if meeting exists
  const [existingMeeting] = await db
    .select()
    .from(meetings)
    .where(eq(meetings.zoomMeetingId, zoomMeetingId))
    .limit(1);

  const meetingData: Partial<NewMeeting> = {
    hostEmail: recordingObject.host_email || 'unknown@unknown.com',
    topic: recordingObject.topic || 'Untitled Meeting',
    startTime: recordingObject.start_time ? new Date(recordingObject.start_time) : null,
    duration: recordingObject.duration || null,
    recordingDownloadUrl: videoFile?.download_url || null,
    transcriptDownloadUrl: transcriptFile?.download_url || null,
    status: 'pending', // Will be updated when transcript job completes
    updatedAt: new Date(),
  };

  let meetingId: string;

  if (existingMeeting) {
    // Update existing meeting with recording data
    await db
      .update(meetings)
      .set(meetingData)
      .where(eq(meetings.id, existingMeeting.id));

    meetingId = existingMeeting.id;

    log('info', 'Meeting updated from recording.completed', {
      rawEventId: rawEvent.id,
      meetingId,
      zoomMeetingId,
      hasTranscript: !!transcriptFile,
      latencyMs: Date.now() - startTime,
    });
  } else {
    // Create new meeting with recording data
    const [newMeeting] = await db
      .insert(meetings)
      .values({
        ...meetingData,
        zoomMeetingId,
        hostEmail: meetingData.hostEmail!,
      } as NewMeeting)
      .returning();

    meetingId = newMeeting.id;

    log('info', 'Meeting created from recording.completed', {
      rawEventId: rawEvent.id,
      meetingId,
      zoomMeetingId,
      latencyMs: Date.now() - startTime,
    });
  }

  // If transcript is available, enqueue job to fetch it
  // Use download_token from webhook payload for authentication (no OAuth needed)
  const downloadToken = recordingObject.download_token;
  if (transcriptFile?.download_url && downloadToken) {
    const job = await addTranscriptJob({
      meetingId,
      zoomMeetingId,
      transcriptDownloadUrl: transcriptFile.download_url,
      downloadToken,
    });

    log('info', 'Transcript job enqueued from recording.completed', {
      rawEventId: rawEvent.id,
      meetingId,
      zoomMeetingId,
      jobId: job.id,
      latencyMs: Date.now() - startTime,
    });
  } else if (transcriptFile?.download_url && !downloadToken) {
    log('warn', 'Transcript available but no download_token in payload', {
      rawEventId: rawEvent.id,
      meetingId,
      zoomMeetingId,
    });
  } else {
    // No transcript available, mark meeting as ready (no transcript to fetch)
    await db
      .update(meetings)
      .set({
        status: 'ready',
        updatedAt: new Date(),
      })
      .where(eq(meetings.id, meetingId));

    log('info', 'No transcript available, meeting marked as ready', {
      rawEventId: rawEvent.id,
      meetingId,
      zoomMeetingId,
    });
  }

  return {
    success: true,
    meetingId,
    action: existingMeeting ? 'updated' : 'created',
  };
}

/**
 * Process a recording.transcript_completed event
 * Enqueues background job to fetch transcript (avoids webhook timeout)
 */
async function processTranscriptCompleted(rawEvent: RawEvent): Promise<ProcessResult> {
  const startTime = Date.now();
  const payload = rawEvent.payload as unknown as RecordingTranscriptCompletedPayload;
  const recordingObject = payload.payload?.object;

  if (!recordingObject?.uuid) {
    log('error', 'Invalid recording.transcript_completed payload: missing uuid', {
      rawEventId: rawEvent.id,
    });
    return { success: false, action: 'failed', error: 'Missing recording uuid' };
  }

  const zoomMeetingId = recordingObject.uuid;

  // Find transcript file in the payload
  const transcriptFile = recordingObject.recording_files?.find(
    (f) => f.file_type === 'TRANSCRIPT' && f.status === 'completed'
  );

  log('info', 'Processing recording.transcript_completed', {
    rawEventId: rawEvent.id,
    zoomMeetingId,
    hasTranscript: !!transcriptFile,
    transcriptUrl: transcriptFile?.download_url ? 'present' : 'missing',
  });

  if (!transcriptFile?.download_url) {
    log('warn', 'No transcript file in transcript_completed event', {
      rawEventId: rawEvent.id,
      zoomMeetingId,
      fileCount: recordingObject.recording_files?.length || 0,
      fileTypes: recordingObject.recording_files?.map((f) => f.file_type) || [],
    });
    return { success: true, action: 'skipped' };
  }

  // Find existing meeting by zoom_meeting_id
  const [existingMeeting] = await db
    .select()
    .from(meetings)
    .where(eq(meetings.zoomMeetingId, zoomMeetingId))
    .limit(1);

  let meetingId: string;

  if (!existingMeeting) {
    // Meeting doesn't exist yet - create it with transcript URL
    log('info', 'Meeting not found, creating from transcript_completed', {
      rawEventId: rawEvent.id,
      zoomMeetingId,
    });

    const [newMeeting] = await db
      .insert(meetings)
      .values({
        zoomMeetingId,
        hostEmail: recordingObject.host_email || 'unknown@unknown.com',
        topic: recordingObject.topic || 'Untitled Meeting',
        startTime: recordingObject.start_time ? new Date(recordingObject.start_time) : null,
        duration: recordingObject.duration || null,
        transcriptDownloadUrl: transcriptFile.download_url,
        status: 'pending',
      })
      .returning();

    meetingId = newMeeting.id;
  } else {
    // Meeting exists - update with transcript URL
    await db
      .update(meetings)
      .set({
        transcriptDownloadUrl: transcriptFile.download_url,
        status: 'pending',
        updatedAt: new Date(),
      })
      .where(eq(meetings.id, existingMeeting.id));

    meetingId = existingMeeting.id;
  }

  // Use download_token from webhook payload for authentication (no OAuth needed)
  const downloadToken = recordingObject.download_token;
  if (!downloadToken) {
    log('error', 'No download_token in transcript_completed payload', {
      rawEventId: rawEvent.id,
      zoomMeetingId,
    });
    return { success: false, action: 'failed', error: 'Missing download_token in payload' };
  }

  // Enqueue transcript job (processed by background worker)
  const job = await addTranscriptJob({
    meetingId,
    zoomMeetingId,
    transcriptDownloadUrl: transcriptFile.download_url,
    downloadToken,
  });

  log('info', 'Transcript job enqueued', {
    rawEventId: rawEvent.id,
    meetingId,
    zoomMeetingId,
    jobId: job.id,
    latencyMs: Date.now() - startTime,
  });

  return { success: true, meetingId, action: existingMeeting ? 'updated' : 'created' };
}

/**
 * Process multiple raw events in sequence
 * Useful for batch reprocessing
 */
export async function processZoomEvents(rawEventIds: string[]): Promise<ProcessResult[]> {
  log('info', 'Starting batch event processing', { count: rawEventIds.length });

  const results: ProcessResult[] = [];

  for (const id of rawEventIds) {
    const [rawEvent] = await db
      .select()
      .from(rawEvents)
      .where(eq(rawEvents.id, id))
      .limit(1);

    if (!rawEvent) {
      log('warn', 'Raw event not found', { rawEventId: id });
      results.push({ success: false, action: 'failed', error: 'Event not found' });
      continue;
    }

    const result = await processZoomEvent(rawEvent);
    results.push(result);
  }

  log('info', 'Batch processing completed', {
    total: rawEventIds.length,
    succeeded: results.filter((r) => r.success).length,
    failed: results.filter((r) => !r.success).length,
  });

  return results;
}
