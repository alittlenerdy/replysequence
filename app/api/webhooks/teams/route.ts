import { NextRequest, NextResponse } from 'next/server';
import { db, rawEvents } from '@/lib/db';
import { processTeamsEvent } from '@/lib/process-teams-event';
import { validateClientState, parseResourcePath } from '@/lib/teams-api';
import { recordWebhookFailure } from '@/lib/webhook-retry';
import type { GraphChangeNotification, ChangeNotificationItem } from '@/lib/teams/types';
import type { RawEvent } from '@/lib/db/schema';

// Disable body parsing to access raw body
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Expected client state for validation (set during subscription creation)
const EXPECTED_CLIENT_STATE = process.env.MICROSOFT_TEAMS_WEBHOOK_SECRET;

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
      service: 'teams-webhook',
      ...data,
    })
  );
}

/**
 * Handle GET request - Subscription validation
 * Microsoft sends a GET request with validationToken query param
 * We must return the token as plain text with 200 status
 */
export async function GET(request: NextRequest) {
  const validationToken = request.nextUrl.searchParams.get('validationToken');

  if (validationToken) {
    log('info', 'Teams subscription validation request received', {
      hasToken: true,
    });

    // Return the validation token as plain text
    return new NextResponse(validationToken, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  }

  log('warn', 'GET request without validationToken');
  return NextResponse.json({ error: 'Missing validationToken' }, { status: 400 });
}

/**
 * Handle POST request - Change notifications
 * Microsoft sends POST with notification payload when transcripts/recordings are created
 * Also handles validation requests which may come as POST with validationToken query param
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Check for validation token in query (Microsoft sends this during subscription creation)
    const validationToken = request.nextUrl.searchParams.get('validationToken');
    if (validationToken) {
      log('info', 'Teams subscription validation via POST query param', {
        tokenLength: validationToken.length,
      });
      return new NextResponse(validationToken, {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    const rawBody = await request.text();

    // Check if body contains validationToken (alternative validation format)
    if (rawBody.includes('validationToken')) {
      try {
        const bodyJson = JSON.parse(rawBody);
        if (bodyJson.validationToken) {
          log('info', 'Teams subscription validation via POST body', {
            tokenLength: bodyJson.validationToken.length,
          });
          return new NextResponse(bodyJson.validationToken, {
            status: 200,
            headers: { 'Content-Type': 'text/plain' },
          });
        }
      } catch {
        // Not valid JSON with validationToken, continue normal processing
      }
    }
    const payload: GraphChangeNotification = JSON.parse(rawBody);

    log('info', '[TEAMS-1] Webhook received', {
      notificationCount: payload.value?.length || 0,
      hasValidationTokens: !!payload.validationTokens?.length,
    });

    // Process each notification
    const results: { eventId?: string; error?: string }[] = [];

    for (const notification of payload.value || []) {
      try {
        const result = await processNotification(notification, rawBody, startTime);
        results.push(result);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        log('error', 'Failed to process notification', {
          subscriptionId: notification.subscriptionId,
          resource: notification.resource,
          error: errorMessage,
        });
        results.push({ error: errorMessage });
      }
    }

    log('info', 'Teams webhook processing complete', {
      duration: Date.now() - startTime,
      processedCount: results.length,
      successCount: results.filter(r => r.eventId).length,
    });

    // Always return 202 Accepted to acknowledge receipt
    // Microsoft expects quick acknowledgment
    return NextResponse.json(
      { received: true, results },
      { status: 202 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    log('error', 'Teams webhook processing error', {
      tag: '[WEBHOOK-ERROR]',
      platform: 'microsoft_teams',
      error: errorMessage,
      duration: Date.now() - startTime,
    });

    // Record failure for retry
    try {
      await recordWebhookFailure(
        'microsoft_teams',
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

    // Return 202 to prevent retries - we log errors for investigation
    return NextResponse.json(
      { received: true, error: 'Internal processing error' },
      { status: 202 }
    );
  }
}

/**
 * Process a single notification item
 */
async function processNotification(
  notification: ChangeNotificationItem,
  rawBody: string,
  startTime: number
): Promise<{ eventId?: string; error?: string }> {
  const { subscriptionId, changeType, resource, resourceData, clientState, tenantId } = notification;

  log('info', 'Processing notification', {
    subscriptionId,
    changeType,
    resource,
    resourceType: resourceData?.['@odata.type'],
    tenantId,
  });

  // Validate client state if configured
  if (!validateClientState(clientState, EXPECTED_CLIENT_STATE)) {
    log('warn', 'Invalid client state in notification', {
      subscriptionId,
      received: clientState?.substring(0, 10),
    });
    return { error: 'Invalid client state' };
  }

  // Determine event type from resource data
  const odataType = resourceData?.['@odata.type'] || '';
  let eventType: string;

  if (odataType.includes('callTranscript')) {
    eventType = 'teams.transcript.created';
  } else if (odataType.includes('callRecording')) {
    eventType = 'teams.recording.created';
  } else {
    eventType = `teams.${changeType}`;
  }

  // Parse resource path to extract IDs
  const parsedResource = parseResourcePath(resource);

  // Generate unique event ID
  const eventId = `${eventType}-${subscriptionId}-${resourceData?.id || Date.now()}`;

  log('info', 'Storing Teams event', {
    eventType,
    eventId,
    parsedResource,
  });

  // Store raw event in database
  const rawEvent = await storeRawEvent(eventType, eventId, rawBody, {
    subscriptionId,
    tenantId,
    resource,
    resourceId: resourceData?.id,
    ...parsedResource,
  });

  // Process event synchronously (fetch transcript, create meeting, generate draft)
  try {
    const result = await processTeamsEvent(rawEvent, notification);

    log('info', 'Teams event processing completed', {
      rawEventId: rawEvent.id,
      action: result.action,
      meetingId: result.meetingId,
      duration: Date.now() - startTime,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log('error', 'Teams event processing failed', {
      tag: '[WEBHOOK-ERROR]',
      platform: 'microsoft_teams',
      eventType,
      rawEventId: rawEvent.id,
      error: errorMessage,
    });

    // Record failure for retry
    try {
      await recordWebhookFailure(
        'microsoft_teams',
        eventType,
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

  return { eventId: rawEvent.id };
}

/**
 * Store raw event in database for audit trail and reprocessing
 */
async function storeRawEvent(
  eventType: string,
  eventId: string,
  rawBody: string,
  metadata: Record<string, unknown>
): Promise<RawEvent> {
  const parsedPayload = JSON.parse(rawBody);

  const [rawEvent] = await db
    .insert(rawEvents)
    .values({
      eventType,
      zoomEventId: eventId, // Reusing field for Teams events
      payload: parsedPayload,
      status: 'pending',
      meetingId: metadata.meetingId as string | undefined,
    })
    .returning();

  log('info', 'Raw event stored', {
    rawEventId: rawEvent.id,
    eventType,
    eventId,
  });

  return rawEvent;
}
