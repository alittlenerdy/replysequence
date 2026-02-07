/**
 * Google Meet Event Processor
 *
 * Processes Google Meet Pub/Sub notifications and fetches transcripts
 * via Meet REST API. Parallel structure to process-teams-event.ts.
 */

import { db, meetings, rawEvents, transcripts } from '@/lib/db';
import { eq } from 'drizzle-orm';
import {
  getConferenceRecord,
  listTranscripts,
  listTranscriptEntries,
  listParticipants,
  getParticipantDisplayName,
  entriesToVTT,
  isMeetConfigured,
  downloadTranscriptFromDocs,
} from '@/lib/meet-api';
import { parseVTT } from '@/lib/transcript/vtt-parser';
import { generateDraft } from '@/lib/generate-draft';
import type { RawEvent, NewMeeting, MeetingPlatform } from '@/lib/db/schema';
import type { MeetWorkspaceEvent, MeetTranscript } from '@/lib/meet/types';

// Platform constant
const MEET_PLATFORM: MeetingPlatform = 'google_meet';

/**
 * Result of processing a Meet event
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
      service: 'meet-processor',
      ...data,
    })
  );
}

/**
 * Process a Meet Pub/Sub event
 *
 * @param rawEvent - The raw event record from the database
 * @param meetEvent - The parsed Workspace event
 * @param accessToken - Optional access token for user-delegated API calls
 * @returns ProcessResult indicating what action was taken
 */
export async function processMeetEvent(
  rawEvent: RawEvent,
  meetEvent: MeetWorkspaceEvent,
  accessToken?: string
): Promise<ProcessResult> {
  const startTime = Date.now();

  log('info', '[MEET-4] Processing Meet event', {
    rawEventId: rawEvent.id,
    eventType: rawEvent.eventType,
    conferenceRecord: meetEvent.conferenceRecord?.name,
  });

  // Check if Meet API is configured
  if (!isMeetConfigured()) {
    log('error', '[MEET-4] Meet API not configured', { rawEventId: rawEvent.id });
    return { success: false, action: 'failed', error: 'Meet API not configured' };
  }

  // Skip already processed events
  if (rawEvent.status === 'processed') {
    log('info', '[MEET-4] Event already processed, skipping', { rawEventId: rawEvent.id });
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
    if (rawEvent.eventType === 'meet.conference.ended') {
      result = await processConferenceEnded(rawEvent, meetEvent, accessToken);
    } else if (rawEvent.eventType === 'meet.transcript.fileGenerated') {
      result = await processTranscriptFileGenerated(rawEvent, meetEvent, accessToken);
    } else {
      log('warn', '[MEET-4] Unknown Meet event type', {
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

      log('info', '[MEET-10] Event processing completed', {
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

    log('error', '[MEET-10] Event processing failed', {
      rawEventId: rawEvent.id,
      error: errorMessage,
      duration: Date.now() - startTime,
    });

    return { success: false, action: 'failed', error: errorMessage };
  }
}

/**
 * Process a conference.ended event
 */
async function processConferenceEnded(
  rawEvent: RawEvent,
  meetEvent: MeetWorkspaceEvent,
  accessToken?: string
): Promise<ProcessResult> {
  const conferenceRecord = meetEvent.conferenceRecord;
  const conferenceRecordName = conferenceRecord?.name || conferenceRecord?.conferenceRecordName;

  if (!conferenceRecordName) {
    log('error', '[MEET-4] Missing conference record name', { rawEventId: rawEvent.id });
    return { success: false, action: 'failed', error: 'Missing conference record' };
  }

  log('info', '[MEET-4] Processing conference ended', {
    rawEventId: rawEvent.id,
    conferenceRecordName,
    meetingCode: conferenceRecord?.space?.meetingCode,
  });

  // Create unique Meet meeting ID using conference record name
  const meetMeetingId = `meet-${conferenceRecordName.replace('conferenceRecords/', '')}`;

  // Check if meeting already exists
  const [existingMeeting] = await db
    .select()
    .from(meetings)
    .where(eq(meetings.platformMeetingId, meetMeetingId))
    .limit(1);

  let meetingId: string;
  let meetingTopic = 'Google Meet';

  // Try to fetch conference details from Meet API
  try {
    const conferenceDetails = await getConferenceRecord(conferenceRecordName, accessToken);
    if (conferenceDetails.space?.meetingCode) {
      meetingTopic = `Meet: ${conferenceDetails.space.meetingCode}`;
    }

    log('info', '[MEET-4] Fetched conference details', {
      conferenceRecordName,
      meetingCode: conferenceDetails.space?.meetingCode,
      startTime: conferenceDetails.startTime,
      endTime: conferenceDetails.endTime,
    });
  } catch (err) {
    log('warn', '[MEET-4] Could not fetch conference details', {
      error: err instanceof Error ? err.message : String(err),
      conferenceRecordName,
    });
  }

  if (existingMeeting) {
    // Update existing meeting
    await db
      .update(meetings)
      .set({
        status: 'processing',
        topic: meetingTopic,
        endTime: conferenceRecord?.endTime ? new Date(conferenceRecord.endTime) : undefined,
        updatedAt: new Date(),
      })
      .where(eq(meetings.id, existingMeeting.id));

    meetingId = existingMeeting.id;
    log('info', '[MEET-4] Updated existing meeting', { meetingId, meetMeetingId });
  } else {
    // Create new meeting
    const [newMeeting] = await db
      .insert(meetings)
      .values({
        zoomMeetingId: meetMeetingId, // Using zoomMeetingId for backwards compat
        platformMeetingId: meetMeetingId,
        platform: MEET_PLATFORM,
        hostEmail: 'organizer@meet.google.com', // Placeholder - Meet doesn't expose in events
        topic: meetingTopic,
        startTime: conferenceRecord?.startTime ? new Date(conferenceRecord.startTime) : undefined,
        endTime: conferenceRecord?.endTime ? new Date(conferenceRecord.endTime) : undefined,
        status: 'processing',
      })
      .returning();

    meetingId = newMeeting.id;
    log('info', '[MEET-4] Created new meeting', { meetingId, meetMeetingId, platform: MEET_PLATFORM });
  }

  // Fetch and store transcript
  await fetchAndStoreMeetTranscript(
    meetingId,
    conferenceRecordName,
    rawEvent.id,
    accessToken
  );

  return {
    success: true,
    meetingId,
    action: existingMeeting ? 'updated' : 'created',
  };
}

/**
 * Process a transcript.fileGenerated event
 * This is triggered when a transcript file becomes available in Google Docs
 */
async function processTranscriptFileGenerated(
  rawEvent: RawEvent,
  meetEvent: MeetWorkspaceEvent,
  accessToken?: string
): Promise<ProcessResult> {
  const conferenceRecordName = meetEvent.conferenceRecord?.name || meetEvent.conferenceRecord?.conferenceRecordName;

  if (!conferenceRecordName) {
    log('error', '[MEET-4] Missing conference record name in transcript event', { rawEventId: rawEvent.id });
    return { success: false, action: 'failed', error: 'Missing conference record' };
  }

  log('info', '[MEET-4] Processing transcript fileGenerated', {
    rawEventId: rawEvent.id,
    conferenceRecordName,
    hasAccessToken: !!accessToken,
  });

  // Create unique Meet meeting ID using conference record name
  const meetMeetingId = `meet-${conferenceRecordName.replace('conferenceRecords/', '')}`;

  // Check if meeting already exists
  const [existingMeeting] = await db
    .select()
    .from(meetings)
    .where(eq(meetings.platformMeetingId, meetMeetingId))
    .limit(1);

  let meetingId: string;
  let meetingTopic = 'Google Meet';

  // Try to fetch conference details from Meet API
  try {
    const conferenceDetails = await getConferenceRecord(conferenceRecordName, accessToken);
    if (conferenceDetails.space?.meetingCode) {
      meetingTopic = `Meet: ${conferenceDetails.space.meetingCode}`;
    }

    log('info', '[MEET-4] Fetched conference details', {
      conferenceRecordName,
      meetingCode: conferenceDetails.space?.meetingCode,
      startTime: conferenceDetails.startTime,
      endTime: conferenceDetails.endTime,
    });

    if (existingMeeting) {
      // Update existing meeting with more details
      await db
        .update(meetings)
        .set({
          status: 'processing',
          topic: meetingTopic,
          startTime: conferenceDetails.startTime ? new Date(conferenceDetails.startTime) : undefined,
          endTime: conferenceDetails.endTime ? new Date(conferenceDetails.endTime) : undefined,
          updatedAt: new Date(),
        })
        .where(eq(meetings.id, existingMeeting.id));

      meetingId = existingMeeting.id;
      log('info', '[MEET-4] Updated existing meeting', { meetingId, meetMeetingId });
    } else {
      // Create new meeting
      const [newMeeting] = await db
        .insert(meetings)
        .values({
          zoomMeetingId: meetMeetingId,
          platformMeetingId: meetMeetingId,
          platform: MEET_PLATFORM,
          hostEmail: 'organizer@meet.google.com', // Placeholder
          topic: meetingTopic,
          startTime: conferenceDetails.startTime ? new Date(conferenceDetails.startTime) : undefined,
          endTime: conferenceDetails.endTime ? new Date(conferenceDetails.endTime) : undefined,
          status: 'processing',
        })
        .returning();

      meetingId = newMeeting.id;
      log('info', '[MEET-4] Created new meeting from transcript event', { meetingId, meetMeetingId, platform: MEET_PLATFORM });
    }
  } catch (err) {
    log('warn', '[MEET-4] Could not fetch conference details, creating meeting anyway', {
      error: err instanceof Error ? err.message : String(err),
      conferenceRecordName,
    });

    if (existingMeeting) {
      meetingId = existingMeeting.id;
      await db
        .update(meetings)
        .set({ status: 'processing', updatedAt: new Date() })
        .where(eq(meetings.id, existingMeeting.id));
    } else {
      const [newMeeting] = await db
        .insert(meetings)
        .values({
          zoomMeetingId: meetMeetingId,
          platformMeetingId: meetMeetingId,
          platform: MEET_PLATFORM,
          hostEmail: 'organizer@meet.google.com',
          topic: meetingTopic,
          status: 'processing',
        })
        .returning();

      meetingId = newMeeting.id;
    }
  }

  // Fetch and store transcript - since we got a fileGenerated event, it should be ready
  await fetchAndStoreMeetTranscript(
    meetingId,
    conferenceRecordName,
    rawEvent.id,
    accessToken
  );

  return {
    success: true,
    meetingId,
    action: existingMeeting ? 'updated' : 'created',
  };
}

/**
 * Fetch transcript from Meet API and store it
 */
async function fetchAndStoreMeetTranscript(
  meetingId: string,
  conferenceRecordName: string,
  rawEventId: string,
  accessToken?: string
): Promise<void> {
  const startTime = Date.now();

  log('info', '[MEET-5] Starting transcript fetch', {
    meetingId,
    conferenceRecordName,
    hasAccessToken: !!accessToken,
  });

  try {
    // List transcripts for this conference
    const transcriptList = await listTranscripts(conferenceRecordName, accessToken);

    if (transcriptList.length === 0) {
      log('warn', '[MEET-5] No transcripts found for conference', {
        meetingId,
        conferenceRecordName,
      });

      // Mark meeting as ready (no transcript available)
      await db
        .update(meetings)
        .set({ status: 'ready', updatedAt: new Date() })
        .where(eq(meetings.id, meetingId));

      return;
    }

    // Find transcript that is ready (FILE_GENERATED state)
    const readyTranscript = transcriptList.find(
      (t: MeetTranscript) => t.state === 'FILE_GENERATED'
    );

    if (!readyTranscript) {
      log('warn', '[MEET-5] No ready transcript found', {
        meetingId,
        conferenceRecordName,
        transcriptStates: transcriptList.map((t: MeetTranscript) => t.state),
      });

      // Mark meeting as pending - transcript may become ready later
      await db
        .update(meetings)
        .set({ status: 'pending', updatedAt: new Date() })
        .where(eq(meetings.id, meetingId));

      return;
    }

    log('info', '[MEET-5] Transcript located', {
      meetingId,
      transcriptName: readyTranscript.name,
      state: readyTranscript.state,
      hasDocsDestination: !!readyTranscript.docsDestination?.document,
    });

    // Fetch transcript entries
    const entries = await listTranscriptEntries(readyTranscript.name, accessToken);

    log('info', '[MEET-6] Transcript entries downloaded', {
      meetingId,
      entryCount: entries.length,
    });

    let fullText: string;
    let vttContent: string;
    let segments: Array<{ speaker: string; text: string; start_time: number; end_time: number }>;
    let wordCount: number;

    // If no entries but docsDestination is available, download from Google Docs
    if (entries.length === 0 && readyTranscript.docsDestination?.document) {
      const documentId = readyTranscript.docsDestination.document;
      log('info', '[MEET-6] No entries from API, downloading from Google Docs', {
        meetingId,
        documentId,
      });

      try {
        const docsContent = await downloadTranscriptFromDocs(documentId, accessToken);

        log('info', '[MEET-6] Transcript downloaded from Google Docs', {
          meetingId,
          contentLength: docsContent.length,
        });

        // Google Docs exports transcript as plain text with timestamps
        // Format: "Speaker Name\nTimestamp\nText\n\nSpeaker Name\n..."
        fullText = docsContent;
        vttContent = ''; // No VTT available from Docs export
        segments = []; // Could parse Docs format later if needed
        wordCount = docsContent.split(/\s+/).filter(Boolean).length;

        log('info', '[MEET-7] Transcript from Docs processed', {
          meetingId,
          wordCount,
        });
      } catch (docsError) {
        log('error', '[MEET-6] Failed to download from Google Docs', {
          meetingId,
          documentId,
          error: docsError instanceof Error ? docsError.message : String(docsError),
        });
        throw docsError;
      }
    } else if (entries.length > 0) {
      // Fetch participants to map participant IDs to names
      const participants = await listParticipants(conferenceRecordName, accessToken);
      const participantNames = new Map<string, string>();

      for (const participant of participants) {
        participantNames.set(participant.name, getParticipantDisplayName(participant));
      }

      log('info', '[MEET-6] Participant names resolved', {
        meetingId,
        participantCount: participants.length,
      });

      // Convert entries to VTT format for consistent parsing
      vttContent = entriesToVTT(entries, participantNames);

      log('info', '[MEET-7] Transcript converted to VTT', {
        meetingId,
        vttLength: vttContent.length,
      });

      // Parse VTT content
      const parsed = parseVTT(vttContent);
      fullText = parsed.fullText;
      segments = parsed.segments;
      wordCount = parsed.wordCount;
    } else {
      // No entries and no docs destination - empty transcript
      log('warn', '[MEET-6] No transcript content available', {
        meetingId,
        hasDocsDestination: !!readyTranscript.docsDestination,
      });
      fullText = '';
      vttContent = '';
      segments = [];
      wordCount = 0;
    }

    log('info', '[MEET-7] Transcript parsed', {
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
      log('info', '[MEET-8] Transcript stored in database (updated)', { transcriptId: transcriptRecordId });
    } else {
      // Create new transcript
      const [newTranscript] = await db
        .insert(transcripts)
        .values({
          meetingId,
          content: fullText,
          vttContent,
          speakerSegments: segments,
          platform: MEET_PLATFORM,
          source: 'meet',
          wordCount,
          status: 'ready',
        })
        .returning({ id: transcripts.id });

      transcriptRecordId = newTranscript.id;
      log('info', '[MEET-8] Transcript stored in database (created)', { transcriptId: transcriptRecordId });
    }

    // Update meeting status
    await db
      .update(meetings)
      .set({ status: 'ready', updatedAt: new Date() })
      .where(eq(meetings.id, meetingId));

    // Generate draft email
    await generateDraftForMeeting(meetingId, transcriptRecordId, fullText);

    log('info', '[MEET-10] Transcript processing complete', {
      meetingId,
      transcriptId: transcriptRecordId,
      duration: Date.now() - startTime,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    log('error', '[MEET-8] Failed to fetch Meet transcript', {
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
      log('error', '[MEET-9] Meeting not found for draft generation', { meetingId });
      return;
    }

    log('info', '[MEET-9] Draft generation triggered', {
      meetingId,
      transcriptId,
      topic: meeting.topic,
    });

    const draftResult = await generateDraft({
      meetingId,
      transcriptId,
      context: {
        meetingTopic: meeting.topic || 'Google Meet',
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
      log('info', '[MEET-9] Draft generated successfully', {
        meetingId,
        draftId: draftResult.draftId,
        qualityScore: draftResult.qualityScore,
      });
    } else {
      log('warn', '[MEET-9] Draft generation failed', {
        meetingId,
        error: draftResult.error,
      });
    }
  } catch (error) {
    log('error', '[MEET-9] Draft generation error', {
      meetingId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
