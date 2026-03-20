/**
 * Pre-Meeting Intelligence Briefing Generator
 *
 * Generates contextual briefings for upcoming meetings by:
 * 1. Looking up attendees from the calendar event
 * 2. Finding past meetings with same participants
 * 3. Aggregating action items, summaries, and topics
 * 4. Using Claude to synthesize a pre-meeting briefing
 */

import { db, meetings, calendarEvents, users, preMeetingBriefings } from '@/lib/db';
import { eq, and, or, desc } from 'drizzle-orm';
import { sendEmail } from '@/lib/email';
import { getClaudeClient, log, calculateCost } from '@/lib/claude-api';
import { runAgent } from '@/lib/agents/core';
import type {
  BriefingContent,
  BriefingAttendeeInsight,
  Participant,
  ActionItem,
  CalendarEventAttendee,
} from '@/lib/db/schema';

interface PastMeetingContext {
  topic: string | null;
  summary: string | null;
  actionItems: ActionItem[];
  startTime: Date | null;
  participants: Participant[];
}

/**
 * Find past meetings that share attendees with the upcoming event
 */
async function findRelatedMeetings(
  userId: string,
  attendeeEmails: string[]
): Promise<PastMeetingContext[]> {
  if (attendeeEmails.length === 0) return [];

  // Get completed meetings for this user, ordered by most recent
  const userMeetings = await db
    .select({
      topic: meetings.topic,
      summary: meetings.summary,
      actionItems: meetings.actionItems,
      startTime: meetings.startTime,
      participants: meetings.participants,
      hostEmail: meetings.hostEmail,
    })
    .from(meetings)
    .where(
      and(
        eq(meetings.userId, userId),
        or(
          eq(meetings.status, 'completed'),
          eq(meetings.status, 'ready')
        )
      )
    )
    .orderBy(desc(meetings.startTime))
    .limit(50); // Check last 50 meetings for overlap

  // Filter to meetings that share at least one attendee email
  const emailSet = new Set(attendeeEmails.map(e => e.toLowerCase()));

  return userMeetings
    .filter(m => {
      const participants = (m.participants || []) as Participant[];
      const hasOverlap = participants.some(
        p => p.email && emailSet.has(p.email.toLowerCase())
      );
      const hostOverlap = emailSet.has(m.hostEmail.toLowerCase());
      return hasOverlap || hostOverlap;
    })
    .slice(0, 10) // Cap at 10 most relevant
    .map(m => ({
      topic: m.topic,
      summary: m.summary,
      actionItems: (m.actionItems || []) as ActionItem[],
      startTime: m.startTime,
      participants: (m.participants || []) as Participant[],
    }));
}

/**
 * Build attendee insights from past meeting data
 */
function buildAttendeeInsights(
  attendees: CalendarEventAttendee[],
  pastMeetings: PastMeetingContext[]
): BriefingAttendeeInsight[] {
  return attendees.map(attendee => {
    const email = attendee.email.toLowerCase();

    // Find meetings involving this attendee
    const relatedMeetings = pastMeetings.filter(m =>
      (m.participants || []).some(p => p.email?.toLowerCase() === email)
    );

    // Collect open action items assigned to this person
    const openItems: string[] = [];
    for (const m of relatedMeetings) {
      for (const item of m.actionItems || []) {
        if (item.owner?.toLowerCase().includes(attendee.name?.split(' ')[0]?.toLowerCase() || email)) {
          openItems.push(item.task);
        }
      }
    }

    const lastMeeting = relatedMeetings[0];

    return {
      name: attendee.name || attendee.email,
      email: attendee.email,
      pastMeetingCount: relatedMeetings.length,
      lastMeetingDate: lastMeeting?.startTime?.toISOString().split('T')[0],
      openActionItems: openItems.slice(0, 5), // Cap at 5
    };
  });
}

/**
 * Generate a briefing using Claude
 */
async function generateBriefingContent(
  meetingTitle: string,
  attendeeInsights: BriefingAttendeeInsight[],
  pastMeetings: PastMeetingContext[],
  senderName: string
): Promise<{ content: BriefingContent; inputTokens: number; outputTokens: number }> {
  const pastMeetingsSummary = pastMeetings
    .map((m, i) => {
      const date = m.startTime?.toISOString().split('T')[0] || 'unknown date';
      const items = (m.actionItems || []).map(a => `  - ${a.task} (${a.owner || 'unassigned'})`).join('\n');
      return `Meeting ${i + 1}: "${m.topic || 'Untitled'}" (${date})\nSummary: ${m.summary || 'No summary'}\nAction Items:\n${items || '  None'}`;
    })
    .join('\n\n');

  const attendeeContext = attendeeInsights
    .map(a => {
      const items = a.openActionItems.length > 0
        ? `Open items: ${a.openActionItems.join('; ')}`
        : 'No open items';
      return `- ${a.name} (${a.email}): ${a.pastMeetingCount} past meetings. ${items}`;
    })
    .join('\n');

  const prompt = `You are preparing a pre-meeting intelligence briefing for ${senderName} before their upcoming meeting: "${meetingTitle}".

## Attendees
${attendeeContext || 'No attendee history available.'}

## Past Meeting History with These Attendees
${pastMeetingsSummary || 'No prior meetings found with these attendees.'}

Generate a structured briefing in JSON format with these fields:
{
  "executiveSummary": "2-3 sentence overview of the relationship and meeting context",
  "talkingPoints": [{"topic": "...", "context": "why this matters", "suggestedApproach": "how to bring it up"}],
  "discoveryQuestions": ["smart questions to ask based on history"],
  "openActionItems": ["action items from past meetings still relevant"],
  "riskFlags": ["any concerns based on past interactions"]
}

Rules:
- If no past meetings exist, focus the briefing on first-meeting preparation
- Keep talking points to 3-5 items
- Keep discovery questions to 3-5
- Risk flags can be empty if none detected
- Be specific and actionable, not generic
- Reference actual past meeting topics and decisions when available

Return ONLY valid JSON, no markdown fences.`;

  const client = getClaudeClient();
  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1500,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  const inputTokens = response.usage.input_tokens;
  const outputTokens = response.usage.output_tokens;

  // Strip markdown fences if present (```json ... ```)
  const cleaned = text.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();

  let parsed: Partial<BriefingContent>;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    log('warn', 'Failed to parse briefing JSON, using raw text', { text: cleaned.slice(0, 200) });
    parsed = {
      executiveSummary: cleaned.slice(0, 500),
      talkingPoints: [],
      discoveryQuestions: [],
      openActionItems: [],
      riskFlags: [],
    };
  }

  const content: BriefingContent = {
    executiveSummary: parsed.executiveSummary || 'Briefing generated.',
    attendeeInsights,
    talkingPoints: parsed.talkingPoints || [],
    discoveryQuestions: parsed.discoveryQuestions || [],
    openActionItems: parsed.openActionItems || [],
    riskFlags: parsed.riskFlags || [],
  };

  return { content, inputTokens, outputTokens };
}

/**
 * Send briefing email to user
 */
async function sendBriefingEmail(
  userEmail: string,
  userName: string,
  meetingTitle: string,
  meetingTime: Date,
  content: BriefingContent
): Promise<boolean> {
  const timeStr = meetingTime.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  });

  const talkingPointsHtml = content.talkingPoints
    .map(tp => `<li><strong>${tp.topic}</strong>: ${tp.context}${tp.suggestedApproach ? ` <em>(${tp.suggestedApproach})</em>` : ''}</li>`)
    .join('');

  const questionsHtml = content.discoveryQuestions
    .map(q => `<li>${q}</li>`)
    .join('');

  const actionItemsHtml = content.openActionItems
    .map(a => `<li>${a}</li>`)
    .join('');

  const risksHtml = content.riskFlags.length > 0
    ? `<h3 style="color: #dc2626; margin-top: 16px;">Risk Flags</h3><ul>${content.riskFlags.map(r => `<li>${r}</li>`).join('')}</ul>`
    : '';

  const html = `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; color: #1f2937;">
  <div style="background: linear-gradient(135deg, #4f46e5, #7A5CFF); padding: 24px; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 20px;">Pre-Meeting Briefing</h1>
    <p style="color: #e0e7ff; margin: 8px 0 0;">
      <strong>${meetingTitle}</strong> at ${timeStr}
    </p>
  </div>
  <div style="background: #ffffff; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
    <p style="color: #4b5563; line-height: 1.6;">${content.executiveSummary}</p>

    ${talkingPointsHtml ? `<h3 style="color: #4f46e5; margin-top: 20px;">Talking Points</h3><ul style="line-height: 1.8;">${talkingPointsHtml}</ul>` : ''}
    ${questionsHtml ? `<h3 style="color: #4f46e5; margin-top: 16px;">Discovery Questions</h3><ul style="line-height: 1.8;">${questionsHtml}</ul>` : ''}
    ${actionItemsHtml ? `<h3 style="color: #FF9D2D; margin-top: 16px;">Open Action Items</h3><ul style="line-height: 1.8;">${actionItemsHtml}</ul>` : ''}
    ${risksHtml}

    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
    <p style="color: #9ca3af; font-size: 12px; margin: 0;">
      Generated by ReplySequence | <a href="https://www.replysequence.com/dashboard" style="color: #6366f1;">View in Dashboard</a>
    </p>
  </div>
</div>`;

  const result = await sendEmail({
    to: userEmail,
    subject: `Briefing: ${meetingTitle} (${timeStr})`,
    body: content.executiveSummary,
    html,
    includeSignature: false,
  });

  return result.success;
}

/**
 * Main entry point: generate a briefing for a specific calendar event
 */
export async function generateBriefing(
  userId: string,
  calendarEventId: string
): Promise<{ success: boolean; briefingId?: string; error?: string }> {
  // Pre-flight: fetch event and user before entering the agent wrapper,
  // so we can return early with a clear error without recording a failed action.
  const [event] = await db
    .select()
    .from(calendarEvents)
    .where(
      and(
        eq(calendarEvents.id, calendarEventId),
        eq(calendarEvents.userId, userId)
      )
    )
    .limit(1);

  if (!event) {
    return { success: false, error: 'Calendar event not found' };
  }

  const [user] = await db
    .select({ id: users.id, email: users.email, name: users.name })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    return { success: false, error: 'User not found' };
  }

  const result = await runAgent<{ briefingId: string }>({
    name: 'pre-meeting-briefing',
    description: `Generate pre-meeting briefing for "${event.title}"`,
    userId,
    fn: async () => {
      const attendees = (event.attendees || []) as CalendarEventAttendee[];
      const attendeeEmails = attendees
        .map(a => a.email)
        .filter(Boolean);

      log('info', 'Generating briefing', {
        userId,
        calendarEventId,
        meetingTitle: event.title,
        attendeeCount: attendeeEmails.length,
      });

      // Create briefing record in generating state
      const [briefing] = await db
        .insert(preMeetingBriefings)
        .values({
          userId,
          calendarEventId,
          meetingTitle: event.title,
          meetingStartTime: event.startTime,
          meetingPlatform: event.meetingPlatform,
          meetingUrl: event.meetingUrl,
          status: 'generating',
        })
        .onConflictDoNothing()
        .returning({ id: preMeetingBriefings.id });

      if (!briefing) {
        log('info', 'Briefing already exists for this event', { calendarEventId });
        // Return with zero tokens since no AI call was made
        return {
          data: { briefingId: '' },
          tokens: { input: 0, output: 0 },
          metadata: { skipped: true, reason: 'already_exists' },
        };
      }

      // Find past meetings with overlapping attendees
      const pastMeetings = await findRelatedMeetings(userId, attendeeEmails);

      // Build attendee insights
      const attendeeInsights = buildAttendeeInsights(attendees, pastMeetings);

      // Generate briefing with Claude
      const { content, inputTokens, outputTokens } = await generateBriefingContent(
        event.title,
        attendeeInsights,
        pastMeetings,
        user.name || 'there'
      );

      // Calculate cost using shared utility (Haiku pricing differs from Sonnet,
      // but calculateCost uses Sonnet rates. We pass 0 for cache tokens and
      // store the correct Haiku cost in the briefing record directly.)
      const haikuCostUsd = (inputTokens * 1 + outputTokens * 5) / 1_000_000;

      // Update briefing with content
      await db
        .update(preMeetingBriefings)
        .set({
          content,
          status: 'ready',
          generationModel: 'claude-haiku-4-5-20251001',
          inputTokens,
          outputTokens,
          costUsd: haikuCostUsd.toFixed(6),
          updatedAt: new Date(),
        })
        .where(eq(preMeetingBriefings.id, briefing.id));

      // Send email notification
      try {
        const emailSent = await sendBriefingEmail(
          user.email,
          user.name || 'there',
          event.title,
          event.startTime,
          content
        );

        if (emailSent) {
          await db
            .update(preMeetingBriefings)
            .set({
              emailSentAt: new Date(),
              deliveryChannel: 'both',
              updatedAt: new Date(),
            })
            .where(eq(preMeetingBriefings.id, briefing.id));
        }
      } catch (emailErr) {
        log('warn', 'Failed to send briefing email', {
          briefingId: briefing.id,
          error: emailErr instanceof Error ? emailErr.message : String(emailErr),
        });
      }

      log('info', 'Briefing generated successfully', {
        briefingId: briefing.id,
        pastMeetingsFound: pastMeetings.length,
        attendeeCount: attendeeInsights.length,
      });

      return {
        data: { briefingId: briefing.id },
        tokens: { input: inputTokens, output: outputTokens },
        metadata: {
          pastMeetingsFound: pastMeetings.length,
          attendeeCount: attendeeInsights.length,
          model: 'claude-haiku-4-5-20251001',
        },
      };
    },
  });

  if (!result.success) {
    return { success: false, error: result.error };
  }

  // Handle the "already exists" skip case
  if (result.data && !result.data.briefingId) {
    return { success: true, error: 'Briefing already exists' };
  }

  return { success: true, briefingId: result.data?.briefingId };
}
