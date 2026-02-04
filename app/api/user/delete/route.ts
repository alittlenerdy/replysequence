import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import {
  users,
  meetings,
  transcripts,
  drafts,
  usageLogs,
  zoomConnections,
  teamsConnections,
  meetConnections,
} from '@/lib/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { rateLimit, RATE_LIMITS, getClientIdentifier, getRateLimitHeaders } from '@/lib/security/rate-limit';

/**
 * DELETE /api/user/delete
 *
 * GDPR-compliant data deletion endpoint.
 * Permanently deletes all user data from the system.
 *
 * This action is IRREVERSIBLE.
 */
export async function DELETE(request: NextRequest) {
  try {
    // Rate limiting - strict limit
    const clientId = getClientIdentifier(request);
    const rateLimitResult = rateLimit(`gdpr-delete:${clientId}`, RATE_LIMITS.GDPR);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
      );
    }

    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Require confirmation in request body
    const body = await request.json().catch(() => ({}));
    if (body.confirm !== 'DELETE_MY_ACCOUNT') {
      return NextResponse.json(
        {
          error: 'Confirmation required',
          message: 'Please send { "confirm": "DELETE_MY_ACCOUNT" } to proceed',
        },
        { status: 400 }
      );
    }

    // Get user from database
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, clerkId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Track deletion for audit
    const deletionLog = {
      userId: user.id,
      email: user.email,
      deletedAt: new Date().toISOString(),
      clerkId,
    };

    console.log('[GDPR-DELETE] Starting account deletion:', deletionLog);

    // Get all meeting IDs for cascade deletion
    const userMeetings = await db
      .select({ id: meetings.id })
      .from(meetings)
      .where(eq(meetings.hostEmail, user.email));

    const meetingIds = userMeetings.map((m) => m.id);

    // Delete in order (respecting foreign key constraints)
    // 1. Delete drafts (references transcripts and meetings)
    if (meetingIds.length > 0) {
      await db.delete(drafts).where(inArray(drafts.meetingId, meetingIds));
      console.log(`[GDPR-DELETE] Deleted drafts for ${meetingIds.length} meetings`);
    }

    // 2. Delete transcripts (references meetings)
    if (meetingIds.length > 0) {
      await db.delete(transcripts).where(inArray(transcripts.meetingId, meetingIds));
      console.log(`[GDPR-DELETE] Deleted transcripts for ${meetingIds.length} meetings`);
    }

    // 3. Delete meetings
    await db.delete(meetings).where(eq(meetings.hostEmail, user.email));
    console.log(`[GDPR-DELETE] Deleted ${meetingIds.length} meetings`);

    // 4. Delete usage logs
    await db.delete(usageLogs).where(eq(usageLogs.userId, user.id));
    console.log('[GDPR-DELETE] Deleted usage logs');

    // 5. Delete OAuth connections
    await db.delete(zoomConnections).where(eq(zoomConnections.userId, user.id));
    await db.delete(teamsConnections).where(eq(teamsConnections.userId, user.id));
    await db.delete(meetConnections).where(eq(meetConnections.userId, user.id));
    console.log('[GDPR-DELETE] Deleted OAuth connections');

    // 6. Delete user record
    await db.delete(users).where(eq(users.id, user.id));
    console.log('[GDPR-DELETE] Deleted user record');

    // 7. Delete from Clerk (optional - user might want to keep auth)
    try {
      const clerk = await clerkClient();
      await clerk.users.deleteUser(clerkId);
      console.log('[GDPR-DELETE] Deleted Clerk user');
    } catch (clerkError) {
      // Log but don't fail - Clerk deletion is secondary
      console.error('[GDPR-DELETE] Clerk deletion failed:', clerkError);
    }

    console.log('[GDPR-DELETE] Account deletion complete:', deletionLog);

    return NextResponse.json(
      {
        success: true,
        message: 'Your account and all associated data have been permanently deleted.',
        deletedAt: deletionLog.deletedAt,
      },
      {
        status: 200,
        headers: getRateLimitHeaders(rateLimitResult),
      }
    );
  } catch (error) {
    console.error('[GDPR-DELETE] Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete account. Please contact support.' },
      { status: 500 }
    );
  }
}
