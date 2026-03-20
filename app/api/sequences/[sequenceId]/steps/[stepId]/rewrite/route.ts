/**
 * Step Rewrite API
 *
 * POST /api/sequences/[sequenceId]/steps/[stepId]/rewrite
 * Rewrites a sequence step using AI, incorporating meeting context and optional user instructions.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db, emailSequences, sequenceSteps, users, meetings } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { callClaudeAPI } from '@/lib/claude-api';
import { runAgent } from '@/lib/agents/core';

export const dynamic = 'force-dynamic';

type RouteParams = {
  params: Promise<{ sequenceId: string; stepId: string }>;
};

const rewriteSchema = z.object({
  instructions: z.string().max(500).optional(),
});

async function getUserId(clerkId: string): Promise<string | null> {
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);
  return user?.id || null;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { sequenceId, stepId } = await params;
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = await getUserId(clerkId);
  if (!userId) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Verify sequence belongs to user
  const [sequence] = await db
    .select()
    .from(emailSequences)
    .where(
      and(eq(emailSequences.id, sequenceId), eq(emailSequences.userId, userId)),
    )
    .limit(1);

  if (!sequence) {
    return NextResponse.json({ error: 'Sequence not found' }, { status: 404 });
  }

  // Get the step
  const [step] = await db
    .select()
    .from(sequenceSteps)
    .where(
      and(
        eq(sequenceSteps.id, stepId),
        eq(sequenceSteps.sequenceId, sequenceId),
      ),
    )
    .limit(1);

  if (!step) {
    return NextResponse.json({ error: 'Step not found' }, { status: 404 });
  }

  if (step.status !== 'pending' && step.status !== 'scheduled') {
    return NextResponse.json(
      { error: 'Can only rewrite pending or scheduled steps' },
      { status: 400 },
    );
  }

  // Parse optional instructions
  const body = await request.json().catch(() => ({}));
  const parsed = rewriteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { instructions } = parsed.data;

  // Get meeting context
  const [meeting] = await db
    .select({
      topic: meetings.topic,
      summary: meetings.summary,
      actionItems: meetings.actionItems,
    })
    .from(meetings)
    .where(eq(meetings.id, sequence.meetingId))
    .limit(1);

  const meetingContext = meeting
    ? `Meeting topic: ${meeting.topic || 'N/A'}\nSummary: ${meeting.summary || 'N/A'}\nAction items: ${
        Array.isArray(meeting.actionItems)
          ? (meeting.actionItems as Array<{ task: string; owner?: string }>)
              .map((a) => `${a.task} (${a.owner || 'unassigned'})`)
              .join(', ')
          : 'None'
      }`
    : 'No meeting context available.';

  // Run the rewrite through the agent wrapper
  const result = await runAgent<{ subject: string; body: string }>({
    name: 'sequence-rewrite',
    description: `Rewrite step ${step.stepNumber} for ${sequence.recipientEmail}`,
    userId,
    meetingId: sequence.meetingId,
    fn: async () => {
      const systemPrompt = `You are a sales follow-up email assistant. Rewrite the given email step while preserving its intent and meeting context. Keep the email under 150 words, professional but human. Return ONLY a JSON object with "subject" and "body" fields, no other text.`;

      const userPrompt = `Rewrite this follow-up email step.

MEETING CONTEXT:
${meetingContext}

RECIPIENT: ${sequence.recipientName || sequence.recipientEmail}
STEP TYPE: ${step.stepType} (step ${step.stepNumber} of ${sequence.totalSteps})

CURRENT EMAIL:
Subject: ${step.subject}
Body: ${step.body}

${instructions ? `USER INSTRUCTIONS: ${instructions}` : 'Improve clarity and engagement while keeping the same intent.'}

Return ONLY this JSON format:
\`\`\`json
{
  "subject": "...",
  "body": "..."
}
\`\`\``;

      const response = await callClaudeAPI({
        systemPrompt,
        userPrompt,
        maxTokens: 1024,
      });

      // Parse the response
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Failed to parse AI response');
      }

      const rewritten = JSON.parse(jsonMatch[0]) as {
        subject: string;
        body: string;
      };

      if (!rewritten.subject || !rewritten.body) {
        throw new Error('AI response missing subject or body');
      }

      return {
        data: rewritten,
        tokens: {
          input: response.inputTokens,
          output: response.outputTokens,
          cacheCreation: response.cacheCreationTokens,
          cacheRead: response.cacheReadTokens,
        },
      };
    },
  });

  if (!result.success || !result.data) {
    return NextResponse.json(
      { error: result.error || 'Rewrite failed' },
      { status: 500 },
    );
  }

  // Update the step in the DB
  const now = new Date();
  await db
    .update(sequenceSteps)
    .set({
      subject: result.data.subject,
      body: result.data.body,
      updatedAt: now,
    })
    .where(eq(sequenceSteps.id, stepId));

  return NextResponse.json({
    subject: result.data.subject,
    body: result.data.body,
    costUsd: result.costUsd,
  });
}
