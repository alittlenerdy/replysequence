import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { meetings, users } from '@/lib/db/schema';
import { eq, and, inArray, desc } from 'drizzle-orm';

// Force dynamic to prevent stale deployment caching issues
export const dynamic = 'force-dynamic';

/**
 * GET /api/meetings/processing
 * Returns all currently processing meetings for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, clerkId))
      .limit(1);

    // New users without a database record won't have any processing meetings
    if (!user) {
      return NextResponse.json({ meetings: [] });
    }

    // Get all meetings that are currently processing
    const processingMeetings = await db
      .select({
        id: meetings.id,
        topic: meetings.topic,
        status: meetings.status,
        processingStep: meetings.processingStep,
        processingProgress: meetings.processingProgress,
        processingStartedAt: meetings.processingStartedAt,
        createdAt: meetings.createdAt,
      })
      .from(meetings)
      .where(
        and(
          eq(meetings.hostEmail, user.email),
          inArray(meetings.status, ['processing', 'pending'])
        )
      )
      .orderBy(desc(meetings.processingStartedAt))
      .limit(5);

    return NextResponse.json({
      meetings: processingMeetings.map((m) => ({
        id: m.id,
        topic: m.topic,
        status: m.status,
        processingStep: m.processingStep,
        processingProgress: m.processingProgress ?? 0,
        processingStartedAt: m.processingStartedAt?.toISOString() ?? null,
        createdAt: m.createdAt?.toISOString() ?? null,
      })),
    });
  } catch (error) {
    console.error('Error fetching processing meetings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch processing meetings' },
      { status: 500 }
    );
  }
}
