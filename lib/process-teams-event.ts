/**
 * Teams Event Processor
 *
 * Processes Microsoft Teams webhook notifications and fetches transcripts
 * via Graph API. Parallel structure to process-zoom-event.ts.
 */

import { db, meetings, rawEvents, transcripts } from '@/lib/db';
import { eq } from 'drizzle-orm';
import {
  getTranscriptContentByUrl,
  getOnlineMeeting,
  parseResourcePath,
  isTeamsConfigured,
} from '@/lib/teams-api';
import { parseVTT } from '@/lib/transcript/vtt-parser';
import { generateDraft } from '@/lib/generate-draft';
import { trackEvent } from '@/lib/analytics';
import type { RawEvent, NewMeeting, MeetingPlatform } from '@/lib/db/schema';
import type { ChangeNotificationItem, TranscriptNotificationPayload } from '@/lib/teams/types';

// Platform constant
const TEAMS_PLATFORM: MeetingPlatform = 'microsoft_teams';

/**
 * Result of processing a Teams event
 */
export interface ProcessResult {
  success: boolean;
  meetingId?: string;
  action: 'created' | 'updated' | 'skipped' | 'failed';
  error?: string;
}

/**
 * Logger helper for structured JSON logging
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
      service: 'teams-processor',
      ...data,
    })
  );
}

/**
 * Process a Teams webhook notification
 *
 * @param rawEvent - The raw event record from the database
 * @param notification - The parsed notification item
 * @returns ProcessResult indicating what action was taken
 */
export async function processTeamsEvent(
  rawEvent: RawEvent,
  notification: ChangeNotificationItem
): Promise<ProcessResult> {
  const startTime = Date.now();

  log('info', 'Processing Teams event', {
    rawEventId: rawEvent.id,
    eventType: rawEvent.eventType,
    resource: notification.resource,
  });

  // Check if Teams API is configured
  if (!isTeamsConfigured()) {
    log('error', 'Teams API not configured', { rawEventId: rawEvent.id });
    return { success: false, action: 'failed', error: 'Teams API not configured' };
  }

  // Skip already processed events
  if (rawEvent.status === 'processed') {
    log('info', 'Event already processed, skipping', { rawEventId: rawEvent.id });
    return { success: true, action: 'skipped' };
  }

  try {
    // Mark as processing
    await db
      .update(rawEvents)
      .set({ status: 'processing', updatedAt: new Date() })
      .where(eq(rawEvents.id, rawEvent.id));

    let result: ProcessResult;

    // Route based on event type
    if (rawEvent.eventType === 'teams.transcript.created') {
      result = await processTranscriptCreated(rawEvent, notification);
    } else if (rawEvent.eventType === 'teams.recording.created') {
      result = await processRecordingCreated(rawEvent, notification);
    } else {
      log('warn', 'Unknown Teams event type', {
        rawEventId: rawEvent.id,
        eventType: rawEvent.eventType,
      });
      result = { success: true, action: 'skipped' };
    }

    // Mark as processed on success
    if (result.success) {
      await db
        .update(rawEvents)
        .set({
          status: 'processed',
          processedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(rawEvents.id, rawEvent.id));

      log('info', 'Teams event processing completed', {
        rawEventId: rawEvent.id,
        action: result.action,
        meetingId: result.meetingId,
        duration: Date.now() - startTime,
      });
    }

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Mark as failed
    await db
      .update(rawEvents)
      .set({
        status: 'failed',
        errorMessage,
        updatedAt: new Date(),
      })
      .where(eq(rawEvents.id, rawEvent.id));

    log('error', 'Teams event processing failed', {
      rawEventId: rawEvent.id,
      error: errorMessage,
      duration: Date.now() - startTime,
    });

    return { success: false, action: 'failed', error: errorMessage };
  }
}

/**
 * Process a transcript.created notification
 */
async function processTranscriptCreated(
  rawEvent: RawEvent,
  notification: ChangeNotificationItem
): Promise<ProcessResult> {
  const { resource, resourceData, tenantId } = notification;

  log('info', 'Processing Teams transcript.created', {
    rawEventId: rawEvent.id,
    resource,
    resourceId: resourceData?.id,
  });

  // Parse resource path to get IDs
  const parsed = parseResourcePath(resource);

  if (!parsed.userId || !parsed.meetingId || !parsed.transcriptId) {
    log('error', 'Could not parse resource path', {
      rawEventId: rawEvent.id,
      resource,
      parsed,
    });
    return { success: false, action: 'failed', error: 'Invalid resource path' };
  }

  // Create a unique Teams meeting ID
  const teamsMeetingId = `teams-${tenantId}-${parsed.meetingId}`;

  // Check if meeting exists
  const [existingMeeting] = await db
    .select()
    .from(meetings)
    .where(eq(meetings.platformMeetingId, teamsMeetingId))
    .limit(1);

  let meetingId: string;
  let meetingTopic = 'Teams Meeting';

  // Try to fetch meeting details from Graph API
  try {
    const meetingDetails = await getOnlineMeeting(parsed.userId, parsed.meetingId);
    meetingTopic = meetingDetails.subject || 'Teams Meeting';

    log('info', 'Fetched meeting details', {
      subject: meetingTopic,
      startDateTime: meetingDetails.startDateTime,
    });
  } catch (err) {
    log('warn', 'Could not fetch meeting details', {
      error: err instanceof Error ? err.message : String(err),
      userId: parsed.userId,
      meetingId: parsed.meetingId,
    });
  }

  if (existingMeeting) {
    // Update existing meeting
    await db
      .update(meetings)
      .set({
        status: 'processing',
        topic: meetingTopic,
        updatedAt: new Date(),
      })
      .where(eq(meetings.id, existingMeeting.id));

    meetingId = existingMeeting.id;
    log('info', 'Updated existing meeting', { meetingId, teamsMeetingId });
  } else {
    // Create new meeting
    const [newMeeting] = await db
      .insert(meetings)
      .values({
        zoomMeetingId: teamsMeetingId, // Using zoomMeetingId for backwards compat
        platformMeetingId: teamsMeetingId,
        platform: TEAMS_PLATFORM,
        hostEmail: `user-${parsed.userId}@teams.microsoft.com`, // Placeholder
        topic: meetingTopic,
        status: 'processing',
      })
      .returning();

    meetingId = newMeeting.id;
    log('info', 'Created new meeting', { meetingId, teamsMeetingId, platform: TEAMS_PLATFORM });
  }

  // Fetch and store transcript
  await fetchAndStoreTeamsTranscript(
    meetingId,
    parsed.userId,
    parsed.meetingId,
    parsed.transcriptId,
    rawEvent.id
  );

  return {
    success: true,
    meetingId,
    action: existingMeeting ? 'updated' : 'created',
  };
}

/**
 * Process a recording.created notification
 * For now, we just log it - transcript is the priority
 */
async function processRecordingCreated(
  rawEvent: RawEvent,
  notification: ChangeNotificationItem
): Promise<ProcessResult> {
  log('info', 'Recording created event received (not processing content)', {
    rawEventId: rawEvent.id,
    resource: notification.resource,
  });

  // We could download the recording here if needed
  // For now, we wait for the transcript notification

  return { success: true, action: 'skipped' };
}

/**
 * Fetch transcript from Graph API and store it
 */
async function fetchAndStoreTeamsTranscript(
  meetingId: string,
  userId: string,
  graphMeetingId: string,
  transcriptId: string,
  rawEventId: string
): Promise<void> {
  const startTime = Date.now();

  log('info', '[TEAMS-3] Transcript file located via Graph API', {
    meetingId,
    userId,
    graphMeetingId,
    transcriptId,
  });

  try {
    // Build the transcript content URL
    const transcriptUrl = `users/${userId}/onlineMeetings/${graphMeetingId}/transcripts/${transcriptId}/content`;

    // Fetch transcript content (VTT format)
    const vttContent = await getTranscriptContentByUrl(transcriptUrl);

    log('info', '[TEAMS-4] VTT transcript downloaded', {
      meetingId,
      contentLength: vttContent.length,
      sizeBytes: vttContent.length,
    });

    // Parse VTT content
    const { fullText, segments, wordCount } = parseVTT(vttContent);

    log('info', 'Teams transcript parsed', {
      meetingId,
      wordCount,
      segmentCount: segments.length,
    });

    // Check for existing transcript
    const [existingTranscript] = await db
      .select({ id: transcripts.id })
      .from(transcripts)
      .where(eq(transcripts.meetingId, meetingId))
      .limit(1);

    let transcriptRecordId: string;

    if (existingTranscript) {
      // Update existing transcript
      await db
        .update(transcripts)
        .set({
          content: fullText,
          vttContent,
          speakerSegments: segments,
          wordCount,
          status: 'ready',
          lastFetchError: null,
          updatedAt: new Date(),
        })
        .where(eq(transcripts.id, existingTranscript.id));

      transcriptRecordId = existingTranscript.id;
      log('info', '[TEAMS-5] Transcript stored in database (updated)', { transcriptId: transcriptRecordId });
    } else {
      // Create new transcript
      const [newTranscript] = await db
        .insert(transcripts)
        .values({
          meetingId,
          content: fullText,
          vttContent,
          speakerSegments: segments,
          platform: TEAMS_PLATFORM,
          source: 'teams',
          wordCount,
          status: 'ready',
        })
        .returning({ id: transcripts.id });

      transcriptRecordId = newTranscript.id;
      log('info', '[TEAMS-5] Transcript stored in database (created)', { transcriptId: transcriptRecordId });
    }

    // Update meeting status
    await db
      .update(meetings)
      .set({ status: 'ready', updatedAt: new Date() })
      .where(eq(meetings.id, meetingId));

    // Track meeting_processed analytics event (non-blocking)
    const [meetingForAnalytics] = await db
      .select()
      .from(meetings)
      .where(eq(meetings.id, meetingId))
      .limit(1);

    if (meetingForAnalytics) {
      // Must await for serverless flush to complete
      try {
        await trackEvent(
          meetingForAnalytics.hostEmail || `teams-${meetingId}`,
          'meeting_processed',
          {
            platform: 'teams',
            meeting_id: meetingId,
            transcript_length: fullText.length,
            speakers_count: segments.length > 0 ? new Set(segments.map(s => s.speaker)).size : 0,
            duration_minutes: meetingForAnalytics.duration || 0,
          }
        );
      } catch { /* Analytics should never fail the operation */ }
    }

    // Generate draft email
    await generateDraftForMeeting(meetingId, transcriptRecordId, fullText);

    log('info', 'Teams transcript processing complete', {
      meetingId,
      transcriptId: transcriptRecordId,
      duration: Date.now() - startTime,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    log('error', 'Failed to fetch Teams transcript', {
      rawEventId,
      meetingId,
      error: errorMessage,
    });

    // Mark meeting as failed
    await db
      .update(meetings)
      .set({ status: 'failed', updatedAt: new Date() })
      .where(eq(meetings.id, meetingId));

    throw error;
  }
}

/**
 * Generate draft email for a meeting
 */
async function generateDraftForMeeting(
  meetingId: string,
  transcriptId: string,
  transcriptContent: string
): Promise<void> {
  try {
    // Fetch meeting details
    const [meeting] = await db
      .select()
      .from(meetings)
      .where(eq(meetings.id, meetingId))
      .limit(1);

    if (!meeting) {
      log('error', 'Meeting not found for draft generation', { meetingId });
      return;
    }

    log('info', '[TEAMS-6] Draft generation triggered', {
      meetingId,
      transcriptId,
      topic: meeting.topic,
    });

    const draftResult = await generateDraft({
      meetingId,
      transcriptId,
      context: {
        meetingTopic: meeting.topic || 'Teams Meeting',
        meetingDate: meeting.startTime
          ? meeting.startTime.toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })
          : new Date().toLocaleDateString('en-US'),
        hostName: meeting.hostEmail.split('@')[0] || 'Host',
        transcript: transcriptContent,
        senderName: meeting.hostEmail.split('@')[0],
      },
    });

    if (draftResult.success) {
      log('info', 'Draft generated successfully for Teams meeting', {
        meetingId,
        draftId: draftResult.draftId,
        qualityScore: draftResult.qualityScore,
      });
    } else {
      log('warn', 'Draft generation failed for Teams meeting', {
        meetingId,
        error: draftResult.error,
      });
    }
  } catch (error) {
    log('error', 'Draft generation error for Teams meeting', {
      meetingId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
