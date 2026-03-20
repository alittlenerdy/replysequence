/**
 * POST /api/drafts/[id]/reply
 *
 * Accepts reply body text and triggers intent classification.
 * Can be called manually or from a future Gmail/Outlook reply detection integration.
 */

import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db, drafts } from '@/lib/db';
import { classifyReplyIntent } from '@/lib/agents/classify-reply';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: draftId } = await params;

  try {
    const body = await request.json();
    const { replyBody } = body;

    if (!replyBody || typeof replyBody !== 'string') {
      return NextResponse.json(
        { error: 'replyBody is required and must be a string' },
        { status: 400 },
      );
    }

    // Look up the draft
    const [draft] = await db
      .select({
        id: drafts.id,
        subject: drafts.subject,
        body: drafts.body,
        status: drafts.status,
      })
      .from(drafts)
      .where(eq(drafts.id, draftId))
      .limit(1);

    if (!draft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    // Mark that a reply was received
    await db
      .update(drafts)
      .set({
        repliedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(drafts.id, draftId));

    // Fire-and-forget classification (don't block the response)
    classifyReplyIntent(
      draftId,
      replyBody,
      draft.subject,
      draft.body,
    ).catch((err) => {
      console.log(
        JSON.stringify({
          level: 'error',
          tag: '[REPLY-CLASSIFY]',
          message: 'Background classification failed',
          draftId,
          error: err instanceof Error ? err.message : String(err),
        }),
      );
    });

    return NextResponse.json({
      received: true,
      draftId,
      message: 'Reply received, classification in progress',
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.log(
      JSON.stringify({
        level: 'error',
        tag: '[REPLY-CLASSIFY]',
        message: 'Reply endpoint error',
        draftId,
        error: errorMessage,
      }),
    );
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
