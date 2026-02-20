/**
 * GET/PUT /api/integrations/hubspot/field-mappings
 * Manage HubSpot CRM field mapping configuration for the current user
 */

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db, users, hubspotConnections } from '@/lib/db';
import { DEFAULT_FIELD_MAPPINGS } from '@/lib/hubspot';
import type { HubSpotFieldMapping } from '@/lib/db/schema';

export async function GET() {
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.clerkId, clerkUserId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const [connection] = await db
      .select({ fieldMappings: hubspotConnections.fieldMappings })
      .from(hubspotConnections)
      .where(eq(hubspotConnections.userId, user.id))
      .limit(1);

    if (!connection) {
      return NextResponse.json({ error: 'HubSpot not connected' }, { status: 404 });
    }

    return NextResponse.json({
      fieldMappings: connection.fieldMappings ?? DEFAULT_FIELD_MAPPINGS,
      isCustom: !!connection.fieldMappings,
    });
  } catch (error) {
    console.error('[HUBSPOT-FIELD-MAPPINGS] GET error:', error);
    return NextResponse.json({ error: 'Failed to load field mappings' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { fieldMappings } = body as { fieldMappings: HubSpotFieldMapping[] };

    // Validate mappings
    if (!Array.isArray(fieldMappings)) {
      return NextResponse.json({ error: 'fieldMappings must be an array' }, { status: 400 });
    }

    const validSourceFields = new Set(['timestamp', 'meeting_title', 'meeting_body', 'meeting_start', 'meeting_end', 'meeting_outcome']);
    for (const mapping of fieldMappings) {
      if (!validSourceFields.has(mapping.sourceField)) {
        return NextResponse.json({ error: `Invalid sourceField: ${mapping.sourceField}` }, { status: 400 });
      }
      if (typeof mapping.hubspotProperty !== 'string' || !mapping.hubspotProperty.trim()) {
        return NextResponse.json({ error: 'hubspotProperty must be a non-empty string' }, { status: 400 });
      }
      if (typeof mapping.enabled !== 'boolean') {
        return NextResponse.json({ error: 'enabled must be a boolean' }, { status: 400 });
      }
    }

    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.clerkId, clerkUserId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const result = await db
      .update(hubspotConnections)
      .set({ fieldMappings, updatedAt: new Date() })
      .where(eq(hubspotConnections.userId, user.id))
      .returning({ id: hubspotConnections.id });

    if (result.length === 0) {
      return NextResponse.json({ error: 'HubSpot not connected' }, { status: 404 });
    }

    return NextResponse.json({ success: true, fieldMappings });
  } catch (error) {
    console.error('[HUBSPOT-FIELD-MAPPINGS] PUT error:', error);
    return NextResponse.json({ error: 'Failed to save field mappings' }, { status: 500 });
  }
}
