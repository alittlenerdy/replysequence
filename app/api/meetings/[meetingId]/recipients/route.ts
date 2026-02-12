/**
 * Meeting Recipients API
 * GET /api/meetings/[meetingId]/recipients - Get suggested recipients from calendar attendees
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db, meetings, users } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import { getSuggestedRecipients } from '@/lib/calendar-queries';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ meetingId: string }> }
) {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { meetingId } = await params;

    if (!meetingId) {
      return NextResponse.json({ error: 'Meeting ID required' }, { status: 400 });
    }

    // Get user's internal ID
    const [user] = await db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(eq(users.clerkId, clerkId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify the meeting belongs to this user
    const [meeting] = await db
      .select({ id: meetings.id })
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

    // Get suggested recipients, excluding the user's own email
    const recipients = await getSuggestedRecipients(meetingId, user.email);

    return NextResponse.json({ recipients });
  } catch (error) {
    console.error('[MEETING-RECIPIENTS-API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
