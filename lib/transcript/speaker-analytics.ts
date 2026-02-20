/**
 * Speaker analytics — computes talk time, monologues, and question counts
 * from pre-parsed SpeakerSegment[] stored in the transcripts table.
 */

import type { SpeakerSegment } from '../db/schema';
import type { SpeakerStat, SpeakerAnalytics } from '../types/analytics';

const MONOLOGUE_THRESHOLD_MS = 60_000; // 60 seconds

/**
 * Count sentences ending with "?" in a text block.
 */
function countQuestions(text: string): number {
  // Split on sentence boundaries and count those ending with ?
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  // Count the ?-terminated ones from the original text
  const matches = text.match(/\?/g);
  return matches ? matches.length : 0;
}

/**
 * Analyze a single meeting's speaker segments.
 */
export function analyzeSpeakerSegments(segments: SpeakerSegment[]): SpeakerStat[] {
  if (!segments || segments.length === 0) return [];

  // Accumulate per-speaker stats
  const speakerMap = new Map<string, {
    talkTimeMs: number;
    segmentCount: number;
    questionCount: number;
    longestMonologueMs: number;
    monologueCount: number;
  }>();

  for (const seg of segments) {
    const duration = Math.max(0, seg.end_time - seg.start_time);
    const existing = speakerMap.get(seg.speaker);

    if (existing) {
      existing.talkTimeMs += duration;
      existing.segmentCount++;
      existing.questionCount += countQuestions(seg.text);
      if (duration > existing.longestMonologueMs) {
        existing.longestMonologueMs = duration;
      }
      if (duration >= MONOLOGUE_THRESHOLD_MS) {
        existing.monologueCount++;
      }
    } else {
      speakerMap.set(seg.speaker, {
        talkTimeMs: duration,
        segmentCount: 1,
        questionCount: countQuestions(seg.text),
        longestMonologueMs: duration,
        monologueCount: duration >= MONOLOGUE_THRESHOLD_MS ? 1 : 0,
      });
    }
  }

  // Total talk time across all speakers
  let totalTalkTimeMs = 0;
  for (const stats of speakerMap.values()) {
    totalTalkTimeMs += stats.talkTimeMs;
  }

  // Build result array sorted by talk time descending
  const result: SpeakerStat[] = [];
  for (const [speaker, stats] of speakerMap) {
    result.push({
      speaker,
      talkTimeMs: stats.talkTimeMs,
      talkTimePercent: totalTalkTimeMs > 0
        ? Math.round((stats.talkTimeMs / totalTalkTimeMs) * 1000) / 10
        : 0,
      segmentCount: stats.segmentCount,
      avgSegmentMs: stats.segmentCount > 0
        ? Math.round(stats.talkTimeMs / stats.segmentCount)
        : 0,
      questionCount: stats.questionCount,
      longestMonologueMs: stats.longestMonologueMs,
      monologueCount: stats.monologueCount,
    });
  }

  result.sort((a, b) => b.talkTimeMs - a.talkTimeMs);
  return result;
}

/**
 * Aggregate speaker analytics across multiple meetings' transcripts.
 * Takes an array of SpeakerSegment[] arrays (one per transcript).
 */
export function aggregateSpeakerAnalytics(
  transcriptSegments: SpeakerSegment[][],
  userEmail?: string,
): SpeakerAnalytics {
  if (transcriptSegments.length === 0) {
    return {
      totalSpeakers: 0,
      totalTalkTimeMs: 0,
      totalMonologues: 0,
      avgTalkToListenRatio: null,
      speakers: [],
      meetingsAnalyzed: 0,
    };
  }

  // Aggregate across all meetings
  const globalMap = new Map<string, {
    talkTimeMs: number;
    segmentCount: number;
    questionCount: number;
    longestMonologueMs: number;
    monologueCount: number;
  }>();

  let meetingsAnalyzed = 0;

  for (const segments of transcriptSegments) {
    if (!segments || segments.length === 0) continue;
    meetingsAnalyzed++;

    const perMeeting = analyzeSpeakerSegments(segments);
    for (const stat of perMeeting) {
      const existing = globalMap.get(stat.speaker);
      if (existing) {
        existing.talkTimeMs += stat.talkTimeMs;
        existing.segmentCount += stat.segmentCount;
        existing.questionCount += stat.questionCount;
        existing.monologueCount += stat.monologueCount;
        if (stat.longestMonologueMs > existing.longestMonologueMs) {
          existing.longestMonologueMs = stat.longestMonologueMs;
        }
      } else {
        globalMap.set(stat.speaker, {
          talkTimeMs: stat.talkTimeMs,
          segmentCount: stat.segmentCount,
          questionCount: stat.questionCount,
          longestMonologueMs: stat.longestMonologueMs,
          monologueCount: stat.monologueCount,
        });
      }
    }
  }

  // Compute totals
  let totalTalkTimeMs = 0;
  let totalMonologues = 0;
  for (const stats of globalMap.values()) {
    totalTalkTimeMs += stats.talkTimeMs;
    totalMonologues += stats.monologueCount;
  }

  // Build speaker stats with percentages
  const speakers: SpeakerStat[] = [];
  for (const [speaker, stats] of globalMap) {
    speakers.push({
      speaker,
      talkTimeMs: stats.talkTimeMs,
      talkTimePercent: totalTalkTimeMs > 0
        ? Math.round((stats.talkTimeMs / totalTalkTimeMs) * 1000) / 10
        : 0,
      segmentCount: stats.segmentCount,
      avgSegmentMs: stats.segmentCount > 0
        ? Math.round(stats.talkTimeMs / stats.segmentCount)
        : 0,
      questionCount: stats.questionCount,
      longestMonologueMs: stats.longestMonologueMs,
      monologueCount: stats.monologueCount,
    });
  }
  speakers.sort((a, b) => b.talkTimeMs - a.talkTimeMs);

  // Calculate talk-to-listen ratio for the user (match by email prefix or name)
  let avgTalkToListenRatio: number | null = null;
  if (userEmail) {
    const emailPrefix = userEmail.split('@')[0].toLowerCase();
    const userSpeaker = speakers.find(s => {
      const name = s.speaker.toLowerCase();
      return name.includes(emailPrefix) || emailPrefix.includes(name.replace(/\s+/g, ''));
    });
    if (userSpeaker && totalTalkTimeMs > 0) {
      avgTalkToListenRatio = Math.round((userSpeaker.talkTimeMs / totalTalkTimeMs) * 100);
    }
  }

  return {
    totalSpeakers: globalMap.size,
    totalTalkTimeMs,
    totalMonologues,
    avgTalkToListenRatio,
    speakers: speakers.slice(0, 20), // Top 20 speakers max
    meetingsAnalyzed,
  };
}
