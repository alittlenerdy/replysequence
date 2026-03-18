# Phase 1: Design System + Landing Page + Product Pages

## Overview

Transform ReplySequence from a functional SaaS UI into a premium product experience. Phase 1 covers the design system foundation, landing page refinements, navigation fix, and 4 new product feature pages with interactive demos.

## 1. Design System Tokens

### Color Tokens (globals.css)

All hardcoded hex values will be replaced with CSS custom properties. Components reference tokens, not raw colors.

```
/* Dark mode (default) */
--surface-page: #060B18
--surface-section: #0A1020
--surface-card: #111827
--surface-card-border: rgba(255,255,255,0.06)

--text-heading: #E8ECF4
--text-body: #C0C8E0
--text-muted: #8892B0

--accent-indigo: #5B6CFF
--accent-indigo-hover: #4A5BEE
--accent-indigo-subtle: rgba(91,108,255,0.10)

--accent-amber: #F59E0B
--accent-amber-hover: #D97706
--accent-amber-subtle: rgba(245,158,11,0.10)

--accent-purple: #7A5CFF  (Sequences pillar only — not a general-use accent)
--accent-teal: #06B6D4  (success/AI signals only)

--divider: #1E2A4A

/* Light mode */
--surface-page: #F8FAFC
--surface-section: #F1F5F9
--surface-card: #FFFFFF
--surface-card-border: rgba(0,0,0,0.08)

--text-heading: #0F172A
--text-body: #334155
--text-muted: #64748B

(accents same in both modes)
```

### Accent Usage Rules

| Color | Use For | Never Use For |
|-------|---------|---------------|
| Indigo `#5B6CFF` | UI elements, links, feature highlights, product identity, icon tints, focus rings | Primary CTAs, urgency signals |
| Amber `#F59E0B` | Primary CTAs, performance stats, countdown timers, action triggers, urgency | Decorative borders, icon tints |
| Purple `#7A5CFF` | Sequences pillar identity only | Anywhere else — this is not a general accent |
| Teal `#06B6D4` | Success states, AI/automation indicators, "connected" status | CTAs, general highlights, decorative use |

### Token Migration Strategy

New tokens are ADDED to globals.css alongside existing ones. Old tokens (`--background`, `--mint`, `--neon`, `--text-primary`, `--color-primary`, etc.) are aliased to the new names for backward compatibility. Over time, components migrate to new token names. No existing component breaks.

```css
/* Aliases for backward compat */
--background: var(--surface-page);
--mint: var(--accent-indigo);
--neon: var(--accent-indigo);
--text-primary: var(--text-heading);
--text-secondary: var(--text-body);
--color-primary: var(--accent-indigo);
--color-accent: var(--accent-amber);
```

### Card System (Global)

All cards across the app get:
- `hover:-translate-y-1` (4px lift — standardized)
- `hover:shadow-lg` increase
- `transition-all duration-200`
- Clickable cards get `cursor-pointer` and subtle border glow on hover

Note: The `light:` prefix is a custom Tailwind variant defined in the project's Tailwind config. All new product page components must use it for light mode overrides.

## 2. Landing Page Refinements

### Hero Section
- H1: `text-[#E8ECF4] light:text-gray-900` (warm white, not pure white)
- Gradient text: indigo gradient on emphasis words only
- Countdown pill: amber border (already done)
- "See How It Works" button: amber accent (already done)
- Trust badges: neutral glass treatment (already done)

### Four Pillars Section
- Make all 4 cards **clickable links** to `/product/follow-ups`, `/product/sequences`, `/product/meeting-intelligence`, `/product/pipeline-automation`
- **Update pillar colors** to match design system (BREAKING CHANGE from current):
  - Follow-Ups: `#5B6CFF` (indigo) — no change
  - Sequences: `#7A5CFF` (purple) — no change
  - Meeting Intelligence: `#06B6D4` (teal) — was `#22D3EE`
  - Pipeline Automation: `#F59E0B` (amber) — was `#37D67A` (green)
- Add hover: `-translate-y-1` (4px lift), border glows in each pillar's color
- Add "Learn more →" text at bottom of each card (muted, appears on hover)
- Each card wraps in `<Link>`

### Before/After Section
- "After" text gets `text-[#F59E0B] light:text-amber-600` for transformation emphasis
- Cards use `bg-[#0F1629]` in dark mode (was `#141C34/80` — slightly brighter for card definition)

### Stats Section
- 6xl stat numbers with amber glow (already done)
- Keep as-is

## 3. Navigation Fix

### Header.tsx — Product Dropdown

Update `productItems` hrefs:
```
Follow-Ups       → /product/follow-ups
Sequences        → /product/sequences
Meeting Intelligence → /product/meeting-intelligence
Pipeline Automation  → /product/pipeline-automation
```

Update pillar colors to match design system:
```
Follow-Ups: #5B6CFF (indigo)
Sequences: #7A5CFF (purple)
Meeting Intelligence: #06B6D4 (teal — AI signal)
Pipeline Automation: #F59E0B (amber — action)
```

The "Explore the platform" footer link stays as `/how-it-works`.

## 4. Product Pages (4 New Pages)

### Route Structure
```
app/product/follow-ups/page.tsx
app/product/sequences/page.tsx
app/product/meeting-intelligence/page.tsx
app/product/pipeline-automation/page.tsx
app/product/layout.tsx (shared layout with Header + Footer)
```

### Page Template (all 4 follow this structure)

```
┌─────────────────────────────────────────┐
│  Hero                                    │
│  - Gradient background (page color)      │
│  - Icon + Title + Subtitle               │
│  - 2-3 bullet value props                │
├─────────────────────────────────────────┤
│  Interactive Demo                        │
│  - Animated React component              │
│  - Shows the feature in action           │
│  - Framer Motion animations              │
│  - Uses real product UI patterns         │
├─────────────────────────────────────────┤
│  Feature Blocks (3-4)                    │
│  - Icon + Title + Description            │
│  - Grid layout                           │
├─────────────────────────────────────────┤
│  Use Cases (2-3)                         │
│  - Scenario title + description          │
│  - Who benefits                          │
├─────────────────────────────────────────┤
│  CTA                                     │
│  - Waitlist form                         │
└─────────────────────────────────────────┘
```

### Interactive Demo Specs

All demos share these behaviors:
- **Trigger**: `whileInView` — animation starts when scrolled into viewport
- **Loop**: Yes — restarts after a 3s pause at the end
- **Step delay**: 800ms between each step
- **Total duration**: ~6-8s per full cycle
- **Easing**: `easeOut` for entries, `easeInOut` for transitions

**Follow-Ups Demo:**
Animated sequence showing:
1. Transcript snippet appears (typing effect, 40ms/char) — "Let's schedule a follow-up for next week to review the proposal..."
2. AI processing indicator (indigo pulse, 1.5s)
3. Generated email fades in with subject line, greeting, body referencing the transcript
4. "Send" button glows amber
5. 3s hold → fade out → restart

**Sequences Demo:**
Timeline visualization:
1. Step 1 appears: "Follow-up email" (Day 0) — slides in from left
2. Step 2 appears: "Check-in if no reply" (Day 3)
3. Step 3 appears: "Value-add resource" (Day 7)
4. Step 4 appears: "Final nudge" (Day 14)
5. Progress indicator auto-advances through steps (800ms each)
6. Each step has status pill: Sent / Scheduled / Draft
7. 3s hold → fade out → restart

**Meeting Intelligence Demo:**
Dashboard card that populates:
1. Meeting title appears at top
2. Next steps populate one by one with assignees and due dates (600ms each)
3. Risk flags appear (amber warning badges): "No budget discussed", "Timeline unclear"
4. Action items checkbox list fills in
5. Confidence score gauge animates to 72%
6. 3s hold → fade out → restart

**Pipeline Automation Demo:**
Multi-card layout that assembles:
1. CRM update card slides in: "Deal stage: Proposal Sent"
2. Deal health gauge animates: score fills to 85% (green/teal)
3. Pre-meeting briefing card appears with key talking points
4. Activity timeline shows: "Email opened 3x", "Proposal viewed"
5. 3s hold → fade out → restart

### Page-Specific Content

**Follow-Ups (`/product/follow-ups`)**
- Accent: Indigo
- Headline: "Every Meeting Deserves a Follow-Up That Sounds Like You Wrote It"
- Subtitle: "ReplySequence generates personalized follow-up emails from your meeting transcript — referencing real topics, action items, and next steps."
- Features: Transcript-aware drafts, Tone matching, One-click send, Multi-recipient support
- Use cases: Sales discovery calls, Client check-ins, Internal syncs

**Sequences (`/product/sequences`)**
- Accent: Purple (#7A5CFF)
- Headline: "One Meeting. A Whole Sequence. Built Automatically."
- Subtitle: "Turn every conversation into a multi-step nurture flow. Each step references the real discussion — not generic templates."
- Features: Auto-generated multi-step flows, Smart timing, Pause on reply, Conversation-aware content
- Use cases: Post-demo nurture, Proposal follow-through, Re-engagement

**Meeting Intelligence (`/product/meeting-intelligence`)**
- Accent: Teal
- Headline: "Every Commitment Tracked. Every Risk Flagged."
- Subtitle: "AI extracts next steps, assigns owners, sets due dates, and flags deal risks — all from the transcript."
- Features: Next steps with due dates, Risk detection (BANT gaps), Overdue reminders, Meeting summaries
- Use cases: Sales pipeline visibility, Manager coaching, Deal review prep

**Pipeline Automation (`/product/pipeline-automation`)**
- Accent: Amber
- Headline: "Your Pipeline Updates Itself."
- Subtitle: "CRM updates, deal health scores, and pre-meeting briefings — generated from every call, automatically."
- Features: Auto CRM sync, Deal health scoring, Pre-meeting briefings, Activity tracking
- Use cases: Pipeline hygiene, Forecast accuracy, Rep enablement

## 5. Component Interfaces

### ProductPageTemplate Props
```typescript
interface ProductPageProps {
  accent: string;           // hex color for the page's accent
  icon: LucideIcon;         // hero icon
  title: string;            // hero headline
  subtitle: string;         // hero subtitle
  bullets: string[];        // 2-3 value prop bullets
  demo: React.ReactNode;    // interactive demo component
  features: FeatureItem[];  // 3-4 feature blocks
  useCases: UseCaseItem[];  // 2-3 use cases
}
```

### FeatureBlock
```typescript
interface FeatureItem {
  icon: LucideIcon;
  title: string;
  description: string;
}
```
- Grid: `grid-cols-1 sm:grid-cols-2` (2-col on tablet+)
- Each block: icon in colored circle + title (font-semibold) + description (text-muted)

### UseCaseBlock
```typescript
interface UseCaseItem {
  title: string;
  description: string;
  audience: string;  // "For sales reps", "For managers", etc.
}
```
- Grid: `grid-cols-1 md:grid-cols-3`
- Each block: title (font-bold) + description + audience pill

### Product Layout (`app/product/layout.tsx`)
- Wraps children in Header + Footer
- No breadcrumbs or cross-page nav in Phase 1 (keep simple)
- Reuses existing `WaitlistForm` component for CTAs

### SEO Metadata
Each product page exports `generateMetadata()` with:
- `title`: "Follow-Ups | ReplySequence" (etc.)
- `description`: The subtitle text
- `openGraph`: title + description + site image

## 6. Files Changed

### Modified
- `app/globals.css` — design tokens
- `app/page.tsx` — pillar cards clickable, before/after amber, section backgrounds
- `components/layout/Header.tsx` — product dropdown hrefs + colors

### New
- `app/product/layout.tsx`
- `app/product/follow-ups/page.tsx`
- `app/product/sequences/page.tsx`
- `app/product/meeting-intelligence/page.tsx`
- `app/product/pipeline-automation/page.tsx`
- `components/product/FollowUpDemo.tsx`
- `components/product/SequenceDemo.tsx`
- `components/product/MeetingIntelligenceDemo.tsx`
- `components/product/PipelineAutomationDemo.tsx`
- `components/product/ProductPageTemplate.tsx` (shared layout)
- `components/product/FeatureBlock.tsx`
- `components/product/UseCaseBlock.tsx`

## 6. What Is NOT In Scope (Phase 2+)

- Dashboard light mode overhaul
- Dashboard page-by-page polish (follow-ups, sequences, analytics, settings)
- Blog page redesign
- Comparison page redesign
- Global component library refactor
