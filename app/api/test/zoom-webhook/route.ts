/**
 * POST /api/test/zoom-webhook
 * Test endpoint to simulate a Zoom recording.transcript_completed webhook
 * This bypasses signature verification and uses mock transcript data
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db, rawEvents, meetings, transcripts, drafts } from '@/lib/db';
import { processZoomEvent } from '@/lib/process-zoom-event';
import { desc } from 'drizzle-orm';

// Only allow in development or for authenticated users
export async function POST(request: NextRequest) {
  const { userId } = await auth();

  // Require authentication
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const startTime = Date.now();

  try {
    // Generate unique IDs for this test
    const testId = Date.now().toString();
    const meetingUuid = `test-meeting-${testId}`;
    const eventId = `recording.transcript_completed-${meetingUuid}-${testId}`;

    console.log(JSON.stringify({
      level: 'info',
      message: '[TEST-WEBHOOK] Starting test webhook simulation',
      testId,
      meetingUuid,
      userId,
    }));

    // Create realistic test webhook payload
    const testPayload = {
      event: 'recording.transcript_completed',
      event_ts: parseInt(testId),
      payload: {
        account_id: 'tRlIYqFaSYiH5DkTYI4TlQ',
        object: {
          uuid: meetingUuid,
          id: Math.floor(Math.random() * 1000000000),
          account_id: 'tRlIYqFaSYiH5DkTYI4TlQ',
          host_id: 'HAK0ibjiRFCyI4KcPFEyOQ',
          host_email: 'jimmy@playgroundgiants.com',
          topic: 'Test Sales Call - ReplySequence Demo',
          type: 2,
          start_time: new Date(Date.now() - 300000).toISOString(),
          duration: 5,
          timezone: 'America/Chicago',
          recording_files: [
            {
              id: `transcript-file-${testId}`,
              recording_start: new Date(Date.now() - 300000).toISOString(),
              recording_end: new Date().toISOString(),
              file_type: 'TRANSCRIPT',
              file_extension: 'VTT',
              file_size: 4521,
              download_url: `https://zoom.us/rec/download/test-transcript-${testId}`,
              status: 'completed',
              recording_type: 'audio_transcript',
            },
          ],
          // Include mock transcript content inline for testing
          // Real webhooks have download_url, but we'll inject mock content
          _test_transcript_content: getMockTranscriptContent(),
        },
      },
    };

    // Store raw event directly (bypassing signature verification)
    const [rawEvent] = await db
      .insert(rawEvents)
      .values({
        eventType: 'recording.transcript_completed',
        zoomEventId: eventId,
        payload: testPayload,
        status: 'pending',
        meetingId: meetingUuid,
      })
      .returning();

    console.log(JSON.stringify({
      level: 'info',
      message: '[TEST-WEBHOOK] Raw event stored',
      rawEventId: rawEvent.id,
      eventId,
    }));

    // Process the event (this will use the mock transcript)
    const result = await processZoomEvent(rawEvent);

    console.log(JSON.stringify({
      level: 'info',
      message: '[TEST-WEBHOOK] Event processing completed',
      rawEventId: rawEvent.id,
      action: result.action,
      meetingId: result.meetingId,
      durationMs: Date.now() - startTime,
    }));

    // Fetch the created records for response
    const [meeting] = await db
      .select()
      .from(meetings)
      .orderBy(desc(meetings.createdAt))
      .limit(1);

    const [transcript] = await db
      .select()
      .from(transcripts)
      .orderBy(desc(transcripts.createdAt))
      .limit(1);

    const [draft] = await db
      .select()
      .from(drafts)
      .orderBy(desc(drafts.createdAt))
      .limit(1);

    return NextResponse.json({
      success: true,
      testId,
      processingResult: result,
      records: {
        rawEvent: {
          id: rawEvent.id,
          status: rawEvent.status,
        },
        meeting: meeting
          ? {
              id: meeting.id,
              topic: meeting.topic,
              status: meeting.status,
              hostEmail: meeting.hostEmail,
            }
          : null,
        transcript: transcript
          ? {
              id: transcript.id,
              status: transcript.status,
              contentLength: transcript.content?.length || 0,
              wordCount: transcript.wordCount,
            }
          : null,
        draft: draft
          ? {
              id: draft.id,
              status: draft.status,
              subject: draft.subject,
              bodyPreview: draft.body?.substring(0, 200) + '...',
            }
          : null,
      },
      durationMs: Date.now() - startTime,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.log(JSON.stringify({
      level: 'error',
      message: '[TEST-WEBHOOK] Test webhook failed',
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      durationMs: Date.now() - startTime,
    }));

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        durationMs: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}

/**
 * Returns mock VTT transcript content for testing
 */
function getMockTranscriptContent(): string {
  return `WEBVTT

1
00:00:00.000 --> 00:00:03.500
Speaker 1: Hi everyone, thanks for joining this sales call today.

2
00:00:03.500 --> 00:00:08.000
Speaker 1: I'm excited to show you how ReplySequence can transform your follow-up workflow.

3
00:00:08.000 --> 00:00:12.500
Speaker 2: Thanks for having me. I've been looking for a solution to automate our meeting follow-ups.

4
00:00:12.500 --> 00:00:18.000
Speaker 1: Perfect. Let me walk you through the key features. First, we automatically capture transcripts from Zoom.

5
00:00:18.000 --> 00:00:23.500
Speaker 1: Then our AI generates personalized follow-up emails within minutes of your meeting ending.

6
00:00:23.500 --> 00:00:28.000
Speaker 2: That sounds great. What about action items? Can it extract those too?

7
00:00:28.000 --> 00:00:33.500
Speaker 1: Absolutely. We identify action items, assign owners, and include them in the follow-up email.

8
00:00:33.500 --> 00:00:38.000
Speaker 2: Impressive. I'd like to schedule a demo with my team next week. Can we do Tuesday at 2pm?

9
00:00:38.000 --> 00:00:42.500
Speaker 1: Tuesday at 2pm works perfectly. I'll send over a calendar invite right after this call.

10
00:00:42.500 --> 00:00:47.000
Speaker 2: Great. Also, can you send me pricing information for the enterprise plan?

11
00:00:47.000 --> 00:00:52.000
Speaker 1: Of course. I'll include that in my follow-up email along with a case study from a similar company.

12
00:00:52.000 --> 00:00:55.000
Speaker 2: Perfect. Thanks for your time today. Looking forward to the demo.

13
00:00:55.000 --> 00:00:58.000
Speaker 1: Thank you! Talk to you on Tuesday. Have a great day.`;
}
