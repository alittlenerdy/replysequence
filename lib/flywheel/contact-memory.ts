/**
 * Retrieves past interaction history with a specific contact.
 * Used at draft generation time to give Claude context about
 * the relationship with the email recipient.
 */

import { db, drafts, meetings } from '@/lib/db';
import { eq, and, desc, sql, isNotNull } from 'drizzle-orm';

export interface ContactHistory {
  pastEmails: Array<{
    subject: string;
    sentAt: Date;
    replied: boolean;
    opened: boolean;
  }>;
  pastMeetings: Array<{
    topic: string | null;
    startTime: Date | null;
    summary: string | null;
    meetingType: string | null;
  }>;
}

export interface ContactContext {
  recipientEmail: string;
  emailCount: number;
  meetingCount: number;
  promptBlock: string;
}

/**
 * Get past interaction history with a specific contact.
 * Returns up to 5 past emails and 5 past meetings.
 */
export async function getContactHistory(
  userId: string,
  recipientEmail: string
): Promise<ContactHistory> {
  // Past emails sent to this contact
  const pastEmails = await db
    .select({
      subject: drafts.subject,
      sentAt: drafts.sentAt,
      repliedAt: drafts.repliedAt,
      openedAt: drafts.openedAt,
    })
    .from(drafts)
    .innerJoin(meetings, eq(drafts.meetingId, meetings.id))
    .where(
      and(
        eq(meetings.userId, userId),
        eq(drafts.sentTo, recipientEmail),
        isNotNull(drafts.sentAt)
      )
    )
    .orderBy(desc(drafts.sentAt))
    .limit(5);

  // Past meetings involving this contact
  // participants is a JSONB array of {name, email} objects
  const pastMeetings = await db
    .select({
      topic: meetings.topic,
      startTime: meetings.startTime,
      summary: meetings.summary,
      meetingType: sql<string | null>`(
        SELECT d."meeting_type" FROM drafts d
        WHERE d."meeting_id" = ${meetings.id}
        LIMIT 1
      )`,
    })
    .from(meetings)
    .where(
      and(
        eq(meetings.userId, userId),
        sql`${meetings.participants}::jsonb @> ${JSON.stringify([{ email: recipientEmail }])}::jsonb`
      )
    )
    .orderBy(desc(meetings.startTime))
    .limit(5);

  return {
    pastEmails: pastEmails.map(e => ({
      subject: e.subject,
      sentAt: e.sentAt!,
      replied: !!e.repliedAt,
      opened: !!e.openedAt,
    })),
    pastMeetings: pastMeetings.map(m => ({
      topic: m.topic,
      startTime: m.startTime,
      summary: m.summary,
      meetingType: m.meetingType,
    })),
  };
}

/**
 * Build a prompt-ready context block from contact history.
 * Returns null if no prior interactions exist.
 */
export async function buildContactContext(
  userId: string,
  recipientEmail: string
): Promise<ContactContext | null> {
  const history = await getContactHistory(userId, recipientEmail);

  if (history.pastEmails.length === 0 && history.pastMeetings.length === 0) {
    return null;
  }

  let promptBlock = `\n## CONTACT HISTORY (${recipientEmail})\n`;
  promptBlock += `You have prior interactions with this recipient. Reference them naturally.\n\n`;

  if (history.pastEmails.length > 0) {
    promptBlock += `Past emails sent:\n`;
    for (const email of history.pastEmails) {
      const date = email.sentAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const status = email.replied ? '(replied)' : email.opened ? '(opened, no reply)' : '(no response)';
      promptBlock += `- ${date}: "${email.subject}" ${status}\n`;
    }
    promptBlock += '\n';
  }

  if (history.pastMeetings.length > 0) {
    promptBlock += `Past meetings together:\n`;
    for (const meeting of history.pastMeetings) {
      const date = meeting.startTime?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) ?? 'Unknown date';
      const summary = meeting.summary ? ` - ${meeting.summary.slice(0, 150)}` : '';
      promptBlock += `- ${date}: ${meeting.topic ?? 'Meeting'}${summary}\n`;
    }
  }

  return {
    recipientEmail,
    emailCount: history.pastEmails.length,
    meetingCount: history.pastMeetings.length,
    promptBlock,
  };
}
