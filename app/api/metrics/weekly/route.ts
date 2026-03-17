/**
 * Weekly Metrics API — returns daily activity counts for the past 7 days
 *
 * GET /api/metrics/weekly
 * Auth: Bearer token via METRICS_API_TOKEN env var
 *
 * Response: { days: [{ date, label, meetings, drafts, emails_sent, sequences }] }
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, meetings, drafts, emailSequences, sequenceSteps } from '@/lib/db';
import { sql, gte, and, eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // Simple bearer token auth for cron/script access
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  const expected = process.env.METRICS_API_TOKEN;

  if (!expected || token !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  // Run all queries in parallel
  const [meetingsByDay, draftsByDay, emailsSentByDay, sequencesByDay] = await Promise.all([
    // Meetings processed per day
    db
      .select({
        date: sql<string>`date_trunc('day', ${meetings.createdAt})::date`.as('date'),
        count: sql<number>`count(*)::int`.as('count'),
      })
      .from(meetings)
      .where(gte(meetings.createdAt, sevenDaysAgo))
      .groupBy(sql`date_trunc('day', ${meetings.createdAt})::date`)
      .orderBy(sql`date_trunc('day', ${meetings.createdAt})::date`),

    // Drafts generated per day
    db
      .select({
        date: sql<string>`date_trunc('day', ${drafts.createdAt})::date`.as('date'),
        count: sql<number>`count(*)::int`.as('count'),
      })
      .from(drafts)
      .where(gte(drafts.createdAt, sevenDaysAgo))
      .groupBy(sql`date_trunc('day', ${drafts.createdAt})::date`)
      .orderBy(sql`date_trunc('day', ${drafts.createdAt})::date`),

    // Emails actually sent per day (drafts with status='sent')
    db
      .select({
        date: sql<string>`date_trunc('day', ${drafts.sentAt})::date`.as('date'),
        count: sql<number>`count(*)::int`.as('count'),
      })
      .from(drafts)
      .where(and(
        gte(drafts.sentAt, sevenDaysAgo),
        eq(drafts.status, 'sent'),
      ))
      .groupBy(sql`date_trunc('day', ${drafts.sentAt})::date`)
      .orderBy(sql`date_trunc('day', ${drafts.sentAt})::date`),

    // Sequences created per day
    db
      .select({
        date: sql<string>`date_trunc('day', ${emailSequences.createdAt})::date`.as('date'),
        count: sql<number>`count(*)::int`.as('count'),
      })
      .from(emailSequences)
      .where(gte(emailSequences.createdAt, sevenDaysAgo))
      .groupBy(sql`date_trunc('day', ${emailSequences.createdAt})::date`)
      .orderBy(sql`date_trunc('day', ${emailSequences.createdAt})::date`),
  ]);

  // Build a map for each day of the past 7 days
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const days = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0]; // YYYY-MM-DD
    const label = dayNames[d.getDay()];

    const findCount = (rows: { date: string; count: number }[]) =>
      rows.find((r) => String(r.date) === dateStr)?.count || 0;

    days.push({
      date: dateStr,
      label,
      meetings: findCount(meetingsByDay),
      drafts: findCount(draftsByDay),
      emails_sent: findCount(emailsSentByDay),
      sequences: findCount(sequencesByDay),
    });
  }

  return NextResponse.json({ days });
}
