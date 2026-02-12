/**
 * Calendar Events API
 * GET /api/calendar/events - Get upcoming calendar events for authenticated user
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db, calendarEvents, users, calendarConnections, outlookCalendarConnections } from '@/lib/db';
import { eq, and, gte, lte, or } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

/**
 * GET /api/calendar/events
 * Query params:
 *   - days: number of days ahead (default: 7, max: 30)
 */
export async function GET(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's internal ID
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.clerkId, clerkId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Parse query params
    const searchParams = request.nextUrl.searchParams;
    const daysParam = searchParams.get('days');
    const days = Math.min(Math.max(parseInt(daysParam || '7', 10) || 7, 1), 30);

    // Calculate date range
    const now = new Date();
    const endDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    // Check if any calendar is connected
    const [googleCalendar] = await db
      .select({ id: calendarConnections.id })
      .from(calendarConnections)
      .where(eq(calendarConnections.userId, user.id))
      .limit(1);

    const [outlookCalendar] = await db
      .select({ id: outlookCalendarConnections.id })
      .from(outlookCalendarConnections)
      .where(eq(outlookCalendarConnections.userId, user.id))
      .limit(1);

    const calendarConnected = !!(googleCalendar || outlookCalendar);

    // Fetch upcoming events
    const events = await db
      .select()
      .from(calendarEvents)
      .where(
        and(
          eq(calendarEvents.userId, user.id),
          gte(calendarEvents.startTime, now),
          lte(calendarEvents.startTime, endDate)
        )
      )
      .orderBy(calendarEvents.startTime);

    return NextResponse.json({
      events,
      calendarConnected,
      meta: {
        days,
        startDate: now.toISOString(),
        endDate: endDate.toISOString(),
        count: events.length,
      },
    });
  } catch (error) {
    console.error('[CALENDAR-EVENTS-API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
