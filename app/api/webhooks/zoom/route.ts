import { NextRequest, NextResponse } from 'next/server';
import { verifyZoomSignature, generateChallengeResponse } from '@/lib/zoom/signature';
import { acquireEventLock } from '@/lib/idempotency';
import { db, meetings } from '@/lib/db';
import { addTranscriptJob } from '@/lib/queue/transcript-queue';
import { getZoomAccessToken } from '@/lib/transcript/downloader';
import type {
  ZoomWebhookPayload,
  RecordingCompletedPayload,
  ExtractedMeetingMetadata,
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

    // Verify signature
    if (!verifyZoomSignature(rawBody, signature, timestamp)) {
      console.log(JSON.stringify({
        level: 'warn',
        message: 'Invalid Zoom webhook signature',
        timestamp,
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

    // Handle URL validation (Zoom endpoint verification)
    if (payload.event === 'endpoint.url_validation') {
      const { plainToken } = payload.payload;
      const response = generateChallengeResponse(plainToken);

      console.log(JSON.stringify({
        level: 'info',
        message: 'Zoom URL validation challenge responded',
      }));

      return NextResponse.json(response, { status: 200 });
    }

    // Handle recording.completed event
    if (payload.event === 'recording.completed') {
      return await handleRecordingCompleted(payload);
    }

    // Unknown event type - acknowledge but don't process
    console.log(JSON.stringify({
      level: 'info',
      message: 'Unhandled Zoom event type',
      event: payload.event,
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
