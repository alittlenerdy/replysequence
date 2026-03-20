import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, meetings, sharedRecaps } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { randomBytes } from 'crypto';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ meetingId: string }> }
) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { meetingId } = await params;

  // Look up the DB user
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.clerkId, clerkUserId))
    .limit(1);

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Verify the meeting exists and belongs to this user
  const [meeting] = await db
    .select({ id: meetings.id })
    .from(meetings)
    .where(and(eq(meetings.id, meetingId), eq(meetings.userId, user.id)))
    .limit(1);

  if (!meeting) {
    return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
  }

  // Check if a share link already exists for this meeting
  const [existing] = await db
    .select({ shareToken: sharedRecaps.shareToken })
    .from(sharedRecaps)
    .where(and(
      eq(sharedRecaps.meetingId, meetingId),
      eq(sharedRecaps.userId, user.id)
    ))
    .limit(1);

  if (existing) {
    return NextResponse.json({
      shareUrl: `/recap/${existing.shareToken}`,
      token: existing.shareToken,
    });
  }

  // Generate an unguessable token (32 random bytes = 64 hex chars)
  const shareToken = randomBytes(32).toString('hex');

  await db.insert(sharedRecaps).values({
    meetingId,
    userId: user.id,
    shareToken,
  });

  return NextResponse.json({
    shareUrl: `/recap/${shareToken}`,
    token: shareToken,
  });
}
