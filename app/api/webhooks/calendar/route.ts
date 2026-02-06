import { NextRequest, NextResponse } from 'next/server';
import { db, calendarWatchChannels, users, meetConnections } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { getValidMeetToken } from '@/lib/meet-token';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Google Calendar API endpoint
const CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3';

/**
 * Structured logging helper
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
      service: 'calendar-webhook',
      ...data,
    })
  );
}

interface CalendarEvent {
  id: string;
  summary?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  conferenceData?: {
    conferenceId?: string;
    conferenceSolution?: {
      key?: { type?: string };
      name?: string;
    };
    entryPoints?: Array<{
      entryPointType?: string;
      uri?: string;
    }>;
  };
  status?: string;
}

/**
 * POST /api/webhooks/calendar
 * Receives Google Calendar push notifications
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Extract headers
    const channelId = request.headers.get('x-goog-channel-id');
    const resourceId = request.headers.get('x-goog-resource-id');
    const resourceState = request.headers.get('x-goog-resource-state');
    const messageNumber = request.headers.get('x-goog-message-number');

    log('info', '[CALENDAR-WEBHOOK-1] Notification received', {
      channelId,
      resourceId,
      resourceState,
      messageNumber,
    });

    // Validate required headers
    if (!channelId || !resourceState) {
      log('warn', '[CALENDAR-WEBHOOK-1] Missing required headers');
      return NextResponse.json({ error: 'Missing headers' }, { status: 400 });
    }

    // Handle sync message (initial notification after watch created)
    if (resourceState === 'sync') {
      log('info', '[CALENDAR-WEBHOOK-1] Sync message received, acknowledging');
      return NextResponse.json({ received: true, type: 'sync' });
    }

    // Step 2: Look up channel in database
    const [channel] = await db
      .select()
      .from(calendarWatchChannels)
      .where(eq(calendarWatchChannels.channelId, channelId))
      .limit(1);

    if (!channel) {
      log('warn', '[CALENDAR-WEBHOOK-2] Unknown channel ID', { channelId });
      // Return 200 to prevent Google from retrying
      return NextResponse.json({ received: true, error: 'Unknown channel' });
    }

    log('info', '[CALENDAR-WEBHOOK-2] Channel verified', {
      userId: channel.userId,
      calendarId: channel.calendarId,
    });

    // Update last notification time
    await db
      .update(calendarWatchChannels)
      .set({
        lastNotificationAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(calendarWatchChannels.id, channel.id));

    // Get user's OAuth token
    const accessToken = await getValidMeetToken(channel.userId);

    if (!accessToken) {
      log('error', '[CALENDAR-WEBHOOK-2] Could not get access token for user', {
        userId: channel.userId,
      });
      return NextResponse.json({ received: true, error: 'No valid token' });
    }

    // Step 3: Fetch changed events from Calendar API
    log('info', '[CALENDAR-WEBHOOK-3] Fetching events from Calendar');

    // Use sync token if available, otherwise get recent events
    let eventsUrl = `${CALENDAR_API_BASE}/calendars/${channel.calendarId}/events`;
    const params = new URLSearchParams({
      singleEvents: 'true',
      orderBy: 'startTime',
    });

    if (channel.syncToken) {
      params.set('syncToken', channel.syncToken);
    } else {
      // First sync - get events from last hour
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      params.set('timeMin', oneHourAgo.toISOString());
    }

    const eventsResponse = await fetch(`${eventsUrl}?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!eventsResponse.ok) {
      const errorText = await eventsResponse.text();
      log('error', '[CALENDAR-WEBHOOK-3] Failed to fetch events', {
        status: eventsResponse.status,
        error: errorText,
      });

      // If sync token is invalid, clear it
      if (eventsResponse.status === 410) {
        await db
          .update(calendarWatchChannels)
          .set({ syncToken: null, updatedAt: new Date() })
          .where(eq(calendarWatchChannels.id, channel.id));
      }

      return NextResponse.json({ received: true, error: 'Failed to fetch events' });
    }

    const eventsData = await eventsResponse.json();
    const events: CalendarEvent[] = eventsData.items || [];
    const nextSyncToken = eventsData.nextSyncToken;

    // Save new sync token
    if (nextSyncToken) {
      await db
        .update(calendarWatchChannels)
        .set({ syncToken: nextSyncToken, updatedAt: new Date() })
        .where(eq(calendarWatchChannels.id, channel.id));
    }

    log('info', '[CALENDAR-WEBHOOK-3] Events fetched', {
      eventCount: events.length,
      hasSyncToken: !!nextSyncToken,
    });

    // Step 4: Filter for Meet events
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    const meetEvents = events.filter((event) => {
      // Check if it's a Meet event
      const isMeet = event.conferenceData?.conferenceSolution?.key?.type === 'hangoutsMeet';
      if (!isMeet) return false;

      // Check if event just ended (within last 5 minutes)
      const endTimeStr = event.end?.dateTime || event.end?.date;
      if (!endTimeStr) return false;

      const endTime = new Date(endTimeStr);
      const justEnded = endTime < now && endTime > fiveMinutesAgo;

      return justEnded;
    });

    log('info', '[CALENDAR-WEBHOOK-4] Meet events filtered', {
      meetEventCount: meetEvents.length,
      events: meetEvents.map(e => ({
        id: e.id,
        summary: e.summary,
        conferenceId: e.conferenceData?.conferenceId,
      })),
    });

    // Step 5: Process ended Meet events
    for (const event of meetEvents) {
      const conferenceId = event.conferenceData?.conferenceId;
      if (!conferenceId) continue;

      log('info', '[CALENDAR-WEBHOOK-5] Processing ended Meet event', {
        eventId: event.id,
        summary: event.summary,
        conferenceId,
        endTime: event.end?.dateTime,
      });

      // TODO: Check for recordings via Meet API
      // For now, log that we detected an ended meeting
      // The Workspace Events API subscription will handle recording detection
      log('info', '[CALENDAR-WEBHOOK-6] Ended meeting detected, awaiting recording notification', {
        conferenceId,
        meetCode: conferenceId,
      });
    }

    log('info', '[CALENDAR-WEBHOOK-6] Notification processing complete', {
      duration: Date.now() - startTime,
      meetEventsProcessed: meetEvents.length,
    });

    return NextResponse.json({
      received: true,
      eventsProcessed: events.length,
      meetEventsDetected: meetEvents.length,
    });
  } catch (error) {
    log('error', '[CALENDAR-WEBHOOK-ERROR] Unexpected error', {
      error: error instanceof Error ? error.message : String(error),
      duration: Date.now() - startTime,
    });

    // Always return 200 to prevent retries
    return NextResponse.json({ received: true, error: 'Internal error' });
  }
}

/**
 * GET /api/webhooks/calendar
 * Health check for the webhook endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: 'calendar-webhook',
    timestamp: new Date().toISOString(),
  });
}
