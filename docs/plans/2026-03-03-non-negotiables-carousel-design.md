# 9 Non-Negotiables Carousel — Design

**Date:** 2026-03-03
**Status:** Approved

## Overview

Two deliverables from one set of content:
1. Auto-advancing carousel section on the landing page (after Pain Points, before How It Works)
2. Standalone `/non-negotiables` page with 1080x1080 social media cards for LinkedIn/Twitter

## Landing Page Section

**Placement:** After "Call out the real leak" pain points, before "How It Works" 3-step process.

**Layout:** Auto-advancing carousel showing 3 cards at a time on desktop, 1 on mobile. Each group advances every 3.5 seconds. Nine dots below show progress. Users can click dots or swipe.

**Section header:** "Our 9 Non-Negotiables" with GradientText on "Non-Negotiables"

**Card design:**
- `bg-gray-900/50 border border-gray-700 rounded-2xl` (matches site pattern)
- Numbered indigo gradient circle badge (1-9) top-left
- Lucide icon
- Bold title + gray description
- Hover lift animation via Framer Motion

## The 9 Items

| # | Title | Icon | Description |
|---|-------|------|-------------|
| 1 | Every meeting gets a follow-up | Mail | No call falls through the cracks. Period. |
| 2 | AI drafts in your voice | Sparkles | Learns your tone, not a generic template |
| 3 | One-click send | Send | Review, tweak if needed, and send from your inbox |
| 4 | Zoom + Meet + Teams | Monitor | All three platforms, one workflow |
| 5 | CRM sync on autopilot | RefreshCw | HubSpot, Salesforce, Airtable — automatically logged |
| 6 | Privacy-first | Shield | No recordings stored. Transcripts processed and purged |
| 7 | Draft in under 30 seconds | Zap | Not 24 hours. Seconds after your call ends |
| 8 | Fully editable | Pencil | You always have final say before anything sends |
| 9 | Opens and clicks tracked | BarChart3 | Know exactly who engaged with your follow-up |

## Social Media Cards

**Route:** `/non-negotiables`

**Card dimensions:** 1080x1080 (square, works on both LinkedIn and Twitter/X)

**Layout per card:**
- ReplySequence logo + "Non-Negotiable #X" at top
- Large centered icon
- Bold title
- Short description
- Indigo-to-purple gradient background

**Extra slides:** Slide 0 = title card ("Our 9 Non-Negotiables"), Slide 10 = CTA card with URL

## Technical Notes

- No new dependencies — uses existing Framer Motion, Lucide, Tailwind
- Landing page component: `components/NonNegotiablesCarousel.tsx`
- Social page: `app/non-negotiables/page.tsx`
- Shared data: non-negotiables array exported from the component
