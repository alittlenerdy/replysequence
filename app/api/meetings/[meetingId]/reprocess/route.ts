import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { db, meetings, transcripts, rawEvents, users } from '@/lib/db';
import { eq, and, desc } from 'drizzle-orm';
import { processZoomEvent } from '@/lib/process-zoom-event';
import { startProcessing } from '@/lib/processing-progress';
import { generateDraft } from '@/lib/generate-draft';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * POST /api/meetings/[meetingId]/reprocess
 * Retry processing a failed meeting.
 * - If transcript exists: regenerate draft
 * - If no transcript: re-run from raw event (Zoom only for now)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ meetingId: string }> }
) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { meetingId } = await params;

    // Get user from database
    const [dbUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.clerkId, user.id))
      .limit(1);

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get meeting (must belong to user and be in failed state)
    const [meeting] = await db
      .select()
      .from(meetings)
      .where(and(
        eq(meetings.id, meetingId),
        eq(meetings.userId, dbUser.id)
      ))
      .limit(1);

    if (!meeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    if (meeting.status !== 'failed') {
      return NextResponse.json(
        { error: 'Meeting is not in failed state' },
        { status: 400 }
      );
    }

    // Check if transcript already exists
    const [transcript] = await db
      .select()
      .from(transcripts)
      .where(eq(transcripts.meetingId, meetingId))
      .limit(1);

    if (transcript?.content) {
      // Transcript exists — just regenerate the draft
      console.log(JSON.stringify({
        level: 'info',
        tag: '[REPROCESS]',
        message: 'Transcript exists, regenerating draft',
        meetingId,
      }));

      await startProcessing(meetingId);

      const result = await generateDraft({
        meetingId,
        transcriptId: transcript.id,
        context: {
          meetingTopic: meeting.topic || 'Meeting',
          meetingDate: meeting.startTime
            ? meeting.startTime.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })
            : new Date().toLocaleDateString('en-US'),
          hostName: meeting.hostEmail?.split('@')[0] || 'Host',
          hostEmail: meeting.hostEmail || undefined,
          transcript: transcript.content,
          senderName: meeting.hostEmail?.split('@')[0] || user.firstName || 'User',
        },
      });

      if (result.success) {
        // Mark as ready
        await db
          .update(meetings)
          .set({ status: 'ready', updatedAt: new Date() })
          .where(eq(meetings.id, meetingId));

        return NextResponse.json({ success: true, action: 'draft_regenerated' });
      } else {
        return NextResponse.json(
          { success: false, error: result.error || 'Draft generation failed' },
          { status: 500 }
        );
      }
    }

    // No transcript — try to reprocess from raw event
    // Find the most recent raw event linked to this meeting's platform ID
    if (meeting.platform === 'zoom' && meeting.platformMeetingId) {
      const [rawEvent] = await db
        .select()
        .from(rawEvents)
        .where(eq(rawEvents.meetingId, meeting.platformMeetingId))
        .orderBy(desc(rawEvents.createdAt))
        .limit(1);

      if (!rawEvent) {
        return NextResponse.json(
          { error: 'No raw event found to reprocess. The meeting may need to be re-recorded.' },
          { status: 404 }
        );
      }

      console.log(JSON.stringify({
        level: 'info',
        tag: '[REPROCESS]',
        message: 'Reprocessing from raw event',
        meetingId,
        rawEventId: rawEvent.id,
        platform: meeting.platform,
      }));

      // Reset meeting status
      await startProcessing(meetingId);

      // Re-run Zoom processing (non-blocking — return immediately)
      processZoomEvent(rawEvent).catch(err => {
        console.log(JSON.stringify({
          level: 'error',
          tag: '[REPROCESS]',
          message: 'Reprocessing failed',
          meetingId,
          error: err instanceof Error ? err.message : String(err),
        }));
      });

      return NextResponse.json({ success: true, action: 'reprocessing' });
    }

    // For Teams/Meet, full reprocessing requires the original webhook notification
    // which is harder to reconstruct. For now, suggest the user try again.
    return NextResponse.json(
      {
        error: `Automatic retry is not yet supported for ${meeting.platform} meetings without a transcript. The recording may not have finished uploading — please try again in a few minutes.`,
      },
      { status: 422 }
    );
  } catch (error) {
    console.error('[REPROCESS] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
