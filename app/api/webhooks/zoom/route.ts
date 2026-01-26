import { NextRequest, NextResponse } from 'next/server';
import { verifyZoomSignature, generateChallengeResponse } from '@/lib/zoom/signature';
import { acquireEventLock } from '@/lib/idempotency';
import { db, rawEvents } from '@/lib/db';
import { processZoomEvent } from '@/lib/process-zoom-event';
import { eq } from 'drizzle-orm';
import type {
  ZoomWebhookPayload,
  MeetingEndedPayload,
  RecordingCompletedPayload,
  RecordingTranscriptCompletedPayload,
} from '@/lib/zoom/types';
import type { RawEvent } from '@/lib/db/schema';

// Disable body parsing to access raw body for signature verification
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 second timeout

// Processing timeout - if processing takes longer, return 200 anyway
const PROCESSING_TIMEOUT_MS = 55000; // 55 seconds (5s buffer before Vercel timeout)

/**
 * Wrap a promise with a timeout that returns a fallback value instead of throwing
 */
async function withProcessingTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  fallback: T,
  operation: string
): Promise<{ result: T; timedOut: boolean }> {
  let timeoutId: NodeJS.Timeout;

  const timeoutPromise = new Promise<{ result: T; timedOut: boolean }>((resolve) => {
    timeoutId = setTimeout(() => {
      console.log(JSON.stringify({
        level: 'warn',
        message: `${operation} timed out after ${timeoutMs}ms`,
        timeoutMs,
      }));
      resolve({ result: fallback, timedOut: true });
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([
      promise.then(r => ({ result: r, timedOut: false })),
      timeoutPromise,
    ]);
    clearTimeout(timeoutId!);
    return result;
  } catch (error) {
    clearTimeout(timeoutId!);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Get raw body for signature verification
    const rawBody = await request.text();

    // Get signature headers
    const signature = request.headers.get('x-zm-signature') || '';
    const timestamp = request.headers.get('x-zm-request-timestamp') || '';

    // Verify signature - reject invalid signatures with 401
    if (!verifyZoomSignature(rawBody, signature, timestamp)) {
      console.log(JSON.stringify({
        level: 'warn',
        message: 'Invalid Zoom webhook signature',
        timestamp,
        duration: Date.now() - startTime,
      }));

      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Parse the body
    const payload: ZoomWebhookPayload = JSON.parse(rawBody);

    console.log(JSON.stringify({
      level: 'info',
      message: 'Zoom webhook received',
      event: payload.event,
      eventTs: payload.event_ts,
    }));

    // Handle URL validation (Zoom endpoint verification) - no storage needed
    if (payload.event === 'endpoint.url_validation') {
      const { plainToken } = payload.payload;
      const response = generateChallengeResponse(plainToken);

      console.log(JSON.stringify({
        level: 'info',
        message: 'Zoom URL validation challenge responded',
        duration: Date.now() - startTime,
      }));

      return NextResponse.json(response, { status: 200 });
    }

    // Handle meeting.ended event - store raw event
    if (payload.event === 'meeting.ended') {
      return await handleMeetingEnded(payload, rawBody, startTime);
    }

    // Handle recording.completed event
    if (payload.event === 'recording.completed') {
      return await handleRecordingCompleted(payload, rawBody, startTime);
    }

    // Handle recording.transcript_completed event
    if (payload.event === 'recording.transcript_completed') {
      console.log(JSON.stringify({
        level: 'info',
        message: 'Routing to handleTranscriptCompleted',
        event: payload.event,
      }));
      return await handleTranscriptCompleted(payload, rawBody, startTime);
    }

    // Unknown event type - store as raw event and acknowledge
    const genericPayload = payload as { event: string; event_ts: number };
    await storeRawEvent(
      genericPayload.event,
      `${genericPayload.event}-${genericPayload.event_ts}`,
      rawBody
    );

    console.log(JSON.stringify({
      level: 'info',
      message: 'Unhandled Zoom event type stored',
      event: genericPayload.event,
      duration: Date.now() - startTime,
    }));

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    console.log(JSON.stringify({
      level: 'error',
      message: 'Zoom webhook processing error',
      error: errorMessage,
      duration: Date.now() - startTime,
    }));

    // Return 200 to prevent Zoom from retrying
    // We log the error for investigation
    return NextResponse.json(
      { received: true, error: 'Internal processing error' },
      { status: 200 }
    );
  }
}

/**
 * Extracted data from meeting.ended payload
 */
interface ExtractedMeetingEndedData {
  meetingId: string;
  endTime: Date;
  recordingAvailable: 'pending' | 'no';
  transcriptAvailable: 'pending' | 'no';
}

/**
 * Store raw event in database for audit trail and reprocessing
 * Returns the full rawEvent object for immediate processing
 */
async function storeRawEvent(
  eventType: string,
  zoomEventId: string,
  rawBody: string,
  extractedData?: Partial<ExtractedMeetingEndedData>
): Promise<RawEvent> {
  const parsedPayload = JSON.parse(rawBody);

  const [rawEvent] = await db
    .insert(rawEvents)
    .values({
      eventType,
      zoomEventId,
      payload: parsedPayload,
      status: 'pending',
      meetingId: extractedData?.meetingId,
      endTime: extractedData?.endTime,
      recordingAvailable: extractedData?.recordingAvailable,
      transcriptAvailable: extractedData?.transcriptAvailable,
    })
    .returning();

  console.log(JSON.stringify({
    level: 'info',
    message: 'Raw event stored',
    rawEventId: rawEvent.id,
    eventType,
    zoomEventId,
  }));

  return rawEvent;
}

/**
 * Handle meeting.ended webhook event
 * Stores raw event and extracts metadata
 */
async function handleMeetingEnded(
  payload: MeetingEndedPayload,
  rawBody: string,
  startTime: number
): Promise<NextResponse> {
  const { object } = payload.payload;
  const eventId = `meeting.ended-${object.uuid}-${payload.event_ts}`;

  // Idempotency check - prevent duplicate processing
  const acquired = await acquireEventLock(eventId);
  if (!acquired) {
    console.log(JSON.stringify({
      level: 'info',
      message: 'Duplicate meeting.ended event ignored',
      eventId,
      meetingId: object.uuid,
      duration: Date.now() - startTime,
    }));

    // Return existing event ID if we have it
    const [existingEvent] = await db
      .select({ id: rawEvents.id })
      .from(rawEvents)
      .where(eq(rawEvents.zoomEventId, eventId))
      .limit(1);

    return NextResponse.json(
      {
        received: true,
        duplicate: true,
        eventId: existingEvent?.id || null,
      },
      { status: 200 }
    );
  }

  // Extract meeting metadata
  const extractedData = extractMeetingEndedData(object);

  // Validate required fields
  if (!extractedData.meetingId) {
    console.log(JSON.stringify({
      level: 'error',
      message: 'Invalid meeting.ended payload: missing meeting_id',
      eventId,
    }));

    return NextResponse.json(
      { error: 'Invalid payload: missing meeting_id' },
      { status: 200 } // Still 200 to prevent retries
    );
  }

  // Store raw event in database
  const rawEvent = await storeRawEvent(
    'meeting.ended',
    eventId,
    rawBody,
    extractedData
  );

  console.log(JSON.stringify({
    level: 'info',
    message: 'meeting.ended event stored',
    rawEventId: rawEvent.id,
    meetingId: extractedData.meetingId,
    endTime: extractedData.endTime.toISOString(),
    duration: Date.now() - startTime,
  }));

  // Process event synchronously before returning
  // Zoom webhooks have 30s timeout, processing should be fast
  try {
    const result = await processZoomEvent(rawEvent);

    console.log(JSON.stringify({
      level: 'info',
      message: 'Event processing completed in webhook handler',
      rawEventId: rawEvent.id,
      action: result.action,
      meetingId: result.meetingId,
    }));
  } catch (error) {
    console.log(JSON.stringify({
      level: 'error',
      message: 'Event processing failed in webhook handler',
      rawEventId: rawEvent.id,
      error: error instanceof Error ? error.message : 'Unknown error',
    }));
    // Don't fail the webhook - raw event is stored for retry
  }

  // Return success with event ID
  return NextResponse.json(
    {
      received: true,
      eventId: rawEvent.id,
      meetingId: extractedData.meetingId,
    },
    { status: 200 }
  );
}

/**
 * Extract data from meeting.ended payload
 */
function extractMeetingEndedData(
  object: MeetingEndedPayload['payload']['object']
): ExtractedMeetingEndedData {
  return {
    meetingId: object.uuid,
    endTime: new Date(object.end_time),
    // Recording/transcript availability is not directly indicated in meeting.ended
    // We mark as 'pending' since recording.completed event will follow if available
    recordingAvailable: 'pending',
    transcriptAvailable: 'pending',
  };
}

async function handleRecordingCompleted(
  payload: RecordingCompletedPayload,
  rawBody: string,
  startTime: number
): Promise<NextResponse> {
  const { object } = payload.payload;
  const eventId = `recording.completed-${object.uuid}-${payload.event_ts}`;

  // Idempotency check - prevent duplicate processing
  const acquired = await acquireEventLock(eventId);
  if (!acquired) {
    console.log(JSON.stringify({
      level: 'info',
      message: 'Duplicate recording.completed event ignored',
      eventId,
      zoomMeetingId: object.uuid,
    }));

    // Return existing event ID if we have it
    const [existingEvent] = await db
      .select({ id: rawEvents.id })
      .from(rawEvents)
      .where(eq(rawEvents.zoomEventId, eventId))
      .limit(1);

    return NextResponse.json(
      {
        received: true,
        duplicate: true,
        eventId: existingEvent?.id || null,
      },
      { status: 200 }
    );
  }

  // Store raw event in database
  const rawEvent = await storeRawEvent(
    'recording.completed',
    eventId,
    rawBody
  );

  console.log(JSON.stringify({
    level: 'info',
    message: 'recording.completed event stored',
    rawEventId: rawEvent.id,
    zoomMeetingId: object.uuid,
    duration: Date.now() - startTime,
  }));

  // Process event synchronously before returning
  try {
    const result = await processZoomEvent(rawEvent);

    console.log(JSON.stringify({
      level: 'info',
      message: 'Event processing completed in webhook handler',
      rawEventId: rawEvent.id,
      action: result.action,
      meetingId: result.meetingId,
    }));
  } catch (error) {
    console.log(JSON.stringify({
      level: 'error',
      message: 'Event processing failed in webhook handler',
      rawEventId: rawEvent.id,
      error: error instanceof Error ? error.message : 'Unknown error',
    }));
  }

  // Return success with event ID
  return NextResponse.json(
    {
      received: true,
      eventId: rawEvent.id,
      zoomMeetingId: object.uuid,
    },
    { status: 200 }
  );
}

async function handleTranscriptCompleted(
  payload: RecordingTranscriptCompletedPayload,
  rawBody: string,
  startTime: number
): Promise<NextResponse> {
  // ============ HANDLER ENTRY POINT ============
  console.log(JSON.stringify({
    level: 'info',
    message: '>>> HANDLER ENTRY: handleTranscriptCompleted',
    timestamp: new Date().toISOString(),
    elapsedMs: Date.now() - startTime,
    envCheck: {
      hasRedisUrl: !!process.env.REDIS_URL,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      hasAnthropicKey: !!process.env.ANTHROPIC_API_KEY,
    },
  }));

  // Wrap entire handler in try-catch to catch any unexpected errors
  try {
    console.log(JSON.stringify({
      level: 'info',
      message: 'A1: Checking payload structure',
      hasPayload: !!payload.payload,
      hasObject: !!payload.payload?.object,
    }));

    // Defensive check for payload structure
    if (!payload.payload?.object?.uuid) {
      console.log(JSON.stringify({
        level: 'error',
        message: 'A1 FAILED: Invalid transcript_completed payload structure',
        hasPayload: !!payload.payload,
        hasObject: !!payload.payload?.object,
        hasUuid: !!payload.payload?.object?.uuid,
      }));
      return NextResponse.json(
        { received: true, error: 'Invalid payload structure' },
        { status: 200 }
      );
    }
    console.log(JSON.stringify({ level: 'info', message: 'A1 DONE: Payload valid' }));

    const { object } = payload.payload;
    const eventId = `recording.transcript_completed-${object.uuid}-${payload.event_ts}`;

    console.log(JSON.stringify({
      level: 'info',
      message: 'A2: About to call acquireEventLock',
      eventId,
      zoomMeetingId: object.uuid,
    }));

    // Idempotency check - prevent duplicate processing
    let acquired: boolean;
    try {
      acquired = await acquireEventLock(eventId);
      console.log(JSON.stringify({
        level: 'info',
        message: 'A2 DONE: acquireEventLock returned',
        eventId,
        acquired,
      }));
    } catch (lockError) {
      console.log(JSON.stringify({
        level: 'error',
        message: 'A2 ERROR: acquireEventLock threw',
        eventId,
        error: lockError instanceof Error ? lockError.message : String(lockError),
      }));
      // Continue without lock - better to process duplicate than fail
      acquired = true;
    }

    if (!acquired) {
      console.log(JSON.stringify({
        level: 'info',
        message: 'A3: Duplicate event, querying existing',
        eventId,
      }));

      const [existingEvent] = await db
        .select({ id: rawEvents.id })
        .from(rawEvents)
        .where(eq(rawEvents.zoomEventId, eventId))
        .limit(1);

      console.log(JSON.stringify({
        level: 'info',
        message: 'A3 DONE: Returning duplicate response',
        eventId,
        existingEventId: existingEvent?.id,
      }));

      return NextResponse.json(
        { received: true, duplicate: true, eventId: existingEvent?.id || null },
        { status: 200 }
      );
    }

    // Store raw event in database
    console.log(JSON.stringify({
      level: 'info',
      message: 'A4: About to call storeRawEvent',
      eventId,
    }));

    let rawEvent: RawEvent;
    try {
      rawEvent = await storeRawEvent(
        'recording.transcript_completed',
        eventId,
        rawBody
      );
      console.log(JSON.stringify({
        level: 'info',
        message: 'A4 DONE: storeRawEvent returned',
        rawEventId: rawEvent.id,
      }));
    } catch (storeError) {
      console.log(JSON.stringify({
        level: 'error',
        message: 'A4 ERROR: storeRawEvent threw',
        eventId,
        error: storeError instanceof Error ? storeError.message : String(storeError),
      }));
      return NextResponse.json(
        { received: true, error: 'Failed to store event' },
        { status: 200 }
      );
    }

    // Process event with timeout wrapper
    console.log(JSON.stringify({
      level: 'info',
      message: 'A5: About to call processZoomEvent with timeout wrapper',
      rawEventId: rawEvent.id,
      timeoutMs: PROCESSING_TIMEOUT_MS,
    }));

    const processingPromise = processZoomEvent(rawEvent);
    const { result, timedOut } = await withProcessingTimeout(
      processingPromise.then(r => r),
      PROCESSING_TIMEOUT_MS - (Date.now() - startTime), // Remaining time
      { success: false, action: 'failed' as const, error: 'Processing timeout' },
      'processZoomEvent'
    );

    if (timedOut) {
      console.log(JSON.stringify({
        level: 'warn',
        message: 'A5 TIMEOUT: processZoomEvent exceeded time limit',
        rawEventId: rawEvent.id,
        elapsedMs: Date.now() - startTime,
      }));
    } else {
      console.log(JSON.stringify({
        level: 'info',
        message: 'A5 DONE: processZoomEvent completed',
        rawEventId: rawEvent.id,
        action: result.action,
        meetingId: result.meetingId,
        elapsedMs: Date.now() - startTime,
      }));
    }

    // Return success with event ID
    console.log(JSON.stringify({
      level: 'info',
      message: '<<< HANDLER EXIT: Returning 200 OK',
      rawEventId: rawEvent.id,
      totalDurationMs: Date.now() - startTime,
      timedOut,
    }));

    return NextResponse.json(
      {
        received: true,
        eventId: rawEvent.id,
        zoomMeetingId: object.uuid,
        timedOut,
      },
      { status: 200 }
    );
  } catch (unexpectedError) {
    // Catch-all for any unexpected errors in the handler
    console.log(JSON.stringify({
      level: 'error',
      message: '!!! HANDLER CRASH: Unexpected error',
      error: unexpectedError instanceof Error ? unexpectedError.message : String(unexpectedError),
      stack: unexpectedError instanceof Error ? unexpectedError.stack : undefined,
      duration: Date.now() - startTime,
    }));

    return NextResponse.json(
      { received: true, error: 'Handler crashed' },
      { status: 200 }
    );
  }
}
