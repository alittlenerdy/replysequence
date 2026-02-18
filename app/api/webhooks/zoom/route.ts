import { NextRequest, NextResponse } from 'next/server';
import { verifyZoomSignature, generateChallengeResponse } from '@/lib/zoom/signature';
import { acquireEventLock, removeEventLock } from '@/lib/idempotency';
import { db, rawEvents } from '@/lib/db';
import { processZoomEvent } from '@/lib/process-zoom-event';
import { recordWebhookFailure } from '@/lib/webhook-retry';
import { eq, desc } from 'drizzle-orm';
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
      tag: '[WEBHOOK-ERROR]',
      message: 'Zoom webhook processing error',
      platform: 'zoom',
      error: errorMessage,
      duration: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    }));

    // Record failure for retry
    try {
      const rawBody = '{}'; // Body already consumed, store minimal info
      await recordWebhookFailure(
        'zoom',
        'unknown',
        { error: 'Failed to parse webhook payload', originalError: errorMessage },
        errorMessage
      );
    } catch (recordError) {
      console.log(JSON.stringify({
        level: 'error',
        tag: '[WEBHOOK-ERROR]',
        message: 'Failed to record webhook failure',
        error: recordError instanceof Error ? recordError.message : String(recordError),
      }));
    }

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
  // Lock key: {event_type}-{meeting_uuid} (no timestamp - one lock per event type per meeting)
  const lockKey = `meeting.ended-${object.uuid}`;
  // Event ID for database: includes timestamp for uniqueness
  const eventId = `meeting.ended-${object.uuid}-${payload.event_ts}`;

  console.log(JSON.stringify({
    level: 'info',
    message: 'Lock key generated',
    lockKey,
    eventId,
    eventType: 'meeting.ended',
    meetingUuid: object.uuid,
  }));

  // Idempotency check - prevent duplicate processing
  const acquired = await acquireEventLock(lockKey);
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.log(JSON.stringify({
      level: 'error',
      tag: '[WEBHOOK-ERROR]',
      message: 'Event processing failed in webhook handler',
      platform: 'zoom',
      eventType: 'meeting.ended',
      rawEventId: rawEvent.id,
      meetingId: extractedData.meetingId,
      error: errorMessage,
      timestamp: new Date().toISOString(),
    }));

    // Record failure for retry
    try {
      await recordWebhookFailure(
        'zoom',
        'meeting.ended',
        rawEvent.payload,
        errorMessage
      );
    } catch (recordError) {
      console.log(JSON.stringify({
        level: 'error',
        tag: '[WEBHOOK-ERROR]',
        message: 'Failed to record webhook failure for retry',
        error: recordError instanceof Error ? recordError.message : String(recordError),
      }));
    }
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
  // Lock key: {event_type}-{meeting_uuid} (no timestamp - one lock per event type per meeting)
  const lockKey = `recording.completed-${object.uuid}`;
  // Event ID for database: includes timestamp for uniqueness
  const eventId = `recording.completed-${object.uuid}-${payload.event_ts}`;

  // Idempotency check - prevent duplicate processing
  let acquired = await acquireEventLock(lockKey);
  let existingRawEvent: RawEvent | null = null;

  if (!acquired) {
    // Smart retry: Check if previous attempt actually succeeded
    const [existingEvent] = await db
      .select()
      .from(rawEvents)
      .where(eq(rawEvents.zoomEventId, eventId))
      .orderBy(desc(rawEvents.createdAt))
      .limit(1);

    if (existingEvent) {
      const ageMinutes = Math.floor((Date.now() - new Date(existingEvent.createdAt).getTime()) / 60000);

      if (existingEvent.status === 'processed') {
        console.log(JSON.stringify({
          level: 'info',
          message: 'Duplicate recording.completed ignored (already processed)',
          eventId,
          existingEventId: existingEvent.id,
          duration: Date.now() - startTime,
        }));

        return NextResponse.json({
          received: true,
          duplicate: true,
          eventId: existingEvent.id,
        }, { status: 200 });
      }

      if (existingEvent.status === 'processing' && ageMinutes < 2) {
        console.log(JSON.stringify({
          level: 'info',
          message: 'Duplicate recording.completed ignored (currently processing)',
          eventId,
          existingEventId: existingEvent.id,
          duration: Date.now() - startTime,
        }));

        return NextResponse.json({
          received: true,
          duplicate: true,
          processing: true,
          eventId: existingEvent.id,
        }, { status: 200 });
      }

      // Failed or stuck - reuse existing record for retry
      await removeEventLock(lockKey);
      existingRawEvent = existingEvent;
      acquired = true;
    } else {
      await removeEventLock(lockKey);
      acquired = true;
    }
  }

  if (!acquired) {
    return NextResponse.json({
      received: true,
      duplicate: true,
      eventId: null,
    }, { status: 200 });
  }

  // Get or create raw event
  let rawEvent: RawEvent;

  if (existingRawEvent) {
    await db
      .update(rawEvents)
      .set({ status: 'pending', updatedAt: new Date(), errorMessage: null })
      .where(eq(rawEvents.id, existingRawEvent.id));

    rawEvent = { ...existingRawEvent, status: 'pending' };
  } else {
    rawEvent = await storeRawEvent(
      'recording.completed',
      eventId,
      rawBody
    );
  }

  console.log(JSON.stringify({
    level: 'info',
    message: 'recording.completed processing started',
    rawEventId: rawEvent.id,
    zoomMeetingId: object.uuid,
    reused: !!existingRawEvent,
  }));

  // Process event synchronously before returning
  try {
    const result = await processZoomEvent(rawEvent);

    console.log(JSON.stringify({
      level: 'info',
      message: 'recording.completed processing completed',
      rawEventId: rawEvent.id,
      action: result.action,
      meetingId: result.meetingId,
      duration: Date.now() - startTime,
    }));
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.log(JSON.stringify({
      level: 'error',
      tag: '[WEBHOOK-ERROR]',
      message: 'Event processing failed in webhook handler',
      platform: 'zoom',
      eventType: 'recording.completed',
      rawEventId: rawEvent.id,
      zoomMeetingId: object.uuid,
      error: errorMessage,
      timestamp: new Date().toISOString(),
    }));

    // Record failure for retry
    try {
      await recordWebhookFailure(
        'zoom',
        'recording.completed',
        rawEvent.payload,
        errorMessage
      );
    } catch (recordError) {
      console.log(JSON.stringify({
        level: 'error',
        tag: '[WEBHOOK-ERROR]',
        message: 'Failed to record webhook failure for retry',
        error: recordError instanceof Error ? recordError.message : String(recordError),
      }));
    }
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
  try {
    // Defensive check for payload structure
    if (!payload.payload?.object?.uuid) {
      console.log(JSON.stringify({
        level: 'error',
        message: 'Invalid transcript_completed payload: missing uuid',
      }));
      return NextResponse.json(
        { received: true, error: 'Invalid payload structure' },
        { status: 200 }
      );
    }

    const { object } = payload.payload;
    const lockKey = `recording.transcript_completed-${object.uuid}`;
    const eventId = `recording.transcript_completed-${object.uuid}-${payload.event_ts}`;

    // Idempotency check - prevent duplicate processing
    let acquired: boolean;
    let existingRawEvent: RawEvent | null = null;

    try {
      acquired = await acquireEventLock(lockKey);
    } catch (lockError) {
      console.log(JSON.stringify({
        level: 'error',
        message: 'Event lock acquisition failed, proceeding without lock',
        lockKey,
        error: lockError instanceof Error ? lockError.message : String(lockError),
      }));
      acquired = true;
    }

    if (!acquired) {
      // Smart retry: Check if previous attempt actually succeeded
      const [existingEvent] = await db
        .select()
        .from(rawEvents)
        .where(eq(rawEvents.zoomEventId, eventId))
        .orderBy(desc(rawEvents.createdAt))
        .limit(1);

      if (existingEvent) {
        const ageMinutes = Math.floor((Date.now() - new Date(existingEvent.createdAt).getTime()) / 60000);

        if (existingEvent.status === 'processed') {
          console.log(JSON.stringify({
            level: 'info',
            message: 'Duplicate transcript_completed ignored (already processed)',
            eventId,
            existingEventId: existingEvent.id,
            duration: Date.now() - startTime,
          }));

          return NextResponse.json({
            received: true,
            duplicate: true,
            eventId: existingEvent.id,
          }, { status: 200 });
        }

        if (existingEvent.status === 'processing' && ageMinutes < 2) {
          console.log(JSON.stringify({
            level: 'info',
            message: 'Duplicate transcript_completed ignored (currently processing)',
            eventId,
            existingEventId: existingEvent.id,
            duration: Date.now() - startTime,
          }));

          return NextResponse.json({
            received: true,
            duplicate: true,
            processing: true,
            eventId: existingEvent.id,
          }, { status: 200 });
        }

        // Failed or stuck - reuse existing record for retry
        await removeEventLock(lockKey);
        existingRawEvent = existingEvent;
        acquired = true;
      } else {
        await removeEventLock(lockKey);
        acquired = true;
      }
    }

    if (!acquired) {
      return NextResponse.json({
        received: true,
        duplicate: true,
        eventId: null,
      }, { status: 200 });
    }

    // Get or create raw event
    let rawEvent: RawEvent;

    if (existingRawEvent) {
      await db
        .update(rawEvents)
        .set({ status: 'pending', updatedAt: new Date(), errorMessage: null })
        .where(eq(rawEvents.id, existingRawEvent.id));

      rawEvent = { ...existingRawEvent, status: 'pending' };
    } else {
      try {
        rawEvent = await storeRawEvent(
          'recording.transcript_completed',
          eventId,
          rawBody
        );
      } catch (storeError) {
        console.log(JSON.stringify({
          level: 'error',
          message: 'Failed to store transcript_completed event',
          eventId,
          error: storeError instanceof Error ? storeError.message : String(storeError),
        }));
        return NextResponse.json(
          { received: true, error: 'Failed to store event' },
          { status: 200 }
        );
      }
    }

    console.log(JSON.stringify({
      level: 'info',
      message: 'transcript_completed processing started',
      rawEventId: rawEvent.id,
      zoomMeetingId: object.uuid,
      reused: !!existingRawEvent,
    }));

    // Process event synchronously
    try {
      const result = await processZoomEvent(rawEvent);

      console.log(JSON.stringify({
        level: 'info',
        message: 'transcript_completed processing completed',
        rawEventId: rawEvent.id,
        action: result.action,
        meetingId: result.meetingId,
        duration: Date.now() - startTime,
      }));
    } catch (processError) {
      const errorMessage = processError instanceof Error ? processError.message : String(processError);
      console.log(JSON.stringify({
        level: 'error',
        tag: '[WEBHOOK-ERROR]',
        message: 'transcript_completed processing failed',
        platform: 'zoom',
        rawEventId: rawEvent.id,
        error: errorMessage,
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      }));

      try {
        await recordWebhookFailure(
          'zoom',
          'recording.transcript_completed',
          rawEvent.payload,
          errorMessage
        );
      } catch (recordError) {
        console.log(JSON.stringify({
          level: 'error',
          tag: '[WEBHOOK-ERROR]',
          message: 'Failed to record webhook failure for retry',
          error: recordError instanceof Error ? recordError.message : String(recordError),
        }));
      }
    }

    return NextResponse.json(
      {
        received: true,
        eventId: rawEvent.id,
        zoomMeetingId: object.uuid,
      },
      { status: 200 }
    );
  } catch (unexpectedError) {
    const errorMessage = unexpectedError instanceof Error ? unexpectedError.message : String(unexpectedError);
    console.log(JSON.stringify({
      level: 'error',
      tag: '[WEBHOOK-ERROR]',
      message: 'transcript_completed handler crashed',
      platform: 'zoom',
      error: errorMessage,
      duration: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    }));

    try {
      await recordWebhookFailure(
        'zoom',
        'recording.transcript_completed',
        { error: 'Handler crash', rawBody: 'unavailable' },
        errorMessage
      );
    } catch (recordError) {
      console.log(JSON.stringify({
        level: 'error',
        tag: '[WEBHOOK-ERROR]',
        message: 'Failed to record webhook failure for retry',
        error: recordError instanceof Error ? recordError.message : String(recordError),
      }));
    }

    return NextResponse.json(
      { received: true, error: 'Handler crashed' },
      { status: 200 }
    );
  }
}
