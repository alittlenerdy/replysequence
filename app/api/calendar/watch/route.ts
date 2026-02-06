import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db, users, meetConnections, calendarWatchChannels } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { getValidMeetToken } from '@/lib/meet-token';
import { randomUUID } from 'crypto';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// Google Calendar API endpoint
const CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3';

// Webhook URL for receiving notifications
const WEBHOOK_URL = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') + '/api/webhooks/calendar';

// Default TTL: 7 days in seconds
const DEFAULT_TTL_SECONDS = 604800;

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
      service: 'calendar-watch',
      ...data,
    })
  );
}

interface WatchResponse {
  kind: string;
  id: string;
  resourceId: string;
  resourceUri: string;
  token?: string;
  expiration: string;
}

/**
 * POST /api/calendar/watch
 * Creates a Google Calendar push notification channel for the authenticated user
 */
export async function POST() {
  const startTime = Date.now();

  try {
    // Step 1: Authenticate user
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      log('warn', '[CALENDAR-WATCH-1] No authenticated user');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    log('info', '[CALENDAR-WATCH-1] Starting watch subscription', { clerkId });

    // Get user from database
    const [user] = await db
      .select({ id: users.id, meetConnected: users.meetConnected })
      .from(users)
      .where(eq(users.clerkId, clerkId))
      .limit(1);

    if (!user || !user.meetConnected) {
      log('warn', '[CALENDAR-WATCH-1] No Meet connection for user', { clerkId });
      return NextResponse.json(
        { error: 'Google Meet not connected. Please connect Google Meet first.' },
        { status: 400 }
      );
    }

    // Check for existing watch channel
    const [existingChannel] = await db
      .select()
      .from(calendarWatchChannels)
      .where(eq(calendarWatchChannels.userId, user.id))
      .limit(1);

    if (existingChannel && existingChannel.expiration > new Date()) {
      log('info', '[CALENDAR-WATCH-1] Active watch channel already exists', {
        channelId: existingChannel.channelId,
        expiration: existingChannel.expiration,
      });

      return NextResponse.json({
        success: true,
        existing: true,
        channel: {
          channelId: existingChannel.channelId,
          expiration: existingChannel.expiration,
        },
      });
    }

    // Step 2: Get valid OAuth token
    const accessToken = await getValidMeetToken(user.id);

    if (!accessToken) {
      log('error', '[CALENDAR-WATCH-2] Failed to get valid access token', { userId: user.id });
      return NextResponse.json(
        { error: 'Failed to get valid access token. Please reconnect Google Meet.' },
        { status: 401 }
      );
    }

    log('info', '[CALENDAR-WATCH-2] OAuth token obtained');

    // Step 3: Create watch channel
    const channelId = randomUUID();
    const expiration = Date.now() + DEFAULT_TTL_SECONDS * 1000;

    log('info', '[CALENDAR-WATCH-3] Calling Calendar API', {
      channelId,
      webhookUrl: WEBHOOK_URL,
      expiration: new Date(expiration).toISOString(),
    });

    const watchRequest = {
      id: channelId,
      type: 'web_hook',
      address: WEBHOOK_URL,
      expiration: expiration.toString(),
    };

    const response = await fetch(
      `${CALENDAR_API_BASE}/calendars/primary/events/watch`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(watchRequest),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      log('error', '[CALENDAR-WATCH-3] Calendar API error', {
        status: response.status,
        error: errorText,
      });

      return NextResponse.json(
        { error: `Failed to create watch channel: ${response.status}` },
        { status: response.status }
      );
    }

    const watchData: WatchResponse = await response.json();

    log('info', '[CALENDAR-WATCH-4] Watch channel created', {
      channelId: watchData.id,
      resourceId: watchData.resourceId,
      expiration: watchData.expiration,
    });

    // Step 4: Store in database
    const expirationDate = new Date(parseInt(watchData.expiration));

    if (existingChannel) {
      // Update existing record
      await db
        .update(calendarWatchChannels)
        .set({
          channelId: watchData.id,
          resourceId: watchData.resourceId,
          expiration: expirationDate,
          updatedAt: new Date(),
        })
        .where(eq(calendarWatchChannels.userId, user.id));
    } else {
      // Insert new record
      await db.insert(calendarWatchChannels).values({
        userId: user.id,
        channelId: watchData.id,
        resourceId: watchData.resourceId,
        calendarId: 'primary',
        expiration: expirationDate,
      });
    }

    log('info', '[CALENDAR-WATCH-5] Stored in database', {
      channelId: watchData.id,
      expiration: expirationDate.toISOString(),
    });

    log('info', '[CALENDAR-WATCH-6] Watch subscription complete', {
      channelId: watchData.id,
      duration: Date.now() - startTime,
    });

    return NextResponse.json({
      success: true,
      channel: {
        channelId: watchData.id,
        resourceId: watchData.resourceId,
        expiration: expirationDate.toISOString(),
      },
    });
  } catch (error) {
    log('error', '[CALENDAR-WATCH-ERROR] Unexpected error', {
      error: error instanceof Error ? error.message : String(error),
      duration: Date.now() - startTime,
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/calendar/watch
 * Returns current watch channel status
 */
export async function GET() {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.clerkId, clerkId))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const [channel] = await db
      .select()
      .from(calendarWatchChannels)
      .where(eq(calendarWatchChannels.userId, user.id))
      .limit(1);

    if (!channel) {
      return NextResponse.json({ hasChannel: false });
    }

    const now = new Date();
    const isExpired = channel.expiration < now;
    const isExpiringSoon = !isExpired && channel.expiration < new Date(now.getTime() + 24 * 60 * 60 * 1000);

    return NextResponse.json({
      hasChannel: true,
      channel: {
        channelId: channel.channelId,
        calendarId: channel.calendarId,
        expiration: channel.expiration,
        isExpired,
        isExpiringSoon,
        lastNotificationAt: channel.lastNotificationAt,
      },
    });
  } catch (error) {
    log('error', '[CALENDAR-WATCH-GET] Error', {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
