import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db, drafts, users, meetings } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import { getClaudeClient, CLAUDE_MODEL } from '@/lib/claude-client';
import { calculateCost, log } from '@/lib/claude-api';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/**
 * POST /api/drafts/refine
 * Refine a draft using natural language instructions
 *
 * Body: {
 *   draftId: string;
 *   instruction: string;  // e.g., "make it more concise", "add urgency"
 *   field?: 'subject' | 'body' | 'both';  // default: 'both'
 * }
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.clerkId, clerkId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { draftId, instruction, field = 'both' } = body;

    if (!draftId) {
      return NextResponse.json({ error: 'draftId is required' }, { status: 400 });
    }

    if (!instruction || typeof instruction !== 'string') {
      return NextResponse.json({ error: 'instruction is required' }, { status: 400 });
    }

    if (instruction.length > 500) {
      return NextResponse.json({ error: 'instruction too long (max 500 characters)' }, { status: 400 });
    }

    // Get draft with meeting (must belong to user)
    const [draft] = await db
      .select({
        id: drafts.id,
        subject: drafts.subject,
        body: drafts.body,
        meetingId: drafts.meetingId,
        refinementCount: drafts.refinementCount,
      })
      .from(drafts)
      .innerJoin(meetings, eq(drafts.meetingId, meetings.id))
      .where(and(
        eq(drafts.id, draftId),
        eq(meetings.userId, user.id)
      ))
      .limit(1);

    if (!draft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    log('info', '[REFINE-1] Starting draft refinement', {
      draftId,
      instruction: instruction.substring(0, 100),
      field,
      currentRefinementCount: draft.refinementCount || 0,
    });

    // Build the refinement prompt
    const systemPrompt = `You are an expert email editor. Your job is to refine email drafts based on user instructions.

Rules:
- Make ONLY the changes requested by the user
- Preserve the original email's core message and meaning
- Keep the professional tone unless instructed otherwise
- If refining the subject, keep it concise (under 60 characters)
- If refining the body, maintain proper email structure (greeting, body, closing)
- Do NOT add placeholder text like [Name] - use what's already there
- Do NOT add signatures or footers unless asked
- Return ONLY the refined content, no explanations`;

    let userPrompt: string;

    if (field === 'subject') {
      userPrompt = `Current subject line:
"""
${draft.subject}
"""

User instruction: ${instruction}

Return ONLY the refined subject line, nothing else.`;
    } else if (field === 'body') {
      userPrompt = `Current email body:
"""
${draft.body}
"""

User instruction: ${instruction}

Return ONLY the refined email body, nothing else.`;
    } else {
      // Both subject and body
      userPrompt = `Current email:

Subject: ${draft.subject}

Body:
"""
${draft.body}
"""

User instruction: ${instruction}

Return the refined email in this exact format:
SUBJECT: <refined subject>
BODY:
<refined body>`;
    }

    // Call Claude API
    const client = getClaudeClient();
    const response = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1500,
      messages: [
        { role: 'user', content: userPrompt }
      ],
      system: systemPrompt,
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    const refinedContent = content.text.trim();
    const inputTokens = response.usage.input_tokens;
    const outputTokens = response.usage.output_tokens;
    const costUsd = calculateCost(inputTokens, outputTokens);

    log('info', '[REFINE-2] Claude API response received', {
      draftId,
      inputTokens,
      outputTokens,
      costUsd: costUsd.toFixed(6),
      responseLength: refinedContent.length,
    });

    // Parse the response based on field
    let newSubject = draft.subject;
    let newBody = draft.body;

    if (field === 'subject') {
      newSubject = refinedContent;
    } else if (field === 'body') {
      newBody = refinedContent;
    } else {
      // Parse both from response
      const subjectMatch = refinedContent.match(/^SUBJECT:\s*(.+?)(?:\n|$)/i);
      const bodyMatch = refinedContent.match(/BODY:\s*\n?([\s\S]+)$/i);

      if (subjectMatch) {
        newSubject = subjectMatch[1].trim();
      }
      if (bodyMatch) {
        newBody = bodyMatch[1].trim();
      }
    }

    // Update the draft
    const currentCount = draft.refinementCount || 0;
    await db
      .update(drafts)
      .set({
        subject: newSubject,
        body: newBody,
        refinementCount: currentCount + 1,
        lastRefinedAt: new Date(),
        lastRefinementInstruction: instruction,
        updatedAt: new Date(),
      })
      .where(eq(drafts.id, draftId));

    const durationMs = Date.now() - startTime;

    log('info', '[REFINE-3] Draft refinement complete', {
      draftId,
      durationMs,
      refinementCount: currentCount + 1,
      subjectChanged: newSubject !== draft.subject,
      bodyChanged: newBody !== draft.body,
    });

    return NextResponse.json({
      success: true,
      draftId,
      subject: newSubject,
      body: newBody,
      refinementCount: currentCount + 1,
      tokens: { input: inputTokens, output: outputTokens },
      costUsd,
      durationMs,
    });

  } catch (error) {
    const durationMs = Date.now() - startTime;
    log('error', '[REFINE-ERROR] Draft refinement failed', {
      error: error instanceof Error ? error.message : String(error),
      durationMs,
    });

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Refinement failed',
    }, { status: 500 });
  }
}
