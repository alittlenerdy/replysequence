/**
 * Meeting Memory API
 *
 * GET /api/meeting-memory?contactEmail=<email>  — Get contact briefing
 * GET /api/meeting-memory?search=<query>         — Search meeting memories
 * POST /api/meeting-memory                       — Trigger memory extraction for a meeting
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { users, contactMemories } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { z } from 'zod';
import { extractMeetingMemory, getContactBriefing, searchMeetingMemories } from '@/lib/meeting-memory';

export const dynamic = 'force-dynamic';

async function getUserId(clerkId: string): Promise<string | null> {
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);
  return user?.id || null;
}

/**
 * GET — Contact briefing or search
 */
export async function GET(request: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = await getUserId(clerkId);
  if (!userId) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const contactEmail = request.nextUrl.searchParams.get('contactEmail');
  const search = request.nextUrl.searchParams.get('search');
  const limit = Math.min(parseInt(request.nextUrl.searchParams.get('limit') || '20'), 50);

  if (contactEmail) {
    // Return contact briefing
    const briefing = await getContactBriefing(userId, contactEmail);
    if (!briefing) {
      return NextResponse.json({ error: 'No memory found for this contact' }, { status: 404 });
    }
    return NextResponse.json(briefing);
  }

  if (search) {
    // Search across all meeting memories
    const results = await searchMeetingMemories(userId, search, limit);
    return NextResponse.json({ results, total: results.length });
  }

  // Default: list all contact memories
  const contacts = await db
    .select()
    .from(contactMemories)
    .where(eq(contactMemories.userId, userId))
    .orderBy(desc(contactMemories.lastMeetingAt))
    .limit(limit);

  return NextResponse.json({ contacts });
}

const postSchema = z.object({
  meetingId: z.string().uuid(),
});

/**
 * POST — Trigger memory extraction for a meeting
 */
export async function POST(request: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = await getUserId(clerkId);
  if (!userId) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const body = await request.json();
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 });
  }

  // Fire-and-forget extraction
  extractMeetingMemory(parsed.data.meetingId, userId).catch(() => {});

  return NextResponse.json({ success: true, message: 'Memory extraction started' });
}
