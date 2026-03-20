/**
 * GET /api/drafts/replies-pending
 *
 * Returns sent drafts that have received replies but haven't been classified yet,
 * plus recently classified replies that may need user action.
 * Powers the ReplyIntelligenceCard on the dashboard.
 */

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { drafts, meetings, users } from '@/lib/db/schema';
import { eq, and, isNotNull, isNull, desc, or } from 'drizzle-orm';
import { currentUser } from '@clerk/nextjs/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Look up internal user ID
    const [dbUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.clerkId, user.id))
      .limit(1);

    if (!dbUser) {
      return NextResponse.json({ unclassified: [], classified: [] });
    }

    // Drafts that have replies but no classification
    const unclassified = await db
      .select({
        id: drafts.id,
        subject: drafts.subject,
        body: drafts.body,
        sentTo: drafts.sentTo,
        sentAt: drafts.sentAt,
        repliedAt: drafts.repliedAt,
        meetingTopic: meetings.topic,
      })
      .from(drafts)
      .innerJoin(meetings, eq(drafts.meetingId, meetings.id))
      .where(
        and(
          eq(meetings.userId, dbUser.id),
          eq(drafts.status, 'sent'),
          isNotNull(drafts.repliedAt),
          isNull(drafts.replyIntent),
        ),
      )
      .orderBy(desc(drafts.repliedAt))
      .limit(10);

    // Recently classified replies that may need action (last 7 days)
    const classified = await db
      .select({
        id: drafts.id,
        subject: drafts.subject,
        sentTo: drafts.sentTo,
        sentAt: drafts.sentAt,
        repliedAt: drafts.repliedAt,
        replyIntent: drafts.replyIntent,
        replyIntentConfidence: drafts.replyIntentConfidence,
        replyIntentSummary: drafts.replyIntentSummary,
        meetingTopic: meetings.topic,
      })
      .from(drafts)
      .innerJoin(meetings, eq(drafts.meetingId, meetings.id))
      .where(
        and(
          eq(meetings.userId, dbUser.id),
          eq(drafts.status, 'sent'),
          isNotNull(drafts.repliedAt),
          isNotNull(drafts.replyIntent),
          // Only show actionable intents
          or(
            eq(drafts.replyIntent, 'interested'),
            eq(drafts.replyIntent, 'meeting_requested'),
            eq(drafts.replyIntent, 'more_info'),
            eq(drafts.replyIntent, 'objection'),
            eq(drafts.replyIntent, 'not_now'),
          ),
        ),
      )
      .orderBy(desc(drafts.repliedAt))
      .limit(10);

    return NextResponse.json({ unclassified, classified });
  } catch (error) {
    console.error(
      JSON.stringify({
        level: 'error',
        tag: '[REPLIES-PENDING]',
        message: 'Failed to fetch pending replies',
        error: error instanceof Error ? error.message : String(error),
      }),
    );
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
