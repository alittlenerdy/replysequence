import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { db, meetings, transcripts, users } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import { generateDraft } from '@/lib/generate-draft';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * POST /api/drafts/regenerate
 * Regenerate a draft for a meeting that has a transcript
 * Body: { meetingId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database
    const [dbUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.clerkId, user.id))
      .limit(1);

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { meetingId } = body;

    if (!meetingId) {
      return NextResponse.json({ error: 'meetingId is required' }, { status: 400 });
    }

    // Get meeting (must belong to user)
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

    // Get transcript
    const [transcript] = await db
      .select()
      .from(transcripts)
      .where(eq(transcripts.meetingId, meetingId))
      .limit(1);

    if (!transcript || !transcript.content) {
      return NextResponse.json({ error: 'No transcript found for this meeting' }, { status: 404 });
    }

    // Generate draft
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
      return NextResponse.json({
        success: true,
        draftId: result.draftId,
        subject: result.subject,
        qualityScore: result.qualityScore,
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error || 'Failed to generate draft',
      }, { status: 500 });
    }
  } catch (error) {
    console.error('[REGENERATE] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
