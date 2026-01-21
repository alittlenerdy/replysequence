import { NextRequest, NextResponse } from 'next/server';
import { verifyZoomSignature, generateChallengeResponse } from '@/lib/zoom/signature';
import { acquireEventLock } from '@/lib/idempotency';
import { db, meetings, rawEvents } from '@/lib/db';
import { addTranscriptJob } from '@/lib/queue/transcript-queue';
import { getZoomAccessToken } from '@/lib/transcript/downloader';
import { eq } from 'drizzle-orm';
import type {
  ZoomWebhookPayload,
  RecordingCompletedPayload,
  MeetingEndedPayload,
  ExtractedMeetingMetadata,
  ExtractedMeetingEndedData,
} from '@/lib/zoom/types';

// Disable body parsing to access raw body for signature verification
export const dynamic = 'force-dynamic';

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
      return await handleRecordingCompleted(payload);
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
 * Store raw event in database for audit trail and reprocessing
 */
async function storeRawEvent(
  eventType: string,
  zoomEventId: string,
  rawBody: string,
  extractedData?: Partial<ExtractedMeetingEndedData>
): Promise<string> {
  const parsedPayload = JSON.parse(rawBody);

  const [rawEvent] = await db
    .insert(rawEvents)
    .values({
      eventType,
      zoomEventId,
      payload: parsedPayload,
      status: 'received',
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

  return rawEvent.id;
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
  const rawEventId = await storeRawEvent(
    'meeting.ended',
    eventId,
    rawBody,
    extractedData
  );

  console.log(JSON.stringify({
    level: 'info',
    message: 'meeting.ended event processed',
    rawEventId,
    meetingId: extractedData.meetingId,
    endTime: extractedData.endTime.toISOString(),
    duration: Date.now() - startTime,
  }));

  // Return success with event ID
  return NextResponse.json(
    {
      received: true,
      eventId: rawEventId,
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
  payload: RecordingCompletedPayload
): Promise<NextResponse> {
  const { object } = payload.payload;
  const eventId = `${object.uuid}-${payload.event_ts}`;

  // Idempotency check - prevent duplicate processing
  const acquired = await acquireEventLock(eventId);
  if (!acquired) {
    console.log(JSON.stringify({
      level: 'info',
      message: 'Duplicate recording.completed event ignored',
      eventId,
      zoomMeetingId: object.uuid,
    }));

    return NextResponse.json(
      { received: true, duplicate: true },
      { status: 200 }
    );
  }

  // Extract meeting metadata
  const metadata = extractMeetingMetadata(object);

  // Check if we have a transcript
  if (!metadata.transcriptDownloadUrl) {
    console.log(JSON.stringify({
      level: 'info',
      message: 'No transcript available for recording',
      zoomMeetingId: metadata.zoomMeetingId,
    }));

    return NextResponse.json(
      { received: true, transcript: false },
      { status: 200 }
    );
  }

  // Store meeting in database
  const [meeting] = await db
    .insert(meetings)
    .values({
      zoomMeetingId: metadata.zoomMeetingId,
      hostEmail: metadata.hostEmail,
      topic: metadata.topic,
      startTime: metadata.startTime,
      duration: metadata.duration,
      participants: metadata.participants,
      status: 'pending',
      zoomEventId: eventId,
      transcriptDownloadUrl: metadata.transcriptDownloadUrl,
      recordingDownloadUrl: metadata.recordingDownloadUrl,
    })
    .returning();

  console.log(JSON.stringify({
    level: 'info',
    message: 'Meeting stored in database',
    meetingId: meeting.id,
    zoomMeetingId: metadata.zoomMeetingId,
  }));

  // Get Zoom access token and queue transcript processing
  try {
    const accessToken = await getZoomAccessToken();

    await addTranscriptJob({
      meetingId: meeting.id,
      zoomMeetingId: metadata.zoomMeetingId,
      transcriptDownloadUrl: metadata.transcriptDownloadUrl,
      accessToken,
    });

    console.log(JSON.stringify({
      level: 'info',
      message: 'Transcript processing job queued',
      meetingId: meeting.id,
      zoomMeetingId: metadata.zoomMeetingId,
    }));
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    console.log(JSON.stringify({
      level: 'error',
      message: 'Failed to queue transcript job',
      meetingId: meeting.id,
      error: errorMessage,
    }));

    // Don't fail the webhook - meeting is saved, job can be retried manually
  }

  // Return 200 OK immediately (async processing via queue)
  return NextResponse.json(
    {
      received: true,
      meetingId: meeting.id,
    },
    { status: 200 }
  );
}

function extractMeetingMetadata(
  object: RecordingCompletedPayload['payload']['object']
): ExtractedMeetingMetadata {
  // Find transcript file
  const transcriptFile = object.recording_files.find(
    (file) => file.file_type === 'TRANSCRIPT' && file.status === 'completed'
  );

  // Find main video recording
  const videoFile = object.recording_files.find(
    (file) => file.file_type === 'MP4' && file.status === 'completed'
  );

  return {
    zoomMeetingId: object.uuid,
    hostEmail: object.host_email || 'unknown@unknown.com',
    topic: object.topic || 'Untitled Meeting',
    startTime: new Date(object.start_time),
    duration: object.duration,
    participants: [], // Zoom doesn't include participants in recording.completed
    transcriptDownloadUrl: transcriptFile?.download_url || null,
    recordingDownloadUrl: videoFile?.download_url || null,
  };
}
