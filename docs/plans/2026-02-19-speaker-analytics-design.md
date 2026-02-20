# Speaker Analytics and Talk Time Ratios — Design

**Date:** 2026-02-19
**ClickUp:** https://app.clickup.com/t/86affcpv0

## Goal

Add a "Speaker Insights" section to the Analytics dashboard that computes talk-time ratios, monologue detection, and question counts from existing transcript speaker segments.

## Data Flow

Query-time computation — no schema changes. The `speakerSegments` JSONB is already stored per transcript with speaker names, start/end timestamps (ms), and text. We compute analytics in the analytics API route and return alongside existing metrics.

## Metrics

| Metric | Computation | Display |
|--------|-------------|---------|
| Talk time per speaker | Sum `(end_time - start_time)` per speaker | Horizontal bar chart with % |
| Monologues | Segments where one speaker talks >60s | Count + longest duration |
| Questions asked | Regex: sentences ending with `?` per speaker | Count per speaker |
| Talk-to-listen ratio | User's talk time vs total meeting time | Single ratio stat |
| Avg segment length | Mean duration per speaker turn | Per-speaker stat |
| Top speakers | Ranked by % of total talk time across meetings | Leaderboard |

## Files

| Action | File | Purpose |
|--------|------|---------|
| Create | `lib/transcript/speaker-analytics.ts` | Pure utility: compute all metrics from `SpeakerSegment[]` |
| Modify | `lib/types/analytics.ts` | Add `SpeakerAnalytics` types |
| Modify | `app/api/analytics/route.ts` | Fetch transcripts, compute speaker stats |
| Create | `components/analytics/SpeakerInsights.tsx` | Bar chart, monologue stats, question counts |
| Modify | `components/analytics/AnalyticsDashboard.tsx` | Add SpeakerInsights section |

## UI Layout

Inside Analytics dashboard, below existing sections:

- **Header**: "Speaker Insights" with Mic icon
- **Top row**: 3 stat cards (Total Speakers, Avg Talk-to-Listen Ratio, Monologues Detected)
- **Main area**: Horizontal stacked bar chart — top speakers by talk time %
- **Detail row**: Per-speaker table (name, talk time, segments, questions, longest monologue)

## Out of Scope

- No Claude API calls for question detection (regex only)
- No per-meeting drill-down (aggregate only on analytics tab)
- No speaker role identification (host vs guest)
- No sentiment analysis
