import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db, waitlistEntries } from '@/lib/db';
import { eq, asc, inArray } from 'drizzle-orm';
import { sendEmail } from '@/lib/email';

export const runtime = 'nodejs';

// Admin user IDs that can send invites (set in env)
const ADMIN_CLERK_IDS = (process.env.ADMIN_CLERK_IDS || '').split(',').filter(Boolean);

/**
 * POST /api/waitlist/invite - Send invites to waitlist users (admin only)
 *
 * Body: { count?: number, emails?: string[] }
 * - count: invite the next N users by position
 * - emails: invite specific email addresses
 */
export async function POST(request: NextRequest) {
  try {
    // Auth check
    const { userId } = await auth();
    if (!userId || !ADMIN_CLERK_IDS.includes(userId)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { count: inviteCount, emails } = body;

    if (!inviteCount && (!emails || !Array.isArray(emails) || emails.length === 0)) {
      return NextResponse.json(
        { error: 'Provide either count or emails array' },
        { status: 400 }
      );
    }

    let entriesToInvite;

    if (emails && emails.length > 0) {
      // Invite specific emails
      const normalizedEmails = emails.map((e: string) => e.toLowerCase().trim());
      entriesToInvite = await db
        .select()
        .from(waitlistEntries)
        .where(inArray(waitlistEntries.email, normalizedEmails));
    } else {
      // Invite next N by position
      entriesToInvite = await db
        .select()
        .from(waitlistEntries)
        .where(eq(waitlistEntries.status, 'waiting'))
        .orderBy(asc(waitlistEntries.position))
        .limit(inviteCount);
    }

    if (entriesToInvite.length === 0) {
      return NextResponse.json({
        success: true,
        invited: 0,
        message: 'No eligible entries found',
      });
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 72 * 60 * 60 * 1000); // 72 hours
    const results: { email: string; success: boolean }[] = [];

    for (const entry of entriesToInvite) {
      // Update status
      await db
        .update(waitlistEntries)
        .set({
          status: 'invited',
          invitedAt: now,
          inviteExpiresAt: expiresAt,
          updatedAt: now,
        })
        .where(eq(waitlistEntries.id, entry.id));

      // Send invite email
      const signupUrl = `https://www.replysequence.com/sign-up?invite=${entry.referralCode}`;
      const result = await sendEmail({
        to: entry.email,
        subject: 'Your ReplySequence invite is ready!',
        body: `Hey${entry.name ? ` ${entry.name}` : ''}!\n\nGreat news — your spot is ready. You're invited to join ReplySequence.\n\nReplySequence turns your Zoom, Teams, and Meet calls into deal-moving follow-up emails in 8 seconds. No more spending 30 minutes writing recaps after every meeting.\n\nClaim your spot:\n${signupUrl}\n\nThis invite expires in 72 hours, so don't wait.\n\nWelcome aboard!\n\n— Jimmy, Founder of ReplySequence`,
        includeSignature: false,
      });

      results.push({ email: entry.email, success: result.success });
    }

    const successCount = results.filter(r => r.success).length;

    return NextResponse.json({
      success: true,
      invited: entriesToInvite.length,
      emailsSent: successCount,
      results,
    });
  } catch (error) {
    console.error(JSON.stringify({
      level: 'error',
      message: 'Waitlist invite failed',
      error: error instanceof Error ? error.message : String(error),
    }));

    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
