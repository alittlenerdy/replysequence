# Dashboard Redesign - Design Document

> **Research-backed redesign of Analytics, Settings (AI discoverability), and Loading States**

**Date:** 2026-02-18
**Status:** Awaiting Approval

---

## The Three Problems

1. **Analytics tab is underwhelming** -- same metrics reshuffled, no new insights, doesn't answer "Am I following up? Are my follow-ups working? How much time am I saving?"
2. **AI settings are buried** -- 3rd of 4 tabs inside Settings, zero connection to the draft workflow where users actually need it
3. **Skeleton jank on page loads** -- generic skeleton doesn't match page layouts, causing visual "pop" when content replaces it

---

## Part 1: Analytics Dashboard Redesign

### Current State
- 4 hero stats: Meetings, Emails Generated, Emails Sent, Time Saved
- 3 AI usage stats: Total AI Cost, Avg Generation Time, Meeting Hours Processed
- ROI Calculator, Email Engagement, Email Funnel
- 2 Activity Charts, Platform Chart, Meeting Type Chart
- 30-second auto-refresh
- 14 visible sections total (too many)

### Design: New Information Hierarchy

The dashboard should answer 3 questions in under 5 seconds:
1. Am I following up on all my meetings?
2. Are my follow-ups working?
3. How much time/money am I saving?

#### Section 1: Hero KPIs (4 cards, always visible)

| Current | New | Why |
|---------|-----|-----|
| Meetings | Meetings (keep) | Core volume indicator |
| Emails Generated | Emails Generated (keep) | Output volume |
| **Emails Sent** (raw count) | **Send Rate** (percentage) | A send rate of 85% tells you drafts are good. A raw count of "12" tells you nothing. |
| Time Saved | Time Saved (keep) | #1 ROI metric |

The Send Rate is calculated from data that already exists: `emailsSent / emailsGenerated * 100`. This is the single most actionable KPI missing -- it's your quality proxy.

#### Section 2: Follow-Up Effectiveness (new section)

Two cards side by side:
- **Email Engagement** (keep, already good) -- opens, clicks, replies funnel
- **Follow-Up Coverage** (new) -- what % of meetings resulted in a sent email. Shows: "15 of 20 meetings followed up = 75% coverage"

Both metrics use data already in the database (meetings count vs drafts with `sentAt`).

#### Section 3: Activity Trends (keep, minimal changes)
- Meeting Activity chart (keep)
- Email Activity chart (keep)
- Increase spacing between charts

#### Section 4: Breakdowns (keep, minimal changes)
- Platform Mix (keep)
- Meeting Type Mix (keep)

#### Section 5: ROI & Value (collapsible)
- ROI Calculator (keep, make hourly rate editable via localStorage)
- Email Funnel (keep)

#### Section 6: AI & System Health (collapsed by default)
- Move Total AI Cost, Avg Generation Time, Meeting Hours Processed here
- These are developer/admin metrics, not daily user metrics
- Label it "Under the Hood" with a chevron toggle

### Visual Changes

| Change | Details |
|--------|---------|
| Reduce accent colors | 4 colors -> 2 primary (blue for volume, emerald for outcomes) + neutral gray |
| Increase spacing | `space-y-4` -> `space-y-6`, card `gap-4` -> `gap-5` |
| Auto-refresh | 30s -> 5 minutes (analytics data doesn't change every 30 seconds) |
| Date range persistence | Save selected range to localStorage |

### NOT doing (scope control)
- Drag-and-drop widgets (Apollo-style) -- too complex for now
- AI insight card (Claude-generated weekly summary) -- future feature
- Activity feed / live events -- future feature
- Export/download reports -- future feature
- Weekly email digest -- future feature

---

## Part 2: AI Settings Discoverability

### Current State
- Settings page has 4 tabs: Integrations, Email, **AI** (3rd), Account
- Default tab is "Integrations" (one-time setup)
- Zero connection between draft modal and AI settings
- No preview of how tone affects drafts
- Explicit "Save" button (easy to forget)

### Design: Three Changes

#### Change 1: Promote AI to first tab + visual weight

Reorder tabs: **AI** (1st), Integrations, Email, Account. Default `activeTab` changes from `'integrations'` to `'ai'`.

Give the AI tab button a purple accent when inactive (subtle `text-purple-400` instead of `text-gray-400`) and a Sparkles icon to visually differentiate it from the other tabs.

Why not make AI a top-level nav item? The nav already has 6 items (Drafts, Meetings, Analytics, Billing, Pricing, Settings). Adding a 7th risks clutter. Promoting within Settings is the right balance -- users who visit Settings see AI first.

#### Change 2: Add contextual AI link in Draft Modal

In the DraftPreviewModal footer (near Refine/Regenerate buttons), add:

```
"Want all drafts to sound like this? Customize AI →"
```

Small text link that navigates to `/dashboard/settings` with the AI tab pre-selected (via URL param `?tab=ai`). This bridges the workflow gap -- users reviewing a draft can discover persistent AI settings without hunting.

The messaging distinction: "Refine changes this draft. AI Preferences changes all future drafts."

#### Change 3: Reorder AI tab content + add tone preview

Current order: Tone > Templates (collapsed) > Custom Instructions > Signature > Save

New order:
1. **Tone Selection** with preview snippet -- when you select "Professional" vs "Casual", show a 2-sentence sample email that changes per tone
2. **Custom Instructions** -- move up, add better placeholder examples
3. **Email Signature**
4. **Templates** (expandable)
5. Save button (keep explicit save for now -- auto-save is a future improvement)

### NOT doing (scope control)
- "Teach by Example" paste-an-email feature -- future
- Quick tone selector in draft modal -- future (inline tone switching)
- Auto-save preferences -- future
- Command palette AI settings shortcuts -- already has command palette, this is a small addition later

---

## Part 3: Loading State Fix

### Current State
- `app/dashboard/loading.tsx` -- generic skeleton (4-stat grid + 5 rows) used for ALL routes
- `app/dashboard/settings/loading.tsx` -- settings-specific skeleton (already good)
- Pages with inline Suspense: `app/dashboard/page.tsx` (drafts)
- Missing: meetings, analytics, billing, pricing all use the generic skeleton

### Design: Per-Route Skeletons

Create content-matched `loading.tsx` for each route:

```
app/dashboard/
  loading.tsx               # SIMPLIFY to minimal fallback (title placeholder only)
  page.tsx                  # Drafts (already has inline Suspense)

  meetings/
    loading.tsx             # NEW: table with meeting-specific columns
    page.tsx

  analytics/
    loading.tsx             # NEW: stat cards + chart placeholder grid
    page.tsx

  billing/
    loading.tsx             # NEW: plan card + invoice table
    page.tsx

  pricing/
    loading.tsx             # NEW: pricing card grid
    page.tsx

  settings/
    loading.tsx             # EXISTS: already good
    page.tsx
```

Each skeleton mirrors its page's actual layout -- same grid columns, same number of cards, same approximate heights.

### NOT doing (scope control)
- SWR client-side caching (instant tab switches) -- significant refactor, do separately
- Partial Prerendering (PPR) -- experimental in Next.js 16, not stable
- Shimmer animations (replacing pulse) -- nice-to-have polish, not the root problem
- 300ms delayed loading states -- only matters for client-side Suspense, not the primary issue

---

## Implementation Order

1. **Loading skeletons** (fastest, most visible improvement)
2. **AI settings discoverability** (3 targeted changes, moderate effort)
3. **Analytics dashboard** (largest change, most files touched)

---

## Files to Modify

### Loading Skeletons
- Simplify: `app/dashboard/loading.tsx`
- Create: `app/dashboard/meetings/loading.tsx`
- Create: `app/dashboard/analytics/loading.tsx`
- Create: `app/dashboard/billing/loading.tsx`
- Create: `app/dashboard/pricing/loading.tsx`

### AI Settings
- Modify: `components/dashboard/SettingsTabs.tsx` (tab order, default, styling)
- Modify: `components/dashboard/AICustomization.tsx` (content reorder, tone preview)
- Modify: `components/DraftPreviewModal.tsx` (add contextual AI link)
- Modify: `app/dashboard/settings/page.tsx` (read ?tab= URL param)

### Analytics Dashboard
- Modify: `components/dashboard/AnalyticsDashboard.tsx` (layout restructure, new sections)
- Modify: `app/api/analytics/route.ts` (add sendRate, followUpCoverage calculations)
- Modify: `components/analytics/StatCard.tsx` (if needed for percentage display)
- Create: `components/analytics/FollowUpCoverage.tsx` (new component)
