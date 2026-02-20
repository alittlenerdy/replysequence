/**
 * Google Sheets Configure Route
 * GET: List user's available spreadsheets
 * PUT: Save spreadsheet selection and column mappings
 */

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { db, users } from '@/lib/db';
import { sheetsConnections } from '@/lib/db/schema';
import type { SheetsColumnMapping } from '@/lib/db/schema';
import { decrypt } from '@/lib/encryption';
import { eq } from 'drizzle-orm';
import { listUserSpreadsheets } from '@/lib/google-sheets';

async function getUserAndConnection(clerkId: string) {
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);

  if (!user) return null;

  const connection = await db.query.sheetsConnections.findFirst({
    where: eq(sheetsConnections.userId, user.id),
  });

  return connection ? { user, connection } : null;
}

/**
 * GET: List available spreadsheets for the user to select from
 */
export async function GET() {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await getUserAndConnection(clerkId);
    if (!result) {
      return NextResponse.json({ error: 'No Sheets connection found. Please connect Google Sheets first.' }, { status: 404 });
    }

    const accessToken = decrypt(result.connection.accessTokenEncrypted);
    const spreadsheets = await listUserSpreadsheets(accessToken);

    return NextResponse.json({ spreadsheets });
  } catch (err) {
    console.error('[SHEETS-CONFIGURE] Error listing spreadsheets:', err);
    return NextResponse.json({ error: 'Failed to list spreadsheets' }, { status: 500 });
  }
}

/**
 * PUT: Save spreadsheet selection and optional column mappings
 */
export async function PUT(request: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { spreadsheetId, spreadsheetName, sheetTab, columnMappings } = body as {
      spreadsheetId: string;
      spreadsheetName?: string;
      sheetTab?: string;
      columnMappings?: SheetsColumnMapping[];
    };

    if (!spreadsheetId) {
      return NextResponse.json({ error: 'Spreadsheet ID is required' }, { status: 400 });
    }

    const result = await getUserAndConnection(clerkId);
    if (!result) {
      return NextResponse.json({ error: 'No Sheets connection found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {
      spreadsheetId,
      updatedAt: new Date(),
    };

    if (spreadsheetName !== undefined) updateData.spreadsheetName = spreadsheetName;
    if (sheetTab !== undefined) updateData.sheetTab = sheetTab;
    if (columnMappings !== undefined) updateData.columnMappings = columnMappings;

    await db
      .update(sheetsConnections)
      .set(updateData)
      .where(eq(sheetsConnections.id, result.connection.id));

    console.log('[SHEETS-CONFIGURE] Saved configuration', {
      spreadsheetId,
      spreadsheetName,
      sheetTab,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[SHEETS-CONFIGURE] Error saving configuration:', err);
    return NextResponse.json({ error: 'Failed to save configuration' }, { status: 500 });
  }
}
