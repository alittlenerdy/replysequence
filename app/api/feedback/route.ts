import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db, feedback, users } from '@/lib/db';
import { eq, desc, and, count } from 'drizzle-orm';
import type { FeedbackType } from '@/lib/db/schema';
import { z } from 'zod';
import { parseBody } from '@/lib/api-validation';

export const dynamic = 'force-dynamic';

const feedbackSchema = z.object({
  type: z.enum(['draft_rating', 'weekly_survey', 'exit_survey', 'nps']),
  draftId: z.string().uuid().optional(),
  rating: z.string().max(50).optional(),
  score: z.number().int().min(0).max(10).optional(),
  comment: z.string().max(5000).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
}).refine(data => {
  if (data.type === 'nps' && data.score === undefined) {
    return false;
  }
  return true;
}, {
  message: 'NPS score must be between 0 and 10',
  path: ['score'],
});

/**
 * POST /api/feedback
 * Submit feedback of any type (draft_rating, weekly_survey, exit_survey, nps)
 */
export async function POST(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
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

    const parsed = await parseBody(request, feedbackSchema);
    if ('error' in parsed) return parsed.error;
    const { type, draftId, rating, score, comment, metadata } = parsed.data;

    const [entry] = await db
      .insert(feedback)
      .values({
        userId: user.id,
        draftId: draftId || null,
        type,
        rating: rating || null,
        score: score ?? null,
        comment: comment || null,
        metadata: metadata || null,
      })
      .returning();

    return NextResponse.json({ success: true, id: entry.id });
  } catch (error) {
    console.error(JSON.stringify({
      level: 'error',
      message: 'Feedback submission failed',
      error: error instanceof Error ? error.message : String(error),
    }));

    return NextResponse.json(
      { error: 'Failed to submit feedback' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/feedback
 * Get feedback summary (admin use / analytics)
 * Query params: type (optional filter), limit (default 50)
 */
export async function GET(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as FeedbackType | null;
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

    // Build query conditions
    const conditions = type ? and(eq(feedback.type, type)) : undefined;

    const entries = await db
      .select()
      .from(feedback)
      .where(conditions)
      .orderBy(desc(feedback.createdAt))
      .limit(limit);

    // Get counts by type
    const typeCounts = await db
      .select({
        type: feedback.type,
        count: count(),
      })
      .from(feedback)
      .groupBy(feedback.type);

    // Calculate NPS if we have NPS entries
    const npsEntries = entries.filter(e => e.type === 'nps' && e.score !== null);
    let npsScore: number | null = null;
    if (npsEntries.length > 0) {
      const promoters = npsEntries.filter(e => e.score! >= 9).length;
      const detractors = npsEntries.filter(e => e.score! <= 6).length;
      npsScore = Math.round(((promoters - detractors) / npsEntries.length) * 100);
    }

    return NextResponse.json({
      entries,
      counts: Object.fromEntries(typeCounts.map(tc => [tc.type, tc.count])),
      npsScore,
      total: entries.length,
    });
  } catch (error) {
    console.error(JSON.stringify({
      level: 'error',
      message: 'Feedback fetch failed',
      error: error instanceof Error ? error.message : String(error),
    }));

    return NextResponse.json(
      { error: 'Failed to fetch feedback' },
      { status: 500 }
    );
  }
}
