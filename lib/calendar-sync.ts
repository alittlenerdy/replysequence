/**
 * Calendar Sync Infrastructure
 * Handles syncing calendar events from Google Calendar and Outlook
 * for the upcoming meetings widget and auto-process toggle feature
 */

import { eq, and, gte, lte, inArray } from 'drizzle-orm';
import {
  db,
  calendarConnections,
  outlookCalendarConnections,
  calendarEvents,
  users,
  type CalendarEventSource,
  type CalendarEventAttendee,
  type NewCalendarEvent,
  type MeetingPlatform,
} from '@/lib/db';
import { decrypt } from '@/lib/encryption';

// Configuration
const GOOGLE_CALENDAR_API = 'https://www.googleapis.com/calendar/v3';
const MICROSOFT_GRAPH_API = 'https://graph.microsoft.com/v1.0';
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID?.trim();
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET?.trim();

// Default sync window: 7 days ahead
const DEFAULT_DAYS_AHEAD = 7;

// Meeting URL patterns for different platforms
const MEETING_URL_PATTERNS: Record<string, RegExp> = {
  zoom: /https:\/\/[\w.-]*zoom\.us\/j\/\d+/i,
  google_meet: /https:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}/i,
  microsoft_teams: /https:\/\/teams\.microsoft\.com\/l\/meetup-join\//i,
};

interface GoogleCalendarEvent {
  id: string;
  summary?: string;
  description?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  hangoutLink?: string;
  conferenceData?: {
    conferenceId?: string;
    conferenceSolution?: { name?: string };
    entryPoints?: Array<{ uri?: string; entryPointType?: string }>;
  };
  location?: string;
  organizer?: { email?: string; displayName?: string; self?: boolean };
  attendees?: Array<{
    email?: string;
    displayName?: string;
    responseStatus?: string;
    organizer?: boolean;
  }>;
}

interface OutlookCalendarEvent {
  id: string;
  subject?: string;
  bodyPreview?: string;
  start?: { dateTime?: string; timeZone?: string };
  end?: { dateTime?: string; timeZone?: string };
  onlineMeetingUrl?: string;
  onlineMeeting?: {
    joinUrl?: string;
  };
  location?: { displayName?: string };
  organizer?: { emailAddress?: { address?: string; name?: string } };
  attendees?: Array<{
    emailAddress?: { address?: string; name?: string };
    status?: { response?: string };
    type?: string;
  }>;
}

/**
 * Logger helper
 */
function log(
  level: 'info' | 'warn' | 'error' | 'debug',
  message: string,
  data: Record<string, unknown> = {}
): void {
  console.log(
    JSON.stringify({
      level,
      message,
      timestamp: new Date().toISOString(),
      service: 'calendar-sync',
      ...data,
    })
  );
}

/**
 * Refresh Google access token
 */
async function refreshGoogleToken(refreshToken: string): Promise<string> {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error('Google credentials not configured');
  }

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Google token refresh failed: ${error}`);
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * Extract meeting URL and platform from text
 */
export function extractMeetingUrl(text: string): { url: string; platform: MeetingPlatform } | null {
  if (!text) return null;

  for (const [platform, pattern] of Object.entries(MEETING_URL_PATTERNS)) {
    const match = text.match(pattern);
    if (match) {
      return {
        url: match[0],
        platform: platform === 'zoom' ? 'zoom' : platform === 'google_meet' ? 'google_meet' : 'microsoft_teams',
      };
    }
  }

  return null;
}

/**
 * Extract meeting info from Google Calendar event
 */
function extractGoogleMeetingInfo(event: GoogleCalendarEvent): { url: string; platform: MeetingPlatform } | null {
  // Check hangoutLink first (direct Google Meet link)
  if (event.hangoutLink) {
    return { url: event.hangoutLink, platform: 'google_meet' };
  }

  // Check conferenceData entry points
  if (event.conferenceData?.entryPoints) {
    for (const entry of event.conferenceData.entryPoints) {
      if (entry.uri && entry.entryPointType === 'video') {
        const extracted = extractMeetingUrl(entry.uri);
        if (extracted) return extracted;
      }
    }
  }

  // Check location and description for meeting URLs
  const textToSearch = [event.location, event.description].filter(Boolean).join(' ');
  return extractMeetingUrl(textToSearch);
}

/**
 * Convert Google attendee to our format
 */
function convertGoogleAttendees(
  attendees: GoogleCalendarEvent['attendees']
): CalendarEventAttendee[] {
  if (!attendees) return [];

  return attendees
    .filter((a) => a.email)
    .map((a) => ({
      email: a.email!,
      name: a.displayName,
      responseStatus: a.responseStatus as CalendarEventAttendee['responseStatus'],
      organizer: a.organizer,
    }));
}

/**
 * Fetch Google Calendar events for a user
 */
export async function fetchGoogleCalendarEvents(
  userId: string,
  daysAhead: number = DEFAULT_DAYS_AHEAD
): Promise<NewCalendarEvent[]> {
  try {
    // Get user's calendar connection
    const [connection] = await db
      .select()
      .from(calendarConnections)
      .where(eq(calendarConnections.userId, userId))
      .limit(1);

    if (!connection) {
      log('debug', 'No Google Calendar connection for user', { userId });
      return [];
    }

    // Refresh token if needed
    const refreshToken = decrypt(connection.refreshTokenEncrypted);
    const accessToken = await refreshGoogleToken(refreshToken);

    const now = new Date();
    const endDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

    const params = new URLSearchParams({
      timeMin: now.toISOString(),
      timeMax: endDate.toISOString(),
      singleEvents: 'true',
      orderBy: 'startTime',
      maxResults: '100',
    });

    const response = await fetch(
      `${GOOGLE_CALENDAR_API}/calendars/primary/events?${params}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      log('error', 'Failed to fetch Google Calendar events', { userId, error });
      return [];
    }

    const data = await response.json();
    const events: GoogleCalendarEvent[] = data.items || [];

    log('info', 'Fetched Google Calendar events', { userId, count: events.length });

    return events.map((event) => {
      const meetingInfo = extractGoogleMeetingInfo(event);
      const startTime = event.start?.dateTime || event.start?.date;
      const endTime = event.end?.dateTime || event.end?.date;

      return {
        userId,
        externalEventId: event.id,
        calendarId: 'primary',
        source: 'google_calendar' as CalendarEventSource,
        title: event.summary || 'Untitled Event',
        description: event.description || null,
        startTime: startTime ? new Date(startTime) : new Date(),
        endTime: endTime ? new Date(endTime) : new Date(),
        meetingUrl: meetingInfo?.url || null,
        meetingPlatform: meetingInfo?.platform || null,
        attendees: convertGoogleAttendees(event.attendees),
        organizerEmail: event.organizer?.email || null,
        syncedAt: new Date(),
      };
    });
  } catch (error) {
    log('error', 'Error fetching Google Calendar events', {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}

/**
 * Convert Outlook attendee response status
 */
function convertOutlookResponseStatus(
  response?: string
): CalendarEventAttendee['responseStatus'] {
  switch (response) {
    case 'accepted':
      return 'accepted';
    case 'declined':
      return 'declined';
    case 'tentativelyAccepted':
      return 'tentative';
    default:
      return 'needsAction';
  }
}

/**
 * Fetch Outlook Calendar events for a user
 */
export async function fetchOutlookCalendarEvents(
  userId: string,
  daysAhead: number = DEFAULT_DAYS_AHEAD
): Promise<NewCalendarEvent[]> {
  try {
    // Get user's Outlook connection
    const [connection] = await db
      .select()
      .from(outlookCalendarConnections)
      .where(eq(outlookCalendarConnections.userId, userId))
      .limit(1);

    if (!connection) {
      log('debug', 'No Outlook Calendar connection for user', { userId });
      return [];
    }

    // Decrypt access token (assume it's still valid or handle refresh elsewhere)
    const accessToken = decrypt(connection.accessTokenEncrypted);

    const now = new Date();
    const endDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

    const params = new URLSearchParams({
      startDateTime: now.toISOString(),
      endDateTime: endDate.toISOString(),
      $select: 'id,subject,bodyPreview,start,end,onlineMeetingUrl,onlineMeeting,location,organizer,attendees',
      $orderby: 'start/dateTime',
      $top: '100',
    });

    const response = await fetch(
      `${MICROSOFT_GRAPH_API}/me/calendarView?${params}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      log('error', 'Failed to fetch Outlook Calendar events', { userId, error });
      return [];
    }

    const data = await response.json();
    const events: OutlookCalendarEvent[] = data.value || [];

    log('info', 'Fetched Outlook Calendar events', { userId, count: events.length });

    return events.map((event) => {
      // Extract meeting URL
      let meetingUrl = event.onlineMeetingUrl || event.onlineMeeting?.joinUrl;
      let meetingPlatform: MeetingPlatform | null = null;

      if (meetingUrl) {
        const extracted = extractMeetingUrl(meetingUrl);
        if (extracted) {
          meetingUrl = extracted.url;
          meetingPlatform = extracted.platform;
        } else if (meetingUrl.includes('teams.microsoft.com')) {
          meetingPlatform = 'microsoft_teams';
        }
      } else {
        // Check location and body for meeting URLs
        const textToSearch = [event.location?.displayName, event.bodyPreview].filter(Boolean).join(' ');
        const extracted = extractMeetingUrl(textToSearch);
        if (extracted) {
          meetingUrl = extracted.url;
          meetingPlatform = extracted.platform;
        }
      }

      const startTime = event.start?.dateTime;
      const endTime = event.end?.dateTime;

      return {
        userId,
        externalEventId: event.id,
        calendarId: 'primary',
        source: 'outlook_calendar' as CalendarEventSource,
        title: event.subject || 'Untitled Event',
        description: event.bodyPreview || null,
        startTime: startTime ? new Date(startTime + 'Z') : new Date(),
        endTime: endTime ? new Date(endTime + 'Z') : new Date(),
        meetingUrl: meetingUrl || null,
        meetingPlatform,
        attendees: (event.attendees || [])
          .filter((a) => a.emailAddress?.address)
          .map((a) => ({
            email: a.emailAddress!.address!,
            name: a.emailAddress?.name,
            responseStatus: convertOutlookResponseStatus(a.status?.response),
            organizer: a.type === 'required' && a.emailAddress?.address === event.organizer?.emailAddress?.address,
          })),
        organizerEmail: event.organizer?.emailAddress?.address || null,
        syncedAt: new Date(),
      };
    });
  } catch (error) {
    log('error', 'Error fetching Outlook Calendar events', {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}

/**
 * Upsert calendar events to database
 */
export async function upsertCalendarEvents(
  userId: string,
  events: NewCalendarEvent[]
): Promise<{ inserted: number; updated: number }> {
  if (events.length === 0) {
    return { inserted: 0, updated: 0 };
  }

  let inserted = 0;
  let updated = 0;

  for (const event of events) {
    try {
      // Check if event already exists
      const [existing] = await db
        .select({ id: calendarEvents.id, autoProcess: calendarEvents.autoProcess })
        .from(calendarEvents)
        .where(
          and(
            eq(calendarEvents.userId, userId),
            eq(calendarEvents.source, event.source),
            eq(calendarEvents.externalEventId, event.externalEventId)
          )
        )
        .limit(1);

      if (existing) {
        // Update existing event, preserving autoProcess preference
        await db
          .update(calendarEvents)
          .set({
            title: event.title,
            description: event.description,
            startTime: event.startTime,
            endTime: event.endTime,
            meetingUrl: event.meetingUrl,
            meetingPlatform: event.meetingPlatform,
            attendees: event.attendees,
            organizerEmail: event.organizerEmail,
            syncedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(calendarEvents.id, existing.id));
        updated++;
      } else {
        // Insert new event
        await db.insert(calendarEvents).values(event);
        inserted++;
      }
    } catch (error) {
      log('error', 'Error upserting calendar event', {
        userId,
        eventId: event.externalEventId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  log('info', 'Upserted calendar events', { userId, inserted, updated });
  return { inserted, updated };
}

/**
 * Sync all calendar events for a user (both Google and Outlook)
 */
export async function syncUserCalendarEvents(
  userId: string,
  daysAhead: number = DEFAULT_DAYS_AHEAD
): Promise<{ google: number; outlook: number }> {
  const [googleEvents, outlookEvents] = await Promise.all([
    fetchGoogleCalendarEvents(userId, daysAhead),
    fetchOutlookCalendarEvents(userId, daysAhead),
  ]);

  const googleResult = await upsertCalendarEvents(userId, googleEvents);
  const outlookResult = await upsertCalendarEvents(userId, outlookEvents);

  return {
    google: googleResult.inserted + googleResult.updated,
    outlook: outlookResult.inserted + outlookResult.updated,
  };
}

/**
 * Clean up old calendar events (events that have passed)
 */
export async function cleanupOldCalendarEvents(userId?: string): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 1); // Keep events from yesterday

  try {
    const conditions = [lte(calendarEvents.endTime, cutoffDate)];
    if (userId) {
      conditions.push(eq(calendarEvents.userId, userId));
    }

    const result = await db
      .delete(calendarEvents)
      .where(and(...conditions));

    log('info', 'Cleaned up old calendar events', {
      userId: userId || 'all',
      cutoffDate: cutoffDate.toISOString(),
    });

    return 0; // Drizzle doesn't return count easily
  } catch (error) {
    log('error', 'Error cleaning up old calendar events', {
      error: error instanceof Error ? error.message : String(error),
    });
    return 0;
  }
}

/**
 * Get upcoming calendar events for a user
 */
export async function getUpcomingCalendarEvents(
  userId: string,
  daysAhead: number = DEFAULT_DAYS_AHEAD
): Promise<typeof calendarEvents.$inferSelect[]> {
  const now = new Date();
  const endDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

  return db
    .select()
    .from(calendarEvents)
    .where(
      and(
        eq(calendarEvents.userId, userId),
        gte(calendarEvents.startTime, now),
        lte(calendarEvents.startTime, endDate)
      )
    )
    .orderBy(calendarEvents.startTime);
}
