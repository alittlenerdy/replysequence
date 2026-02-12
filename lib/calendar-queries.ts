/**
 * Calendar-related database queries
 * Used for fetching attendee information for draft recipient suggestions
 */

import { db, calendarEvents, recallBots, meetings } from './db';
import { eq, and } from 'drizzle-orm';
import type { CalendarEventAttendee } from './db/schema';

/**
 * Get calendar event attendees for a meeting
 * Links through recallBots table: meeting -> recallBot -> calendarEvent
 */
export async function getCalendarEventAttendees(
  meetingId: string
): Promise<CalendarEventAttendee[]> {
  try {
    // Find the recallBot record for this meeting to get the calendarEventId
    const [recallBot] = await db
      .select({
        calendarEventId: recallBots.calendarEventId,
        userId: recallBots.userId,
      })
      .from(recallBots)
      .where(eq(recallBots.meetingId, meetingId))
      .limit(1);

    if (!recallBot?.calendarEventId) {
      console.log('[CALENDAR-QUERIES] No calendar event linked to meeting:', meetingId);
      return [];
    }

    // Find the calendar event to get attendees
    const [calendarEvent] = await db
      .select({
        attendees: calendarEvents.attendees,
        organizerEmail: calendarEvents.organizerEmail,
      })
      .from(calendarEvents)
      .where(
        and(
          eq(calendarEvents.userId, recallBot.userId),
          eq(calendarEvents.externalEventId, recallBot.calendarEventId)
        )
      )
      .limit(1);

    if (!calendarEvent) {
      console.log('[CALENDAR-QUERIES] Calendar event not found:', recallBot.calendarEventId);
      return [];
    }

    const attendees = (calendarEvent.attendees as CalendarEventAttendee[]) || [];

    // Filter out the organizer from suggestions (they're usually the one sending)
    const filteredAttendees = attendees.filter(
      (a) => a.email !== calendarEvent.organizerEmail && !a.organizer
    );

    console.log('[CALENDAR-QUERIES] Found attendees for meeting:', {
      meetingId,
      totalAttendees: attendees.length,
      filteredAttendees: filteredAttendees.length,
    });

    return filteredAttendees;
  } catch (error) {
    console.error('[CALENDAR-QUERIES] Error fetching attendees:', error);
    return [];
  }
}

/**
 * Get suggested recipients for a draft
 * Returns attendees from the linked calendar event, excluding the organizer
 */
export async function getSuggestedRecipients(
  meetingId: string,
  excludeEmail?: string
): Promise<Array<{ email: string; name?: string }>> {
  const attendees = await getCalendarEventAttendees(meetingId);

  return attendees
    .filter((a) => a.email !== excludeEmail)
    .map((a) => ({
      email: a.email,
      name: a.name,
    }));
}
