import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db, users } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { rateLimit, RATE_LIMITS, getClientIdentifier, getRateLimitHeaders } from '@/lib/security/rate-limit';
import { z } from 'zod';
import { parseBody } from '@/lib/api-validation';
import { admitUser } from '@/lib/waitlist-gate';

export const runtime = 'nodejs';

const ADMIN_CLERK_IDS = (process.env.ADMIN_CLERK_IDS || '').split(',').filter(Boolean);

/**
 * GET /api/waitlist/admit - Check if current user is admitted
 *
 * Returns { admitted: boolean, admittedAt: string | null }
 */
export async function GET(request: NextRequest) {
  const clientId = getClientIdentifier(request);
  const rateLimitResult = rateLimit(`waitlist-admit-get:${clientId}`, RATE_LIMITS.AUTH);

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
    );
  }

  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [user] = await db
      .select({ admittedAt: users.admittedAt })
      .from(users)
      .where(eq(users.clerkId, userId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ admitted: false, admittedAt: null });
    }

    return NextResponse.json({
      admitted: !!user.admittedAt,
      admittedAt: user.admittedAt?.toISOString() || null,
    });
  } catch (error) {
    console.error('[WAITLIST-ADMIT] Error checking admission:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

const adminAdmitSchema = z.object({
  clerkId: z.string().min(1).optional(),
  email: z.string().email().optional(),
}).refine(data => data.clerkId || data.email, {
  message: 'Provide either clerkId or email',
});

/**
 * POST /api/waitlist/admit - Admit a user (admin only)
 *
 * Body: { clerkId?: string, email?: string }
 * Admits the specified user by setting admittedAt and updating Clerk publicMetadata.
 */
export async function POST(request: NextRequest) {
  const clientId = getClientIdentifier(request);
  const rateLimitResult = rateLimit(`waitlist-admit-post:${clientId}`, RATE_LIMITS.AUTH);

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
    );
  }

  try {
    const { userId } = await auth();
    if (!userId || !ADMIN_CLERK_IDS.includes(userId)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const parsed = await parseBody(request, adminAdmitSchema);
    if ('error' in parsed) return parsed.error;
    const { clerkId, email } = parsed.data;

    // Find the user
    let userRecord;
    if (clerkId) {
      [userRecord] = await db
        .select({ id: users.id, clerkId: users.clerkId, admittedAt: users.admittedAt })
        .from(users)
        .where(eq(users.clerkId, clerkId))
        .limit(1);
    } else if (email) {
      [userRecord] = await db
        .select({ id: users.id, clerkId: users.clerkId, admittedAt: users.admittedAt })
        .from(users)
        .where(eq(users.email, email.toLowerCase().trim()))
        .limit(1);
    }

    if (!userRecord) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (userRecord.admittedAt) {
      return NextResponse.json({
        success: true,
        message: 'User already admitted',
        admittedAt: userRecord.admittedAt.toISOString(),
      });
    }

    // Admit the user
    await admitUser(userRecord.clerkId);

    return NextResponse.json({
      success: true,
      admittedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[WAITLIST-ADMIT] Error admitting user:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
