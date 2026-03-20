import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { currentUser } from '@clerk/nextjs/server';
import { db, users } from '@/lib/db';
import { drafts, meetings } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getClaudeClient } from '@/lib/claude-api';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: draftId } = await params;

    // Get DB user
    const [dbUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.clerkId, user.id))
      .limit(1);

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify ownership and get draft subject
    const [draft] = await db
      .select({
        id: drafts.id,
        subject: drafts.subject,
        body: drafts.body,
        meetingTopic: meetings.topic,
      })
      .from(drafts)
      .innerJoin(meetings, eq(drafts.meetingId, meetings.id))
      .where(and(eq(drafts.id, draftId), eq(meetings.userId, dbUser.id)))
      .limit(1);

    if (!draft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    // Generate alternative subject line using Claude
    const client = getClaudeClient();

    const response = await client.messages.create({
      model: 'claude-haiku-4-20250414',
      max_tokens: 100,
      messages: [
        {
          role: 'user',
          content: `Generate ONE alternative email subject line for A/B testing. The alternative should take a different angle or tone while conveying the same intent.

Original subject: "${draft.subject}"
Meeting topic: "${draft.meetingTopic || 'Unknown'}"
Email preview: "${draft.body.slice(0, 200)}"

Rules:
- Return ONLY the alternative subject line, nothing else
- Keep it under 80 characters
- Make it meaningfully different (different angle, tone, or framing)
- Keep it professional and relevant to the meeting context
- Do not use clickbait or misleading phrasing`,
        },
      ],
    });

    const variantSubject =
      response.content[0].type === 'text'
        ? response.content[0].text.trim().replace(/^["']|["']$/g, '')
        : null;

    if (!variantSubject) {
      return NextResponse.json(
        { error: 'Failed to generate variant' },
        { status: 500 }
      );
    }

    // Store the variant on the draft
    await db
      .update(drafts)
      .set({
        subjectVariantB: variantSubject,
        updatedAt: new Date(),
      })
      .where(eq(drafts.id, draftId));

    console.log(JSON.stringify({
      level: 'info',
      message: 'A/B subject variant generated',
      draftId,
      originalSubject: draft.subject,
      variantSubject,
    }));

    return NextResponse.json({
      success: true,
      subjectVariantB: variantSubject,
    });
  } catch (error) {
    Sentry.captureException(error, {
      tags: { component: 'drafts-generate-variant' },
    });

    console.error('Generate variant failed:', error);
    return NextResponse.json(
      { error: 'Failed to generate subject variant' },
      { status: 500 }
    );
  }
}
