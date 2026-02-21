# Sentiment Analysis Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add async sentiment analysis to meeting transcript processing using Claude Haiku, storing results on the meetings table, displaying in the meeting detail UI, syncing to CRMs, and surfacing in the analytics dashboard.

**Architecture:** Fire-and-forget Haiku call after draft generation (matches existing `gradeDraftAsync` pattern in `lib/generate-draft.ts`). Single JSONB column on `meetings` table stores overall + per-speaker sentiment. UI card in MeetingDetailView, CRM field mapping extensions, and analytics aggregation section.

**Tech Stack:** Anthropic SDK (Haiku), Drizzle ORM (PostgreSQL JSONB), React (Tailwind UI cards), existing CRM sync infra.

**Design doc:** `docs/plans/2026-02-20-sentiment-analysis-design.md`

---

## Task 1: Database Schema — Add Sentiment Columns

**Files:**
- Modify: `lib/db/schema.ts:72-118` (meetings table)

**Step 1: Add MeetingSentiment type and columns to schema**

Add these types after the existing `MeetingTopic` interface (~line 70):

```typescript
// Sentiment analysis types
export type SentimentLabel = 'positive' | 'neutral' | 'negative' | 'mixed';
export type SentimentTrend = 'improving' | 'stable' | 'declining';

export interface SpeakerSentiment {
  name: string;
  score: number;        // -1.0 to 1.0
  label: SentimentLabel;
  tones: string[];
}

export interface MeetingSentiment {
  overall: {
    score: number;        // -1.0 to 1.0
    label: SentimentLabel;
    trend: SentimentTrend;
    tones: string[];
  };
  speakers: SpeakerSentiment[];
}
```

Add these columns to the `meetings` table definition, after `summaryGeneratedAt` (~line 96):

```typescript
    // Sentiment analysis fields (populated async by Haiku)
    sentimentAnalysis: jsonb('sentiment_analysis').$type<MeetingSentiment>(),
    sentimentAnalyzedAt: timestamp('sentiment_analyzed_at', { withTimezone: true }),
```

**Step 2: Push schema to database**

Run: `npm run db:push`
Expected: Schema changes applied, two new columns added to meetings table.

**Step 3: Commit**

```bash
git add lib/db/schema.ts
git commit -m "feat(schema): add sentimentAnalysis and sentimentAnalyzedAt columns to meetings table"
```

---

## Task 2: Sentiment Analysis Module — `lib/sentiment.ts`

**Files:**
- Create: `lib/sentiment.ts`
- Reference: `lib/grade-draft.ts` (Haiku client pattern)
- Reference: `lib/db/schema.ts` (MeetingSentiment type)

**Step 1: Create the sentiment analysis module**

Create `lib/sentiment.ts` with the full implementation. Key patterns to follow:

- Use `HAIKU_MODEL` and `getHaikuClient()` from `lib/grade-draft.ts` (import them)
- Use `log()` from `lib/claude-api.ts` for structured logging
- Use `db` and `meetings` from `lib/db` for database updates
- Match the JSON-parsing pattern from `gradeDraft()` (regex extract + validate)

```typescript
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
```

**Step 2: Verify the module compiles**

Run: `npx tsc --noEmit lib/sentiment.ts` (or rely on build check later)

**Step 3: Commit**

```bash
git add lib/sentiment.ts
git commit -m "feat: add sentiment analysis module using Claude Haiku"
```

---

## Task 3: Integration — Wire Sentiment into Draft Generation Pipeline

**Files:**
- Modify: `lib/generate-draft.ts:446-459` (after gradeDraftAsync call)
- Reference: `lib/sentiment.ts`

**Step 1: Add the fire-and-forget sentiment call**

In `lib/generate-draft.ts`, add an import at the top:

```typescript
import { analyzeSentiment } from './sentiment';
```

After the `gradeDraftAsync(...)` call (~line 459), add the sentiment analysis call. It needs the `speakerSegments` from the transcript. We need to fetch them. Add this block right after the `gradeDraftAsync` `.catch()` block:

```typescript
      // Analyze meeting sentiment (non-blocking, async)
      // Fetch speaker segments from transcript for analysis
      try {
        const [transcript] = await db
          .select({ speakerSegments: transcripts.speakerSegments })
          .from(transcripts)
          .where(eq(transcripts.id, transcriptId))
          .limit(1);

        if (transcript?.speakerSegments && transcript.speakerSegments.length > 0) {
          analyzeSentiment(meetingId, transcript.speakerSegments).catch((err) => {
            log('error', 'Sentiment analysis failed (non-blocking)', {
              meetingId,
              error: err instanceof Error ? err.message : String(err),
            });
          });
        }
      } catch {
        // Non-blocking — if transcript lookup fails, skip sentiment
      }
```

Also add the `transcripts` import at the top of the file if not already present:

```typescript
import { db, drafts, meetings, users, transcripts } from './db';
```

**Step 2: Verify build compiles**

Run: `npx next build` (background)

**Step 3: Commit**

```bash
git add lib/generate-draft.ts
git commit -m "feat: wire sentiment analysis into draft generation pipeline"
```

---

## Task 4: Meeting Detail UI — Sentiment Card Component

**Files:**
- Modify: `lib/dashboard-queries.ts:260-287` (MeetingDetail interface)
- Modify: `lib/dashboard-queries.ts` (getMeetingById query)
- Modify: `components/dashboard/MeetingDetailView.tsx`

**Step 1: Extend MeetingDetail interface**

In `lib/dashboard-queries.ts`, add to the `MeetingDetail` interface after `summaryGeneratedAt`:

```typescript
  sentimentAnalysis: {
    overall: {
      score: number;
      label: string;
      trend: string;
      tones: string[];
    };
    speakers: Array<{
      name: string;
      score: number;
      label: string;
      tones: string[];
    }>;
  } | null;
  sentimentAnalyzedAt: Date | null;
```

**Step 2: Update getMeetingById query**

Find the `getMeetingById` function and add `sentimentAnalysis` and `sentimentAnalyzedAt` to the select clause:

```typescript
sentimentAnalysis: meetings.sentimentAnalysis,
sentimentAnalyzedAt: meetings.sentimentAnalyzedAt,
```

And map them in the return object.

**Step 3: Add SentimentCard to MeetingDetailView**

In `components/dashboard/MeetingDetailView.tsx`, add a sentiment card between the Meeting Summary section and the Processing Status section. The card should:

- Show only when `meeting.sentimentAnalysis` is not null
- Show "Analyzing sentiment..." state when meeting has a transcript but `sentimentAnalyzedAt` is null
- Display overall sentiment as a color-coded badge (green for positive, yellow for neutral/mixed, red for negative)
- Show the numeric score, trend arrow, and tone tags
- Show per-speaker bars with their name, score, and label

```tsx
{/* Sentiment Analysis Card */}
{meeting.transcript && (
  <div className="bg-gray-900/50 light:bg-white border border-gray-700 light:border-gray-200 rounded-2xl p-6 light:shadow-sm">
    <h2 className="text-lg font-semibold text-white light:text-gray-900 mb-4 flex items-center gap-2">
      <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      Meeting Sentiment
    </h2>

    {!meeting.sentimentAnalysis ? (
      <p className="text-sm text-gray-500 italic">Analyzing sentiment...</p>
    ) : (
      <div className="space-y-4">
        {/* Overall sentiment row */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Score badge */}
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full border ${
            meeting.sentimentAnalysis.overall.label === 'positive'
              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20'
              : meeting.sentimentAnalysis.overall.label === 'negative'
              ? 'bg-red-500/15 text-red-400 border-red-500/20'
              : 'bg-amber-500/15 text-amber-400 border-amber-500/20'
          }`}>
            {meeting.sentimentAnalysis.overall.label === 'positive' ? '+' : meeting.sentimentAnalysis.overall.label === 'negative' ? '' : ''}
            {meeting.sentimentAnalysis.overall.score.toFixed(2)}
            <span className="capitalize">{meeting.sentimentAnalysis.overall.label}</span>
          </span>

          {/* Trend indicator */}
          <span className="text-xs text-gray-400 flex items-center gap-1">
            {meeting.sentimentAnalysis.overall.trend === 'improving' && '↗'}
            {meeting.sentimentAnalysis.overall.trend === 'declining' && '↘'}
            {meeting.sentimentAnalysis.overall.trend === 'stable' && '→'}
            {meeting.sentimentAnalysis.overall.trend}
          </span>

          {/* Tone tags */}
          {meeting.sentimentAnalysis.overall.tones.map((tone, i) => (
            <span
              key={i}
              className="inline-flex items-center px-2 py-0.5 text-xs rounded-full bg-indigo-500/10 text-indigo-300 light:text-indigo-600 border border-indigo-500/15"
            >
              {tone}
            </span>
          ))}
        </div>

        {/* Per-speaker breakdown */}
        {meeting.sentimentAnalysis.speakers.length > 0 && (
          <div className="pt-3 border-t border-gray-700/50 light:border-gray-200">
            <h3 className="text-xs font-medium text-gray-400 light:text-gray-500 uppercase tracking-wider mb-3">
              By Speaker
            </h3>
            <div className="space-y-2">
              {meeting.sentimentAnalysis.speakers.map((speaker, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-sm text-gray-300 light:text-gray-600 w-28 truncate">{speaker.name}</span>
                  <div className="flex-1 h-2 bg-gray-700/50 light:bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        speaker.label === 'positive'
                          ? 'bg-emerald-500'
                          : speaker.label === 'negative'
                          ? 'bg-red-500'
                          : 'bg-amber-500'
                      }`}
                      style={{ width: `${Math.max(5, ((speaker.score + 1) / 2) * 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 w-16 text-right capitalize">{speaker.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )}
  </div>
)}
```

Place this block after the Meeting Summary section (after the closing `)}` for `{meeting.summary && (` at ~line 287) and before the Processing Status section.

**Step 4: Commit**

```bash
git add lib/dashboard-queries.ts components/dashboard/MeetingDetailView.tsx
git commit -m "feat: add sentiment analysis card to meeting detail view"
```

---

## Task 5: CRM Sync — Extend Field Mappings with Sentiment Data

**Files:**
- Modify: `lib/db/schema.ts` (HubSpotFieldMapping and SalesforceFieldMapping sourceField types)
- Modify: `app/api/drafts/send/route.ts:334-342` (HubSpot sync params) and `450-458` (Salesforce sync params)
- Modify: `lib/hubspot.ts` (syncSentEmailToHubSpot function)
- Modify: `lib/salesforce.ts` (syncSentEmailToSalesforce function)

**Step 1: Extend field mapping types**

In `lib/db/schema.ts`, update `HubSpotFieldMapping.sourceField` union type (~line 483):

```typescript
export interface HubSpotFieldMapping {
  sourceField: 'meeting_title' | 'meeting_body' | 'meeting_start' | 'meeting_end' | 'meeting_outcome' | 'timestamp' | 'sentiment_score' | 'sentiment_label' | 'emotional_tones';
  hubspotProperty: string;
  enabled: boolean;
}
```

Update `SalesforceFieldMapping.sourceField` similarly (~line 603):

```typescript
export interface SalesforceFieldMapping {
  sourceField: 'meeting_title' | 'meeting_body' | 'meeting_start' | 'meeting_end' | 'meeting_outcome' | 'timestamp' | 'sentiment_score' | 'sentiment_label' | 'emotional_tones';
  salesforceField: string;
  enabled: boolean;
}
```

**Step 2: Pass sentiment data through CRM sync**

In `app/api/drafts/send/route.ts`, before the HubSpot sync block (~line 270), fetch the meeting's sentiment data:

```typescript
    // Fetch meeting sentiment for CRM sync (needed by HubSpot + Salesforce)
    let meetingSentiment: { score: number; label: string; tones: string } | null = null;
    if (draft.meetingId) {
      try {
        const [meetingRow] = await db
          .select({ sentimentAnalysis: meetings.sentimentAnalysis })
          .from(meetings)
          .where(eq(meetings.id, draft.meetingId))
          .limit(1);
        if (meetingRow?.sentimentAnalysis) {
          const sa = meetingRow.sentimentAnalysis as { overall: { score: number; label: string; tones: string[] } };
          meetingSentiment = {
            score: sa.overall.score,
            label: sa.overall.label,
            tones: sa.overall.tones.join(', '),
          };
        }
      } catch { /* Non-blocking */ }
    }
```

Then pass `meetingSentiment` to both HubSpot and Salesforce sync calls by adding it to the params objects:

```typescript
// In HubSpot sync:
sentimentScore: meetingSentiment?.score,
sentimentLabel: meetingSentiment?.label,
emotionalTones: meetingSentiment?.tones,
```

```typescript
// In Salesforce sync:
sentimentScore: meetingSentiment?.score,
sentimentLabel: meetingSentiment?.label,
emotionalTones: meetingSentiment?.tones,
```

**Step 3: Handle sentiment source fields in sync functions**

In `lib/hubspot.ts` `syncSentEmailToHubSpot`, update the params type to accept the new optional fields:

```typescript
sentimentScore?: number;
sentimentLabel?: string;
emotionalTones?: string;
```

In the field mapping resolution logic, add a `sourceFieldValues` map that includes `sentiment_score`, `sentiment_label`, and `emotional_tones`. When iterating field mappings, look up these values.

Do the same for `lib/salesforce.ts` `syncSentEmailToSalesforce`.

**Step 4: Commit**

```bash
git add lib/db/schema.ts app/api/drafts/send/route.ts lib/hubspot.ts lib/salesforce.ts
git commit -m "feat: extend CRM field mappings with sentiment_score, sentiment_label, emotional_tones"
```

---

## Task 6: Analytics Dashboard — Sentiment Metrics

**Files:**
- Modify: `lib/types/analytics.ts` (add SentimentMetrics type)
- Modify: `app/api/analytics/route.ts` (add sentiment aggregation)

**Step 1: Add sentiment types to analytics**

In `lib/types/analytics.ts`, add the sentiment metrics interface and update `AnalyticsData`:

```typescript
/** Sentiment metrics for the analytics dashboard */
export interface SentimentMetrics {
  avgScore: number | null;
  sentimentComparison: PeriodComparison;
  sentimentByType: Array<{
    type: string;
    avgScore: number;
    count: number;
    color: string;
  }>;
}
```

Add to the `AnalyticsData` interface:

```typescript
  // Sentiment analytics
  sentimentMetrics: SentimentMetrics;
```

**Step 2: Add sentiment aggregation to analytics route**

In `app/api/analytics/route.ts`, after the speaker analytics section (~line 466), add sentiment computation:

```typescript
    // --- Sentiment analytics ---
    let sentimentMetrics: SentimentMetrics = {
      avgScore: null,
      sentimentComparison: emptyComparison,
      sentimentByType: [],
    };

    if (meetingIds.length > 0) {
      try {
        // Fetch meetings with sentiment data
        const meetingsWithSentiment = await db
          .select({
            id: meetings.id,
            sentimentAnalysis: meetings.sentimentAnalysis,
            createdAt: meetings.createdAt,
          })
          .from(meetings)
          .where(inArray(meetings.id, meetingIds));

        // Filter to those that have sentiment
        const analyzed = meetingsWithSentiment.filter(
          (m) => m.sentimentAnalysis && typeof (m.sentimentAnalysis as any)?.overall?.score === 'number'
        );

        if (analyzed.length > 0) {
          // Average sentiment score
          const scores = analyzed.map(m => (m.sentimentAnalysis as any).overall.score as number);
          const avgScore = Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100;

          // Period comparison for sentiment
          const thisWeekAnalyzed = analyzed.filter(m => {
            if (!m.createdAt) return false;
            const d = new Date(m.createdAt).toISOString().split('T')[0];
            return dateRange.slice(-7).includes(d);
          });
          const lastWeekAnalyzed = analyzed.filter(m => {
            if (!m.createdAt) return false;
            const d = new Date(m.createdAt).toISOString().split('T')[0];
            return dateRange.slice(0, 7).includes(d);
          });

          const thisWeekAvg = thisWeekAnalyzed.length > 0
            ? thisWeekAnalyzed.reduce((s, m) => s + ((m.sentimentAnalysis as any).overall.score as number), 0) / thisWeekAnalyzed.length
            : 0;
          const lastWeekAvg = lastWeekAnalyzed.length > 0
            ? lastWeekAnalyzed.reduce((s, m) => s + ((m.sentimentAnalysis as any).overall.score as number), 0) / lastWeekAnalyzed.length
            : 0;

          // Sentiment by meeting type (cross-reference with drafts)
          const sentimentByType: Record<string, { total: number; count: number }> = {};
          for (const m of analyzed) {
            const draft = draftsByMeeting.get(m.id);
            const mt = (draft as any)?.meetingType || 'general';
            if (!sentimentByType[mt]) sentimentByType[mt] = { total: 0, count: 0 };
            sentimentByType[mt].total += (m.sentimentAnalysis as any).overall.score as number;
            sentimentByType[mt].count++;
          }

          sentimentMetrics = {
            avgScore,
            sentimentComparison: calculateComparison(
              Math.round(thisWeekAvg * 100),
              Math.round(lastWeekAvg * 100),
            ),
            sentimentByType: Object.entries(sentimentByType).map(([type, data]) => ({
              type: MEETING_TYPE_LABELS[type] || type,
              avgScore: Math.round((data.total / data.count) * 100) / 100,
              count: data.count,
              color: MEETING_TYPE_COLORS[type] || '#6B7280',
            })),
          };
        }
      } catch (e) {
        console.log('[ANALYTICS-WARN] Error computing sentiment analytics:', e);
      }
    }
```

Add `sentimentMetrics` to the response object and the empty response.

Also import `SentimentMetrics` in the route imports.

**Step 3: Update empty response**

Add to `emptyResponse`:

```typescript
sentimentMetrics: { avgScore: null, sentimentComparison: emptyComparison, sentimentByType: [] },
```

**Step 4: Commit**

```bash
git add lib/types/analytics.ts app/api/analytics/route.ts
git commit -m "feat: add sentiment metrics to analytics API"
```

---

## Task 7: Build Verification & Schema Push

**Files:** None (verification only)

**Step 1: Push schema changes to database**

Run: `npm run db:push`

**Step 2: Run production build**

Run: `npx next build`
Expected: Clean build with no TypeScript errors.

**Step 3: Fix any type errors**

If the build reveals type errors (likely in the analytics route or dashboard-queries), fix them.

**Step 4: Final commit**

```bash
git add -A
git commit -m "fix: resolve any build errors from sentiment analysis feature"
```

---

## Task 8: Push and Deploy

**Step 1: Push to main**

```bash
git push origin main
```

This triggers Vercel deployment.

**Step 2: Verify deployment builds**

Check Vercel deployment logs for successful build.

**Step 3: Update ClickUp task**

Update task 86affcqex:
- Status: "ready for review"
- Phase: "Testing"
