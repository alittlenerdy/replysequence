# Sentiment Analysis for Meetings - Design

**Date:** 2026-02-20
**ClickUp Task:** 86affcqex
**Status:** Approved
**Estimated Effort:** 10 hours

---

## Overview

Add async sentiment analysis to meeting transcript processing. Sentiment is computed after draft generation using Claude Haiku, stored on the meetings table, displayed in the meeting detail UI, synced to CRMs, and surfaced in the analytics dashboard.

**Key decisions:**
- **Purpose:** Visibility only (async, does not influence draft generation)
- **Granularity:** Meeting-level + per-speaker breakdown
- **Model:** Claude Haiku (cheap, fast, sufficient for sentiment classification)

---

## 1. Data Model

Two new columns on the `meetings` table:

```typescript
// lib/db/schema.ts - additions to meetings table
sentimentAnalysis: jsonb('sentiment_analysis'),
sentimentAnalyzedAt: timestamp('sentiment_analyzed_at'),
```

### JSONB Structure

```typescript
interface MeetingSentiment {
  overall: {
    score: number;        // -1.0 to 1.0
    label: 'positive' | 'neutral' | 'negative' | 'mixed';
    trend: 'improving' | 'stable' | 'declining';
    tones: string[];      // e.g. ['enthusiastic', 'collaborative']
  };
  speakers: Array<{
    name: string;
    score: number;
    label: 'positive' | 'neutral' | 'negative' | 'mixed';
    tones: string[];
  }>;
}
```

**Rationale:** Single JSONB column avoids schema sprawl and migration overhead. The structure is self-contained and queryable via Drizzle's `jsonb` operators when needed.

---

## 2. Processing Pipeline

### New Module: `lib/sentiment.ts`

Follows the existing async grading pattern from `lib/generate-draft.ts`:

1. **Input:** `SpeakerSegment[]` from transcript (already parsed and stored)
2. **Chunking:** Group segments into ~2000-token batches to stay within Haiku context
3. **Prompt:** Single Haiku call with structured JSON output requesting overall + per-speaker sentiment
4. **Storage:** Update `meetings.sentimentAnalysis` and `meetings.sentimentAnalyzedAt`
5. **Error handling:** Log and continue on failure (non-critical path)

### Integration Point

Fire-and-forget after draft generation in `lib/generate-draft.ts`, matching the existing async grading pattern:

```typescript
// After draft is saved, fire sentiment analysis (non-blocking)
analyzeSentiment(meeting.id, speakerSegments).catch(err => {
  console.log(JSON.stringify({
    level: 'error',
    tag: '[SENTIMENT]',
    message: 'Sentiment analysis failed',
    meetingId: meeting.id,
    error: err instanceof Error ? err.message : String(err),
  }));
});
```

### Cost Estimate

- Haiku input: ~2000 tokens per meeting transcript chunk
- Haiku output: ~200 tokens (structured JSON)
- Cost: ~$0.001 per meeting (negligible)

---

## 3. Meeting Detail UI

New sentiment card in `components/dashboard/MeetingDetailView.tsx`, placed between the summary section and key topics.

### Card Contents

- **Overall sentiment badge:** Color-coded pill (green/yellow/red) with label and score
- **Trend indicator:** Arrow icon showing improving/stable/declining
- **Emotional tones:** Tag pills for detected tones (e.g. "enthusiastic", "collaborative")
- **Per-speaker breakdown:** Horizontal bars showing each speaker's sentiment score with their name and label
- **Empty state:** "Analyzing sentiment..." while `sentimentAnalyzedAt` is null, hidden if no transcript

### Visual Design

Follows existing card patterns in MeetingDetailView (rounded corners, consistent spacing, dark/light mode support via existing Tailwind classes).

---

## 4. CRM Sync

Extend existing field mapping architecture to include sentiment data during email send.

### HubSpot

Add three new source fields to the default field mappings:
- `sentiment_score` (number) - overall score (-1.0 to 1.0)
- `sentiment_label` (string) - overall label
- `emotional_tones` (string) - comma-separated tones

These are added to the configurable field mappings in `hubspot_connections.fieldMappings`, so users can enable/disable and map to their custom HubSpot properties.

### Salesforce

Same three fields added to Salesforce field mappings in `salesforce_connections.fieldMappings`.

### Airtable / Google Sheets

Add sentiment_score and sentiment_label as additional columns in the row/record appended during sync.

### Implementation

No new sync logic needed. The existing `syncToHubSpot()` / `syncToSalesforce()` functions already read from field mappings dynamically. We just:
1. Add default mapping entries for sentiment fields
2. Read sentiment data from `meetings.sentimentAnalysis` during sync
3. Pass values through existing mapping infrastructure

---

## 5. Analytics Dashboard

New "Sentiment" section on the analytics page.

### Metrics

- **Average Sentiment KPI:** New card showing avg sentiment score across all meetings in the period, with period-over-period comparison
- **Sentiment Trend Chart:** Line chart showing average sentiment over time (daily/weekly buckets matching existing chart patterns)
- **Sentiment by Meeting Type:** Bar chart breaking down average sentiment by meeting type (sales_call, internal_sync, etc.)

### Implementation

- Extend `app/api/analytics/route.ts` with a new sentiment aggregation query
- Extend `lib/types/analytics.ts` with sentiment metric types
- Add sentiment section to the analytics page UI

---

## Non-Goals

- Sentiment does NOT influence draft generation or tone
- No real-time sentiment during meetings
- No per-segment (timestamp-level) sentiment granularity
- No alerting or notifications for negative sentiment (future consideration)
- No sentiment comparison across time periods beyond what analytics provides
