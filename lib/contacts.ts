/**
 * Contacts — upsert contacts from meeting participants
 *
 * Called after meeting creation/update to persist contact records.
 * Fire-and-forget: never throws, logs errors internally.
 */

import { db, contacts } from '@/lib/db';
import { sql } from 'drizzle-orm';
import type { Participant } from '@/lib/db/schema';

/**
 * Free email domains to skip when inferring company from email.
 */
const FREE_EMAIL_DOMAINS = new Set([
  'gmail.com',
  'googlemail.com',
  'yahoo.com',
  'yahoo.co.uk',
  'hotmail.com',
  'hotmail.co.uk',
  'outlook.com',
  'outlook.co.uk',
  'live.com',
  'aol.com',
  'icloud.com',
  'me.com',
  'mac.com',
  'protonmail.com',
  'proton.me',
  'mail.com',
  'zoho.com',
  'yandex.com',
  'gmx.com',
  'gmx.de',
  'fastmail.com',
  'hey.com',
  'tutanota.com',
  'pm.me',
]);

/**
 * Infer company name from email domain.
 * Returns null for free email providers.
 */
function inferCompany(email: string): string | null {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return null;
  if (FREE_EMAIL_DOMAINS.has(domain)) return null;

  // Use the domain without TLD as company name, capitalize first letter
  const parts = domain.split('.');
  const name = parts[0];
  return name.charAt(0).toUpperCase() + name.slice(1);
}

/**
 * Upsert contacts from meeting participants into the contacts table.
 *
 * For each participant with an email (skipping the host's own email):
 * - Creates a new contact or updates an existing one (ON CONFLICT userId+email)
 * - Increments meetingCount
 * - Updates lastMeetingAt if this meeting is more recent
 * - Sets lastMeetingId
 * - Infers company from email domain (skips free providers)
 * - Updates name if the new meeting has a non-empty name
 *
 * This function is fire-and-forget: it catches all errors internally
 * and never throws.
 *
 * @param userId - The RS user who owns these contacts
 * @param meetingId - The meeting ID these participants came from
 * @param participants - Array of meeting participants
 * @param meetingDate - When the meeting occurred
 * @param hostEmail - The host's email (will be skipped as a contact)
 */
export async function upsertContactsFromMeeting(
  userId: string,
  meetingId: string,
  participants: Participant[],
  meetingDate: Date,
  hostEmail?: string
): Promise<void> {
  try {
    if (!participants || participants.length === 0) return;

    const normalizedHostEmail = hostEmail?.toLowerCase();

    for (const participant of participants) {
      if (!participant.email) continue;

      const email = participant.email.toLowerCase().trim();

      // Skip the host's own email
      if (normalizedHostEmail && email === normalizedHostEmail) continue;

      const name = participant.user_name || null;
      const company = inferCompany(email);
      const now = new Date();

      await db
        .insert(contacts)
        .values({
          userId,
          email,
          name,
          company,
          meetingCount: 1,
          lastMeetingAt: meetingDate,
          lastMeetingId: meetingId,
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: [contacts.userId, contacts.email],
          set: {
            meetingCount: sql`${contacts.meetingCount} + 1`,
            // Only update lastMeetingAt if this meeting is more recent
            lastMeetingAt: sql`GREATEST(${contacts.lastMeetingAt}, ${meetingDate})`,
            lastMeetingId: sql`CASE WHEN ${contacts.lastMeetingAt} IS NULL OR ${meetingDate} >= ${contacts.lastMeetingAt} THEN ${meetingId} ELSE ${contacts.lastMeetingId} END`,
            // Update name if the new meeting has a non-empty name and existing is null
            name: sql`COALESCE(NULLIF(${name}, ''), ${contacts.name})`,
            // Update company if we inferred one and existing is null
            company: sql`COALESCE(${contacts.company}, ${company})`,
            updatedAt: now,
          },
        });
    }
  } catch (error) {
    console.error(
      JSON.stringify({
        level: 'error',
        message: 'upsertContactsFromMeeting failed (non-blocking)',
        userId,
        meetingId,
        participantCount: participants?.length ?? 0,
        error: error instanceof Error ? error.message : String(error),
      })
    );
  }
}

/**
 * Increment emailsSent counter for a contact when a draft is sent.
 * Fire-and-forget: never throws.
 *
 * @param userId - The RS user who owns the contact
 * @param recipientEmail - The email address the draft was sent to
 */
export async function incrementContactEmailsSent(
  userId: string,
  recipientEmail: string
): Promise<void> {
  try {
    const email = recipientEmail.toLowerCase().trim();
    const now = new Date();

    await db
      .update(contacts)
      .set({
        emailsSent: sql`${contacts.emailsSent} + 1`,
        lastEmailedAt: now,
        updatedAt: now,
      })
      .where(
        sql`${contacts.userId} = ${userId} AND ${contacts.email} = ${email}`
      );
  } catch (error) {
    console.error(
      JSON.stringify({
        level: 'error',
        message: 'incrementContactEmailsSent failed (non-blocking)',
        userId,
        recipientEmail,
        error: error instanceof Error ? error.message : String(error),
      })
    );
  }
}
