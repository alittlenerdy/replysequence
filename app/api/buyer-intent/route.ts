/**
 * Buyer Intent API
 *
 * GET /api/buyer-intent?email=recipient@example.com — analyze intent for a specific recipient
 * GET /api/buyer-intent — get intent analysis for all recent recipients
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db, users } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { analyzeBuyerIntent, analyzeAllRecipientIntent } from '@/lib/signals/buyer-intent';

export const dynamic = 'force-dynamic';

async function getUserId(clerkId: string): Promise<string | null> {
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);
  return user?.id || null;
}

export async function GET(request: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = await getUserId(clerkId);
  if (!userId) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const email = request.nextUrl.searchParams.get('email');

  if (email) {
    // Single recipient analysis
    const result = await analyzeBuyerIntent(userId, email);
    return NextResponse.json(result);
  }

  // Batch analysis for all recent recipients
  const result = await analyzeAllRecipientIntent(userId);
  return NextResponse.json({
    success: true,
    ...result,
  });
}
