/**
 * Meeting Search — finds relevant meetings and transcripts for conversational AI queries.
 *
 * V1 approach: PostgreSQL text search (ILIKE + ts_rank) instead of vector embeddings.
 * For most users (<100 meetings), this is fast and accurate enough.
 * We can upgrade to pgvector later if needed.
 */

import { db } from './db';
import { meetings, transcripts } from './db/schema';
import { eq, and, desc, sql, ilike, or } from 'drizzle-orm';
import type { MeetingPlatform, SpeakerSegment } from './db/schema';

export interface MeetingSearchResult {
  meetingId: string;
  topic: string;
  platform: MeetingPlatform;
  hostEmail: string;
  startTime: Date | null;
  duration: number | null;
  participants: { user_name: string; email?: string }[];
  summary: string | null;
  // Transcript info
  transcriptId: string | null;
  transcriptSnippet: string; // Relevant portion of transcript
  wordCount: number | null;
  // Relevance
  relevanceScore: number;
}

/**
 * Search a user's meetings by query text.
 * Returns the most relevant meetings with transcript snippets.
 *
 * Strategy:
 * 1. Search meeting topics and summaries
 * 2. Search transcript content
 * 3. Score and rank results
 * 4. Return top N with context snippets
 */
export async function searchMeetings(params: {
  userId: string;
  query: string;
  meetingId?: string; // Scope to a single meeting
  limit?: number;
}): Promise<MeetingSearchResult[]> {
  const { userId, query, meetingId, limit = 5 } = params;

  // Extract search terms for ILIKE matching
  const searchTerms = query
    .toLowerCase()
    .split(/\s+/)
    .filter(t => t.length > 2) // Skip very short words
    .slice(0, 8); // Cap at 8 terms

  if (searchTerms.length === 0) {
    // No meaningful search terms — return recent meetings
    return getRecentMeetings(userId, meetingId, limit);
  }

  // Build ILIKE conditions for each term across topic, summary, and transcript
  const results = await db
    .select({
      meetingId: meetings.id,
      topic: meetings.topic,
      platform: meetings.platform,
      hostEmail: meetings.hostEmail,
      startTime: meetings.startTime,
      duration: meetings.duration,
      participants: meetings.participants,
      summary: meetings.summary,
      transcriptId: transcripts.id,
      transcriptContent: transcripts.content,
      wordCount: transcripts.wordCount,
      speakerSegments: transcripts.speakerSegments,
    })
    .from(meetings)
    .leftJoin(transcripts, and(
      eq(transcripts.meetingId, meetings.id),
      eq(transcripts.status, 'ready'),
    ))
    .where(and(
      eq(meetings.userId, userId),
      eq(meetings.status, 'completed'),
      meetingId ? eq(meetings.id, meetingId) : undefined,
      // At least one term must match somewhere
      or(
        ...searchTerms.map(term =>
          or(
            ilike(meetings.topic, `%${term}%`),
            ilike(meetings.summary, `%${term}%`),
            ilike(transcripts.content, `%${term}%`),
          )
        ),
      ),
    ))
    .orderBy(desc(meetings.startTime))
    .limit(limit * 2); // Fetch extra for scoring

  // Score results by term frequency
  const scored = results.map(row => {
    let score = 0;
    const topicLower = (row.topic || '').toLowerCase();
    const summaryLower = (row.summary || '').toLowerCase();
    const contentLower = (row.transcriptContent || '').toLowerCase();

    for (const term of searchTerms) {
      // Topic matches are most valuable (3x)
      if (topicLower.includes(term)) score += 3;
      // Summary matches (2x)
      if (summaryLower.includes(term)) score += 2;
      // Transcript matches (1x)
      if (contentLower.includes(term)) score += 1;
    }

    // Extract a relevant snippet from transcript
    const snippet = extractRelevantSnippet(
      row.transcriptContent || '',
      row.speakerSegments as SpeakerSegment[] | null,
      searchTerms,
    );

    return {
      meetingId: row.meetingId,
      topic: row.topic || 'Untitled Meeting',
      platform: row.platform,
      hostEmail: row.hostEmail,
      startTime: row.startTime,
      duration: row.duration,
      participants: (row.participants as { user_name: string; email?: string }[]) || [],
      summary: row.summary,
      transcriptId: row.transcriptId,
      transcriptSnippet: snippet,
      wordCount: row.wordCount,
      relevanceScore: score,
    };
  });

  // Sort by relevance score (desc), then recency
  scored.sort((a, b) => {
    if (b.relevanceScore !== a.relevanceScore) return b.relevanceScore - a.relevanceScore;
    const aTime = a.startTime?.getTime() || 0;
    const bTime = b.startTime?.getTime() || 0;
    return bTime - aTime;
  });

  return scored.slice(0, limit);
}

/**
 * Get recent meetings (fallback when no search terms).
 */
async function getRecentMeetings(
  userId: string,
  meetingId: string | undefined,
  limit: number,
): Promise<MeetingSearchResult[]> {
  const results = await db
    .select({
      meetingId: meetings.id,
      topic: meetings.topic,
      platform: meetings.platform,
      hostEmail: meetings.hostEmail,
      startTime: meetings.startTime,
      duration: meetings.duration,
      participants: meetings.participants,
      summary: meetings.summary,
      transcriptId: transcripts.id,
      transcriptContent: transcripts.content,
      wordCount: transcripts.wordCount,
    })
    .from(meetings)
    .leftJoin(transcripts, and(
      eq(transcripts.meetingId, meetings.id),
      eq(transcripts.status, 'ready'),
    ))
    .where(and(
      eq(meetings.userId, userId),
      eq(meetings.status, 'completed'),
      meetingId ? eq(meetings.id, meetingId) : undefined,
    ))
    .orderBy(desc(meetings.startTime))
    .limit(limit);

  return results.map(row => ({
    meetingId: row.meetingId,
    topic: row.topic || 'Untitled Meeting',
    platform: row.platform,
    hostEmail: row.hostEmail,
    startTime: row.startTime,
    duration: row.duration,
    participants: (row.participants as { user_name: string; email?: string }[]) || [],
    summary: row.summary,
    transcriptId: row.transcriptId,
    transcriptSnippet: truncateContent(row.transcriptContent || '', 500),
    wordCount: row.wordCount,
    relevanceScore: 1,
  }));
}

/**
 * Extract a relevant snippet from a transcript around matching terms.
 * Returns speaker segments that contain the search terms.
 */
function extractRelevantSnippet(
  content: string,
  segments: SpeakerSegment[] | null,
  terms: string[],
): string {
  // If we have speaker segments, find relevant ones
  if (segments && segments.length > 0) {
    const relevantSegments = segments.filter(seg => {
      const textLower = seg.text.toLowerCase();
      return terms.some(term => textLower.includes(term));
    });

    if (relevantSegments.length > 0) {
      // Take up to 5 most relevant segments
      return relevantSegments
        .slice(0, 5)
        .map(seg => `${seg.speaker}: ${seg.text}`)
        .join('\n');
    }
  }

  // Fallback: find the section of plain text content around the first match
  if (!content) return '';

  const contentLower = content.toLowerCase();
  for (const term of terms) {
    const idx = contentLower.indexOf(term);
    if (idx !== -1) {
      const start = Math.max(0, idx - 200);
      const end = Math.min(content.length, idx + 300);
      let snippet = content.slice(start, end);
      if (start > 0) snippet = '...' + snippet;
      if (end < content.length) snippet = snippet + '...';
      return snippet;
    }
  }

  return truncateContent(content, 500);
}

/**
 * Truncate content to a max length at a word boundary.
 */
function truncateContent(content: string, maxLength: number): string {
  if (content.length <= maxLength) return content;
  const truncated = content.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  return (lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated) + '...';
}

/**
 * Build context for Claude from search results.
 * Formats meeting data into a prompt-friendly string.
 */
export function buildMeetingContext(results: MeetingSearchResult[]): string {
  if (results.length === 0) {
    return 'No meetings found matching the query.';
  }

  return results.map((m, i) => {
    const date = m.startTime
      ? m.startTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
      : 'Unknown date';
    const platform = m.platform === 'zoom' ? 'Zoom' : m.platform === 'microsoft_teams' ? 'Teams' : 'Google Meet';
    const participantNames = m.participants.map(p => p.user_name).join(', ') || 'Unknown';
    const duration = m.duration ? `${m.duration} minutes` : 'Unknown duration';

    let context = `=== Meeting ${i + 1}: ${m.topic} ===\n`;
    context += `Date: ${date} | Platform: ${platform} | Duration: ${duration}\n`;
    context += `Participants: ${participantNames}\n`;

    if (m.summary) {
      context += `\nSummary: ${m.summary}\n`;
    }

    if (m.transcriptSnippet) {
      context += `\nTranscript excerpt:\n${m.transcriptSnippet}\n`;
    }

    return context;
  }).join('\n\n');
}

/**
 * Get the full transcript for a single meeting (for focused queries).
 */
export async function getFullTranscript(meetingId: string, userId: string): Promise<string | null> {
  const [result] = await db
    .select({
      content: transcripts.content,
      meetingUserId: meetings.userId,
    })
    .from(transcripts)
    .innerJoin(meetings, eq(meetings.id, transcripts.meetingId))
    .where(and(
      eq(transcripts.meetingId, meetingId),
      eq(transcripts.status, 'ready'),
      eq(meetings.userId, userId),
    ))
    .limit(1);

  return result?.content || null;
}
