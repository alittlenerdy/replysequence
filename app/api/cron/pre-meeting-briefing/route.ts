/**
 * Pre-Meeting Briefing Cron Job
 *
 * Runs every 15 minutes. Finds calendar events starting in 15–60 minutes
 * that don't already have a briefing, then generates one.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, calendarEvents, preMeetingBriefings, calendarConnections, outlookCalendarConnections } from '@/lib/db';
import { eq, and, gte, lte, notInArray, sql } from 'drizzle-orm';
import { generateBriefing } from '@/lib/pre-meeting-briefing';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const CRON_SECRET = process.env.CRON_SECRET;

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
      service: 'pre-meeting-briefing-cron',
      ...data,
    })
  );
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  // Verify cron secret
  if (CRON_SECRET) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  log('info', 'Starting pre-meeting briefing cron');

  try {
    const now = new Date();
    // Look for meetings starting 15–60 minutes from now
    const windowStart = new Date(now.getTime() + 15 * 60 * 1000);
    const windowEnd = new Date(now.getTime() + 60 * 60 * 1000);

    // Find calendar events in the window that have attendees and a meeting URL
    const upcomingEvents = await db
      .select({
        id: calendarEvents.id,
        userId: calendarEvents.userId,
        title: calendarEvents.title,
        startTime: calendarEvents.startTime,
      })
      .from(calendarEvents)
      .where(
        and(
          gte(calendarEvents.startTime, windowStart),
          lte(calendarEvents.startTime, windowEnd)
        )
      );

    if (upcomingEvents.length === 0) {
      log('info', 'No upcoming events in briefing window', {
        windowStart: windowStart.toISOString(),
        windowEnd: windowEnd.toISOString(),
      });
      return NextResponse.json({
        success: true,
        eventsFound: 0,
        briefingsGenerated: 0,
        durationMs: Date.now() - startTime,
      });
    }

    // Find which events already have briefings
    const eventIds = upcomingEvents.map(e => e.id);
    const existingBriefings = await db
      .select({ calendarEventId: preMeetingBriefings.calendarEventId })
      .from(preMeetingBriefings)
      .where(
        sql`${preMeetingBriefings.calendarEventId} IN (${sql.join(
          eventIds.map(id => sql`${id}`),
          sql`, `
        )})`
      );

    const existingEventIds = new Set(existingBriefings.map(b => b.calendarEventId));
    const eventsNeedingBriefings = upcomingEvents.filter(e => !existingEventIds.has(e.id));

    log('info', 'Events needing briefings', {
      total: upcomingEvents.length,
      alreadyBriefed: existingBriefings.length,
      needBriefing: eventsNeedingBriefings.length,
    });

    // Generate briefings (limit to 5 per cron run to stay within timeout)
    const results = {
      generated: 0,
      failed: 0,
      skipped: 0,
    };

    for (const event of eventsNeedingBriefings.slice(0, 5)) {
      try {
        const result = await generateBriefing(event.userId, event.id);
        if (result.success) {
          results.generated++;
        } else {
          results.failed++;
          log('warn', 'Briefing generation failed', {
            eventId: event.id,
            error: result.error,
          });
        }
      } catch (error) {
        results.failed++;
        log('error', 'Briefing generation error', {
          eventId: event.id,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    if (eventsNeedingBriefings.length > 5) {
      results.skipped = eventsNeedingBriefings.length - 5;
    }

    const duration = Date.now() - startTime;
    log('info', 'Pre-meeting briefing cron completed', { ...results, durationMs: duration });

    return NextResponse.json({
      success: true,
      eventsFound: upcomingEvents.length,
      ...results,
      durationMs: duration,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    log('error', 'Pre-meeting briefing cron failed', {
      error: error instanceof Error ? error.message : String(error),
      durationMs: duration,
    });

    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
