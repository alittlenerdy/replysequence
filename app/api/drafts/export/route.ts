import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { db, users, drafts } from '@/lib/db';
import { meetings } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

/**
 * GET /api/drafts/export
 *
 * Exports all user drafts as CSV for download.
 * Authenticated - only returns drafts owned by the current user.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [dbUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.clerkId, user.id))
      .limit(1);

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Fetch all drafts with meeting info for this user
    const rows = await db
      .select({
        subject: drafts.subject,
        body: drafts.body,
        status: drafts.status,
        qualityScore: drafts.qualityScore,
        meetingTopic: meetings.topic,
        meetingPlatform: meetings.platform,
        hostEmail: meetings.hostEmail,
        sentTo: drafts.sentTo,
        sentAt: drafts.sentAt,
        openCount: drafts.openCount,
        clickCount: drafts.clickCount,
        createdAt: drafts.createdAt,
      })
      .from(drafts)
      .innerJoin(meetings, eq(drafts.meetingId, meetings.id))
      .where(eq(meetings.userId, dbUser.id))
      .orderBy(desc(drafts.createdAt));

    // Build CSV
    const headers = [
      'Subject',
      'Status',
      'Quality Score',
      'Meeting Topic',
      'Platform',
      'Host Email',
      'Sent To',
      'Sent At',
      'Opens',
      'Clicks',
      'Created At',
      'Body',
    ];

    const csvRows = [headers.join(',')];

    for (const row of rows) {
      const values = [
        escapeCSV(row.subject),
        row.status,
        row.qualityScore?.toString() ?? '',
        escapeCSV(row.meetingTopic ?? ''),
        row.meetingPlatform,
        row.hostEmail,
        row.sentTo ?? '',
        row.sentAt ? new Date(row.sentAt).toISOString() : '',
        (row.openCount ?? 0).toString(),
        (row.clickCount ?? 0).toString(),
        row.createdAt ? new Date(row.createdAt).toISOString() : '',
        escapeCSV(row.body),
      ];
      csvRows.push(values.join(','));
    }

    const csv = csvRows.join('\n');
    const filename = `replysequence-drafts-${new Date().toISOString().split('T')[0]}.csv`;

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('[EXPORT] Error:', error);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}

function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
