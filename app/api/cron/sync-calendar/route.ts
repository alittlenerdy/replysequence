/**
 * Calendar Sync Cron Job
 * Periodically syncs calendar events for all connected users
 * Run every 15 minutes via Vercel Cron
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, calendarConnections, outlookCalendarConnections, users } from '@/lib/db';
import { eq, isNotNull } from 'drizzle-orm';
import {
  syncUserCalendarEvents,
  cleanupOldCalendarEvents,
} from '@/lib/calendar-sync';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Verify cron secret
const CRON_SECRET = process.env.CRON_SECRET;

/**
 * Logger helper
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
      service: 'sync-calendar-cron',
      ...data,
    })
  );
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  // Verify cron secret in production
  if (CRON_SECRET) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      log('warn', 'Unauthorized cron request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  log('info', 'Starting calendar sync cron job');

  try {
    // Get all users with Google Calendar connections
    const googleCalendarUsers = await db
      .select({ userId: calendarConnections.userId })
      .from(calendarConnections);

    // Get all users with Outlook Calendar connections
    const outlookCalendarUsers = await db
      .select({ userId: outlookCalendarConnections.userId })
      .from(outlookCalendarConnections);

    // Combine unique user IDs
    const allUserIds = new Set([
      ...googleCalendarUsers.map((u) => u.userId),
      ...outlookCalendarUsers.map((u) => u.userId),
    ]);

    log('info', 'Found users with calendar connections', {
      googleUsers: googleCalendarUsers.length,
      outlookUsers: outlookCalendarUsers.length,
      uniqueUsers: allUserIds.size,
    });

    // Sync calendar events for each user
    const results = {
      usersProcessed: 0,
      googleEvents: 0,
      outlookEvents: 0,
      errors: 0,
    };

    for (const userId of allUserIds) {
      try {
        const syncResult = await syncUserCalendarEvents(userId, 7);
        results.usersProcessed++;
        results.googleEvents += syncResult.google;
        results.outlookEvents += syncResult.outlook;
      } catch (error) {
        results.errors++;
        log('error', 'Error syncing calendar for user', {
          userId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    // Clean up old events
    await cleanupOldCalendarEvents();

    const duration = Date.now() - startTime;
    log('info', 'Calendar sync cron job completed', {
      ...results,
      durationMs: duration,
    });

    return NextResponse.json({
      success: true,
      ...results,
      durationMs: duration,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    log('error', 'Calendar sync cron job failed', {
      error: error instanceof Error ? error.message : String(error),
      durationMs: duration,
    });

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        durationMs: duration,
      },
      { status: 500 }
    );
  }
}
