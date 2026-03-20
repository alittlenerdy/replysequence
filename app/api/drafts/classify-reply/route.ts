/**
 * POST /api/drafts/classify-reply
 *
 * Classifies a reply email using the AI reply-classification agent.
 * Accepts either:
 *   - { draftId, replyBody } — classify a reply for a specific draft
 *   - { draftId } — re-classify using stored reply data (if replyBody was previously saved)
 *
 * Returns the classification result with suggested next action.
 */

import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db, drafts } from '@/lib/db';
import { classifyReplyIntent } from '@/lib/agents/classify-reply';
import { currentUser } from '@clerk/nextjs/server';
import { users, meetings } from '@/lib/db/schema';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/** Map reply intents to suggested next actions */
const SUGGESTED_ACTIONS: Record<string, { action: string; label: string; description: string }> = {
  interested: {
    action: 'send_followup',
    label: 'Send follow-up',
    description: 'Prospect is interested — send a personalized follow-up to keep momentum.',
  },
  meeting_requested: {
    action: 'schedule_meeting',
    label: 'Schedule meeting',
    description: 'They want to meet — share your calendar link or propose times.',
  },
  more_info: {
    action: 'send_followup',
    label: 'Send more details',
    description: 'They have questions — prepare a detailed response with relevant info.',
  },
  not_now: {
    action: 'snooze',
    label: 'Snooze and revisit',
    description: 'Bad timing — set a reminder to follow up in a few weeks.',
  },
  objection: {
    action: 'send_followup',
    label: 'Address objection',
    description: 'They pushed back — craft a response that addresses their specific concern.',
  },
  unsubscribe: {
    action: 'mark_closed',
    label: 'Mark as closed',
    description: 'They want out — respect their request and remove from sequences.',
  },
  auto_reply: {
    action: 'ignore',
    label: 'Wait for return',
    description: 'Automated response — the sequence has been paused automatically.',
  },
  other: {
    action: 'review',
    label: 'Review manually',
    description: 'Could not determine clear intent — review the reply yourself.',
  },
};

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user exists
    const [dbUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.clerkId, user.id))
      .limit(1);

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { draftId, replyBody } = body;

    if (!draftId || typeof draftId !== 'string') {
      return NextResponse.json(
        { error: 'draftId is required and must be a string' },
        { status: 400 },
      );
    }

    // Look up the draft and verify ownership
    const [draft] = await db
      .select({
        id: drafts.id,
        subject: drafts.subject,
        body: drafts.body,
        status: drafts.status,
        repliedAt: drafts.repliedAt,
        replyIntent: drafts.replyIntent,
        meetingUserId: meetings.userId,
      })
      .from(drafts)
      .innerJoin(meetings, eq(drafts.meetingId, meetings.id))
      .where(eq(drafts.id, draftId))
      .limit(1);

    if (!draft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    if (draft.meetingUserId !== dbUser.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Need either a provided replyBody or the draft must have been replied to
    const effectiveReplyBody = replyBody || '';
    if (!effectiveReplyBody && !draft.repliedAt) {
      return NextResponse.json(
        { error: 'No reply body provided and draft has no recorded reply' },
        { status: 400 },
      );
    }

    // If replyBody is provided, mark the draft as replied (if not already)
    if (replyBody && !draft.repliedAt) {
      await db
        .update(drafts)
        .set({
          repliedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(drafts.id, draftId));
    }

    // Run classification
    const classification = await classifyReplyIntent(
      draftId,
      effectiveReplyBody,
      draft.subject,
      draft.body,
    );

    if (!classification) {
      return NextResponse.json(
        { error: 'Classification failed' },
        { status: 500 },
      );
    }

    // Get suggested action
    const suggestedAction = SUGGESTED_ACTIONS[classification.intent] || SUGGESTED_ACTIONS.other;

    return NextResponse.json({
      draftId,
      classification: {
        intent: classification.intent,
        confidence: classification.confidence,
        summary: classification.summary,
      },
      suggestedAction,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(
      JSON.stringify({
        level: 'error',
        tag: '[CLASSIFY-REPLY]',
        message: 'Classification endpoint error',
        error: errorMessage,
      }),
    );
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
