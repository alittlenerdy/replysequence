import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { db, users, meetings, drafts } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import { getDraftById, deleteDraft } from '@/lib/dashboard-queries';

type UserRating = 'up' | 'down';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * Verify the current user owns the draft via meeting ownership
 */
async function verifyDraftOwnership(draftId: string, clerkId: string): Promise<boolean> {
  const [dbUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);

  if (!dbUser) return false;

  const [draft] = await db
    .select({ id: drafts.id })
    .from(drafts)
    .innerJoin(meetings, eq(drafts.meetingId, meetings.id))
    .where(and(eq(drafts.id, draftId), eq(meetings.userId, dbUser.id)))
    .limit(1);

  return !!draft;
}

/**
 * GET /api/drafts/[id] - Get a specific draft
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Draft ID is required' },
        { status: 400 }
      );
    }

    const isOwner = await verifyDraftOwnership(id, user.id);
    if (!isOwner) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    const draft = await getDraftById(id);
    if (!draft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    return NextResponse.json(draft);
  } catch (error) {
    console.error('[DRAFT-GET-ERROR] Failed to fetch draft:', error);
    return NextResponse.json(
      { error: 'Failed to fetch draft' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/drafts/[id] - Submit feedback on a draft (thumbs up/down)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Draft ID is required' }, { status: 400 });
    }

    const isOwner = await verifyDraftOwnership(id, user.id);
    if (!isOwner) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    const body = await request.json();
    const { rating, feedback } = body as { rating?: UserRating | null; feedback?: string };

    // Validate rating
    if (rating !== undefined && rating !== null && rating !== 'up' && rating !== 'down') {
      return NextResponse.json({ error: 'Rating must be "up", "down", or null' }, { status: 400 });
    }

    await db
      .update(drafts)
      .set({
        userRating: rating ?? null,
        userFeedback: feedback || null,
        feedbackAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(drafts.id, id));

    console.log(JSON.stringify({
      level: 'info',
      message: 'Draft feedback submitted',
      draftId: id,
      rating,
      hasFeedbackText: !!feedback,
    }));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[FEEDBACK-ERROR] Failed to submit feedback:', error);
    return NextResponse.json({ error: 'Failed to submit feedback' }, { status: 500 });
  }
}

/**
 * DELETE /api/drafts/[id] - Delete a draft
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Draft ID is required' },
        { status: 400 }
      );
    }

    const isOwner = await verifyDraftOwnership(id, user.id);
    if (!isOwner) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    const draft = await getDraftById(id);
    if (!draft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    if (draft.status === 'sent') {
      return NextResponse.json(
        { error: 'Cannot delete a sent draft' },
        { status: 400 }
      );
    }

    await deleteDraft(id);

    console.log(JSON.stringify({
      level: 'info',
      message: 'Draft deleted',
      draftId: id,
    }));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE-ERROR] Failed to delete draft:', error);
    return NextResponse.json(
      { error: 'Failed to delete draft' },
      { status: 500 }
    );
  }
}
