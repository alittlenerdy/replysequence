# Phase 1: Design System + Landing Page + Product Pages

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish a formal design system, fix the landing page visual hierarchy, update navigation, and create 4 interactive product feature pages.

**Architecture:** CSS custom properties define the design tokens in globals.css. New product pages use a shared template component (`ProductPageTemplate`) with page-specific interactive demos built with Framer Motion. The landing page pillar cards become links to the new pages. Navigation dropdown hrefs are updated.

**Tech Stack:** Next.js 16, Tailwind CSS (with custom `light:` variant), Framer Motion, Clerk, Lucide icons

**Spec:** `docs/superpowers/specs/2026-03-18-design-system-overhaul-phase1-design.md`

---

### Task 1: Design System Tokens

**Files:**
- Modify: `app/globals.css` — add new token block

- [ ] **Step 1: Add new design tokens to globals.css**

Add the following token block inside the existing `:root` selector, after the current variables. Keep all existing variables for backward compatibility.

```css
/* === Phase 1 Design Tokens === */

/* Surfaces - Dark (default) */
--surface-page: #060B18;
--surface-section: #0A1020;
--surface-card: #111827;
--surface-card-border: rgba(255, 255, 255, 0.06);

/* Text - Dark */
--text-heading: #E8ECF4;
--text-body: #C0C8E0;
--text-muted: #8892B0;

/* Accents */
--accent-indigo: #5B6CFF;
--accent-indigo-hover: #4A5BEE;
--accent-indigo-subtle: rgba(91, 108, 255, 0.10);
--accent-purple: #7A5CFF;
--accent-amber: #F59E0B;
--accent-amber-hover: #D97706;
--accent-amber-subtle: rgba(245, 158, 11, 0.10);
--accent-teal: #06B6D4;

/* Divider */
--divider: #1E2A4A;

/* Backward compat aliases */
--background: var(--surface-page);
--mint: var(--accent-indigo);
--neon: var(--accent-indigo);
--text-primary: var(--text-heading);
--text-secondary: var(--text-body);
--color-primary: var(--accent-indigo);
--color-accent: var(--accent-amber);
```

- [ ] **Step 2: Add light mode token overrides**

In globals.css, find or create a `.light` or `[data-theme="light"]` selector and add:

```css
/* Light mode surface/text overrides — check existing light mode pattern first */
--surface-page: #F8FAFC;
--surface-section: #F1F5F9;
--surface-card: #FFFFFF;
--surface-card-border: rgba(0, 0, 0, 0.08);
--text-heading: #0F172A;
--text-body: #334155;
--text-muted: #64748B;
--divider: #E2E8F0;
```

Note: Check how the existing `light:` Tailwind variant works in the codebase. The tokens may need to go in a media query or class selector depending on the theme toggle implementation.

- [ ] **Step 3: Commit**

```bash
git add app/globals.css
git commit -m "feat: add Phase 1 design system tokens with backward compat aliases"
```

---

### Task 2: Landing Page — Pillar Cards Clickable

**Files:**
- Modify: `app/page.tsx` — platformPillars array and card rendering (~lines 86-460)

- [ ] **Step 1: Update pillar colors to match design system**

In `app/page.tsx`, update the `platformPillars` array:

```typescript
const platformPillars = [
  {
    icon: FileText,
    title: 'Follow-Ups',
    description: 'AI-drafted emails that reference the real conversation. Every follow-up sounds like you wrote it.',
    color: '#5B6CFF',
    href: '/product/follow-ups',
  },
  {
    icon: Layers,
    title: 'Sequences',
    description: 'Multi-step nurture flows triggered by each meeting. Keep deals warm without manual effort.',
    color: '#7A5CFF',
    href: '/product/sequences',
  },
  {
    icon: Brain,
    title: 'Meeting Intelligence',
    description: 'Next steps extracted with due dates. Risk flags for budget, timeline, and champion gaps.',
    color: '#06B6D4',
    href: '/product/meeting-intelligence',
  },
  {
    icon: TrendingUp,
    title: 'Pipeline Automation',
    description: 'CRM updates, deal health scores, and pre-meeting briefings — all from your transcripts.',
    color: '#F59E0B',
    href: '/product/pipeline-automation',
  },
];
```

- [ ] **Step 2: Wrap pillar cards in Link with hover effects**

Add `import Link from 'next/link';` if not already imported. Update the pillar card rendering to wrap each card in a `<Link>` with hover lift and "Learn more" text:

```tsx
{platformPillars.map((pillar, index) => {
  const Icon = pillar.icon;
  return (
    <motion.div key={index} /* ...existing motion props... */>
      <Link
        href={pillar.href}
        className="block rounded-2xl bg-[#0F1629] light:bg-white border border-[#1E2A4A] light:border-gray-200 p-6 hover:border-opacity-60 hover:-translate-y-1 hover:shadow-lg transition-all duration-200 cursor-pointer light:shadow-sm group"
        style={{ ['--pillar-color' as string]: pillar.color }}
      >
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
          style={{ backgroundColor: `${pillar.color}15`, boxShadow: `0 4px 16px ${pillar.color}20` }}
        >
          <Icon className="w-6 h-6" style={{ color: pillar.color }} strokeWidth={1.5} />
        </div>
        <h3 className="text-lg font-bold text-white light:text-gray-900 mb-2">{pillar.title}</h3>
        <p className="text-sm text-[#C0C8E0] light:text-gray-600 mb-4">{pillar.description}</p>
        <span className="text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200" style={{ color: pillar.color }}>
          Learn more →
        </span>
      </Link>
    </motion.div>
  );
})}
```

- [ ] **Step 3: Update Before/After cards**

Change the "After" text color and card surface:
- After label: add `text-[#F59E0B] light:text-amber-600`
- Card surface: change `bg-[#141C34]/80` to `bg-[#0F1629]`

- [ ] **Step 4: Commit**

```bash
git add app/page.tsx
git commit -m "feat: make pillar cards clickable, update colors, improve before/after contrast"
```

---

### Task 3: Navigation Dropdown Fix

**Files:**
- Modify: `components/layout/Header.tsx` — productItems array (~lines 13-42)

- [ ] **Step 1: Update productItems hrefs and colors**

```typescript
const productItems = [
  {
    label: 'Follow-Ups',
    description: 'AI-generated follow-ups after every meeting',
    href: '/product/follow-ups',
    icon: FileText,
    color: '#5B6CFF',
  },
  {
    label: 'Sequences',
    description: 'Automated multi-step follow-up campaigns',
    href: '/product/sequences',
    icon: Layers,
    color: '#7A5CFF',
  },
  {
    label: 'Meeting Intelligence',
    description: 'Analyze transcripts and extract next steps',
    href: '/product/meeting-intelligence',
    icon: Brain,
    color: '#06B6D4',
  },
  {
    label: 'Pipeline Automation',
    description: 'Track deal momentum and risks',
    href: '/product/pipeline-automation',
    icon: TrendingUp,
    color: '#F59E0B',
  },
];
```

- [ ] **Step 2: Commit**

```bash
git add components/layout/Header.tsx
git commit -m "fix: update product dropdown to link to dedicated product pages"
```

---

### Task 4: Shared Product Page Components

**Files:**
- Create: `components/product/ProductPageTemplate.tsx`
- Create: `components/product/FeatureBlock.tsx`
- Create: `components/product/UseCaseBlock.tsx`

- [ ] **Step 1: Create ProductPageTemplate**

```tsx
// components/product/ProductPageTemplate.tsx
'use client';

import { motion } from 'framer-motion';
import { type LucideIcon } from 'lucide-react';
import dynamic from 'next/dynamic';

const WaitlistForm = dynamic(
  () => import('@/components/landing/WaitlistForm').then(m => ({ default: m.WaitlistForm })),
  { ssr: false }
);

interface FeatureItem {
  icon: LucideIcon;
  title: string;
  description: string;
}

interface UseCaseItem {
  title: string;
  description: string;
  audience: string;
}

interface ProductPageProps {
  accent: string;
  icon: LucideIcon;
  title: string;
  subtitle: string;
  bullets: string[];
  demo: React.ReactNode;
  features: FeatureItem[];
  useCases: UseCaseItem[];
}

export function ProductPageTemplate({
  accent,
  icon: Icon,
  title,
  subtitle,
  bullets,
  demo,
  features,
  useCases,
}: ProductPageProps) {
  return (
    <div className="min-h-screen bg-[#060B18] light:bg-[#F8FAFC] text-white light:text-gray-900">
      {/* Hero */}
      <section className="relative pt-32 pb-16 px-4">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at 50% 30%, ${accent}15 0%, transparent 60%)`,
          }}
        />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
              style={{ backgroundColor: `${accent}15`, boxShadow: `0 0 40px ${accent}20` }}
            >
              <Icon className="w-8 h-8" style={{ color: accent }} />
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight text-[#E8ECF4] light:text-gray-900 text-pretty">
              {title}
            </h1>
            <p className="text-xl text-[#C0C8E0] light:text-gray-600 mb-8 max-w-2xl mx-auto">
              {subtitle}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
              {bullets.map((bullet, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: accent }} />
                  <span className="text-sm text-[#8892B0] light:text-gray-500 font-medium">{bullet}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Interactive Demo */}
      <section className="py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="rounded-2xl bg-[#0F1629] light:bg-white border border-[#1E2A4A] light:border-gray-200 p-8 md:p-12 light:shadow-lg"
            style={{ boxShadow: `0 0 60px ${accent}08` }}
          >
            {demo}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4" style={{ background: 'linear-gradient(180deg, rgba(10,16,32,0.5) 0%, transparent 100%)' }}>
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12 text-[#E8ECF4] light:text-gray-900">
            How It Works
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {features.map((feature, i) => {
              const FeatureIcon = feature.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.4 }}
                  className="rounded-xl bg-[#0F1629] light:bg-white border border-[#1E2A4A] light:border-gray-200 p-6 light:shadow-sm"
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                    style={{ backgroundColor: `${accent}15` }}
                  >
                    <FeatureIcon className="w-5 h-5" style={{ color: accent }} />
                  </div>
                  <h3 className="text-base font-semibold text-white light:text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-sm text-[#8892B0] light:text-gray-500">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12 text-[#E8ECF4] light:text-gray-900">
            Built For
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {useCases.map((uc, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                className="rounded-xl bg-[#0F1629] light:bg-white border border-[#1E2A4A] light:border-gray-200 p-6 text-center light:shadow-sm"
              >
                <span
                  className="inline-block text-xs font-semibold px-3 py-1 rounded-full mb-4"
                  style={{ backgroundColor: `${accent}15`, color: accent }}
                >
                  {uc.audience}
                </span>
                <h3 className="text-lg font-bold text-white light:text-gray-900 mb-2">{uc.title}</h3>
                <p className="text-sm text-[#8892B0] light:text-gray-500">{uc.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4" style={{ background: `radial-gradient(ellipse at center, ${accent}08 0%, transparent 50%)` }}>
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4 text-[#E8ECF4] light:text-gray-900">
            Ready to See It In Action?
          </h2>
          <p className="text-[#C0C8E0] light:text-gray-600 mb-8">
            Start with 5 free AI drafts. No credit card required.
          </p>
          <div className="glass-border-accent rounded-2xl p-6 sm:p-10">
            <WaitlistForm />
          </div>
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/product/ProductPageTemplate.tsx
git commit -m "feat: add ProductPageTemplate shared component"
```

---

### Task 5: Product Layout

**Files:**
- Create: `app/product/layout.tsx`

- [ ] **Step 1: Create product layout**

```tsx
// app/product/layout.tsx
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default function ProductLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/product/layout.tsx
git commit -m "feat: add product pages layout with Header + Footer"
```

---

### Task 6: Follow-Ups Product Page + Demo

**Files:**
- Create: `components/product/FollowUpDemo.tsx`
- Create: `app/product/follow-ups/page.tsx`

- [ ] **Step 1: Create FollowUpDemo component**

Build an animated demo showing: transcript snippet → AI processing → generated email. Use Framer Motion with `whileInView` trigger, 800ms step delays, looping after 3s hold.

The demo should show a stylized UI with:
- Left panel: transcript excerpt with highlighted text
- Center: indigo pulse animation (AI processing)
- Right panel: email draft appearing with typing-style animation
- Amber "Send" button glowing at the end

All using the product's card styles (dark surfaces, rounded corners, proper text colors).

- [ ] **Step 2: Create follow-ups page**

```tsx
// app/product/follow-ups/page.tsx
import { FileText, Mail, Sparkles, Users } from 'lucide-react';
import { ProductPageTemplate } from '@/components/product/ProductPageTemplate';
import { FollowUpDemo } from '@/components/product/FollowUpDemo';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Follow-Ups | ReplySequence',
  description: 'AI-generated follow-up emails from your meeting transcripts — personalized, accurate, and ready to send.',
};

export default function FollowUpsPage() {
  return (
    <ProductPageTemplate
      accent="#5B6CFF"
      icon={FileText}
      title="Every Meeting Deserves a Follow-Up That Sounds Like You Wrote It"
      subtitle="ReplySequence generates personalized follow-up emails from your meeting transcript — referencing real topics, action items, and next steps."
      bullets={[
        'References specific conversation topics',
        'Matches your writing tone',
        'Ready to send in seconds',
      ]}
      demo={<FollowUpDemo />}
      features={[
        { icon: FileText, title: 'Transcript-Aware Drafts', description: 'Every email references what was actually discussed — not generic templates.' },
        { icon: Sparkles, title: 'Tone Matching', description: 'Configure your preferred tone and the AI adapts — professional, friendly, or concise.' },
        { icon: Mail, title: 'One-Click Send', description: 'Review the draft, make any edits, and send directly from ReplySequence.' },
        { icon: Users, title: 'Multi-Recipient Support', description: 'Follow up with multiple meeting participants, each with personalized content.' },
      ]}
      useCases={[
        { title: 'Sales Discovery Calls', description: 'Send a recap with next steps within minutes of hanging up.', audience: 'For sales reps' },
        { title: 'Client Check-Ins', description: 'Keep clients informed with detailed follow-ups that reference their specific concerns.', audience: 'For account managers' },
        { title: 'Internal Syncs', description: 'Share meeting outcomes and action items with stakeholders who weren\'t on the call.', audience: 'For team leads' },
      ]}
    />
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add components/product/FollowUpDemo.tsx app/product/follow-ups/page.tsx
git commit -m "feat: add Follow-Ups product page with interactive demo"
```

---

### Task 7: Sequences Product Page + Demo

**Files:**
- Create: `components/product/SequenceDemo.tsx`
- Create: `app/product/sequences/page.tsx`

- [ ] **Step 1: Create SequenceDemo component**

Animated timeline showing 4 sequence steps appearing one by one with slide-in animations. Each step shows: step number, action title, day label, and status pill (Sent/Scheduled/Draft). Progress indicator auto-advances through steps. Loop after 3s hold.

- [ ] **Step 2: Create sequences page**

Same pattern as follow-ups, using:
- Accent: `#7A5CFF`
- Icon: `Layers`
- Headline: "One Meeting. A Whole Sequence. Built Automatically."
- Features: Auto-generated flows, Smart timing, Pause on reply, Conversation-aware content
- Use cases: Post-demo nurture, Proposal follow-through, Re-engagement

- [ ] **Step 3: Commit**

```bash
git add components/product/SequenceDemo.tsx app/product/sequences/page.tsx
git commit -m "feat: add Sequences product page with timeline demo"
```

---

### Task 8: Meeting Intelligence Product Page + Demo

**Files:**
- Create: `components/product/MeetingIntelligenceDemo.tsx`
- Create: `app/product/meeting-intelligence/page.tsx`

- [ ] **Step 1: Create MeetingIntelligenceDemo component**

Dashboard card that populates with meeting analysis: title appears, then next steps with assignees/dates populate one by one, risk flags appear as amber badges, action items fill in, confidence gauge animates to 72%. Loop after 3s hold.

- [ ] **Step 2: Create meeting-intelligence page**

Same pattern, using:
- Accent: `#06B6D4`
- Icon: `Brain`
- Headline: "Every Commitment Tracked. Every Risk Flagged."
- Features: Next steps with due dates, Risk detection, Overdue reminders, Meeting summaries
- Use cases: Pipeline visibility, Manager coaching, Deal review prep

- [ ] **Step 3: Commit**

```bash
git add components/product/MeetingIntelligenceDemo.tsx app/product/meeting-intelligence/page.tsx
git commit -m "feat: add Meeting Intelligence product page with analysis demo"
```

---

### Task 9: Pipeline Automation Product Page + Demo

**Files:**
- Create: `components/product/PipelineAutomationDemo.tsx`
- Create: `app/product/pipeline-automation/page.tsx`

- [ ] **Step 1: Create PipelineAutomationDemo component**

Multi-card layout: CRM update card slides in, deal health gauge animates to 85% (teal/green), pre-meeting briefing card appears, activity timeline shows engagement signals. Loop after 3s hold.

- [ ] **Step 2: Create pipeline-automation page**

Same pattern, using:
- Accent: `#F59E0B`
- Icon: `TrendingUp`
- Headline: "Your Pipeline Updates Itself."
- Features: Auto CRM sync, Deal health scoring, Pre-meeting briefings, Activity tracking
- Use cases: Pipeline hygiene, Forecast accuracy, Rep enablement

- [ ] **Step 3: Commit**

```bash
git add components/product/PipelineAutomationDemo.tsx app/product/pipeline-automation/page.tsx
git commit -m "feat: add Pipeline Automation product page with CRM demo"
```

---

### Task 10: Final Integration + Push

**Files:**
- Verify all pages render
- Push to remote

- [ ] **Step 1: Verify all product pages are accessible**

Check that these routes exist and render without errors:
- `/product/follow-ups`
- `/product/sequences`
- `/product/meeting-intelligence`
- `/product/pipeline-automation`

Check that the product dropdown in the header links to the correct pages.
Check that the pillar cards on the landing page link to the correct pages.

- [ ] **Step 2: Push**

```bash
git push origin main
```
