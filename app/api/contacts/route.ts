/**
 * Contacts API — aggregates contacts from meeting participants
 *
 * GET /api/contacts — returns unique contacts with meeting history
 */

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db, users, meetings, drafts, emailSequences } from '@/lib/db';
import { eq, and, desc, or } from 'drizzle-orm';
import type { Participant } from '@/lib/db/schema';

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

export async function GET() {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = await getUserId(clerkId);
  if (!userId) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Get all processed meetings with participants ('ready' = transcript processed, 'completed' = legacy)
  const userMeetings = await db
    .select({
      id: meetings.id,
      participants: meetings.participants,
      startTime: meetings.startTime,
      topic: meetings.topic,
      hostEmail: meetings.hostEmail,
    })
    .from(meetings)
    .where(and(
      eq(meetings.userId, userId),
      or(eq(meetings.status, 'ready'), eq(meetings.status, 'completed')),
    ))
    .orderBy(desc(meetings.startTime));

  // Get all drafts sent (drafts don't have userId — join through meetings)
  const sentDrafts = await db
    .select({
      sentTo: drafts.sentTo,
    })
    .from(drafts)
    .innerJoin(meetings, eq(drafts.meetingId, meetings.id))
    .where(and(eq(meetings.userId, userId), eq(drafts.status, 'sent')));

  // Get all sequences
  const userSequences = await db
    .select({
      recipientEmail: emailSequences.recipientEmail,
      status: emailSequences.status,
    })
    .from(emailSequences)
    .where(eq(emailSequences.userId, userId));

  // Count emails sent per recipient
  const emailCounts = new Map<string, number>();
  for (const d of sentDrafts) {
    if (d.sentTo) {
      const email = d.sentTo.toLowerCase();
      emailCounts.set(email, (emailCounts.get(email) || 0) + 1);
    }
  }

  // Count sequences per recipient
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

  // Aggregate contacts from meeting participants
  const contactMap = new Map<string, ContactRecord>();

  for (const meeting of userMeetings) {
    const participants = (meeting.participants || []) as Participant[];
    for (const p of participants) {
      if (!p.email) continue;
      const email = p.email.toLowerCase();

      // Skip the host (that's the user)
      if (email === meeting.hostEmail?.toLowerCase()) continue;

      const existing = contactMap.get(email);
      if (existing) {
        existing.meetingCount++;
        // Keep the most recent meeting date/topic (meetings are ordered desc)
      } else {
        contactMap.set(email, {
          email,
          name: p.user_name || email.split('@')[0],
          meetingCount: 1,
          lastMeetingDate: meeting.startTime?.toISOString() || null,
          lastMeetingTopic: meeting.topic || null,
          emailsSent: emailCounts.get(email) || 0,
          activeSequences: seqActive.get(email) || 0,
          completedSequences: seqCompleted.get(email) || 0,
        });
      }
    }
  }

  const contacts = Array.from(contactMap.values()).sort((a, b) => {
    // Sort by most recent meeting first
    if (a.lastMeetingDate && b.lastMeetingDate) {
      return new Date(b.lastMeetingDate).getTime() - new Date(a.lastMeetingDate).getTime();
    }
    return a.lastMeetingDate ? -1 : 1;
  });

  return NextResponse.json({ contacts, total: contacts.length });
}
