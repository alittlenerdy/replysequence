/**
 * Async sentiment analysis for meeting transcripts.
 * Uses Claude Haiku to classify overall + per-speaker sentiment.
 * Non-blocking — called fire-and-forget after draft generation.
 *
 * Cost: ~$0.001 per meeting
 */

import { HAIKU_MODEL, HAIKU_PRICING } from './grade-draft';
import { log } from './claude-api';
import { db, meetings } from './db';
import { eq } from 'drizzle-orm';
import type { SpeakerSegment, MeetingSentiment, SentimentLabel } from './db/schema';
import Anthropic from '@anthropic-ai/sdk';

// Singleton Haiku client (reuse from grade-draft pattern)
let sentimentClient: Anthropic | null = null;

function getSentimentClient(): Anthropic {
  if (!sentimentClient) {
    sentimentClient = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
      timeout: 15 * 1000,
      maxRetries: 2,
    });
    log('info', 'Sentiment analysis client initialized');
  }
  return sentimentClient;
}

const SENTIMENT_SYSTEM_PROMPT = `You are a meeting sentiment analyst. Analyze the emotional tone and sentiment of a meeting transcript.

You MUST respond with ONLY valid JSON in this exact format:
{
  "overall_score": <number -1.0 to 1.0>,
  "overall_label": "<positive|neutral|negative|mixed>",
  "overall_trend": "<improving|stable|declining>",
  "overall_tones": ["<tone1>", "<tone2>"],
  "speakers": [
    {
      "name": "<speaker name>",
      "score": <number -1.0 to 1.0>,
      "label": "<positive|neutral|negative|mixed>",
      "tones": ["<tone1>"]
    }
  ]
}

Scoring guide:
- 0.5 to 1.0: Clearly positive (enthusiastic, collaborative, optimistic)
- 0.1 to 0.49: Slightly positive (agreeable, constructive)
- -0.1 to 0.1: Neutral (factual, procedural)
- -0.49 to -0.1: Slightly negative (hesitant, concerned)
- -1.0 to -0.5: Clearly negative (frustrated, confrontational, dismissive)

Trend: "improving" if tone gets better over the meeting, "declining" if worse, "stable" if consistent.

Tones should be 1-3 descriptive words like: enthusiastic, collaborative, tense, hesitant, professional, frustrated, optimistic, analytical, concerned, supportive.

Do not include any text before or after the JSON.`;

/**
 * Build transcript text from speaker segments for the prompt.
 * Truncates to ~8000 chars to stay within Haiku context limits.
 */
function buildTranscriptText(segments: SpeakerSegment[]): string {
  const lines = segments.map(s => `${s.speaker}: ${s.text}`);
  const full = lines.join('\n');
  if (full.length <= 8000) return full;
  return full.substring(0, 8000) + '\n... [transcript truncated for analysis]';
}

/**
 * Validate a sentiment label string
 */
function validateLabel(label: string): SentimentLabel {
  const valid: SentimentLabel[] = ['positive', 'neutral', 'negative', 'mixed'];
  return valid.includes(label as SentimentLabel) ? (label as SentimentLabel) : 'neutral';
}

/**
 * Clamp a score to the valid range
 */
function clampScore(score: number): number {
  if (typeof score !== 'number' || isNaN(score)) return 0;
  return Math.max(-1, Math.min(1, Math.round(score * 100) / 100));
}

/**
 * Analyze sentiment for a meeting's transcript segments.
 * Stores results directly in the meetings table.
 */
export async function analyzeSentiment(
  meetingId: string,
  segments: SpeakerSegment[],
): Promise<void> {
  const startTime = Date.now();

  log('info', '[SENTIMENT-1] Starting sentiment analysis', {
    meetingId,
    segmentCount: segments.length,
  });

  if (!segments || segments.length === 0) {
    log('warn', '[SENTIMENT] No segments to analyze', { meetingId });
    return;
  }

  const transcriptText = buildTranscriptText(segments);

  // Get unique speaker names for validation
  const speakerNames = [...new Set(segments.map(s => s.speaker))];

  const userPrompt = `Analyze the sentiment of this meeting transcript with ${speakerNames.length} speakers: ${speakerNames.join(', ')}

TRANSCRIPT:
${transcriptText}

Return the JSON sentiment analysis.`;

  try {
    const client = getSentimentClient();

    const message = await client.messages.create({
      model: HAIKU_MODEL,
      max_tokens: 500,
      system: SENTIMENT_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const textBlock = message.content.find((b) => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('No text content in sentiment response');
    }

    // Parse JSON response
    const jsonMatch = textBlock.text.trim().match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in sentiment response');
    }

    const parsed = JSON.parse(jsonMatch[0]) as {
      overall_score: number;
      overall_label: string;
      overall_trend: string;
      overall_tones: string[];
      speakers: Array<{
        name: string;
        score: number;
        label: string;
        tones: string[];
      }>;
    };

    // Build validated MeetingSentiment
    const sentiment: MeetingSentiment = {
      overall: {
        score: clampScore(parsed.overall_score),
        label: validateLabel(parsed.overall_label),
        trend: (['improving', 'stable', 'declining'].includes(parsed.overall_trend)
          ? parsed.overall_trend
          : 'stable') as MeetingSentiment['overall']['trend'],
        tones: Array.isArray(parsed.overall_tones) ? parsed.overall_tones.slice(0, 5) : [],
      },
      speakers: Array.isArray(parsed.speakers)
        ? parsed.speakers.map(s => ({
            name: s.name || 'Unknown',
            score: clampScore(s.score),
            label: validateLabel(s.label),
            tones: Array.isArray(s.tones) ? s.tones.slice(0, 3) : [],
          }))
        : [],
    };

    // Store in database
    await db
      .update(meetings)
      .set({
        sentimentAnalysis: sentiment,
        sentimentAnalyzedAt: new Date(),
      })
      .where(eq(meetings.id, meetingId));

    const durationMs = Date.now() - startTime;
    const costUsd = (message.usage.input_tokens / 1_000_000) * HAIKU_PRICING.inputPerMillion +
                    (message.usage.output_tokens / 1_000_000) * HAIKU_PRICING.outputPerMillion;

    log('info', '[SENTIMENT-2] Sentiment analysis complete', {
      meetingId,
      overallScore: sentiment.overall.score,
      overallLabel: sentiment.overall.label,
      trend: sentiment.overall.trend,
      speakerCount: sentiment.speakers.length,
      durationMs,
      costUsd: costUsd.toFixed(6),
    });
  } catch (error) {
    const durationMs = Date.now() - startTime;
    log('error', '[SENTIMENT-ERROR] Sentiment analysis failed', {
      meetingId,
      error: error instanceof Error ? error.message : String(error),
      durationMs,
    });
    // Don't rethrow — sentiment is non-blocking
  }
}
