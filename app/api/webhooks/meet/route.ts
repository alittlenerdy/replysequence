import { NextRequest, NextResponse } from 'next/server';
import { db, rawEvents, meetConnections } from '@/lib/db';
import { processMeetEvent } from '@/lib/process-meet-event';
import { validatePubSubMessage } from '@/lib/meet-api';
import { recordWebhookFailure } from '@/lib/webhook-retry';
import { acquireEventLock } from '@/lib/idempotency';
import { decrypt } from '@/lib/encryption';
import type {
  PubSubPushMessage,
  MeetWorkspaceEvent,
  RecordingFileGeneratedEvent,
  TranscriptFileGeneratedEvent,
} from '@/lib/meet/types';
import type { RawEvent } from '@/lib/db/schema';

// Disable body parsing to access raw body
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 second timeout

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
      service: 'meet-webhook',
      ...data,
    })
  );
}

/**
 * Handle GET request - Subscription validation
 * Google Pub/Sub may send a verification request
 */
export async function GET(request: NextRequest) {
  const challenge = request.nextUrl.searchParams.get('challenge');

  if (challenge) {
    log('info', '[MEET-1] Pub/Sub subscription validation request received');

    return new NextResponse(challenge, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  }

  log('warn', '[MEET-1] GET request without challenge');
  return NextResponse.json({ error: 'Missing challenge parameter' }, { status: 400 });
}

/**
 * Handle POST request - Pub/Sub push notifications
 * Receives notifications when Meet conferences end
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const rawBody = await request.text();
    const authHeader = request.headers.get('authorization');

    // Validate Pub/Sub message JWT authenticity
    const jwtResult = await validatePubSubMessage(authHeader);
    if (!jwtResult.valid) {
      log('warn', '[MEET-1] Invalid Pub/Sub message authentication', {
        hasAuthHeader: !!authHeader,
        error: jwtResult.error,
      });

      // Return 403 for claim validation failures (wrong audience), 401 for others
      const status = jwtResult.error?.includes('Claim validation') ? 403 : 401;
      return NextResponse.json(
        { error: 'Invalid authentication', details: jwtResult.error },
        { status }
      );
    }

    log('info', '[MEET-1] JWT validated successfully', {
      email: jwtResult.email,
      audience: jwtResult.audience,
    });

    // Parse the Pub/Sub envelope
    const pushMessage: PubSubPushMessage = JSON.parse(rawBody);

    log('info', '[MEET-1] Webhook received', {
      messageId: pushMessage.message.messageId,
      subscription: pushMessage.subscription,
      publishTime: pushMessage.message.publishTime,
    });

    // Decode the base64 event data
    const eventData = Buffer.from(pushMessage.message.data, 'base64').toString('utf-8');
    const meetEvent: MeetWorkspaceEvent = JSON.parse(eventData);

    log('info', '[MEET-2] Message validated', {
      eventType: meetEvent.eventType,
      eventTime: meetEvent.eventTime,
      conferenceRecord: meetEvent.conferenceRecord?.name,
    });

    // Route based on event type
    if (meetEvent.eventType === 'google.workspace.meet.conference.v2.ended') {
      return await handleConferenceEnded(meetEvent, pushMessage, rawBody, startTime);
    }

    // Handle transcript file generated event
    if (meetEvent.eventType === 'google.workspace.meet.transcript.v2.fileGenerated') {
      const transcriptEvent = JSON.parse(eventData) as TranscriptFileGeneratedEvent;
      return await handleTranscriptFileGenerated(transcriptEvent, pushMessage, rawBody, startTime);
    }

    // Handle recording file generated event
    if (meetEvent.eventType === 'google.workspace.meet.recording.v2.fileGenerated') {
      const recordingEvent = JSON.parse(eventData) as RecordingFileGeneratedEvent;
      return await handleRecordingFileGenerated(recordingEvent, pushMessage, rawBody, startTime);
    }

    // Unknown event type - store for reference and acknowledge
    await storeRawEvent(
      meetEvent.eventType,
      pushMessage.message.messageId,
      rawBody
    );

    log('info', '[MEET-3] Unknown event type stored', {
      eventType: meetEvent.eventType,
      duration: Date.now() - startTime,
    });

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    log('error', '[MEET-1] Webhook processing error', {
      tag: '[WEBHOOK-ERROR]',
      platform: 'google_meet',
      error: errorMessage,
      duration: Date.now() - startTime,
    });

    // Record failure for retry
    try {
      await recordWebhookFailure(
        'google_meet',
        'unknown',
        { error: 'Failed to parse webhook payload', originalError: errorMessage },
        errorMessage
      );
    } catch (recordError) {
      log('error', 'Failed to record webhook failure', {
        tag: '[WEBHOOK-ERROR]',
        error: recordError instanceof Error ? recordError.message : String(recordError),
      });
    }

    // Return 200 to prevent Pub/Sub from retrying
    // We log the error for investigation
    return NextResponse.json(
      { received: true, error: 'Internal processing error' },
      { status: 200 }
    );
  }
}

/**
 * Resolve user context for Meet webhook events.
 * Since Pub/Sub notifications don't include user info, we look up the first
 * active Meet connection and use their credentials. For single-user beta
 * this is correct; for multi-user we'll need subscription-based routing.
 */
async function resolveUserContext(): Promise<{
  accessToken: string;
  userId: string;
  hostEmail: string;
} | null> {
  try {
    const connections = await db
      .select({
        userId: meetConnections.userId,
        googleEmail: meetConnections.googleEmail,
        refreshTokenEncrypted: meetConnections.refreshTokenEncrypted,
      })
      .from(meetConnections)
      .limit(5);

    if (connections.length === 0) {
      log('warn', 'No Meet connections found for webhook processing');
      return null;
    }

    // Try each connection until one works
    for (const connection of connections) {
      try {
        const refreshToken = decrypt(connection.refreshTokenEncrypted);
        const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();

        if (!clientId || !clientSecret) continue;

        const response = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: refreshToken,
            grant_type: 'refresh_token',
          }),
        });

        if (response.ok) {
          const data = await response.json();
          return {
            accessToken: data.access_token,
            userId: connection.userId,
            hostEmail: connection.googleEmail,
          };
        }
      } catch {
        // Try next connection
      }
    }

    log('warn', 'Could not resolve user context from any Meet connection');
    return null;
  } catch (error) {
    log('error', 'Error resolving user context', {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * Handle conference.ended event
 */
async function handleConferenceEnded(
  meetEvent: MeetWorkspaceEvent,
  pushMessage: PubSubPushMessage,
  rawBody: string,
  startTime: number
): Promise<NextResponse> {
  const conferenceRecord = meetEvent.conferenceRecord;
  const conferenceRecordName = conferenceRecord?.name || conferenceRecord?.conferenceRecordName;

  if (!conferenceRecordName) {
    log('error', '[MEET-2] Missing conference record name in event', {
      eventType: meetEvent.eventType,
    });

    return NextResponse.json(
      { received: true, error: 'Missing conference record' },
      { status: 200 }
    );
  }

  // Idempotency check - lock on conference record to prevent duplicate meetings
  // from both conference.ended and transcript.fileGenerated events
  const lockKey = `conference-${conferenceRecordName}`;
  const acquired = await acquireEventLock(lockKey, 'meet');
  if (!acquired) {
    log('info', '[MEET-2] Conference already being processed (duplicate event)', {
      conferenceRecordName,
      messageId: pushMessage.message.messageId,
    });
    return NextResponse.json({ received: true, duplicate: true }, { status: 200 });
  }

  // Generate unique event ID
  const eventId = `meet.conference.ended-${conferenceRecordName}-${pushMessage.message.messageId}`;

  log('info', '[MEET-3] Storing conference ended event', {
    eventId,
    conferenceRecordName,
    meetingCode: conferenceRecord?.space?.meetingCode,
  });

  // Store raw event in database
  const rawEvent = await storeRawEvent(
    'meet.conference.ended',
    eventId,
    rawBody,
    {
      conferenceRecordName,
      meetingCode: conferenceRecord?.space?.meetingCode,
      meetingUri: conferenceRecord?.space?.meetingUri,
      startTime: conferenceRecord?.startTime,
      endTime: conferenceRecord?.endTime,
    }
  );

  log('info', '[MEET-3] Raw event stored', {
    rawEventId: rawEvent.id,
    eventId,
    duration: Date.now() - startTime,
  });

  // Resolve user context for API calls and multi-tenant data isolation
  const userContext = await resolveUserContext();

  // Process event synchronously (fetch transcript, create meeting, generate draft)
  try {
    const result = await processMeetEvent(
      rawEvent,
      meetEvent,
      userContext?.accessToken,
      userContext?.userId,
      userContext?.hostEmail
    );

    log('info', '[MEET-10] Processing complete', {
      rawEventId: rawEvent.id,
      action: result.action,
      meetingId: result.meetingId,
      hasUserContext: !!userContext,
      duration: Date.now() - startTime,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log('error', '[MEET-10] Event processing failed', {
      tag: '[WEBHOOK-ERROR]',
      platform: 'google_meet',
      eventType: 'meet.conference.ended',
      rawEventId: rawEvent.id,
      conferenceRecordName,
      error: errorMessage,
      duration: Date.now() - startTime,
    });

    // Record failure for retry
    try {
      await recordWebhookFailure(
        'google_meet',
        'meet.conference.ended',
        rawEvent.payload,
        errorMessage
      );
    } catch (recordError) {
      log('error', 'Failed to record webhook failure for retry', {
        tag: '[WEBHOOK-ERROR]',
        error: recordError instanceof Error ? recordError.message : String(recordError),
      });
    }
    // Don't fail the webhook - event is stored for retry
  }

  return NextResponse.json(
    {
      received: true,
      eventId: rawEvent.id,
      conferenceRecordName,
    },
    { status: 200 }
  );
}

/**
 * Handle transcript.v2.fileGenerated event
 * Triggered when a Meet transcript file is ready in Google Docs
 */
async function handleTranscriptFileGenerated(
  transcriptEvent: TranscriptFileGeneratedEvent,
  pushMessage: PubSubPushMessage,
  rawBody: string,
  startTime: number
): Promise<NextResponse> {
  const transcriptName = transcriptEvent.transcript?.name;

  if (!transcriptName) {
    log('error', '[MEET-2] Missing transcript name in fileGenerated event', {
      eventType: transcriptEvent.eventType,
    });

    return NextResponse.json(
      { received: true, error: 'Missing transcript name' },
      { status: 200 }
    );
  }

  // Extract conference record name from transcript name
  // Format: conferenceRecords/{record}/transcripts/{transcript}
  const conferenceRecordMatch = transcriptName.match(/^(conferenceRecords\/[^/]+)/);
  const conferenceRecordName = conferenceRecordMatch?.[1] || transcriptName;

  // Idempotency check - lock on conference record to prevent duplicate meetings
  // from both conference.ended and transcript.fileGenerated events
  const lockKey = `conference-${conferenceRecordName}`;
  const acquired = await acquireEventLock(lockKey, 'meet');
  if (!acquired) {
    log('info', '[MEET-2] Conference already being processed (duplicate event)', {
      conferenceRecordName,
      transcriptName,
      messageId: pushMessage.message.messageId,
    });
    return NextResponse.json({ received: true, duplicate: true }, { status: 200 });
  }

  // Generate unique event ID
  const eventId = `meet.transcript.fileGenerated-${transcriptName}-${pushMessage.message.messageId}`;

  log('info', '[MEET-3] Storing transcript fileGenerated event', {
    eventId,
    transcriptName,
    conferenceRecordName,
    docsDestination: transcriptEvent.transcript?.docsDestination?.document,
  });

  // Store raw event in database
  const rawEvent = await storeRawEvent(
    'meet.transcript.fileGenerated',
    eventId,
    rawBody,
    {
      transcriptName,
      conferenceRecordName,
      docsDocument: transcriptEvent.transcript?.docsDestination?.document,
      exportUri: transcriptEvent.transcript?.docsDestination?.exportUri,
    }
  );

  log('info', '[MEET-3] Raw event stored', {
    rawEventId: rawEvent.id,
    eventId,
    duration: Date.now() - startTime,
  });

  // Resolve user context for API calls and multi-tenant data isolation
  const userContext = await resolveUserContext();

  // Process event - fetch transcript and generate draft
  try {
    // Create a MeetWorkspaceEvent-compatible object for the processor
    const meetEvent: MeetWorkspaceEvent = {
      eventType: transcriptEvent.eventType,
      eventTime: transcriptEvent.eventTime,
      conferenceRecord: {
        name: conferenceRecordName,
        conferenceRecordName,
      },
    };

    const result = await processMeetEvent(
      rawEvent,
      meetEvent,
      userContext?.accessToken,
      userContext?.userId,
      userContext?.hostEmail
    );

    log('info', '[MEET-10] Transcript processing complete', {
      rawEventId: rawEvent.id,
      action: result.action,
      meetingId: result.meetingId,
      hasUserContext: !!userContext,
      duration: Date.now() - startTime,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log('error', '[MEET-10] Transcript event processing failed', {
      tag: '[WEBHOOK-ERROR]',
      platform: 'google_meet',
      eventType: 'meet.transcript.fileGenerated',
      rawEventId: rawEvent.id,
      transcriptName,
      error: errorMessage,
      duration: Date.now() - startTime,
    });

    try {
      await recordWebhookFailure(
        'google_meet',
        'meet.transcript.fileGenerated',
        rawEvent.payload,
        errorMessage
      );
    } catch (recordError) {
      log('error', 'Failed to record webhook failure for retry', {
        tag: '[WEBHOOK-ERROR]',
        error: recordError instanceof Error ? recordError.message : String(recordError),
      });
    }
  }

  return NextResponse.json(
    {
      received: true,
      eventId: rawEvent.id,
      transcriptName,
    },
    { status: 200 }
  );
}

/**
 * Handle recording.v2.fileGenerated event
 * Triggered when a Meet recording file is ready in Google Drive
 */
async function handleRecordingFileGenerated(
  recordingEvent: RecordingFileGeneratedEvent,
  pushMessage: PubSubPushMessage,
  rawBody: string,
  startTime: number
): Promise<NextResponse> {
  const recordingName = recordingEvent.recording?.name;

  if (!recordingName) {
    log('error', '[MEET-2] Missing recording name in fileGenerated event', {
      eventType: recordingEvent.eventType,
    });

    return NextResponse.json(
      { received: true, error: 'Missing recording name' },
      { status: 200 }
    );
  }

  // Extract conference record name from recording name
  // Format: conferenceRecords/{record}/recordings/{recording}
  const conferenceRecordMatch = recordingName.match(/^(conferenceRecords\/[^/]+)/);
  const conferenceRecordName = conferenceRecordMatch?.[1] || recordingName;

  // Generate unique event ID
  const eventId = `meet.recording.fileGenerated-${recordingName}-${pushMessage.message.messageId}`;

  log('info', '[MEET-3] Storing recording fileGenerated event', {
    eventId,
    recordingName,
    conferenceRecordName,
    driveFile: recordingEvent.recording?.driveDestination?.file,
  });

  // Store raw event in database
  const rawEvent = await storeRawEvent(
    'meet.recording.fileGenerated',
    eventId,
    rawBody,
    {
      recordingName,
      conferenceRecordName,
      driveFile: recordingEvent.recording?.driveDestination?.file,
      exportUri: recordingEvent.recording?.driveDestination?.exportUri,
    }
  );

  log('info', '[MEET-3] Recording event stored (no processing - transcript-based flow)', {
    rawEventId: rawEvent.id,
    eventId,
    duration: Date.now() - startTime,
  });

  // Note: We primarily process transcripts, not recordings
  // The recording event is stored for reference but doesn't trigger draft generation
  // If needed in the future, we could extract audio and use speech-to-text

  return NextResponse.json(
    {
      received: true,
      eventId: rawEvent.id,
      recordingName,
    },
    { status: 200 }
  );
}

/**
 * Store raw event in database for audit trail and reprocessing
 */
async function storeRawEvent(
  eventType: string,
  eventId: string,
  rawBody: string,
  metadata?: Record<string, unknown>
): Promise<RawEvent> {
  const parsedPayload = JSON.parse(rawBody);

  const [rawEvent] = await db
    .insert(rawEvents)
    .values({
      eventType,
      zoomEventId: eventId, // Reusing field for Meet events
      payload: parsedPayload,
      status: 'pending',
      meetingId: metadata?.conferenceRecordName as string | undefined,
    })
    .returning();

  log('info', '[MEET-3] Raw event stored', {
    rawEventId: rawEvent.id,
    eventType,
    eventId,
  });

  return rawEvent;
}
