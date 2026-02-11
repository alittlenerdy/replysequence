import { NextRequest, NextResponse } from 'next/server';
import { db, meetConnections, meetings, rawEvents } from '@/lib/db';
import { eq, and, gte, isNull } from 'drizzle-orm';
import { decrypt } from '@/lib/encryption';
import { processMeetEvent } from '@/lib/process-meet-event';
import { searchMeetRecordingsFolder, DriveFile } from '@/lib/drive-api';
import type { MeetWorkspaceEvent } from '@/lib/meet/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Configuration
const CALENDAR_API = 'https://www.googleapis.com/calendar/v3';
const MEET_API = 'https://meet.googleapis.com/v2';
const MEET_API_BETA = 'https://meet.googleapis.com/v2beta';
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID?.trim();
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET?.trim();

// Poll window: look back 15 minutes for recently ended meetings
const POLL_WINDOW_MINUTES = 15;

interface CalendarEvent {
  id: string;
  summary?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  hangoutLink?: string;
  conferenceData?: {
    conferenceId?: string;
    conferenceSolution?: { name?: string };
    entryPoints?: Array<{ uri?: string }>;
  };
  organizer?: { email?: string };
  attendees?: Array<{ email?: string; responseStatus?: string }>;
}

interface CalendarListResponse {
  items?: CalendarEvent[];
  nextPageToken?: string;
}

interface ConferenceRecord {
  name: string;
  startTime?: string;
  endTime?: string;
  space?: { meetingCode?: string };
}

interface MeetTranscript {
  name: string;
  state: string;
  docsDestination?: {
    document: string;
    exportUri: string;
  };
}

interface MeetSmartNotes {
  name: string;
  state: string;
  docsDestination?: {
    document: string;
    exportUri: string;
  };
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
      service: 'poll-meet-recordings',
      ...data,
    })
  );
}

/**
 * Refresh access token using stored refresh token
 */
async function refreshAccessToken(refreshToken: string): Promise<string> {
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
    throw new Error(`Token refresh failed: ${error}`);
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * Fetch calendar events that ended in the poll window
 */
async function getRecentlyEndedMeetings(
  accessToken: string
): Promise<CalendarEvent[]> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - POLL_WINDOW_MINUTES * 60 * 1000);

  log('debug', 'Calendar query time window', {
    now: now.toISOString(),
    windowStart: windowStart.toISOString(),
    windowMinutes: POLL_WINDOW_MINUTES,
  });

  // Query for events that ended between windowStart and now
  const params = new URLSearchParams({
    timeMin: windowStart.toISOString(),
    timeMax: now.toISOString(),
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '50',
  });

  const response = await fetch(
    `${CALENDAR_API}/calendars/primary/events?${params}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    log('error', 'Failed to fetch calendar events', { error });
    throw new Error(`Calendar API error: ${error}`);
  }

  const data: CalendarListResponse = await response.json();
  const events = data.items || [];

  log('debug', 'Raw calendar events received', {
    count: events.length,
    events: events.map((e) => ({
      id: e.id,
      summary: e.summary,
      start: e.start?.dateTime || e.start?.date,
      end: e.end?.dateTime || e.end?.date,
    })),
  });

  // Filter for events with Meet links that have ended
  const meetEvents: CalendarEvent[] = [];

  for (const event of events) {
    const hasHangoutLink = !!event.hangoutLink;
    const hasConferenceData = !!event.conferenceData;
    const hasConferenceId = !!event.conferenceData?.conferenceId;
    const hasMeetLink = hasHangoutLink || hasConferenceId;

    const endTimeStr = event.end?.dateTime || event.end?.date;
    const endTime = endTimeStr ? new Date(endTimeStr) : null;
    const hasEnded = endTime && endTime <= now;

    // Extract meeting code for logging
    let meetingCode: string | null = null;
    if (event.hangoutLink) {
      const match = event.hangoutLink.match(/meet\.google\.com\/([a-z]{3}-[a-z]{4}-[a-z]{3})/i);
      meetingCode = match ? match[1] : null;
    }

    log('debug', 'Evaluating calendar event', {
      eventId: event.id,
      summary: event.summary,
      startTime: event.start?.dateTime || event.start?.date,
      endTime: endTimeStr,
      endTimeParsed: endTime?.toISOString(),
      now: now.toISOString(),
      hasHangoutLink,
      hangoutLink: event.hangoutLink,
      hasConferenceData,
      hasConferenceId,
      conferenceId: event.conferenceData?.conferenceId,
      conferenceSolution: event.conferenceData?.conferenceSolution?.name,
      entryPoints: event.conferenceData?.entryPoints?.map((ep) => ep.uri),
      meetingCode,
      hasMeetLink,
      hasEnded,
      passesFilter: hasMeetLink && hasEnded,
    });

    if (hasMeetLink && hasEnded) {
      meetEvents.push(event);
    }
  }

  log('info', 'Found calendar events with Meet links', {
    total: events.length,
    withMeet: meetEvents.length,
    meetEventSummaries: meetEvents.map((e) => e.summary),
  });

  return meetEvents;
}

/**
 * Extract meeting code from various Meet URL formats
 */
function extractMeetingCode(event: CalendarEvent): string | null {
  // Try hangoutLink first (format: https://meet.google.com/xxx-xxxx-xxx)
  if (event.hangoutLink) {
    const match = event.hangoutLink.match(/meet\.google\.com\/([a-z]{3}-[a-z]{4}-[a-z]{3})/i);
    if (match) {
      log('debug', 'Extracted meeting code from hangoutLink', {
        eventId: event.id,
        hangoutLink: event.hangoutLink,
        meetingCode: match[1],
      });
      return match[1];
    }
  }

  // Try conferenceData
  if (event.conferenceData?.entryPoints) {
    for (const entry of event.conferenceData.entryPoints) {
      if (entry.uri?.includes('meet.google.com')) {
        const match = entry.uri.match(/meet\.google\.com\/([a-z]{3}-[a-z]{4}-[a-z]{3})/i);
        if (match) {
          log('debug', 'Extracted meeting code from conferenceData entryPoint', {
            eventId: event.id,
            entryUri: entry.uri,
            meetingCode: match[1],
          });
          return match[1];
        }
      }
    }
  }

  log('debug', 'Could not extract meeting code from event', {
    eventId: event.id,
    summary: event.summary,
    hangoutLink: event.hangoutLink,
    conferenceData: event.conferenceData,
  });

  return null;
}

/**
 * Search for conference records by meeting code
 * Note: Meet API requires knowing the conference record name
 * We'll try to find it by listing recent records
 */
async function findConferenceRecord(
  accessToken: string,
  meetingCode: string,
  startTime: Date,
  endTime: Date
): Promise<ConferenceRecord | null> {
  // Meet API doesn't have a direct search by meeting code
  // We need to use the filter parameter with space.meeting_code
  const filter = `space.meeting_code="${meetingCode}"`;

  const params = new URLSearchParams({
    filter,
    pageSize: '10',
  });

  log('debug', 'Searching for conference record', {
    meetingCode,
    filter,
    calendarEventStart: startTime.toISOString(),
    calendarEventEnd: endTime.toISOString(),
    apiUrl: `${MEET_API}/conferenceRecords?${params}`,
  });

  try {
    const response = await fetch(
      `${MEET_API}/conferenceRecords?${params}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      log('warn', 'Failed to search conference records', {
        meetingCode,
        error,
        status: response.status,
      });
      return null;
    }

    const data = await response.json();
    const records = data.conferenceRecords || [];

    log('debug', 'Conference records API response', {
      meetingCode,
      recordCount: records.length,
      records: records.map((r: ConferenceRecord) => ({
        name: r.name,
        startTime: r.startTime,
        endTime: r.endTime,
        meetingCode: r.space?.meetingCode,
      })),
    });

    // Find a record that matches our time window
    for (const record of records) {
      const recordStart = record.startTime ? new Date(record.startTime) : null;
      const recordEnd = record.endTime ? new Date(record.endTime) : null;

      // Check if this record overlaps with our calendar event
      if (recordStart && recordEnd) {
        const startDiff = Math.abs(recordStart.getTime() - startTime.getTime());
        const endDiff = Math.abs(recordEnd.getTime() - endTime.getTime());

        log('debug', 'Comparing record times', {
          meetingCode,
          recordName: record.name,
          recordStart: recordStart.toISOString(),
          recordEnd: recordEnd.toISOString(),
          calendarStart: startTime.toISOString(),
          calendarEnd: endTime.toISOString(),
          startDiffMs: startDiff,
          endDiffMs: endDiff,
          startDiffMinutes: Math.round(startDiff / 60000),
          endDiffMinutes: Math.round(endDiff / 60000),
          withinTolerance: startDiff < 5 * 60 * 1000 || endDiff < 5 * 60 * 1000,
        });

        // Allow 5 minute tolerance
        if (startDiff < 5 * 60 * 1000 || endDiff < 5 * 60 * 1000) {
          log('info', 'Found matching conference record', {
            meetingCode,
            recordName: record.name,
          });
          return record;
        }
      }
    }

    log('info', 'No matching conference record found', {
      meetingCode,
      recordsChecked: records.length,
    });
    return null;
  } catch (error) {
    log('error', 'Error searching conference records', {
      meetingCode,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * Check for transcripts on a conference record
 */
async function getTranscripts(
  accessToken: string,
  conferenceRecordName: string
): Promise<MeetTranscript[]> {
  log('debug', 'Fetching transcripts for conference record', {
    conferenceRecordName,
    apiUrl: `${MEET_API}/${conferenceRecordName}/transcripts`,
  });

  try {
    const response = await fetch(
      `${MEET_API}/${conferenceRecordName}/transcripts`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      log('warn', 'Failed to get transcripts', {
        conferenceRecordName,
        error,
        status: response.status,
      });
      return [];
    }

    const data = await response.json();
    const transcripts = data.transcripts || [];

    log('debug', 'Transcripts API response', {
      conferenceRecordName,
      transcriptCount: transcripts.length,
      transcripts: transcripts.map((t: MeetTranscript) => ({
        name: t.name,
        state: t.state,
        docsDocument: t.docsDestination?.document,
        exportUri: t.docsDestination?.exportUri,
      })),
    });

    return transcripts;
  } catch (error) {
    log('error', 'Error fetching transcripts', {
      conferenceRecordName,
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}

/**
 * Check for Smart Notes (Gemini AI notes) on a conference record
 * Uses v2beta API endpoint
 */
async function getSmartNotes(
  accessToken: string,
  conferenceRecordName: string
): Promise<MeetSmartNotes[]> {
  log('debug', 'Fetching Smart Notes for conference record', {
    conferenceRecordName,
    apiUrl: `${MEET_API_BETA}/${conferenceRecordName}/smartNotes`,
  });

  try {
    const response = await fetch(
      `${MEET_API_BETA}/${conferenceRecordName}/smartNotes`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!response.ok) {
      // Smart Notes API may return 404 if feature is not enabled
      const error = await response.text();
      log('debug', 'Smart Notes API response', {
        conferenceRecordName,
        status: response.status,
        error,
      });
      return [];
    }

    const data = await response.json();
    const smartNotes = data.smartNotes || [];

    log('debug', 'Smart Notes API response', {
      conferenceRecordName,
      smartNotesCount: smartNotes.length,
      smartNotes: smartNotes.map((n: MeetSmartNotes) => ({
        name: n.name,
        state: n.state,
        docsDocument: n.docsDestination?.document,
      })),
    });

    return smartNotes;
  } catch (error) {
    log('error', 'Error fetching Smart Notes', {
      conferenceRecordName,
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}

/**
 * Check if we've already processed this meeting
 */
async function isAlreadyProcessed(conferenceRecordName: string): Promise<boolean> {
  const [existing] = await db
    .select({ id: meetings.id })
    .from(meetings)
    .where(eq(meetings.platformMeetingId, conferenceRecordName))
    .limit(1);

  return !!existing;
}

/**
 * Process a single calendar event
 */
async function processCalendarEvent(
  accessToken: string,
  event: CalendarEvent,
  userId: string,
  hostEmail: string
): Promise<{ processed: boolean; reason: string }> {
  log('debug', 'Processing calendar event', {
    eventId: event.id,
    summary: event.summary,
    userId,
  });

  const meetingCode = extractMeetingCode(event);
  if (!meetingCode) {
    log('debug', 'No meeting code found in event', {
      eventId: event.id,
      summary: event.summary,
    });
    return { processed: false, reason: 'No meeting code found' };
  }

  log('debug', 'Found meeting code', {
    eventId: event.id,
    summary: event.summary,
    meetingCode,
  });

  const startTime = event.start?.dateTime ? new Date(event.start.dateTime) : new Date();
  const endTime = event.end?.dateTime ? new Date(event.end.dateTime) : new Date();

  // Find conference record
  const conferenceRecord = await findConferenceRecord(
    accessToken,
    meetingCode,
    startTime,
    endTime
  );

  if (!conferenceRecord) {
    return { processed: false, reason: 'No conference record found' };
  }

  // Check if already processed
  const alreadyProcessed = await isAlreadyProcessed(conferenceRecord.name);
  if (alreadyProcessed) {
    return { processed: false, reason: 'Already processed' };
  }

  // Check for transcripts first
  const transcripts = await getTranscripts(accessToken, conferenceRecord.name);
  const readyTranscript = transcripts.find((t) => t.state === 'FILE_GENERATED');

  // If no native transcript, check for Smart Notes (Gemini AI notes)
  let readySmartNote: MeetSmartNotes | undefined;
  if (!readyTranscript) {
    log('info', 'No native transcript found, checking for Smart Notes', {
      conferenceRecordName: conferenceRecord.name,
    });

    const smartNotes = await getSmartNotes(accessToken, conferenceRecord.name);
    readySmartNote = smartNotes.find((n) => n.state === 'FILE_GENERATED');

    if (readySmartNote) {
      log('info', 'Found ready Smart Notes (Gemini)', {
        conferenceRecordName: conferenceRecord.name,
        smartNoteName: readySmartNote.name,
      });
    }
  }

  // If neither transcript nor smart notes are ready, try Drive fallback
  let driveFile: DriveFile | null = null;
  if (!readyTranscript && !readySmartNote) {
    log('info', 'No transcript or Smart Notes found, searching Google Drive', {
      conferenceRecordName: conferenceRecord.name,
    });

    try {
      // Search for files in Meet Recordings folder around the meeting end time
      const driveFiles = await searchMeetRecordingsFolder(
        accessToken,
        endTime,
        120 // 2 hour window
      );

      // Find Google Docs (potential meeting notes)
      const docFiles = driveFiles.filter(
        (f: DriveFile) => f.mimeType === 'application/vnd.google-apps.document'
      );

      if (docFiles.length > 0) {
        driveFile = docFiles[0];
        log('info', 'Found meeting notes in Google Drive', {
          conferenceRecordName: conferenceRecord.name,
          fileId: driveFile.id,
          fileName: driveFile.name,
        });
      }
    } catch (driveError) {
      log('warn', 'Drive search failed', {
        conferenceRecordName: conferenceRecord.name,
        error: driveError instanceof Error ? driveError.message : String(driveError),
      });
    }

    // If still no content, skip
    if (!driveFile) {
      return { processed: false, reason: 'No transcript, Smart Notes, or Drive files ready yet' };
    }
  }

  // Determine which content source we're using
  const contentSource = readyTranscript ? 'transcript' : (readySmartNote ? 'smart_notes' : 'drive_notes');
  const contentName = readyTranscript?.name || readySmartNote?.name || driveFile?.name || 'unknown';
  const contentDocId = readyTranscript?.docsDestination?.document || readySmartNote?.docsDestination?.document || driveFile?.id;

  log('info', 'Found ready content, processing', {
    conferenceRecordName: conferenceRecord.name,
    contentSource,
    contentName,
    hasDocsDocument: !!contentDocId,
  });

  // Store raw event for audit
  const eventId = `poll-${conferenceRecord.name}-${Date.now()}`;
  const eventTypeMap: Record<string, string> = {
    transcript: 'meet.transcript.fileGenerated',
    smart_notes: 'meet.smartNotes.fileGenerated',
    drive_notes: 'meet.driveNotes.fileGenerated',
  };
  const [rawEvent] = await db
    .insert(rawEvents)
    .values({
      eventType: eventTypeMap[contentSource] || 'meet.transcript.fileGenerated',
      zoomEventId: eventId,
      payload: {
        source: 'calendar_poll',
        calendarEventId: event.id,
        calendarEventSummary: event.summary,
        conferenceRecordName: conferenceRecord.name,
        contentSource,
        contentName,
        docsDocument: contentDocId,
      },
      status: 'pending',
      meetingId: conferenceRecord.name,
    })
    .returning();

  // Create a MeetWorkspaceEvent-compatible object
  const meetEvent: MeetWorkspaceEvent = {
    eventType: 'google.workspace.meet.transcript.v2.fileGenerated',
    eventTime: new Date().toISOString(),
    conferenceRecord: {
      name: conferenceRecord.name,
      conferenceRecordName: conferenceRecord.name,
      space: {
        name: `spaces/${meetingCode}`,
        meetingCode,
      },
      startTime: conferenceRecord.startTime,
      endTime: conferenceRecord.endTime,
    },
  };

  // Process through existing pipeline - pass the access token, userId, and hostEmail for multi-tenant isolation
  try {
    const result = await processMeetEvent(rawEvent, meetEvent, accessToken, userId, hostEmail);
    log('info', 'Successfully processed meeting', {
      conferenceRecordName: conferenceRecord.name,
      action: result.action,
      meetingId: result.meetingId,
      userId,
      hostEmail,
    });
    return { processed: true, reason: 'Success' };
  } catch (error) {
    log('error', 'Failed to process meeting', {
      conferenceRecordName: conferenceRecord.name,
      error: error instanceof Error ? error.message : String(error),
    });
    return { processed: false, reason: `Processing error: ${error}` };
  }
}

/**
 * Main handler - poll all connected users' calendars
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  // Verify cron secret (Vercel cron protection)
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    log('warn', 'Unauthorized cron request');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  log('info', 'Starting Meet recordings poll');

  try {
    // Get all users with Meet connected
    const connections = await db
      .select({
        id: meetConnections.id,
        userId: meetConnections.userId,
        googleEmail: meetConnections.googleEmail,
        refreshTokenEncrypted: meetConnections.refreshTokenEncrypted,
      })
      .from(meetConnections);

    if (connections.length === 0) {
      log('info', 'No Meet connections found');
      return NextResponse.json({
        success: true,
        message: 'No Meet connections to poll',
        duration: Date.now() - startTime,
      });
    }

    log('info', 'Polling Meet connections', { count: connections.length });

    const results: Array<{
      email: string;
      eventsFound: number;
      processed: number;
      errors: string[];
    }> = [];

    for (const connection of connections) {
      const userResult = {
        email: connection.googleEmail,
        eventsFound: 0,
        processed: 0,
        errors: [] as string[],
      };

      log('debug', 'Processing user connection', {
        userId: connection.userId,
        googleEmail: connection.googleEmail,
        connectionId: connection.id,
      });

      try {
        // Get access token
        log('debug', 'Decrypting refresh token');
        const refreshToken = decrypt(connection.refreshTokenEncrypted);
        log('debug', 'Refresh token decrypted, refreshing access token');
        const accessToken = await refreshAccessToken(refreshToken);
        log('debug', 'Access token obtained successfully');

        // Get recently ended meetings
        const events = await getRecentlyEndedMeetings(accessToken);
        userResult.eventsFound = events.length;

        // Process each event
        for (const event of events) {
          const result = await processCalendarEvent(
            accessToken,
            event,
            connection.userId,
            connection.googleEmail
          );

          if (result.processed) {
            userResult.processed++;
          } else if (result.reason !== 'Already processed') {
            log('info', 'Event not processed', {
              eventId: event.id,
              summary: event.summary,
              reason: result.reason,
            });
          }
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        userResult.errors.push(errorMsg);
        log('error', 'Error processing user', {
          email: connection.googleEmail,
          error: errorMsg,
        });
      }

      results.push(userResult);
    }

    const totalProcessed = results.reduce((sum, r) => sum + r.processed, 0);
    const totalEvents = results.reduce((sum, r) => sum + r.eventsFound, 0);

    log('info', 'Poll complete', {
      users: connections.length,
      totalEvents,
      totalProcessed,
      duration: Date.now() - startTime,
    });

    return NextResponse.json({
      success: true,
      summary: {
        usersPolled: connections.length,
        eventsFound: totalEvents,
        meetingsProcessed: totalProcessed,
        duration: Date.now() - startTime,
      },
      results,
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    log('error', 'Poll failed', { error: errorMsg });

    return NextResponse.json(
      {
        success: false,
        error: errorMsg,
        duration: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}
