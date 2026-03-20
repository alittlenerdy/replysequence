/**
 * Contact Enrichment API
 *
 * POST /api/contacts/enrich — enrich a single contact by email
 * GET  /api/contacts/enrich — batch enrich unenriched contacts (limit 10)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db, users, contacts } from '@/lib/db';
import { eq, and, isNull } from 'drizzle-orm';
import { enrichContact } from '@/lib/contact-enrichment';

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
 * POST: Enrich a single contact by email
 * Body: { email: string }
 */
export async function POST(request: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = await getUserId(clerkId);
  if (!userId) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  if (!process.env.CLEARBIT_API_KEY) {
    return NextResponse.json(
      { error: 'Enrichment not configured. Set CLEARBIT_API_KEY to enable contact enrichment.' },
      { status: 503 }
    );
  }

  const body = await request.json().catch(() => null);
  if (!body?.email || typeof body.email !== 'string') {
    return NextResponse.json({ error: 'email is required' }, { status: 400 });
  }

  const email = body.email.toLowerCase().trim();

  // Verify contact belongs to this user
  const [contact] = await db
    .select({ id: contacts.id, enrichedAt: contacts.enrichedAt })
    .from(contacts)
    .where(and(eq(contacts.userId, userId), eq(contacts.email, email)))
    .limit(1);

  if (!contact) {
    return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
  }

  const result = await enrichContact(email);
  if (!result) {
    return NextResponse.json({ enriched: false, message: 'No enrichment data found for this email' });
  }

  // Update contact with enrichment data
  await db
    .update(contacts)
    .set({
      ...(result.fullName && { name: result.fullName }),
      ...(result.title && { title: result.title }),
      ...(result.company && { company: result.company }),
      ...(result.linkedinUrl && { linkedinUrl: result.linkedinUrl }),
      ...(result.avatarUrl && { avatarUrl: result.avatarUrl }),
      enrichedAt: new Date(),
      enrichmentSource: 'clearbit',
      updatedAt: new Date(),
    })
    .where(eq(contacts.id, contact.id));

  return NextResponse.json({
    enriched: true,
    data: result,
  });
}

/**
 * GET: Batch enrich unenriched contacts (limit 10 per call)
 */
export async function GET() {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = await getUserId(clerkId);
  if (!userId) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  if (!process.env.CLEARBIT_API_KEY) {
    return NextResponse.json(
      { error: 'Enrichment not configured. Set CLEARBIT_API_KEY to enable contact enrichment.' },
      { status: 503 }
    );
  }

  // Find unenriched contacts
  const unenriched = await db
    .select({ id: contacts.id, email: contacts.email })
    .from(contacts)
    .where(and(eq(contacts.userId, userId), isNull(contacts.enrichedAt)))
    .limit(10);

  if (unenriched.length === 0) {
    return NextResponse.json({ enriched: 0, message: 'All contacts are already enriched' });
  }

  let enrichedCount = 0;

  for (const contact of unenriched) {
    const result = await enrichContact(contact.email);
    if (result) {
      await db
        .update(contacts)
        .set({
          ...(result.fullName && { name: result.fullName }),
          ...(result.title && { title: result.title }),
          ...(result.company && { company: result.company }),
          ...(result.linkedinUrl && { linkedinUrl: result.linkedinUrl }),
          ...(result.avatarUrl && { avatarUrl: result.avatarUrl }),
          enrichedAt: new Date(),
          enrichmentSource: 'clearbit',
          updatedAt: new Date(),
        })
        .where(eq(contacts.id, contact.id));
      enrichedCount++;
    } else {
      // Mark as attempted so we don't retry endlessly
      await db
        .update(contacts)
        .set({
          enrichedAt: new Date(),
          enrichmentSource: 'clearbit:not_found',
          updatedAt: new Date(),
        })
        .where(eq(contacts.id, contact.id));
    }
  }

  return NextResponse.json({
    enriched: enrichedCount,
    attempted: unenriched.length,
    message: `Enriched ${enrichedCount} of ${unenriched.length} contacts`,
  });
}
