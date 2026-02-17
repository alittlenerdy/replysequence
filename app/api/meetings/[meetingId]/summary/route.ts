import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { meetings, users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * GET /api/meetings/[meetingId]/summary
 * Returns the meeting summary, key topics, decisions, and action items
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ meetingId: string }> }
) {
  try {
    const { userId: clerkId } = await auth();
    const { meetingId } = await params;

    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!meetingId) {
      return NextResponse.json({ error: 'Meeting ID required' }, { status: 400 });
    }

    // Get user from database
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.clerkId, clerkId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get meeting with summary data, verifying ownership
    const [meeting] = await db
      .select({
        id: meetings.id,
        topic: meetings.topic,
        summary: meetings.summary,
        keyDecisions: meetings.keyDecisions,
        keyTopics: meetings.keyTopics,
        actionItems: meetings.actionItems,
        summaryGeneratedAt: meetings.summaryGeneratedAt,
        startTime: meetings.startTime,
        duration: meetings.duration,
        platform: meetings.platform,
      })
      .from(meetings)
      .where(
        and(
          eq(meetings.id, meetingId),
          eq(meetings.userId, user.id)
        )
      )
      .limit(1);

    if (!meeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    return NextResponse.json({
      meetingId: meeting.id,
      topic: meeting.topic,
      summary: meeting.summary,
      keyDecisions: meeting.keyDecisions || [],
      keyTopics: meeting.keyTopics || [],
      actionItems: meeting.actionItems || [],
      summaryGeneratedAt: meeting.summaryGeneratedAt,
      startTime: meeting.startTime,
      duration: meeting.duration,
      platform: meeting.platform,
    });
  } catch (error) {
    console.error('[MEETING-SUMMARY] Error fetching summary:', error);
    return NextResponse.json(
      { error: 'Failed to fetch meeting summary' },
      { status: 500 }
    );
  }
}
