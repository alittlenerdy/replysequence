/**
 * Recall Bot Scheduler
 * Automatically schedules bots for upcoming calendar events with meeting URLs
 */

import { eq, and, gte, lte, isNull, inArray } from 'drizzle-orm';
import { db, recallBots, calendarConnections, calendarEvents, users, type MeetingPlatform } from '@/lib/db';
import { getRecallClient } from './client';
import { decrypt } from '@/lib/encryption';
import type { RecallPlatform } from './types';

// How far in advance to schedule bots (in minutes)
const SCHEDULE_AHEAD_MINUTES = 30;

// Meeting URL patterns for different platforms
const MEETING_URL_PATTERNS: Record<RecallPlatform, RegExp> = {
  zoom: /https:\/\/[\w.-]*zoom\.us\/j\/\d+/i,
  google_meet: /https:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}/i,
  microsoft_teams: /https:\/\/teams\.microsoft\.com\/l\/meetup-join\//i,
  webex: /https:\/\/[\w.-]*\.webex\.com\//i,
  slack_huddles: /https:\/\/[\w.-]*\.slack\.com\/huddle\//i,
  goto_meeting: /https:\/\/[\w.-]*gotomeet\.me\//i,
};

/**
 * Extract meeting URL from text (event description, location, etc.)
 */
export function extractMeetingUrl(text: string): { url: string; platform: RecallPlatform } | null {
  if (!text) return null;

  for (const [platform, pattern] of Object.entries(MEETING_URL_PATTERNS)) {
    const match = text.match(pattern);
    if (match) {
      return { url: match[0], platform: platform as RecallPlatform };
    }
  }

  return null;
}

/**
 * Map Recall platform to our MeetingPlatform enum
 */
export function mapRecallPlatformToMeetingPlatform(recallPlatform: RecallPlatform): MeetingPlatform {
  switch (recallPlatform) {
    case 'google_meet':
      return 'google_meet';
    case 'microsoft_teams':
      return 'microsoft_teams';
    case 'zoom':
    default:
      return 'zoom';
  }
}

/**
 * Fetch upcoming calendar events with meeting URLs for a user
 */
async function fetchUpcomingCalendarEvents(
  userId: string,
  accessToken: string,
  lookAheadMinutes: number = 60
): Promise<Array<{
  id: string;
  title: string;
  startTime: Date;
  meetingUrl: string;
  platform: RecallPlatform;
}>> {
  const now = new Date();
  const lookAhead = new Date(now.getTime() + lookAheadMinutes * 60 * 1000);

  try {
    // Fetch events from Google Calendar API
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
      new URLSearchParams({
        timeMin: now.toISOString(),
        timeMax: lookAhead.toISOString(),
        singleEvents: 'true',
        orderBy: 'startTime',
        maxResults: '20',
      }),
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      console.error('[RECALL-SCHEDULER] Calendar API error:', {
        status: response.status,
        userId,
      });
      return [];
    }

    const data = await response.json();
    const events: Array<{
      id: string;
      title: string;
      startTime: Date;
      meetingUrl: string;
      platform: RecallPlatform;
    }> = [];

    for (const event of data.items || []) {
      // Skip all-day events
      if (!event.start?.dateTime) continue;

      // Look for meeting URL in various places
      const textToSearch = [
        event.description || '',
        event.location || '',
        event.hangoutLink || '',
        event.conferenceData?.entryPoints?.map((e: { uri: string }) => e.uri).join(' ') || '',
      ].join(' ');

      const meetingInfo = extractMeetingUrl(textToSearch);

      // Also check for Google Meet link directly
      if (!meetingInfo && event.hangoutLink) {
        events.push({
          id: event.id,
          title: event.summary || 'Meeting',
          startTime: new Date(event.start.dateTime),
          meetingUrl: event.hangoutLink,
          platform: 'google_meet',
        });
        continue;
      }

      if (meetingInfo) {
        events.push({
          id: event.id,
          title: event.summary || 'Meeting',
          startTime: new Date(event.start.dateTime),
          meetingUrl: meetingInfo.url,
          platform: meetingInfo.platform,
        });
      }
    }

    return events;
  } catch (error) {
    console.error('[RECALL-SCHEDULER] Error fetching calendar events:', {
      userId,
      error: error instanceof Error ? error.message : error,
    });
    return [];
  }
}

/**
 * Schedule a Recall bot for a meeting
 */
export async function scheduleBotForMeeting(
  userId: string,
  calendarEventId: string,
  meetingUrl: string,
  meetingTitle: string,
  scheduledJoinAt: Date,
  platform: RecallPlatform
): Promise<{ success: boolean; botId?: string; error?: string }> {
  const recallClient = getRecallClient();

  if (!recallClient.isConfigured()) {
    return { success: false, error: 'Recall API not configured' };
  }

  try {
    // Check if we already have a bot scheduled for this event
    const [existingBot] = await db
      .select()
      .from(recallBots)
      .where(
        and(
          eq(recallBots.userId, userId),
          eq(recallBots.calendarEventId, calendarEventId),
          inArray(recallBots.status, ['pending', 'scheduled', 'joining', 'in_call', 'recording'])
        )
      )
      .limit(1);

    if (existingBot) {
      console.log('[RECALL-SCHEDULER] Bot already scheduled for event:', {
        eventId: calendarEventId,
        botId: existingBot.recallBotId,
      });
      return { success: true, botId: existingBot.recallBotId || undefined };
    }

    // Check auto-process preference from calendarEvents table
    const [calendarEvent] = await db
      .select({ autoProcess: calendarEvents.autoProcess })
      .from(calendarEvents)
      .where(
        and(
          eq(calendarEvents.userId, userId),
          eq(calendarEvents.externalEventId, calendarEventId)
        )
      )
      .limit(1);

    if (calendarEvent?.autoProcess === 'disabled') {
      console.log('[RECALL-SCHEDULER] Auto-process disabled for event:', {
        eventId: calendarEventId,
        userId,
      });
      return { success: false, error: 'Auto-process disabled for this meeting' };
    }

    // Get webhook URL for this environment
    const webhookBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const transcriptionWebhookUrl = `${webhookBaseUrl}/api/webhooks/recall`;

    // Schedule the bot with Recall
    const bot = await recallClient.scheduleBot(meetingUrl, scheduledJoinAt, {
      botName: 'ReplySequence',
      transcriptionWebhookUrl,
      metadata: {
        userId,
        calendarEventId,
        meetingTitle,
      },
    });

    // Create our bot record
    const [botRecord] = await db
      .insert(recallBots)
      .values({
        userId,
        recallBotId: bot.id,
        calendarEventId,
        meetingUrl,
        meetingTitle,
        platform: mapRecallPlatformToMeetingPlatform(platform),
        scheduledJoinAt,
        status: 'scheduled',
        lastStatusCode: bot.status_changes?.[0]?.code,
      })
      .returning();

    console.log('[RECALL-SCHEDULER] Bot scheduled:', {
      botId: bot.id,
      eventId: calendarEventId,
      joinAt: scheduledJoinAt,
    });

    return { success: true, botId: bot.id };
  } catch (error) {
    console.error('[RECALL-SCHEDULER] Error scheduling bot:', {
      userId,
      calendarEventId,
      error: error instanceof Error ? error.message : error,
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to schedule bot',
    };
  }
}

/**
 * Cancel a scheduled bot
 */
export async function cancelScheduledBot(botRecordId: string): Promise<boolean> {
  const recallClient = getRecallClient();

  try {
    const [botRecord] = await db
      .select()
      .from(recallBots)
      .where(eq(recallBots.id, botRecordId))
      .limit(1);

    if (!botRecord) {
      console.warn('[RECALL-SCHEDULER] Bot record not found:', { botRecordId });
      return false;
    }

    // Cancel with Recall if we have a bot ID and it's not already done
    if (botRecord.recallBotId && !['completed', 'failed', 'cancelled'].includes(botRecord.status)) {
      try {
        await recallClient.deleteBot(botRecord.recallBotId);
      } catch (error) {
        console.warn('[RECALL-SCHEDULER] Error cancelling bot with Recall:', {
          botId: botRecord.recallBotId,
          error: error instanceof Error ? error.message : error,
        });
        // Continue to update our record even if Recall deletion fails
      }
    }

    // Update our record
    await db
      .update(recallBots)
      .set({
        status: 'cancelled',
        updatedAt: new Date(),
      })
      .where(eq(recallBots.id, botRecordId));

    return true;
  } catch (error) {
    console.error('[RECALL-SCHEDULER] Error cancelling bot:', {
      botRecordId,
      error: error instanceof Error ? error.message : error,
    });
    return false;
  }
}

/**
 * Scan and schedule bots for all users with calendar connections
 * This should be called periodically (e.g., every 5 minutes)
 */
export async function scanAndScheduleBots(): Promise<{
  usersScanned: number;
  botsScheduled: number;
  errors: number;
}> {
  console.log('[RECALL-SCHEDULER] Starting bot scheduling scan...');

  const recallClient = getRecallClient();
  if (!recallClient.isConfigured()) {
    console.warn('[RECALL-SCHEDULER] Recall API not configured, skipping scan');
    return { usersScanned: 0, botsScheduled: 0, errors: 0 };
  }

  let usersScanned = 0;
  let botsScheduled = 0;
  let errors = 0;

  try {
    // Get all users with active calendar connections
    const connections = await db
      .select({
        userId: calendarConnections.userId,
        accessToken: calendarConnections.accessTokenEncrypted,
        expiresAt: calendarConnections.accessTokenExpiresAt,
      })
      .from(calendarConnections);

    for (const connection of connections) {
      usersScanned++;

      // Skip if token is expired
      if (connection.expiresAt < new Date()) {
        console.log('[RECALL-SCHEDULER] Skipping user with expired token:', {
          userId: connection.userId,
        });
        continue;
      }

      try {
        const accessToken = decrypt(connection.accessToken);
        const events = await fetchUpcomingCalendarEvents(
          connection.userId,
          accessToken,
          60 // Look 60 minutes ahead
        );

        for (const event of events) {
          // Calculate join time (5 minutes before start)
          const joinAt = new Date(event.startTime.getTime() - 5 * 60 * 1000);

          // Only schedule if join time is in the future and within scheduling window
          const now = new Date();
          if (joinAt <= now) continue;
          if (joinAt.getTime() - now.getTime() > SCHEDULE_AHEAD_MINUTES * 60 * 1000) continue;

          const result = await scheduleBotForMeeting(
            connection.userId,
            event.id,
            event.meetingUrl,
            event.title,
            joinAt,
            event.platform
          );

          if (result.success && result.botId) {
            botsScheduled++;
          } else if (result.error) {
            errors++;
          }
        }
      } catch (error) {
        console.error('[RECALL-SCHEDULER] Error processing user:', {
          userId: connection.userId,
          error: error instanceof Error ? error.message : error,
        });
        errors++;
      }
    }
  } catch (error) {
    console.error('[RECALL-SCHEDULER] Error in scan:', error);
    errors++;
  }

  console.log('[RECALL-SCHEDULER] Scan complete:', {
    usersScanned,
    botsScheduled,
    errors,
  });

  return { usersScanned, botsScheduled, errors };
}

/**
 * Get scheduled bots for a user
 */
export async function getScheduledBots(userId: string) {
  return db
    .select()
    .from(recallBots)
    .where(
      and(
        eq(recallBots.userId, userId),
        inArray(recallBots.status, ['pending', 'scheduled', 'joining', 'in_call', 'recording'])
      )
    )
    .orderBy(recallBots.scheduledJoinAt);
}

/**
 * Get bot history for a user
 */
export async function getBotHistory(userId: string, limit: number = 20) {
  return db
    .select()
    .from(recallBots)
    .where(eq(recallBots.userId, userId))
    .orderBy(recallBots.createdAt)
    .limit(limit);
}
