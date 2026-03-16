import { NextRequest, NextResponse } from 'next/server';
import { db, newsletterSubscribers } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { rateLimit, RATE_LIMITS, getClientIdentifier, getRateLimitHeaders } from '@/lib/security/rate-limit';
import { z } from 'zod';
import { parseBody } from '@/lib/api-validation';

export const runtime = 'nodejs';

const subscribeSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  name: z.string().max(255).optional(),
});

/**
 * POST /api/newsletter/subscribe - Subscribe to "Close the Loop" newsletter
 */
export async function POST(request: NextRequest) {
  const clientId = getClientIdentifier(request);
  const rateLimitResult = rateLimit(`newsletter-subscribe:${clientId}`, RATE_LIMITS.PUBLIC);

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
    );
  }

  try {
    const parsed = await parseBody(request, subscribeSchema);
    if ('error' in parsed) return parsed.error;
    const { email, name } = parsed.data;

    const normalizedEmail = email.toLowerCase().trim();

    // Check for duplicate
    const existing = await db
      .select({ id: newsletterSubscribers.id, unsubscribedAt: newsletterSubscribers.unsubscribedAt })
      .from(newsletterSubscribers)
      .where(eq(newsletterSubscribers.email, normalizedEmail))
      .limit(1);

    if (existing.length > 0) {
      // If previously unsubscribed, re-subscribe
      if (existing[0].unsubscribedAt) {
        await db
          .update(newsletterSubscribers)
          .set({
            unsubscribedAt: null,
            name: name?.trim() || undefined,
          })
          .where(eq(newsletterSubscribers.id, existing[0].id));

        return NextResponse.json(
          { success: true, message: "Welcome back! You're re-subscribed." },
          { headers: getRateLimitHeaders(rateLimitResult) }
        );
      }

      return NextResponse.json(
        { error: 'This email is already subscribed.' },
        { status: 409, headers: getRateLimitHeaders(rateLimitResult) }
      );
    }

    // Insert new subscriber
    await db
      .insert(newsletterSubscribers)
      .values({
        email: normalizedEmail,
        name: name?.trim() || null,
        source: 'website',
      });

    return NextResponse.json(
      { success: true, message: "You're subscribed! See you Tuesday." },
      { headers: getRateLimitHeaders(rateLimitResult) }
    );
  } catch (error) {
    console.error(JSON.stringify({
      level: 'error',
      message: 'Newsletter subscribe failed',
      error: error instanceof Error ? error.message : String(error),
    }));

    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
