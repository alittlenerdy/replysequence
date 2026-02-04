import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getProcessingStatus } from '@/lib/processing-progress';
import { db } from '@/lib/db';
import { meetings, users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * GET /api/meetings/[id]/status
 * Returns the current processing status of a meeting
 * Used for real-time progress updates in the UI
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkId } = await auth();
    const { id: meetingId } = await params;

    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!meetingId) {
      return NextResponse.json({ error: 'Meeting ID required' }, { status: 400 });
    }

    // Get user from database
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, clerkId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify meeting belongs to user (by host email)
    const [meeting] = await db
      .select({
        id: meetings.id,
        status: meetings.status,
        processingStep: meetings.processingStep,
        processingProgress: meetings.processingProgress,
        processingLogs: meetings.processingLogs,
        processingStartedAt: meetings.processingStartedAt,
        processingCompletedAt: meetings.processingCompletedAt,
        processingError: meetings.processingError,
        topic: meetings.topic,
        hostEmail: meetings.hostEmail,
      })
      .from(meetings)
      .where(eq(meetings.id, meetingId))
      .limit(1);

    if (!meeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    // Check if user owns this meeting (host email matches)
    if (meeting.hostEmail !== user.email) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({
      id: meeting.id,
      topic: meeting.topic,
      status: meeting.status,
      processingStep: meeting.processingStep,
      processingProgress: meeting.processingProgress ?? 0,
      processingLogs: meeting.processingLogs ?? [],
      processingStartedAt: meeting.processingStartedAt?.toISOString() ?? null,
      processingCompletedAt: meeting.processingCompletedAt?.toISOString() ?? null,
      processingError: meeting.processingError,
    });
  } catch (error) {
    console.error('Error fetching meeting status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch meeting status' },
      { status: 500 }
    );
  }
}
