/**
 * POST /api/integrations/airtable/connect
 * Validates and stores per-user Airtable PAT + Base ID
 */

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db, users, airtableConnections } from '@/lib/db';
import { encrypt } from '@/lib/encryption';
import Airtable from 'airtable';
import { z } from 'zod';
import { parseBody } from '@/lib/api-validation';

const airtableConnectSchema = z.object({
  apiKey: z.string().min(1),
  baseId: z.string().min(1).refine(val => val.startsWith('app'), {
    message: 'Base ID should start with "app" (e.g., appXXXXXXXXXXXXXX)',
  }),
  contactsTable: z.string().max(255).optional(),
  meetingsTable: z.string().max(255).optional(),
});

export async function POST(request: NextRequest) {
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const parsed = await parseBody(request, airtableConnectSchema);
    if ('error' in parsed) return parsed.error;
    const { apiKey, baseId, contactsTable, meetingsTable } = parsed.data;

    // Find user by Clerk ID
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.clerkId, clerkUserId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Test the connection by listing tables in the base
    try {
      Airtable.configure({ apiKey });
      const base = Airtable.base(baseId);
      const tableName = contactsTable || 'Contacts';
      // Try to read one record from the contacts table to validate
      await base(tableName).select({ maxRecords: 1 }).firstPage();
    } catch (airtableError) {
      const errorMsg = airtableError instanceof Error ? airtableError.message : String(airtableError);
      console.error('[AIRTABLE-CONNECT] Validation failed:', errorMsg);
      return NextResponse.json(
        { success: false, error: `Could not connect to Airtable: ${errorMsg}` },
        { status: 400 }
      );
    }

    // Encrypt the API key
    const apiKeyEncrypted = encrypt(apiKey);

    // Upsert the connection (one per user)
    const existing = await db.query.airtableConnections.findFirst({
      where: eq(airtableConnections.userId, user.id),
    });

    if (existing) {
      await db
        .update(airtableConnections)
        .set({
          apiKeyEncrypted,
          baseId,
          contactsTable: contactsTable || 'Contacts',
          meetingsTable: meetingsTable || 'Meetings',
          connectedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(airtableConnections.userId, user.id));
    } else {
      await db.insert(airtableConnections).values({
        userId: user.id,
        apiKeyEncrypted,
        baseId,
        contactsTable: contactsTable || 'Contacts',
        meetingsTable: meetingsTable || 'Meetings',
      });
    }

    console.log(JSON.stringify({
      level: 'info',
      message: 'Airtable connected',
      userId: user.id,
      baseId,
    }));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[AIRTABLE-CONNECT] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to connect Airtable' },
      { status: 500 }
    );
  }
}
