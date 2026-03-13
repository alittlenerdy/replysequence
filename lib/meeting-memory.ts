/**
 * AI Meeting Memory — Persistent Context Across Calls
 *
 * Extracts per-meeting insights and accumulates them into contact-level memory.
 * Called after a meeting is processed (transcript ready + draft generated).
 *
 * Two-layer architecture:
 * 1. meetingMemories — per-meeting extracted insights
 * 2. contactMemories — accumulated context per contact across all meetings
 */

import { db } from '@/lib/db';
import { meetings, transcripts, contactMemories, meetingMemories } from '@/lib/db/schema';
import type { Participant } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { callClaudeAPI, calculateCost } from '@/lib/claude-api';

function log(level: 'info' | 'warn' | 'error', message: string, data?: Record<string, unknown>) {
  console.log(JSON.stringify({ level, tag: '[MEETING-MEMORY]', message, ...data }));
}

interface ExtractedMemory {
  summary: string;
  keyInsights: string[];
  topicsDiscussed: string[];
  objectionsRaised: string[];
  commitmentsGiven: string[];
  questionsAsked: string[];
  sentimentTrend: 'positive' | 'neutral' | 'negative' | 'mixed';
  contactRole?: string;
  communicationStyle?: string;
  personalNotes: string[];
}

const MEMORY_EXTRACTION_PROMPT = `You are a meeting intelligence analyst. Extract structured insights from this meeting transcript for building long-term memory about the contact.

Output a JSON object with these fields:
- "summary": 2-3 sentence meeting summary
- "keyInsights": Array of key takeaways (max 5)
- "topicsDiscussed": Array of main topics covered
- "objectionsRaised": Array of any concerns, objections, or pushback from the external participant
- "commitmentsGiven": Array of promises or commitments made by either side
- "questionsAsked": Array of important questions the contact asked (reveals their priorities)
- "sentimentTrend": One of "positive", "neutral", "negative", "mixed"
- "contactRole": The contact's role/title if mentioned (or null)
- "communicationStyle": Brief description of their communication style (e.g., "direct and data-driven", "relationship-focused", "detail-oriented")
- "personalNotes": Array of personal details mentioned (hobbies, upcoming events, preferences) that could help build rapport

Focus on information that would be useful in future meetings with this same contact. Be specific — use names, numbers, dates. Ignore small talk unless it reveals useful personal context.`;

/**
 * Extract memory from a completed meeting and update contact memory.
 * Fire-and-forget — logs errors but never throws.
 */
export async function extractMeetingMemory(meetingId: string, userId: string): Promise<void> {
  try {
    // Fetch meeting + transcript
    const [meeting] = await db
      .select({
        id: meetings.id,
        topic: meetings.topic,
        startTime: meetings.startTime,
        hostName: meetings.hostName,
        hostEmail: meetings.hostEmail,
        participants: meetings.participants,
        summary: meetings.summary,
      })
      .from(meetings)
      .where(eq(meetings.id, meetingId))
      .limit(1);

    if (!meeting) {
      log('warn', 'Meeting not found for memory extraction', { meetingId });
      return;
    }

    const [transcript] = await db
      .select({ content: transcripts.content })
      .from(transcripts)
      .where(eq(transcripts.meetingId, meetingId))
      .limit(1);

    if (!transcript?.content) {
      log('info', 'No transcript for memory extraction', { meetingId });
      return;
    }

    // Identify the external contact (first non-host participant with email)
    const participants = (meeting.participants || []) as Participant[];
    const externalContact = participants.find((p) => p.email && p.email !== meeting.hostEmail);

    if (!externalContact?.email) {
      log('info', 'No external contact found, skipping memory extraction', { meetingId });
      return;
    }

    // Truncate transcript for API
    const maxChars = 32000;
    const transcriptText = transcript.content.length > maxChars
      ? transcript.content.slice(0, maxChars) + '\n[Truncated]'
      : transcript.content;

    // Extract memory via Claude
    const userPrompt = [
      `Meeting: ${meeting.topic || 'Untitled'}`,
      `Date: ${meeting.startTime ? new Date(meeting.startTime).toISOString() : 'Unknown'}`,
      `Host: ${meeting.hostName || 'Unknown'}`,
      `Contact: ${externalContact.user_name} (${externalContact.email})`,
      '',
      'Transcript:',
      transcriptText,
    ].join('\n');

    log('info', 'Extracting meeting memory', { meetingId, contactEmail: externalContact.email });

    const result = await callClaudeAPI({
      systemPrompt: MEMORY_EXTRACTION_PROMPT,
      userPrompt,
      maxTokens: 2048,
    });

    // Parse response
    let extracted: ExtractedMemory;
    try {
      let jsonStr = result.content.trim();
      const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) jsonStr = jsonMatch[1].trim();
      extracted = JSON.parse(jsonStr);
    } catch {
      log('warn', 'Failed to parse memory extraction response', { meetingId });
      // Use meeting summary as fallback
      extracted = {
        summary: meeting.summary || 'Meeting processed',
        keyInsights: [],
        topicsDiscussed: [],
        objectionsRaised: [],
        commitmentsGiven: [],
        questionsAsked: [],
        sentimentTrend: 'neutral',
        personalNotes: [],
      };
    }

    // Upsert contact memory
    const contactEmail = externalContact.email;
    const contactName = externalContact.user_name;

    // Check for existing contact memory
    const [existing] = await db
      .select()
      .from(contactMemories)
      .where(and(eq(contactMemories.userId, userId), eq(contactMemories.contactEmail, contactEmail)))
      .limit(1);

    let contactMemoryId: string;

    if (existing) {
      // Merge new insights into existing memory
      const mergedTopics = dedupeArray([...(existing.topics || []), ...extracted.topicsDiscussed]);
      const mergedObjections = dedupeArray([...(existing.objections || []), ...extracted.objectionsRaised]);
      const mergedCommitments = dedupeArray([...(existing.commitments || []), ...extracted.commitmentsGiven]);
      const mergedNotes = dedupeArray([...(existing.personalNotes || []), ...extracted.personalNotes]);

      await db
        .update(contactMemories)
        .set({
          contactName: contactName || existing.contactName,
          role: extracted.contactRole || existing.role,
          topics: mergedTopics.slice(-20), // Keep last 20
          objections: mergedObjections.slice(-15),
          commitments: mergedCommitments.slice(-15),
          personalNotes: mergedNotes.slice(-10),
          communicationStyle: extracted.communicationStyle || existing.communicationStyle,
          meetingCount: existing.meetingCount + 1,
          lastMeetingId: meetingId,
          lastMeetingAt: meeting.startTime || new Date(),
          updatedAt: new Date(),
        })
        .where(eq(contactMemories.id, existing.id));

      contactMemoryId = existing.id;
    } else {
      // Create new contact memory
      const [newMem] = await db
        .insert(contactMemories)
        .values({
          userId,
          contactEmail,
          contactName,
          role: extracted.contactRole,
          topics: extracted.topicsDiscussed,
          objections: extracted.objectionsRaised,
          commitments: extracted.commitmentsGiven,
          personalNotes: extracted.personalNotes,
          communicationStyle: extracted.communicationStyle,
          meetingCount: 1,
          lastMeetingId: meetingId,
          lastMeetingAt: meeting.startTime || new Date(),
        })
        .returning({ id: contactMemories.id });

      contactMemoryId = newMem.id;
    }

    // Store per-meeting memory
    await db.insert(meetingMemories).values({
      meetingId,
      contactMemoryId,
      userId,
      summary: extracted.summary,
      keyInsights: extracted.keyInsights,
      topicsDiscussed: extracted.topicsDiscussed,
      objectionsRaised: extracted.objectionsRaised,
      commitmentsGiven: extracted.commitmentsGiven,
      questionsAsked: extracted.questionsAsked,
      sentimentTrend: extracted.sentimentTrend,
      contactEmail,
      contactName,
    });

    const cost = calculateCost(result.inputTokens, result.outputTokens, result.cacheCreationTokens, result.cacheReadTokens);
    log('info', 'Meeting memory extracted and stored', {
      meetingId,
      contactEmail,
      contactMemoryId,
      isNew: !existing,
      costUsd: cost.toFixed(6),
    });
  } catch (error) {
    log('error', 'Meeting memory extraction failed', {
      meetingId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Get contact memory with recent meeting history for briefing before a meeting.
 */
export async function getContactBriefing(
  userId: string,
  contactEmail: string
): Promise<{
  contact: typeof contactMemories.$inferSelect | null;
  recentMeetings: (typeof meetingMemories.$inferSelect)[];
} | null> {
  const [contact] = await db
    .select()
    .from(contactMemories)
    .where(and(eq(contactMemories.userId, userId), eq(contactMemories.contactEmail, contactEmail)))
    .limit(1);

  if (!contact) return null;

  const recentMeetings = await db
    .select()
    .from(meetingMemories)
    .where(and(eq(meetingMemories.userId, userId), eq(meetingMemories.contactEmail, contactEmail)))
    .orderBy(desc(meetingMemories.createdAt))
    .limit(10);

  return { contact, recentMeetings };
}

/**
 * Search meeting memories by keyword across all contacts.
 */
export async function searchMeetingMemories(
  userId: string,
  query: string,
  limit = 20
): Promise<(typeof meetingMemories.$inferSelect)[]> {
  // Text search across summaries and insights
  const results = await db
    .select()
    .from(meetingMemories)
    .where(eq(meetingMemories.userId, userId))
    .orderBy(desc(meetingMemories.createdAt))
    .limit(limit * 3); // Over-fetch for filtering

  // Client-side filtering (until pgvector is added for semantic search)
  const queryLower = query.toLowerCase();
  const filtered = results.filter((m) => {
    const searchable = [
      m.summary,
      ...(m.keyInsights || []),
      ...(m.topicsDiscussed || []),
      ...(m.objectionsRaised || []),
      ...(m.commitmentsGiven || []),
      ...(m.questionsAsked || []),
      m.contactName || '',
      m.contactEmail || '',
    ].join(' ').toLowerCase();
    return searchable.includes(queryLower);
  });

  return filtered.slice(0, limit);
}

function dedupeArray(arr: string[]): string[] {
  const seen = new Set<string>();
  return arr.filter((item) => {
    const lower = item.toLowerCase().trim();
    if (seen.has(lower)) return false;
    seen.add(lower);
    return true;
  });
}
