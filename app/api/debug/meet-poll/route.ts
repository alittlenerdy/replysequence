/**
 * Debug endpoint to manually trigger Meet poll for current user
 * This helps diagnose why meetings aren't being detected
 *
 * GET /api/debug/meet-poll
 */

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db, users, meetConnections } from '@/lib/db';
import { decrypt } from '@/lib/encryption';

const CALENDAR_API = 'https://www.googleapis.com/calendar/v3';
const MEET_API = 'https://meet.googleapis.com/v2';
const MEET_API_BETA = 'https://meet.googleapis.com/v2beta';
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID?.trim();
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET?.trim();

// Look back further for debugging - 60 minutes instead of 15
const DEBUG_POLL_WINDOW_MINUTES = 60;

export async function GET() {
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const debugLog: string[] = [];
  const log = (msg: string) => {
    debugLog.push(`[${new Date().toISOString()}] ${msg}`);
    console.log(`[DEBUG-MEET-POLL] ${msg}`);
  };

  try {
    log(`Starting debug poll for clerkId: ${clerkUserId}`);

    // Find user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, clerkUserId))
      .limit(1);

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found in database',
        debugLog,
      });
    }
    log(`Found user: ${user.id} (${user.email})`);

    // Get meet connection
    const [meetConn] = await db
      .select()
      .from(meetConnections)
      .where(eq(meetConnections.userId, user.id))
      .limit(1);

    if (!meetConn) {
      return NextResponse.json({
        success: false,
        error: 'No Meet connection found for this user',
        user: { id: user.id, email: user.email, meetConnected: user.meetConnected },
        debugLog,
      });
    }
    log(`Found Meet connection: ${meetConn.googleEmail}`);

    // Check scopes
    log(`Scopes: ${meetConn.scopes}`);
    const hasCalendarScope = meetConn.scopes.includes('calendar.readonly');
    const hasMeetScope = meetConn.scopes.includes('meetings.space.readonly');
    const hasDriveScope = meetConn.scopes.includes('drive.readonly');
    log(`Has calendar scope: ${hasCalendarScope}`);
    log(`Has Meet scope: ${hasMeetScope}`);
    log(`Has Drive scope: ${hasDriveScope}`);

    if (!hasCalendarScope) {
      return NextResponse.json({
        success: false,
        error: 'Missing calendar.readonly scope',
        scopes: meetConn.scopes,
        debugLog,
      });
    }

    // Decrypt and refresh token
    log('Decrypting refresh token...');
    const refreshToken = decrypt(meetConn.refreshTokenEncrypted);
    log('Refresh token decrypted, getting access token...');

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: CLIENT_ID || '',
        client_secret: CLIENT_SECRET || '',
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      log(`Token refresh failed: ${error}`);
      return NextResponse.json({
        success: false,
        error: 'Token refresh failed',
        tokenError: error,
        debugLog,
      });
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    log('Access token obtained successfully');

    // Query calendar for recent events
    const now = new Date();
    const windowStart = new Date(now.getTime() - DEBUG_POLL_WINDOW_MINUTES * 60 * 1000);

    log(`Querying calendar events from ${windowStart.toISOString()} to ${now.toISOString()}`);

    const params = new URLSearchParams({
      timeMin: windowStart.toISOString(),
      timeMax: now.toISOString(),
      singleEvents: 'true',
      orderBy: 'startTime',
      maxResults: '50',
    });

    const calendarResponse = await fetch(
      `${CALENDAR_API}/calendars/primary/events?${params}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!calendarResponse.ok) {
      const error = await calendarResponse.text();
      log(`Calendar API error: ${error}`);
      return NextResponse.json({
        success: false,
        error: 'Calendar API failed',
        calendarError: error,
        debugLog,
      });
    }

    const calendarData = await calendarResponse.json();
    const calendarEvents = calendarData.items || [];
    log(`Found ${calendarEvents.length} calendar events`);

    // Analyze each event
    interface EventAnalysis {
      id: string;
      summary: string | null;
      start: string | null;
      end: string | null;
      hasMeetLink: boolean;
      meetingCode: string | null;
      hasEnded: boolean;
      conferenceRecord: {
        found: boolean;
        name?: string;
        startTime?: string;
        endTime?: string;
      } | null;
      transcript: {
        found: boolean;
        state?: string;
        name?: string;
      } | null;
      smartNotes: {
        found: boolean;
        state?: string;
        name?: string;
        documentId?: string;
      } | null;
      issues: string[];
    }

    const eventAnalysis: EventAnalysis[] = [];

    for (const event of calendarEvents) {
      const analysis: EventAnalysis = {
        id: event.id,
        summary: event.summary || null,
        start: event.start?.dateTime || event.start?.date || null,
        end: event.end?.dateTime || event.end?.date || null,
        hasMeetLink: false,
        meetingCode: null,
        hasEnded: false,
        conferenceRecord: null,
        transcript: null,
        smartNotes: null,
        issues: [],
      };

      // Check for Meet link
      let meetingCode: string | null = null;
      if (event.hangoutLink) {
        const match = event.hangoutLink.match(/meet\.google\.com\/([a-z]{3}-[a-z]{4}-[a-z]{3})/i);
        if (match) {
          meetingCode = match[1];
          analysis.hasMeetLink = true;
          analysis.meetingCode = meetingCode;
        }
      }

      // Check if ended
      const endTime = event.end?.dateTime ? new Date(event.end.dateTime) : null;
      analysis.hasEnded = endTime ? endTime <= now : false;

      if (!analysis.hasMeetLink) {
        analysis.issues.push('No Meet link found');
      }

      if (!analysis.hasEnded) {
        analysis.issues.push('Event has not ended yet');
      }

      // If has meet link and ended, check for conference record
      if (analysis.hasMeetLink && analysis.hasEnded && meetingCode) {
        log(`Checking conference record for ${meetingCode}...`);

        try {
          const filter = `space.meeting_code="${meetingCode}"`;
          const crParams = new URLSearchParams({ filter, pageSize: '10' });

          const crResponse = await fetch(
            `${MEET_API}/conferenceRecords?${crParams}`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );

          if (crResponse.ok) {
            const crData = await crResponse.json();
            const records = crData.conferenceRecords || [];

            if (records.length > 0) {
              const record = records[0];
              analysis.conferenceRecord = {
                found: true,
                name: record.name,
                startTime: record.startTime,
                endTime: record.endTime,
              };
              log(`Found conference record: ${record.name}`);

              // Check for transcript
              try {
                const trResponse = await fetch(
                  `${MEET_API}/${record.name}/transcripts`,
                  { headers: { Authorization: `Bearer ${accessToken}` } }
                );

                if (trResponse.ok) {
                  const trData = await trResponse.json();
                  const transcripts = trData.transcripts || [];

                  if (transcripts.length > 0) {
                    const transcript = transcripts[0];
                    analysis.transcript = {
                      found: true,
                      state: transcript.state,
                      name: transcript.name,
                    };
                    log(`Found transcript: ${transcript.name} (state: ${transcript.state})`);

                    if (transcript.state !== 'FILE_GENERATED') {
                      analysis.issues.push(`Transcript not ready: state is ${transcript.state}`);
                    }
                  } else {
                    analysis.transcript = { found: false };
                    // Don't add issue yet - check for Smart Notes first
                  }
                } else {
                  const trError = await trResponse.text();
                  analysis.issues.push(`Transcript API error: ${trError}`);
                }
              } catch (trErr) {
                analysis.issues.push(`Transcript fetch error: ${(trErr as Error).message}`);
              }

              // Check for Smart Notes (Gemini AI notes) via v2beta API
              try {
                log(`Checking Smart Notes (Gemini) for ${record.name}...`);
                const snResponse = await fetch(
                  `${MEET_API_BETA}/${record.name}/smartNotes`,
                  { headers: { Authorization: `Bearer ${accessToken}` } }
                );

                if (snResponse.ok) {
                  const snData = await snResponse.json();
                  const smartNotes = snData.smartNotes || [];

                  if (smartNotes.length > 0) {
                    const note = smartNotes[0];
                    analysis.smartNotes = {
                      found: true,
                      state: note.state,
                      name: note.name,
                      documentId: note.docsDestination?.document,
                    };
                    log(`Found Smart Notes: ${note.name} (state: ${note.state})`);

                    if (note.state === 'FILE_GENERATED') {
                      // Smart Notes ready - this can be used for draft generation
                      log(`Smart Notes ready with doc: ${note.docsDestination?.document}`);
                    }
                  } else {
                    analysis.smartNotes = { found: false };
                  }
                } else {
                  // Smart Notes API may return 404 if not enabled
                  analysis.smartNotes = { found: false };
                  log(`Smart Notes API returned ${snResponse.status}`);
                }
              } catch (snErr) {
                analysis.smartNotes = { found: false };
                log(`Smart Notes check error: ${(snErr as Error).message}`);
              }

              // Add issue if neither transcript nor smart notes are ready
              if (!analysis.transcript?.found && !analysis.smartNotes?.found) {
                analysis.issues.push('No transcripts or Smart Notes found for this conference record');
              } else if (
                analysis.transcript?.state !== 'FILE_GENERATED' &&
                analysis.smartNotes?.state !== 'FILE_GENERATED'
              ) {
                analysis.issues.push('Neither transcript nor Smart Notes are ready (FILE_GENERATED)');
              }
            } else {
              analysis.conferenceRecord = { found: false };
              analysis.issues.push('No conference record found for this meeting code');
            }
          } else {
            const crError = await crResponse.text();
            analysis.issues.push(`Conference record API error: ${crError}`);
          }
        } catch (crErr) {
          analysis.issues.push(`Conference record fetch error: ${(crErr as Error).message}`);
        }
      }

      eventAnalysis.push(analysis);
    }

    // Count events with issues
    const eventsWithMeet = eventAnalysis.filter(e => e.hasMeetLink);
    const eventsEnded = eventAnalysis.filter(e => e.hasEnded);
    const eventsWithMeetEnded = eventAnalysis.filter(e => e.hasMeetLink && e.hasEnded);
    const eventsWithConference = eventAnalysis.filter(e => e.conferenceRecord?.found);
    const eventsWithTranscript = eventAnalysis.filter(e => e.transcript?.found);
    const eventsWithSmartNotes = eventAnalysis.filter(e => e.smartNotes?.found);
    const eventsReady = eventAnalysis.filter(e =>
      e.transcript?.state === 'FILE_GENERATED' || e.smartNotes?.state === 'FILE_GENERATED'
    );

    return NextResponse.json({
      success: true,
      summary: {
        totalEvents: calendarEvents.length,
        eventsWithMeetLink: eventsWithMeet.length,
        eventsEnded: eventsEnded.length,
        eventsWithMeetLinkAndEnded: eventsWithMeetEnded.length,
        eventsWithConferenceRecord: eventsWithConference.length,
        eventsWithTranscript: eventsWithTranscript.length,
        eventsWithSmartNotes: eventsWithSmartNotes.length,
        eventsReadyForProcessing: eventsReady.length,
      },
      user: {
        id: user.id,
        email: user.email,
      },
      meetConnection: {
        googleEmail: meetConn.googleEmail,
        scopes: meetConn.scopes,
      },
      timeWindow: {
        start: windowStart.toISOString(),
        end: now.toISOString(),
        minutes: DEBUG_POLL_WINDOW_MINUTES,
      },
      events: eventAnalysis,
      debugLog,
    });
  } catch (error) {
    log(`Error: ${(error as Error).message}`);
    return NextResponse.json({
      success: false,
      error: 'Debug poll failed',
      message: (error as Error).message,
      debugLog,
    }, { status: 500 });
  }
}
