/**
 * GET /api/drafts/[id]/events
 * Returns detailed email tracking events for a specific draft
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db, drafts, emailEvents, meetings, users } from '@/lib/db';
import { eq, desc, and } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: draftId } = await params;
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // First verify the user owns this draft
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.clerkId, clerkUserId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get the draft and verify ownership through the meeting
    const [draft] = await db
      .select({
        id: drafts.id,
        trackingId: drafts.trackingId,
        meetingUserId: meetings.userId,
      })
      .from(drafts)
      .leftJoin(meetings, eq(drafts.meetingId, meetings.id))
      .where(eq(drafts.id, draftId))
      .limit(1);

    if (!draft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    // Verify ownership
    if (draft.meetingUserId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get all events for this draft
    const events = await db
      .select({
        id: emailEvents.id,
        eventType: emailEvents.eventType,
        clickedUrl: emailEvents.clickedUrl,
        occurredAt: emailEvents.occurredAt,
        country: emailEvents.country,
        city: emailEvents.city,
      })
      .from(emailEvents)
      .where(eq(emailEvents.draftId, draftId))
      .orderBy(desc(emailEvents.occurredAt))
      .limit(100);

    // Group events by type for summary
    const summary = {
      sent: 0,
      opened: 0,
      clicked: 0,
      replied: 0,
    };

    const clickedUrls: Record<string, number> = {};

    events.forEach(event => {
      if (event.eventType === 'sent') summary.sent++;
      if (event.eventType === 'opened') summary.opened++;
      if (event.eventType === 'clicked') {
        summary.clicked++;
        if (event.clickedUrl) {
          clickedUrls[event.clickedUrl] = (clickedUrls[event.clickedUrl] || 0) + 1;
        }
      }
      if (event.eventType === 'replied') summary.replied++;
    });

    return NextResponse.json({
      draftId,
      summary,
      clickedUrls: Object.entries(clickedUrls).map(([url, count]) => ({ url, count })),
      events: events.map(e => ({
        id: e.id,
        type: e.eventType,
        url: e.clickedUrl,
        occurredAt: e.occurredAt,
        location: e.city && e.country ? `${e.city}, ${e.country}` : null,
      })),
    });
  } catch (error) {
    console.error('[EVENTS-ERROR] Failed to get events:', error);
    return NextResponse.json(
      { error: 'Failed to get events' },
      { status: 500 }
    );
  }
}
