import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db, users, calendarWatchChannels } from '@/lib/db';
import { eq, lt, and } from 'drizzle-orm';
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
      service: 'calendar-renew',
      ...data,
    })
  );
}

interface WatchResponse {
  kind: string;
  id: string;
  resourceId: string;
  resourceUri: string;
  expiration: string;
}

/**
 * POST /api/calendar/renew-watch
 * Renews the user's calendar watch channel
 */
export async function POST() {
  const startTime = Date.now();

  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    log('info', '[CALENDAR-RENEW-1] Starting watch renewal', { clerkId });

    // Get user
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

    // Get existing channel
    const [channel] = await db
      .select()
      .from(calendarWatchChannels)
      .where(eq(calendarWatchChannels.userId, user.id))
      .limit(1);

    if (!channel) {
      log('warn', '[CALENDAR-RENEW-1] No watch channel found', { userId: user.id });
      return NextResponse.json(
        { error: 'No watch channel found. Create one first.' },
        { status: 404 }
      );
    }

    log('info', '[CALENDAR-RENEW-2] Found existing channel', {
      channelId: channel.channelId,
      currentExpiration: channel.expiration,
    });

    // Get valid OAuth token
    const accessToken = await getValidMeetToken(user.id);

    if (!accessToken) {
      log('error', '[CALENDAR-RENEW-2] Failed to get access token', { userId: user.id });
      return NextResponse.json(
        { error: 'Failed to get valid access token' },
        { status: 401 }
      );
    }

    // Step 3: Stop old watch channel
    log('info', '[CALENDAR-RENEW-3] Stopping old channel');

    const stopResponse = await fetch(`${CALENDAR_API_BASE}/channels/stop`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: channel.channelId,
        resourceId: channel.resourceId,
      }),
    });

    if (!stopResponse.ok && stopResponse.status !== 404) {
      // 404 is OK - channel may have already expired
      const errorText = await stopResponse.text();
      log('warn', '[CALENDAR-RENEW-3] Failed to stop old channel', {
        status: stopResponse.status,
        error: errorText,
      });
    }

    // Step 4: Create new watch channel
    const newChannelId = randomUUID();
    const expiration = Date.now() + DEFAULT_TTL_SECONDS * 1000;

    log('info', '[CALENDAR-RENEW-4] Creating new channel', {
      channelId: newChannelId,
      expiration: new Date(expiration).toISOString(),
    });

    const watchRequest = {
      id: newChannelId,
      type: 'web_hook',
      address: WEBHOOK_URL,
      expiration: expiration.toString(),
    };

    const watchResponse = await fetch(
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

    if (!watchResponse.ok) {
      const errorText = await watchResponse.text();
      log('error', '[CALENDAR-RENEW-4] Failed to create new channel', {
        status: watchResponse.status,
        error: errorText,
      });

      return NextResponse.json(
        { error: 'Failed to create new watch channel' },
        { status: watchResponse.status }
      );
    }

    const watchData: WatchResponse = await watchResponse.json();
    const expirationDate = new Date(parseInt(watchData.expiration));

    // Step 5: Update database
    await db
      .update(calendarWatchChannels)
      .set({
        channelId: watchData.id,
        resourceId: watchData.resourceId,
        expiration: expirationDate,
        updatedAt: new Date(),
      })
      .where(eq(calendarWatchChannels.id, channel.id));

    log('info', '[CALENDAR-RENEW-5] Channel renewed successfully', {
      oldChannelId: channel.channelId,
      newChannelId: watchData.id,
      newExpiration: expirationDate.toISOString(),
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
    log('error', '[CALENDAR-RENEW-ERROR] Unexpected error', {
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
 * Batch renewal function for cron job use
 * Renews all channels expiring within the next 24 hours
 */
export async function renewExpiringChannels(): Promise<{
  renewed: number;
  failed: number;
  errors: string[];
}> {
  const results = {
    renewed: 0,
    failed: 0,
    errors: [] as string[],
  };

  try {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Find expiring channels
    const expiringChannels = await db
      .select()
      .from(calendarWatchChannels)
      .where(lt(calendarWatchChannels.expiration, tomorrow));

    log('info', '[CALENDAR-RENEW-BATCH] Found expiring channels', {
      count: expiringChannels.length,
    });

    for (const channel of expiringChannels) {
      try {
        const accessToken = await getValidMeetToken(channel.userId);
        if (!accessToken) {
          results.failed++;
          results.errors.push(`No token for user ${channel.userId}`);
          continue;
        }

        // Stop old channel
        await fetch(`${CALENDAR_API_BASE}/channels/stop`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: channel.channelId,
            resourceId: channel.resourceId,
          }),
        });

        // Create new channel
        const newChannelId = randomUUID();
        const expiration = Date.now() + DEFAULT_TTL_SECONDS * 1000;

        const watchResponse = await fetch(
          `${CALENDAR_API_BASE}/calendars/primary/events/watch`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              id: newChannelId,
              type: 'web_hook',
              address: WEBHOOK_URL,
              expiration: expiration.toString(),
            }),
          }
        );

        if (!watchResponse.ok) {
          results.failed++;
          results.errors.push(`API error for channel ${channel.channelId}`);
          continue;
        }

        const watchData: WatchResponse = await watchResponse.json();

        await db
          .update(calendarWatchChannels)
          .set({
            channelId: watchData.id,
            resourceId: watchData.resourceId,
            expiration: new Date(parseInt(watchData.expiration)),
            updatedAt: new Date(),
          })
          .where(eq(calendarWatchChannels.id, channel.id));

        results.renewed++;
      } catch (error) {
        results.failed++;
        results.errors.push(
          `Error renewing ${channel.channelId}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  } catch (error) {
    log('error', '[CALENDAR-RENEW-BATCH] Batch renewal failed', {
      error: error instanceof Error ? error.message : String(error),
    });
  }

  return results;
}
