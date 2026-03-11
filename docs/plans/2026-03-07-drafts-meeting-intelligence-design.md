# Drafts + Meeting Intelligence Inline Redesign

**Date:** 2026-03-07
**Status:** Approved

## Problem

1. **Duplicate header/tabs bug**: The meeting detail page (`/dashboard/meetings/[meetingId]`) wraps content in `DashboardShell`, but the parent `dashboard/layout.tsx` already provides one. This renders two stacked headers with tab bars.
2. **Meeting intelligence is buried**: The rich meeting summary (topics, decisions, action items) only appears when navigating into a separate meeting detail page. Users on the Drafts tab can't see this context alongside their drafts.
3. **Sentiment "not available" noise**: The sentiment analysis card shows "not yet available" text when data doesn't exist, adding visual clutter.

## Design

### A. Fix duplicate header (bug)

Remove the `<DashboardShell>` wrapper from `app/dashboard/meetings/[meetingId]/page.tsx`. Render `<MeetingDetailView>` directly — the parent layout already provides the shell.

### B. Reorder tabs visually

Tab order becomes: **Meetings | Drafts\* | Analytics | Plan & Billing | Waitlist | Settings**

- `*` = Drafts remains the default landing page at `/dashboard`
- No route changes — Meetings just moves visually to the left of Drafts in `DashboardNav.tsx`
- Rationale: meetings are the starting point of the product flow (meeting → transcript → draft), so placing them first in the nav reflects the natural pipeline order

### C. Inline-expand draft rows with meeting intelligence

When a user clicks a draft row in `DraftsTable`, it expands inline to show a two-column layout:

```
┌────────────────────────────────────────────────────────────┐
│  Google Meet  ·  Mar 7  ·  Draft ready  ·  10 drafts       │  ← collapsed row
├────────────────────────────────────────────────────────────┤
│  ┌─── Meeting Intelligence ──┐  ┌─── Email Draft ────────┐│
│  │ Meeting Summary            │  │ Subject: Follow-up on  ││
│  │ Jimmy conducted an E2E...  │  │ migration              ││
│  │                            │  │                        ││
│  │ Topics Discussed           │  │ Hi team,               ││
│  │ • Auth migration (main)    │  │ Following up on our    ││
│  │ • E2E testing (main)       │  │ discussion about...    ││
│  │                            │  │                        ││
│  │ Decisions Made             │  │ [Edit] [Send] [Delete] ││
│  │ ✓ Full domain transfer     │  │                        ││
│  │                            │  │ Quality: 100/100       ││
│  │ Action Items               │  │                        ││
│  │ ☐ Verify email delivery    │  │                        ││
│  │ ☐ Document migration       │  │                        ││
│  └────────────────────────────┘  └────────────────────────┘│
└────────────────────────────────────────────────────────────┘
```

**Behavior:**
- Only one row expanded at a time (clicking another collapses the current)
- Smooth CSS height transition on expand/collapse
- On mobile (`< md`): columns stack vertically (meeting intelligence on top, draft below)
- If a meeting has multiple drafts, show a draft selector/tabs within the expanded view

**Data flow:**
- `DraftsTable` already has `meetingId` per draft
- On expand, fetch meeting detail (summary, topics, decisions, action items) from `/api/meetings/[id]`
- Meeting intelligence data lives in `meetings` table JSON columns, already populated by `generateDraft`

### D. Hide empty sentiment section

When sentiment data is unavailable, hide the section entirely instead of showing "not yet available" placeholder text.

## Components

### Extract from `MeetingDetailView.tsx`:
- `MeetingSummaryCard` — summary text + 3-column grid (topics, decisions, action items)

### Create new:
- `ExpandableDraftRow` — wraps existing draft row with expand/collapse behavior
- `DraftInlinePreview` — draft email content + edit/send actions (extracted from `DraftPreviewModal` patterns)

### Modify:
- `DraftsTable` — integrate `ExpandableDraftRow`, manage which row is expanded
- `DashboardNav` — reorder tabs (Meetings first visually)
- `MeetingDetailView` — hide sentiment card when data absent

## Non-goals

- No route changes (Drafts stays at `/dashboard`, Meetings at `/dashboard/meetings`)
- No changes to the Meetings tab list view itself
- No changes to the meeting detail page content (just fixing the duplicate shell)
- No new API endpoints (reuse existing `/api/meetings/[id]`)
