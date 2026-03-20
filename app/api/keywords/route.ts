/**
 * Keywords API — manage tracked keywords/topics for meeting monitoring
 *
 * GET    /api/keywords — list user's tracked keywords with mention counts
 * POST   /api/keywords — add a new tracked keyword
 * DELETE /api/keywords?id=<uuid> — remove a tracked keyword
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db, users, trackedKeywords, keywordMentions } from '@/lib/db';
import { eq, and, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

async function getUserId(clerkId: string): Promise<string | null> {
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);
  return user?.id || null;
}

export async function GET() {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = await getUserId(clerkId);
  if (!userId) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Fetch keywords with mention counts via left join + group by
  const rows = await db
    .select({
      id: trackedKeywords.id,
      keyword: trackedKeywords.keyword,
      category: trackedKeywords.category,
      createdAt: trackedKeywords.createdAt,
      mentionCount: sql<number>`count(${keywordMentions.id})::int`,
    })
    .from(trackedKeywords)
    .leftJoin(keywordMentions, eq(keywordMentions.keywordId, trackedKeywords.id))
    .where(eq(trackedKeywords.userId, userId))
    .groupBy(trackedKeywords.id)
    .orderBy(trackedKeywords.createdAt);

  return NextResponse.json({ keywords: rows });
}

export async function POST(request: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = await getUserId(clerkId);
  if (!userId) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const body = await request.json();
  const { keyword, category } = body as { keyword?: string; category?: string };

  if (!keyword || typeof keyword !== 'string' || keyword.trim().length === 0) {
    return NextResponse.json({ error: 'Keyword is required' }, { status: 400 });
  }

  const trimmedKeyword = keyword.trim().toLowerCase();

  if (trimmedKeyword.length > 200) {
    return NextResponse.json({ error: 'Keyword must be 200 characters or less' }, { status: 400 });
  }

  const validCategories = ['competitor', 'product', 'objection', 'custom'] as const;
  const safeCategory = validCategories.includes(category as typeof validCategories[number])
    ? (category as typeof validCategories[number])
    : 'custom';

  try {
    const [inserted] = await db
      .insert(trackedKeywords)
      .values({
        userId,
        keyword: trimmedKeyword,
        category: safeCategory,
      })
      .returning();

    return NextResponse.json({ keyword: inserted }, { status: 201 });
  } catch (error: unknown) {
    // Handle unique constraint violation (duplicate keyword for this user)
    if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === '23505') {
      return NextResponse.json({ error: 'You are already tracking this keyword' }, { status: 409 });
    }
    throw error;
  }
}

export async function DELETE(request: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = await getUserId(clerkId);
  if (!userId) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const { searchParams } = request.nextUrl;
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Keyword ID is required' }, { status: 400 });
  }

  const deleted = await db
    .delete(trackedKeywords)
    .where(and(eq(trackedKeywords.id, id), eq(trackedKeywords.userId, userId)))
    .returning();

  if (deleted.length === 0) {
    return NextResponse.json({ error: 'Keyword not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
