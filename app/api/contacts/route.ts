/**
 * Contacts API — queries persistent contacts table
 *
 * GET /api/contacts — returns contacts with meeting history and engagement stats
 *
 * Backwards-compatible response format: { contacts: ContactRecord[], total: number }
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db, users, contacts, meetings } from '@/lib/db';
import { eq, and, desc, or, ilike, sql } from 'drizzle-orm';
import { emailSequences } from '@/lib/db/schema';

export const dynamic = 'force-dynamic';

async function getUserId(clerkId: string): Promise<string | null> {
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);
  return user?.id || null;
}

interface ContactRecord {
  email: string;
  name: string;
  meetingCount: number;
  lastMeetingDate: string | null;
  lastMeetingTopic: string | null;
  emailsSent: number;
  activeSequences: number;
  completedSequences: number;
}

export async function GET(request: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = await getUserId(clerkId);
  if (!userId) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Parse optional search query parameter
  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get('q') || searchParams.get('search') || '';
  const sortBy = searchParams.get('sort') || 'lastMeetingDate';
  const sortDir = searchParams.get('dir') === 'asc' ? 'asc' : 'desc';

  // Build query conditions
  const conditions = [eq(contacts.userId, userId)];

  if (search) {
    conditions.push(
      or(
        ilike(contacts.email, `%${search}%`),
        ilike(contacts.name, `%${search}%`),
        ilike(contacts.company, `%${search}%`)
      )!
    );
  }

  // Fetch contacts from the persistent table with last meeting topic via join
  const contactRows = await db
    .select({
      email: contacts.email,
      name: contacts.name,
      meetingCount: contacts.meetingCount,
      lastMeetingAt: contacts.lastMeetingAt,
      lastMeetingId: contacts.lastMeetingId,
      emailsSent: contacts.emailsSent,
    })
    .from(contacts)
    .where(and(...conditions))
    .orderBy(
      sortBy === 'name' ? (sortDir === 'asc' ? contacts.name : desc(contacts.name))
        : sortBy === 'meetingCount' ? (sortDir === 'asc' ? contacts.meetingCount : desc(contacts.meetingCount))
        : sortBy === 'emailsSent' ? (sortDir === 'asc' ? contacts.emailsSent : desc(contacts.emailsSent))
        : (sortDir === 'asc' ? contacts.lastMeetingAt : desc(contacts.lastMeetingAt))
    );

  // Collect lastMeetingIds to fetch topics in a single query
  const meetingIds = contactRows
    .map(c => c.lastMeetingId)
    .filter((id): id is string => id !== null);

  // Fetch meeting topics for all referenced meetings
  const topicMap = new Map<string, string>();
  if (meetingIds.length > 0) {
    const meetingRows = await db
      .select({ id: meetings.id, topic: meetings.topic })
      .from(meetings)
      .where(sql`${meetings.id} IN (${sql.join(meetingIds.map(id => sql`${id}`), sql`, `)})`);

    for (const m of meetingRows) {
      if (m.topic) topicMap.set(m.id, m.topic);
    }
  }

  // Fetch sequence counts per recipient email
  const userSequences = await db
    .select({
      recipientEmail: emailSequences.recipientEmail,
      status: emailSequences.status,
    })
    .from(emailSequences)
    .where(eq(emailSequences.userId, userId));

  const seqActive = new Map<string, number>();
  const seqCompleted = new Map<string, number>();
  for (const s of userSequences) {
    const email = s.recipientEmail.toLowerCase();
    if (s.status === 'active' || s.status === 'paused') {
      seqActive.set(email, (seqActive.get(email) || 0) + 1);
    } else if (s.status === 'completed') {
      seqCompleted.set(email, (seqCompleted.get(email) || 0) + 1);
    }
  }

  // Build response with backwards-compatible format
  const contactList: ContactRecord[] = contactRows.map(c => ({
    email: c.email,
    name: c.name || c.email.split('@')[0],
    meetingCount: c.meetingCount,
    lastMeetingDate: c.lastMeetingAt?.toISOString() || null,
    lastMeetingTopic: c.lastMeetingId ? (topicMap.get(c.lastMeetingId) || null) : null,
    emailsSent: c.emailsSent,
    activeSequences: seqActive.get(c.email.toLowerCase()) || 0,
    completedSequences: seqCompleted.get(c.email.toLowerCase()) || 0,
  }));

  return NextResponse.json({ contacts: contactList, total: contactList.length });
}
