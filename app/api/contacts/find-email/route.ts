/**
 * POST /api/contacts/find-email — Find email via Hunter.io and optionally store it
 * POST /api/contacts/find-email?action=verify — Verify an existing email via Hunter.io
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { parseBody } from '@/lib/api-validation';
import { findEmail, verifyEmail } from '@/lib/hunter-io';
import { db, users, contacts } from '@/lib/db';
import { eq, and, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

const findEmailSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  domain: z.string().min(1).max(255),
});

const verifyEmailSchema = z.object({
  email: z.string().email(),
});

async function getUserId(clerkId: string): Promise<string | null> {
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);
  return user?.id || null;
}

export async function POST(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = await getUserId(clerkId);
    if (!userId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const action = request.nextUrl.searchParams.get('action');

    // ── Verify existing email ─────────────────────────────────────────
    if (action === 'verify') {
      const parsed = await parseBody(request, verifyEmailSchema);
      if ('error' in parsed) return parsed.error;

      const result = await verifyEmail(parsed.data.email);

      if (result === null) {
        return NextResponse.json(
          { error: 'Email verification unavailable. HUNTER_API_KEY may not be configured.' },
          { status: 503 }
        );
      }

      return NextResponse.json({
        email: result.email,
        score: result.score,
        status: result.status,
        result: result.result,
      });
    }

    // ── Find email from name + domain ─────────────────────────────────
    const parsed = await parseBody(request, findEmailSchema);
    if ('error' in parsed) return parsed.error;

    const { firstName, lastName, domain } = parsed.data;

    const result = await findEmail(firstName, lastName, domain);

    if (result === null) {
      return NextResponse.json(
        { error: 'Email finder unavailable. HUNTER_API_KEY may not be configured.' },
        { status: 503 }
      );
    }

    // Store found email in contacts table if we got a result
    if (result.email) {
      const now = new Date();
      const fullName = `${firstName} ${lastName}`.trim();
      const companyFromDomain = domain.split('.')[0];
      const company = companyFromDomain.charAt(0).toUpperCase() + companyFromDomain.slice(1);

      await db
        .insert(contacts)
        .values({
          userId,
          email: result.email.toLowerCase(),
          name: fullName,
          company,
          meetingCount: 0,
          emailsSent: 0,
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: [contacts.userId, contacts.email],
          set: {
            // Only update name/company if existing values are null
            name: sql`COALESCE(${contacts.name}, ${fullName})`,
            company: sql`COALESCE(${contacts.company}, ${company})`,
            updatedAt: now,
          },
        });
    }

    return NextResponse.json({
      email: result.email,
      score: result.score,
      status: result.status,
      sources: result.sources,
    });
  } catch (error) {
    console.error('Find-email API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
