import { db, meetings, rawEvents, transcripts } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { downloadTranscript } from '@/lib/transcript/downloader';
import { parseVTT } from '@/lib/transcript/vtt-parser';
import { generateDraft } from '@/lib/generate-draft';
import {
  startPipeline,
  startStage,
  endStage,
  endPipeline,
  STAGES,
  measureAsync,
  measureSync,
} from '@/lib/performance';
import type { RawEvent, NewMeeting, MeetingPlatform } from '@/lib/db/schema';

// Default platform for Zoom webhook events
const ZOOM_PLATFORM: MeetingPlatform = 'zoom';

// Database query timeout (5 seconds)
const DB_QUERY_TIMEOUT_MS = 5000;

/**
 * Wrap a database query with a timeout
 * Returns null on timeout instead of throwing
 */
async function withDbTimeout<T>(
  queryPromise: Promise<T>,
  timeoutMs: number,
  queryName: string
): Promise<{ result: T; timedOut: false } | { result: null; timedOut: true }> {
  let timeoutId: NodeJS.Timeout;

  const timeoutPromise = new Promise<{ result: null; timedOut: true }>((resolve) => {
    timeoutId = setTimeout(() => {
      log('error', `Database query timed out: ${queryName}`, { timeoutMs });
      resolve({ result: null, timedOut: true });
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([
      queryPromise.then(r => ({ result: r, timedOut: false as const })),
      timeoutPromise,
    ]);
    clearTimeout(timeoutId!);
    return result;
  } catch (error) {
    clearTimeout(timeoutId!);
    throw error;
  }
}
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

  log('info', '>>> processZoomEvent ENTRY', {
    rawEventId: rawEvent.id,
    eventType: rawEvent.eventType,
    zoomEventId: rawEvent.zoomEventId,
    currentStatus: rawEvent.status,
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
    log('info', 'B1: About to update rawEvents status to processing', { rawEventId: rawEvent.id });
    await db
      .update(rawEvents)
      .set({ status: 'processing', updatedAt: new Date() })
      .where(eq(rawEvents.id, rawEvent.id));

    log('info', 'B1 DONE: Event marked as processing', { rawEventId: rawEvent.id });

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
        platformMeetingId: zoomMeetingId, // Generic platform ID for multi-platform support
        hostEmail: meetingData.hostEmail!,
        platform: ZOOM_PLATFORM,
        status: 'pending',
      } as NewMeeting)
      .returning();

    log('info', 'Meeting created from meeting.ended', {
      rawEventId: rawEvent.id,
      meetingId: newMeeting.id,
      zoomMeetingId,
      platform: ZOOM_PLATFORM,
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

  // Start performance instrumentation
  const pipelineId = `recording-${rawEvent.id}`;
  startPipeline(pipelineId);
  startStage(pipelineId, STAGES.WEBHOOK_RECEIVED, { eventType: 'recording.completed' });
  endStage(pipelineId, STAGES.WEBHOOK_RECEIVED);
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
  startStage(pipelineId, STAGES.MEETING_FETCHED, { zoomMeetingId });
  const [existingMeeting] = await db
    .select()
    .from(meetings)
    .where(eq(meetings.zoomMeetingId, zoomMeetingId))
    .limit(1);
  endStage(pipelineId, STAGES.MEETING_FETCHED, { found: !!existingMeeting });

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

  startStage(pipelineId, STAGES.MEETING_CREATED, { action: existingMeeting ? 'update' : 'create' });
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
        platformMeetingId: zoomMeetingId, // Generic platform ID for multi-platform support
        hostEmail: meetingData.hostEmail!,
        platform: ZOOM_PLATFORM,
      } as NewMeeting)
      .returning();

    meetingId = newMeeting.id;

    log('info', 'Meeting created from recording.completed', {
      rawEventId: rawEvent.id,
      meetingId,
      zoomMeetingId,
      platform: ZOOM_PLATFORM,
      latencyMs: Date.now() - startTime,
    });
  }
  endStage(pipelineId, STAGES.MEETING_CREATED, { meetingId });

  // If transcript is available, download it using download_token from payload
  const downloadToken = payload.download_token;
  if (transcriptFile?.download_url && downloadToken) {
    await fetchAndStoreTranscript(
      meetingId,
      transcriptFile.download_url,
      downloadToken,
      rawEvent.id,
      zoomMeetingId,
      pipelineId
    );
  } else if (transcriptFile?.download_url && !downloadToken) {
    log('warn', 'Transcript available but no download_token', {
      rawEventId: rawEvent.id,
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

  endPipeline(pipelineId, { success: true, meetingId });
  return {
    success: true,
    meetingId,
    action: existingMeeting ? 'updated' : 'created',
  };
}

/**
 * Process a recording.transcript_completed event
 * Uses download_token from webhook payload to fetch transcript
 */
async function processTranscriptCompleted(rawEvent: RawEvent): Promise<ProcessResult> {
  // Start performance tracking for this pipeline
  const pipelineId = `transcript-${rawEvent.id}`;
  startPipeline(pipelineId);

  log('info', 'Step 1: Parsing transcript_completed payload', { rawEventId: rawEvent.id, pipelineId });

  const payload = rawEvent.payload as unknown as RecordingTranscriptCompletedPayload;
  const recordingObject = payload.payload?.object;

  if (!recordingObject?.uuid) {
    log('error', 'Step 1 FAILED: Missing uuid in payload', { rawEventId: rawEvent.id });
    endPipeline(pipelineId, { status: 'failed', reason: 'missing_uuid' });
    return { success: false, action: 'failed', error: 'Missing recording uuid' };
  }

  const zoomMeetingId = recordingObject.uuid;
  const downloadToken = payload.download_token;
  const transcriptFile = recordingObject.recording_files?.find(
    (f) => f.file_type === 'TRANSCRIPT' && f.status === 'completed'
  );

  log('info', 'Step 2: Payload parsed successfully', {
    rawEventId: rawEvent.id,
    zoomMeetingId,
    hasDownloadToken: !!downloadToken,
    hasTranscriptFile: !!transcriptFile,
  });

  if (!downloadToken) {
    log('error', 'Step 2 FAILED: No download_token', { rawEventId: rawEvent.id, zoomMeetingId });
    endPipeline(pipelineId, { status: 'failed', reason: 'missing_download_token' });
    return { success: false, action: 'failed', error: 'Missing download_token' };
  }

  if (!transcriptFile?.download_url) {
    log('warn', 'Step 2 SKIPPED: No transcript file', { rawEventId: rawEvent.id, zoomMeetingId });
    endPipeline(pipelineId, { status: 'skipped', reason: 'no_transcript_file' });
    return { success: true, action: 'skipped' };
  }

  // Track meeting fetch/create stage
  startStage(pipelineId, STAGES.MEETING_FETCHED, { zoomMeetingId });

  log('info', 'Step 3: Querying database for existing meeting', { zoomMeetingId });

  const [existingMeeting] = await db
    .select()
    .from(meetings)
    .where(eq(meetings.zoomMeetingId, zoomMeetingId))
    .limit(1);

  endStage(pipelineId, STAGES.MEETING_FETCHED, { found: !!existingMeeting });

  log('info', 'Step 3 complete: Database query finished', {
    zoomMeetingId,
    meetingFound: !!existingMeeting,
    existingMeetingId: existingMeeting?.id || 'none',
  });

  let meetingId: string;

  if (!existingMeeting) {
    startStage(pipelineId, STAGES.MEETING_CREATED, { zoomMeetingId });
    log('info', 'Step 4: Creating new meeting in database', { zoomMeetingId });

    const [newMeeting] = await db
      .insert(meetings)
      .values({
        zoomMeetingId,
        platformMeetingId: zoomMeetingId, // Generic platform ID for multi-platform support
        hostEmail: recordingObject.host_email || 'unknown@unknown.com',
        topic: recordingObject.topic || 'Untitled Meeting',
        startTime: recordingObject.start_time ? new Date(recordingObject.start_time) : null,
        duration: recordingObject.duration || null,
        transcriptDownloadUrl: transcriptFile.download_url,
        platform: ZOOM_PLATFORM,
        status: 'pending',
      })
      .returning();

    meetingId = newMeeting.id;
    endStage(pipelineId, STAGES.MEETING_CREATED, { meetingId });
    log('info', 'Step 4 complete: Meeting created', { meetingId });
  } else {
    log('info', 'Step 4: Updating existing meeting', { meetingId: existingMeeting.id });

    await db
      .update(meetings)
      .set({
        transcriptDownloadUrl: transcriptFile.download_url,
        status: 'pending',
        updatedAt: new Date(),
      })
      .where(eq(meetings.id, existingMeeting.id));

    meetingId = existingMeeting.id;
    log('info', 'Step 4 complete: Meeting updated', { meetingId });
  }

  log('info', 'Step 5: Calling fetchAndStoreTranscript', { meetingId, zoomMeetingId });

  await fetchAndStoreTranscript(
    meetingId,
    transcriptFile.download_url,
    downloadToken,
    rawEvent.id,
    zoomMeetingId,
    pipelineId
  );

  // End the pipeline with final metrics
  const metrics = endPipeline(pipelineId, {
    status: 'success',
    meetingId,
    action: existingMeeting ? 'updated' : 'created',
  });

  log('info', 'Step 5 complete: fetchAndStoreTranscript finished', {
    meetingId,
    zoomMeetingId,
    totalPipelineDurationMs: metrics?.totalDurationMs,
  });

  return { success: true, meetingId, action: existingMeeting ? 'updated' : 'created' };
}

/**
 * Download and store transcript directly
 * Uses download_token from webhook payload
 */
async function fetchAndStoreTranscript(
  meetingId: string,
  transcriptUrl: string,
  downloadToken: string,
  rawEventId: string,
  zoomMeetingId: string,
  pipelineId: string
): Promise<void> {
  const startTime = Date.now();

  log('info', 'Step 6: Starting fetchAndStoreTranscript', { meetingId, zoomMeetingId, pipelineId });

  try {
    log('info', 'Step 7: Updating meeting status to processing', { meetingId });
    await db
      .update(meetings)
      .set({ status: 'processing', updatedAt: new Date() })
      .where(eq(meetings.id, meetingId));
    log('info', 'Step 7 complete: Meeting status updated', { meetingId });

    // Track transcript download
    startStage(pipelineId, STAGES.TRANSCRIPT_DOWNLOAD, { meetingId });
    log('info', 'Step 8: Calling downloadTranscript', { meetingId, transcriptUrl: transcriptUrl.substring(0, 50) + '...' });
    const vttContent = await downloadTranscript(transcriptUrl, downloadToken);
    endStage(pipelineId, STAGES.TRANSCRIPT_DOWNLOAD, { contentLength: vttContent.length });
    log('info', 'Step 8 complete: Transcript downloaded', { meetingId, contentLength: vttContent.length });

    // Track VTT parsing
    startStage(pipelineId, STAGES.TRANSCRIPT_PARSE, { contentLength: vttContent.length });
    log('info', 'Step 9: Parsing VTT content', { meetingId });
    const { fullText, segments, wordCount } = parseVTT(vttContent);
    endStage(pipelineId, STAGES.TRANSCRIPT_PARSE, { wordCount, segmentCount: segments.length });
    log('info', 'Step 9 complete: VTT parsed', { meetingId, wordCount, segmentCount: segments.length });

    log('info', 'Step 10A: About to query for existing transcript', { meetingId });

    // Query only the id column to avoid fetching large JSONB/text columns
    const transcriptQuery = db
      .select({ id: transcripts.id })
      .from(transcripts)
      .where(eq(transcripts.meetingId, meetingId))
      .limit(1);

    log('info', 'Step 10B: Executing transcript query with timeout', { meetingId, timeoutMs: DB_QUERY_TIMEOUT_MS });

    const queryResult = await withDbTimeout(transcriptQuery, DB_QUERY_TIMEOUT_MS, 'check existing transcript');

    let existingTranscript: { id: string } | undefined;

    if (queryResult.timedOut) {
      log('warn', 'Step 10C: Query timed out, assuming no existing transcript', { meetingId });
      existingTranscript = undefined;
    } else {
      existingTranscript = queryResult.result[0];
      log('info', 'Step 10C: Query completed successfully', { meetingId, exists: !!existingTranscript, transcriptId: existingTranscript?.id });
    }

    let transcriptId: string;

    // Track transcript storage
    startStage(pipelineId, STAGES.TRANSCRIPT_STORED, { meetingId });

    if (existingTranscript) {
      log('info', 'Step 11A: Updating existing transcript', { transcriptId: existingTranscript.id });
      const updateResult = await withDbTimeout(
        db.update(transcripts)
          .set({
            content: fullText,
            vttContent,
            speakerSegments: segments,
            wordCount,
            status: 'ready',
            lastFetchError: null,
            updatedAt: new Date(),
          })
          .where(eq(transcripts.id, existingTranscript.id)),
        DB_QUERY_TIMEOUT_MS,
        'update transcript'
      );
      if (updateResult.timedOut) {
        log('error', 'Step 11B: Transcript update timed out', { transcriptId: existingTranscript.id });
        endStage(pipelineId, STAGES.TRANSCRIPT_STORED, { success: false, reason: 'timeout' });
        throw new Error('Transcript update timed out');
      }
      transcriptId = existingTranscript.id;
      log('info', 'Step 11B: Transcript updated successfully', { transcriptId });
    } else {
      log('info', 'Step 11A: Inserting new transcript', { meetingId });
      const insertResult = await withDbTimeout(
        db.insert(transcripts)
          .values({
            meetingId,
            content: fullText,
            vttContent,
            speakerSegments: segments,
            platform: ZOOM_PLATFORM,
            source: 'zoom',
            wordCount,
            status: 'ready',
          })
          .returning({ id: transcripts.id }),
        DB_QUERY_TIMEOUT_MS,
        'insert transcript'
      );
      if (insertResult.timedOut) {
        log('error', 'Step 11B: Transcript insert timed out', { meetingId });
        endStage(pipelineId, STAGES.TRANSCRIPT_STORED, { success: false, reason: 'timeout' });
        throw new Error('Transcript insert timed out');
      }
      transcriptId = insertResult.result[0].id;
      log('info', 'Step 11B: Transcript inserted successfully', { transcriptId });
    }

    endStage(pipelineId, STAGES.TRANSCRIPT_STORED, { transcriptId });

    log('info', 'Step 12A: Updating meeting status to ready', { meetingId });
    const meetingUpdateResult = await withDbTimeout(
      db.update(meetings)
        .set({ status: 'ready', updatedAt: new Date() })
        .where(eq(meetings.id, meetingId)),
      DB_QUERY_TIMEOUT_MS,
      'update meeting status'
    );
    if (meetingUpdateResult.timedOut) {
      log('error', 'Step 12B: Meeting status update timed out', { meetingId });
      // Don't throw - transcript was already saved, just log the error
    } else {
      log('info', 'Step 12B: Meeting status updated to ready', { meetingId });
    }

    log('info', 'Step 13: Preparing draft generation', { meetingId, transcriptId });

    try {
      log('info', 'Step 14: Fetching meeting for draft context', { meetingId });
      const [meeting] = await db
        .select()
        .from(meetings)
        .where(eq(meetings.id, meetingId))
        .limit(1);
      log('info', 'Step 14 complete: Meeting fetched', { meetingId, found: !!meeting, topic: meeting?.topic });

      if (!meeting) {
        log('error', 'Step 14 FAILED: Meeting not found for draft generation', { meetingId, transcriptId });
        return;
      }

      // Track draft generation
      startStage(pipelineId, STAGES.DRAFT_GENERATION, { meetingId, transcriptId, transcriptLength: fullText.length });
      log('info', 'Step 15: Calling generateDraft', { meetingId, transcriptId, transcriptLength: fullText.length });
      const draftResult = await generateDraft({
        meetingId,
        transcriptId,
        context: {
          meetingTopic: meeting.topic || 'Meeting',
          meetingDate: meeting.startTime
            ? meeting.startTime.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })
            : new Date().toLocaleDateString('en-US'),
          hostName: meeting.hostEmail.split('@')[0] || 'Host',
          transcript: fullText,
          senderName: meeting.hostEmail.split('@')[0],
        },
      });

      if (draftResult.success) {
        endStage(pipelineId, STAGES.DRAFT_GENERATION, {
          success: true,
          draftId: draftResult.draftId,
          generationDurationMs: draftResult.generationDurationMs,
        });
        log('info', 'Step 15 complete: Draft generated successfully', {
          meetingId,
          transcriptId,
          draftId: draftResult.draftId,
          costUsd: draftResult.costUsd?.toFixed(6),
          generationDurationMs: draftResult.generationDurationMs,
        });
      } else {
        endStage(pipelineId, STAGES.DRAFT_GENERATION, {
          success: false,
          error: draftResult.error,
        });
        log('warn', 'Step 15 FAILED: Draft generation returned failure', {
          meetingId,
          transcriptId,
          error: draftResult.error,
        });
      }
    } catch (draftError) {
      endStage(pipelineId, STAGES.DRAFT_GENERATION, {
        success: false,
        error: draftError instanceof Error ? draftError.message : 'Unknown error',
      });
      log('error', 'Step 15 CRASHED: Draft generation threw error', {
        meetingId,
        transcriptId,
        error: draftError instanceof Error ? draftError.message : String(draftError),
        stack: draftError instanceof Error ? draftError.stack : undefined,
      });
    }

    log('info', 'Step 16: fetchAndStoreTranscript complete', {
      meetingId,
      transcriptId,
      totalLatencyMs: Date.now() - startTime,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    log('error', 'fetchAndStoreTranscript CRASHED', {
      rawEventId,
      meetingId,
      zoomMeetingId,
      error: errorMessage,
      latencyMs: Date.now() - startTime,
    });

    await db
      .update(meetings)
      .set({ status: 'failed', updatedAt: new Date() })
      .where(eq(meetings.id, meetingId));
  }
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
