/**
 * Recall.ai Webhook Handler
 * Receives bot status updates and real-time transcripts from Recall.ai
 */

import { NextRequest, NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { db, recallBots, meetings, transcripts as transcriptsTable, users, calendarEvents } from '@/lib/db';
import { getRecallClient } from '@/lib/recall/client';
import { generateDraft } from '@/lib/generate-draft';
import type { BotStatus, TranscriptWord, TranscriptSpeaker } from '@/lib/recall/types';
import crypto from 'crypto';

// Verify webhook signature (Recall uses Svix-style webhook signing)
const RECALL_WEBHOOK_SECRET = process.env.RECALL_WEBHOOK_SECRET;

/**
 * Verify Recall webhook signature using HMAC-SHA256.
 * Recall signs: "{webhook-id}.{webhook-timestamp}.{payload}"
 * Secret has whsec_ prefix that must be stripped, then base64-decoded.
 * Signature header format: "v1,{base64-signature}"
 */
function verifyRecallSignature(
  rawBody: string,
  msgId: string,
  msgTimestamp: string,
  signatureHeader: string
): boolean {
  if (!RECALL_WEBHOOK_SECRET) return true;
  try {
    // Strip whsec_ prefix and decode the secret
    const secretStr = RECALL_WEBHOOK_SECRET.startsWith('whsec_')
      ? RECALL_WEBHOOK_SECRET.slice(6)
      : RECALL_WEBHOOK_SECRET;
    const key = Buffer.from(secretStr, 'base64');

    // Construct the signed content
    const toSign = `${msgId}.${msgTimestamp}.${rawBody}`;
    const expectedSignature = crypto
      .createHmac('sha256', key)
      .update(toSign)
      .digest('base64');

    // Check against all signature versions in the header (comma-separated)
    const signatures = signatureHeader.split(' ');
    for (const sig of signatures) {
      const [version, value] = sig.split(',');
      if (version === 'v1' && value) {
        try {
          if (crypto.timingSafeEqual(
            Buffer.from(value, 'base64'),
            Buffer.from(expectedSignature, 'base64')
          )) {
            return true;
          }
        } catch {
          // Length mismatch, try next
        }
      }
    }
    return false;
  } catch {
    return false;
  }
}

export const maxDuration = 60; // Allow up to 60 seconds for processing

interface RecallWebhookPayload {
  event: string;
  data: {
    bot_id: string;
    status?: {
      code: BotStatus;
      message?: string;
      created_at: string;
    };
    transcript?: {
      words: TranscriptWord[];
      is_final: boolean;
      speaker?: TranscriptSpeaker;
    };
    recording?: {
      id: string;
      status: string;
      media_shortcuts?: {
        video_mixed?: string;
        audio_mixed?: string;
      };
    };
  };
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Get raw body for potential signature verification
    const rawBody = await request.text();
    let payload: RecallWebhookPayload;

    try {
      payload = JSON.parse(rawBody);
    } catch {
      console.error('[RECALL-WEBHOOK] Invalid JSON payload');
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    console.log('[RECALL-WEBHOOK] Received event:', {
      event: payload.event,
      botId: payload.data?.bot_id,
      status: payload.data?.status?.code,
    });

    // Verify webhook signature if configured
    if (RECALL_WEBHOOK_SECRET) {
      const msgId = request.headers.get('webhook-id') || request.headers.get('svix-id');
      const msgTimestamp = request.headers.get('webhook-timestamp') || request.headers.get('svix-timestamp');
      const msgSignature = request.headers.get('webhook-signature') || request.headers.get('svix-signature');

      if (!msgId || !msgTimestamp || !msgSignature) {
        console.error('[RECALL-WEBHOOK] Missing webhook verification headers');
        return NextResponse.json({ error: 'Missing signature headers' }, { status: 401 });
      }

      // Reject stale webhooks (older than 5 minutes)
      const timestampSeconds = parseInt(msgTimestamp, 10);
      const now = Math.floor(Date.now() / 1000);
      if (Math.abs(now - timestampSeconds) > 300) {
        console.error('[RECALL-WEBHOOK] Webhook timestamp too old', { timestampSeconds, now });
        return NextResponse.json({ error: 'Stale webhook' }, { status: 401 });
      }

      if (!verifyRecallSignature(rawBody, msgId, msgTimestamp, msgSignature)) {
        console.error('[RECALL-WEBHOOK] Invalid webhook signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    const { event, data } = payload;
    const botId = data.bot_id;

    if (!botId) {
      console.error('[RECALL-WEBHOOK] Missing bot_id in payload');
      return NextResponse.json({ error: 'Missing bot_id' }, { status: 400 });
    }

    // Find our bot record
    const [botRecord] = await db
      .select()
      .from(recallBots)
      .where(eq(recallBots.recallBotId, botId))
      .limit(1);

    if (!botRecord) {
      console.warn('[RECALL-WEBHOOK] Unknown bot ID:', { botId });
      // Still return 200 to prevent retries for unknown bots
      return NextResponse.json({ received: true, unknown_bot: true });
    }

    // Handle different event types
    switch (event) {
      case 'bot.status_change':
        await handleBotStatusChange(botRecord, data);
        break;

      case 'bot.transcription':
        await handleRealTimeTranscript(botRecord, data);
        break;

      case 'bot.done':
      case 'recording.done':
        await handleBotComplete(botRecord, data);
        break;

      case 'transcript.done':
        await handleTranscriptComplete(botRecord, data);
        break;

      default:
        console.log('[RECALL-WEBHOOK] Unhandled event type:', { event });
    }

    console.log('[RECALL-WEBHOOK] Event processed:', {
      event,
      botId,
      duration: Date.now() - startTime,
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[RECALL-WEBHOOK] Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Handle bot status change events
 */
async function handleBotStatusChange(
  botRecord: typeof recallBots.$inferSelect,
  data: RecallWebhookPayload['data']
) {
  const status = data.status;
  if (!status) return;

  console.log('[RECALL-WEBHOOK] Bot status change:', {
    botId: botRecord.recallBotId,
    oldStatus: botRecord.status,
    newStatus: status.code,
  });

  // Map Recall status to our status
  let ourStatus: typeof botRecord.status = botRecord.status;
  const updates: Partial<typeof recallBots.$inferInsert> = {
    lastStatusCode: status.code,
    lastStatusMessage: status.message,
    updatedAt: new Date(),
  };

  switch (status.code) {
    case 'joining_call':
      ourStatus = 'joining';
      break;
    case 'in_waiting_room':
      ourStatus = 'joining';
      break;
    case 'in_call_not_recording':
      ourStatus = 'in_call';
      updates.actualJoinAt = new Date();
      break;
    case 'in_call_recording':
      ourStatus = 'recording';
      break;
    case 'call_ended':
    case 'done':
    case 'analysis_done':
      ourStatus = 'completed';
      updates.endedAt = new Date();
      break;
    case 'fatal':
      ourStatus = 'failed';
      updates.errorMessage = status.message || 'Bot encountered a fatal error';
      break;
  }

  updates.status = ourStatus;

  await db
    .update(recallBots)
    .set(updates)
    .where(eq(recallBots.id, botRecord.id));
}

/**
 * Handle real-time transcript events (if enabled)
 */
async function handleRealTimeTranscript(
  botRecord: typeof recallBots.$inferSelect,
  data: RecallWebhookPayload['data']
) {
  const transcriptData = data.transcript;
  if (!transcriptData) return;

  console.log('[RECALL-WEBHOOK] Real-time transcript:', {
    botId: botRecord.recallBotId,
    isFinal: transcriptData.is_final,
    wordCount: transcriptData.words?.length || 0,
  });

  // For now, we'll just log real-time transcripts
  // Full transcript processing happens when bot is done
  // Could be extended to show live transcription in UI
}

/**
 * Handle bot completion - fetch full transcript and create meeting record
 */
async function handleBotComplete(
  botRecord: typeof recallBots.$inferSelect,
  data: RecallWebhookPayload['data']
) {
  console.log('[RECALL-WEBHOOK] Bot complete, fetching transcript:', {
    botId: botRecord.recallBotId,
    recordingId: data.recording?.id,
  });

  // Update recording info if provided
  if (data.recording) {
    await db
      .update(recallBots)
      .set({
        recordingId: data.recording.id,
        recordingUrl: data.recording.media_shortcuts?.video_mixed ||
                      data.recording.media_shortcuts?.audio_mixed,
        updatedAt: new Date(),
      })
      .where(eq(recallBots.id, botRecord.id));
  }

  // Fetch the full transcript from Recall
  const recallClient = getRecallClient();
  const transcript = await recallClient.getTranscript(botRecord.recallBotId!);

  if (!transcript || !transcript.words || transcript.words.length === 0) {
    console.log('[RECALL-WEBHOOK] No transcript available yet');
    return;
  }

  // Update transcript status
  await db
    .update(recallBots)
    .set({
      transcriptId: transcript.id,
      transcriptStatus: transcript.status,
      updatedAt: new Date(),
    })
    .where(eq(recallBots.id, botRecord.id));

  // Process transcript if it's ready
  if (transcript.status === 'done') {
    await processTranscriptAndGenerateDraft(botRecord, transcript);
  }
}

/**
 * Handle transcript completion event
 */
async function handleTranscriptComplete(
  botRecord: typeof recallBots.$inferSelect,
  data: RecallWebhookPayload['data']
) {
  console.log('[RECALL-WEBHOOK] Transcript complete:', {
    botId: botRecord.recallBotId,
  });

  // Fetch the full transcript
  const recallClient = getRecallClient();
  const transcript = await recallClient.getTranscript(botRecord.recallBotId!);

  if (!transcript || !transcript.words) {
    console.error('[RECALL-WEBHOOK] Failed to fetch transcript');
    return;
  }

  await processTranscriptAndGenerateDraft(botRecord, transcript);
}

/**
 * Process transcript and generate email draft
 */
async function processTranscriptAndGenerateDraft(
  botRecord: typeof recallBots.$inferSelect,
  transcript: { id: string; words?: Array<{ text: string; start_time: number; end_time: number; speaker_id?: string }>; speakers?: Array<{ id: string; name?: string }> }
) {
  console.log('[RECALL-WEBHOOK] Processing transcript:', {
    botId: botRecord.recallBotId,
    wordCount: transcript.words?.length || 0,
  });

  // Get user info
  const [user] = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, botRecord.userId))
    .limit(1);

  if (!user) {
    console.error('[RECALL-WEBHOOK] User not found for bot');
    return;
  }

  // Convert transcript words to text with speaker labels
  const speakerMap = new Map(
    transcript.speakers?.map(s => [s.id, s.name || `Speaker ${s.id}`]) || []
  );

  let currentSpeaker = '';
  let fullText = '';
  const speakerSegments: Array<{ speaker: string; start_time: number; end_time: number; text: string }> = [];
  let currentSegment: { speaker: string; start_time: number; end_time: number; text: string } | null = null;

  for (const word of transcript.words || []) {
    const speaker = speakerMap.get(word.speaker_id || '') || 'Unknown';

    if (speaker !== currentSpeaker) {
      // Save previous segment
      if (currentSegment) {
        speakerSegments.push(currentSegment);
      }

      // Start new segment
      currentSpeaker = speaker;
      fullText += `\n\n${speaker}: `;
      currentSegment = {
        speaker,
        start_time: word.start_time,
        end_time: word.end_time,
        text: word.text,
      };
    } else {
      if (currentSegment) {
        currentSegment.end_time = word.end_time;
        currentSegment.text += ' ' + word.text;
      }
    }

    fullText += word.text + ' ';
  }

  // Save last segment
  if (currentSegment) {
    speakerSegments.push(currentSegment);
  }

  // Determine platform from bot record
  const platform = botRecord.platform || 'zoom';

  // Create or update meeting record
  let meeting = botRecord.meetingId ? await db.query.meetings.findFirst({
    where: eq(meetings.id, botRecord.meetingId),
  }) : null;

  if (!meeting) {
    // Create new meeting record
    const [newMeeting] = await db
      .insert(meetings)
      .values({
        userId: botRecord.userId,
        platform,
        zoomMeetingId: botRecord.recallBotId!, // Use recall bot ID as external ID
        platformMeetingId: botRecord.calendarEventId || botRecord.recallBotId,
        hostEmail: user.email,
        topic: botRecord.meetingTitle || 'Meeting',
        startTime: botRecord.actualJoinAt || botRecord.scheduledJoinAt,
        endTime: botRecord.endedAt,
        status: 'processing',
        processingStep: 'transcript_stored',
        processingProgress: 60,
      })
      .returning();
    meeting = newMeeting;

    // Link meeting to bot record
    await db
      .update(recallBots)
      .set({ meetingId: meeting.id, updatedAt: new Date() })
      .where(eq(recallBots.id, botRecord.id));
  }

  // Create transcript record
  const [transcriptRecord] = await db
    .insert(transcriptsTable)
    .values({
      meetingId: meeting.id,
      platform,
      content: fullText.trim(),
      speakerSegments,
      source: 'recall',
      language: 'en',
      wordCount: transcript.words?.length || 0,
      status: 'ready',
    })
    .returning();

  console.log('[RECALL-WEBHOOK] Transcript stored:', {
    meetingId: meeting.id,
    transcriptId: transcriptRecord.id,
  });

  // Update meeting status
  await db
    .update(meetings)
    .set({
      status: 'ready',
      processingStep: 'draft_generation',
      processingProgress: 70,
      updatedAt: new Date(),
    })
    .where(eq(meetings.id, meeting.id));

  // Check auto-process preference before generating draft
  if (botRecord.calendarEventId) {
    const [calendarEvent] = await db
      .select({ autoProcess: calendarEvents.autoProcess })
      .from(calendarEvents)
      .where(
        and(
          eq(calendarEvents.userId, botRecord.userId),
          eq(calendarEvents.externalEventId, botRecord.calendarEventId)
        )
      )
      .limit(1);

    if (calendarEvent?.autoProcess === 'disabled') {
      console.log('[RECALL-WEBHOOK] Auto-process disabled, skipping draft generation:', {
        meetingId: meeting.id,
        calendarEventId: botRecord.calendarEventId,
      });

      // Update meeting status to ready (transcript stored, but no draft)
      await db
        .update(meetings)
        .set({
          status: 'ready',
          processingStep: 'completed',
          processingProgress: 100,
          processingCompletedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(meetings.id, meeting.id));

      // Update bot record as complete
      await db
        .update(recallBots)
        .set({
          status: 'completed',
          updatedAt: new Date(),
        })
        .where(eq(recallBots.id, botRecord.id));

      return;
    }
  }

  // Generate email draft
  try {
    console.log('[RECALL-WEBHOOK] Generating draft...');

    // Build context for draft generation
    const meetingDate = meeting.startTime
      ? new Date(meeting.startTime).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : new Date().toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });

    const draft = await generateDraft({
      meetingId: meeting.id,
      transcriptId: transcriptRecord.id,
      context: {
        meetingTopic: meeting.topic || 'Meeting',
        meetingDate,
        hostName: user.email.split('@')[0] || 'Host',
        hostEmail: user.email,
        transcript: fullText.trim(),
      },
    });

    console.log('[RECALL-WEBHOOK] Draft generated:', {
      meetingId: meeting.id,
      draftId: draft?.draftId,
      success: draft?.success,
    });

    // Update meeting as complete
    await db
      .update(meetings)
      .set({
        status: 'completed',
        processingStep: 'completed',
        processingProgress: 100,
        processingCompletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(meetings.id, meeting.id));

    // Update bot record as complete
    await db
      .update(recallBots)
      .set({
        status: 'completed',
        updatedAt: new Date(),
      })
      .where(eq(recallBots.id, botRecord.id));

  } catch (error) {
    console.error('[RECALL-WEBHOOK] Draft generation failed:', error);

    await db
      .update(meetings)
      .set({
        status: 'failed',
        processingStep: 'failed',
        processingError: error instanceof Error ? error.message : 'Draft generation failed',
        updatedAt: new Date(),
      })
      .where(eq(meetings.id, meeting.id));
  }
}

// Handle GET for webhook verification (if Recall requires it)
export async function GET(request: NextRequest) {
  const challenge = request.nextUrl.searchParams.get('challenge');
  if (challenge) {
    return new NextResponse(challenge);
  }
  return NextResponse.json({ status: 'ok' });
}
