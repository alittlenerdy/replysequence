import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { meetings, users, transcripts, callCoachingInsights } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { callClaudeAPI, log } from '@/lib/claude-api';

/**
 * GET /api/meetings/[meetingId]/coaching
 * Returns existing coaching insights for a meeting
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ meetingId: string }> }
) {
  try {
    const { userId: clerkId } = await auth();
    const { meetingId } = await params;

    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.clerkId, clerkId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const [insight] = await db
      .select()
      .from(callCoachingInsights)
      .where(
        and(
          eq(callCoachingInsights.meetingId, meetingId),
          eq(callCoachingInsights.userId, user.id)
        )
      )
      .limit(1);

    if (!insight) {
      return NextResponse.json({ exists: false });
    }

    return NextResponse.json({ exists: true, insight });
  } catch (error) {
    console.error('[COACHING] Error fetching insights:', error);
    return NextResponse.json(
      { error: 'Failed to fetch coaching insights' },
      { status: 500 }
    );
  }
}

const COACHING_SYSTEM_PROMPT = `You are a sales call coach analyzing a meeting transcript. Provide structured, actionable feedback to help the seller improve.

Analyze the transcript and return a JSON object with these exact fields:
{
  "talkRatio": { "seller": <number 0-100>, "prospect": <number 0-100> },
  "questionCount": <total questions asked by seller>,
  "openQuestionCount": <open-ended questions by seller>,
  "fillerWordCount": <count of filler words like "um", "uh", "like", "you know", "basically", "actually", "sort of", "kind of">,
  "longestMonologue": <longest uninterrupted seller speech in seconds, estimated from word count at ~150 words/minute>,
  "nextStepSet": <boolean - did the seller establish a clear next step with date/time?>,
  "objectionHandled": <boolean - did the seller acknowledge and address any prospect objections?>,
  "overallScore": <0-100 coaching score>,
  "suggestions": [<3-5 specific, actionable coaching tips based on THIS call>]
}

Scoring guide:
- Talk ratio: Ideal is 40-50% seller. Penalize if seller talks >60%.
- Questions: Reward open-ended discovery questions. Penalize leading/closed questions.
- Filler words: Count every instance. High counts (>20) lower the score.
- Monologue: Anything over 90 seconds is too long.
- Next steps: A vague "let's connect soon" doesn't count. Needs a specific action + timeline.
- Objections: Did the seller use acknowledge-question-reframe or just steamroll?

For suggestions, be specific to what happened in the call. Not generic advice. Reference actual moments.
Example good suggestion: "At the 12-minute mark when the prospect raised pricing concerns, you moved on too quickly. Try acknowledging the concern, asking what their budget range is, and then positioning value."
Example bad suggestion: "Ask more open-ended questions."

Return ONLY valid JSON with no markdown formatting.`;

/**
 * POST /api/meetings/[meetingId]/coaching
 * Generates coaching insights using Claude API
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ meetingId: string }> }
) {
  try {
    const { userId: clerkId } = await auth();
    const { meetingId } = await params;

    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.clerkId, clerkId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if insights already exist
    const [existing] = await db
      .select({ id: callCoachingInsights.id })
      .from(callCoachingInsights)
      .where(
        and(
          eq(callCoachingInsights.meetingId, meetingId),
          eq(callCoachingInsights.userId, user.id)
        )
      )
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { error: 'Coaching insights already exist for this meeting' },
        { status: 409 }
      );
    }

    // Get meeting with ownership check
    const [meeting] = await db
      .select({
        id: meetings.id,
        topic: meetings.topic,
        hostEmail: meetings.hostEmail,
        duration: meetings.duration,
      })
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

    // Get transcript
    const [transcript] = await db
      .select({
        content: transcripts.content,
        speakerSegments: transcripts.speakerSegments,
      })
      .from(transcripts)
      .where(eq(transcripts.meetingId, meetingId))
      .limit(1);

    if (!transcript || !transcript.content) {
      return NextResponse.json(
        { error: 'No transcript available for this meeting' },
        { status: 400 }
      );
    }

    // Truncate transcript to ~12k words to fit context window comfortably
    const words = transcript.content.split(/\s+/);
    const truncatedContent = words.length > 12000
      ? words.slice(0, 12000).join(' ') + '\n\n[TRANSCRIPT TRUNCATED]'
      : transcript.content;

    const userPrompt = `Meeting: ${meeting.topic || 'Untitled'}
Host: ${meeting.hostEmail}
Duration: ${meeting.duration || 'unknown'} minutes

TRANSCRIPT:
${truncatedContent}`;

    log('info', 'Generating coaching insights', {
      meetingId,
      transcriptWords: words.length,
    });

    const result = await callClaudeAPI({
      systemPrompt: COACHING_SYSTEM_PROMPT,
      userPrompt,
      maxTokens: 2048,
    });

    // Parse JSON from response (handle possible markdown wrapping)
    let parsed;
    try {
      const jsonStr = result.content
        .replace(/^```json?\s*/i, '')
        .replace(/\s*```\s*$/, '')
        .trim();
      parsed = JSON.parse(jsonStr);
    } catch {
      log('error', 'Failed to parse coaching JSON', {
        meetingId,
        content: result.content.slice(0, 500),
      });
      return NextResponse.json(
        { error: 'Failed to parse coaching analysis' },
        { status: 500 }
      );
    }

    // Validate and clamp values
    const talkRatio = {
      seller: Math.max(0, Math.min(100, Number(parsed.talkRatio?.seller) || 50)),
      prospect: Math.max(0, Math.min(100, Number(parsed.talkRatio?.prospect) || 50)),
    };
    const overallScore = Math.max(0, Math.min(100, Number(parsed.overallScore) || 0));
    const suggestions = Array.isArray(parsed.suggestions)
      ? parsed.suggestions.filter((s: unknown): s is string => typeof s === 'string').slice(0, 5)
      : [];

    const [insight] = await db
      .insert(callCoachingInsights)
      .values({
        meetingId,
        userId: user.id,
        talkRatio,
        questionCount: Math.max(0, Number(parsed.questionCount) || 0),
        openQuestionCount: Math.max(0, Number(parsed.openQuestionCount) || 0),
        fillerWordCount: Math.max(0, Number(parsed.fillerWordCount) || 0),
        longestMonologue: Math.max(0, Number(parsed.longestMonologue) || 0),
        nextStepSet: Boolean(parsed.nextStepSet),
        objectionHandled: Boolean(parsed.objectionHandled),
        overallScore,
        suggestions,
      })
      .returning();

    log('info', 'Coaching insights generated', {
      meetingId,
      overallScore,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
    });

    return NextResponse.json({ exists: true, insight });
  } catch (error) {
    console.error('[COACHING] Error generating insights:', error);
    return NextResponse.json(
      { error: 'Failed to generate coaching insights' },
      { status: 500 }
    );
  }
}
