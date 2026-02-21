import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db, waitlistEntries } from '@/lib/db';
import { eq, sql, count, asc, desc } from 'drizzle-orm';
import { sendEmail } from '@/lib/email';
import { nanoid } from 'nanoid';

const ADMIN_CLERK_IDS = (process.env.ADMIN_CLERK_IDS || '').split(',').filter(Boolean);

export const runtime = 'nodejs';

/**
 * POST /api/waitlist - Join the waitlist
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, ref, utmSource, utmMedium, utmCampaign } = body;

    // Validate email
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Check for duplicate
    const existing = await db
      .select({ id: waitlistEntries.id, position: waitlistEntries.position, referralCode: waitlistEntries.referralCode })
      .from(waitlistEntries)
      .where(eq(waitlistEntries.email, normalizedEmail))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        {
          error: 'Already on the waitlist',
          position: existing[0].position,
          referralCode: existing[0].referralCode,
        },
        { status: 409 }
      );
    }

    // Get current count for position
    const [{ value: totalCount }] = await db
      .select({ value: count() })
      .from(waitlistEntries);
    const position = Number(totalCount) + 1;

    // Generate unique referral code
    const referralCode = nanoid(8);

    // Look up referrer if ref code provided
    let referredById: string | null = null;
    if (ref && typeof ref === 'string') {
      const referrer = await db
        .select({ id: waitlistEntries.id })
        .from(waitlistEntries)
        .where(eq(waitlistEntries.referralCode, ref))
        .limit(1);

      if (referrer.length > 0) {
        referredById = referrer[0].id;

        // Increment referrer's count
        await db
          .update(waitlistEntries)
          .set({
            referralCount: sql`${waitlistEntries.referralCount} + 1`,
            // Auto-promote tier based on referral count
            tier: sql`CASE
              WHEN ${waitlistEntries.referralCount} + 1 >= 10 THEN 'vip'
              WHEN ${waitlistEntries.referralCount} + 1 >= 3 THEN 'priority'
              ELSE ${waitlistEntries.tier}
            END`,
            updatedAt: new Date(),
          })
          .where(eq(waitlistEntries.id, referredById));
      }
    }

    // Insert waitlist entry
    const [entry] = await db
      .insert(waitlistEntries)
      .values({
        email: normalizedEmail,
        name: name?.trim() || null,
        referralCode,
        referredBy: referredById,
        position,
        utmSource: utmSource || null,
        utmMedium: utmMedium || null,
        utmCampaign: utmCampaign || null,
      })
      .returning();

    // Send welcome email (non-blocking)
    const referralLink = `https://www.replysequence.com?ref=${referralCode}`;
    sendEmail({
      to: normalizedEmail,
      subject: `You're #${position} on the ReplySequence waitlist`,
      body: `Hey${name ? ` ${name}` : ''}!\n\nYou're officially on the ReplySequence waitlist at position #${position}.\n\nReplySequence turns your Zoom, Teams, and Meet calls into deal-moving follow-up emails in 8 seconds — so you never lose momentum after a meeting.\n\nWant to move up the list? Share your referral link:\n${referralLink}\n\nEvery friend who joins moves you closer to early access.\n\nWe'll be in touch soon with your invite.\n\n— Jimmy, Founder of ReplySequence`,
      includeSignature: false,
    }).then(async (result) => {
      if (result.success) {
        await db
          .update(waitlistEntries)
          .set({ welcomeEmailSentAt: new Date() })
          .where(eq(waitlistEntries.id, entry.id));
      }
    }).catch(() => {
      // Non-critical: log but don't fail the signup
    });

    return NextResponse.json({
      success: true,
      position,
      referralCode,
      referralLink,
    });
  } catch (error) {
    console.error(JSON.stringify({
      level: 'error',
      message: 'Waitlist signup failed',
      error: error instanceof Error ? error.message : String(error),
    }));

    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/waitlist - Get waitlist stats, check position, or list all (admin)
 *
 * Public: ?email=user@example.com → returns position + referral stats
 * Admin: ?list=all → returns all entries (requires auth)
 * No params: returns total count (public-safe)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const list = searchParams.get('list');

    // Admin: list all entries
    if (list === 'all') {
      const { userId } = await auth();
      if (!userId || !ADMIN_CLERK_IDS.includes(userId)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const entries = await db
        .select({
          id: waitlistEntries.id,
          email: waitlistEntries.email,
          name: waitlistEntries.name,
          position: waitlistEntries.position,
          status: waitlistEntries.status,
          tier: waitlistEntries.tier,
          referralCode: waitlistEntries.referralCode,
          referralCount: waitlistEntries.referralCount,
          utmSource: waitlistEntries.utmSource,
          invitedAt: waitlistEntries.invitedAt,
          acceptedAt: waitlistEntries.acceptedAt,
          createdAt: waitlistEntries.createdAt,
        })
        .from(waitlistEntries)
        .orderBy(asc(waitlistEntries.position));

      // Stats by status
      const statusCounts = entries.reduce((acc, e) => {
        acc[e.status] = (acc[e.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const tierCounts = entries.reduce((acc, e) => {
        acc[e.tier] = (acc[e.tier] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return NextResponse.json({
        entries,
        stats: {
          total: entries.length,
          byStatus: statusCounts,
          byTier: tierCounts,
        },
      });
    }

    if (email) {
      // Look up specific entry
      const normalizedEmail = email.toLowerCase().trim();
      const entry = await db
        .select({
          position: waitlistEntries.position,
          referralCode: waitlistEntries.referralCode,
          referralCount: waitlistEntries.referralCount,
          tier: waitlistEntries.tier,
          status: waitlistEntries.status,
          createdAt: waitlistEntries.createdAt,
        })
        .from(waitlistEntries)
        .where(eq(waitlistEntries.email, normalizedEmail))
        .limit(1);

      if (entry.length === 0) {
        return NextResponse.json(
          { error: 'Email not found on waitlist' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        position: entry[0].position,
        referralCode: entry[0].referralCode,
        referralCount: entry[0].referralCount,
        tier: entry[0].tier,
        status: entry[0].status,
        referralLink: `https://www.replysequence.com?ref=${entry[0].referralCode}`,
      });
    }

    // Public stats
    const [{ value: totalCount }] = await db
      .select({ value: count() })
      .from(waitlistEntries);

    return NextResponse.json({
      totalSignups: Number(totalCount),
    });
  } catch (error) {
    console.error(JSON.stringify({
      level: 'error',
      message: 'Waitlist stats fetch failed',
      error: error instanceof Error ? error.message : String(error),
    }));

    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
