# Draft Workflow Tour Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a 5-step guided tour that teaches new users the draft workflow (edit, refine, regenerate, send) on their first draft.

**Architecture:** Custom spotlight overlay with glassmorphism tooltips. Tour state tracked via localStorage. Tour orchestrator renders as sibling to DraftsTable in DraftsView. Target elements marked with `data-tour` attributes.

**Tech Stack:** React, Tailwind CSS, CSS transitions, localStorage

---

### Task 1: Add data-tour attributes to target elements

**Files:**
- Modify: `components/DraftInlinePanel.tsx:449` (Edit button)
- Modify: `components/DraftInlinePanel.tsx:455` (Refine button)
- Modify: `components/DraftInlinePanel.tsx:463` (Regenerate button)
- Modify: `components/DraftInlinePanel.tsx:476` (Send section container)
- Modify: `components/DraftsTable.tsx:734` (Draft row `<tr>`)

**Step 1: Add data-tour to Edit button**

In `DraftInlinePanel.tsx` at line 449, add `data-tour="edit-draft"` to the button:

```tsx
<button
  data-tour="edit-draft"
  onClick={() => setMode('editing')}
  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg text-sky-300 bg-sky-500/10 border border-sky-500/25 hover:bg-sky-500/20 transition-colors"
>
```

**Step 2: Add data-tour to Refine button**

In `DraftInlinePanel.tsx` at line 455, add `data-tour="refine-draft"`:

```tsx
<button
  data-tour="refine-draft"
  onClick={() => setMode('refining')}
  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg text-violet-300 bg-violet-500/15 border border-violet-500/30 hover:bg-violet-500/25 transition-colors"
>
```

**Step 3: Add data-tour to Regenerate button**

In `DraftInlinePanel.tsx` at line 463, add `data-tour="regenerate-draft"`:

```tsx
<button
  data-tour="regenerate-draft"
  onClick={() => setShowTemplates(!showTemplates)}
  disabled={templates.length === 0}
  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg text-orange-300 bg-orange-500/10 border border-orange-500/25 hover:bg-orange-500/20 disabled:opacity-50 transition-colors"
>
```

**Step 4: Add data-tour to Send section**

In `DraftInlinePanel.tsx` at line 476, wrap the send section container with `data-tour="send-section"`:

```tsx
<div data-tour="send-section" className="flex flex-col gap-3">
```

**Step 5: Add data-tour to first draft row**

In `DraftsTable.tsx` at line 734, add `data-tour` conditionally for the first draft:

```tsx
<tr
  key={draft.id}
  data-tour={index === 0 ? 'draft-row' : undefined}
  onClick={() => {
    if (!isSelectMode) toggleExpanded(draft.id);
  }}
```

**Step 6: Commit**

```bash
git add components/DraftInlinePanel.tsx components/DraftsTable.tsx
git commit -m "feat: add data-tour attributes for draft workflow tour"
```

---

### Task 2: Create useTourState hook

**Files:**
- Create: `lib/hooks/useTourState.ts`

**Step 1: Create the hook file**

```typescript
'use client';

import { useState, useCallback, useEffect } from 'react';

const TOUR_KEY = 'replysequence-draft-tour-completed';

export interface TourStep {
  id: string;
  target: string; // data-tour attribute value
  title: string;
  message: string;
  placement: 'top' | 'bottom' | 'left' | 'right';
}

export const DRAFT_TOUR_STEPS: TourStep[] = [
  {
    id: 'draft-row',
    target: 'draft-row',
    title: 'Your first draft is ready',
    message:
      'ReplySequence analyzed your meeting transcript and wrote this email draft. Click to expand and see it.',
    placement: 'bottom',
  },
  {
    id: 'edit-draft',
    target: 'edit-draft',
    title: 'Edit directly',
    message:
      'Make manual changes to the subject or body. Use this for quick tweaks — fixing a name, adjusting a detail.',
    placement: 'bottom',
  },
  {
    id: 'refine-draft',
    target: 'refine-draft',
    title: 'Refine with AI',
    message:
      "Ask AI to improve the draft — make it more concise, add urgency, fix grammar, or give custom instructions. You'll see a before/after comparison.",
    placement: 'bottom',
  },
  {
    id: 'regenerate-draft',
    target: 'regenerate-draft',
    title: 'Start fresh with a template',
    message:
      'Generate a completely new draft using a different template. Templates like "Sales Follow-up" or "Discovery Call" change the entire structure and focus.',
    placement: 'bottom',
  },
  {
    id: 'send-section',
    target: 'send-section',
    title: 'Send when ready',
    message:
      'Choose your recipient, review the draft, and send. The email goes from your connected email account.',
    placement: 'top',
  },
];

export function useTourState() {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    // Check if tour was already completed
    const completed = localStorage.getItem(TOUR_KEY);
    if (completed) {
      setIsActive(false);
    }
  }, []);

  const startTour = useCallback(() => {
    const completed = localStorage.getItem(TOUR_KEY);
    if (!completed) {
      setCurrentStep(0);
      setIsActive(true);
    }
  }, []);

  const nextStep = useCallback(() => {
    if (currentStep < DRAFT_TOUR_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      // Tour complete
      localStorage.setItem(TOUR_KEY, 'true');
      setIsActive(false);
    }
  }, [currentStep]);

  const skipTour = useCallback(() => {
    localStorage.setItem(TOUR_KEY, 'true');
    setIsActive(false);
  }, []);

  const resetTour = useCallback(() => {
    localStorage.removeItem(TOUR_KEY);
    setCurrentStep(0);
    setIsActive(false);
  }, []);

  return {
    isActive,
    currentStep,
    totalSteps: DRAFT_TOUR_STEPS.length,
    step: DRAFT_TOUR_STEPS[currentStep],
    startTour,
    nextStep,
    skipTour,
    resetTour,
  };
}
```

**Step 2: Commit**

```bash
git add lib/hooks/useTourState.ts
git commit -m "feat: add useTourState hook for draft tour persistence"
```

---

### Task 3: Create TourSpotlight component

**Files:**
- Create: `components/tour/TourSpotlight.tsx`

**Step 1: Create the spotlight component**

This component renders:
- A full-screen dark overlay with a transparent cutout around the target element
- A glassmorphism tooltip positioned relative to the target
- Navigation (Next button, step dots, Skip tour)

```tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { X } from 'lucide-react';
import type { TourStep } from '@/lib/hooks/useTourState';

interface TourSpotlightProps {
  step: TourStep;
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onSkip: () => void;
}

interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const PADDING = 8;

export function TourSpotlight({
  step,
  currentStep,
  totalSteps,
  onNext,
  onSkip,
}: TourSpotlightProps) {
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);

  const updatePosition = useCallback(() => {
    const el = document.querySelector(`[data-tour="${step.target}"]`);
    if (!el) return;

    const rect = el.getBoundingClientRect();
    setTargetRect({
      top: rect.top - PADDING,
      left: rect.left - PADDING,
      width: rect.width + PADDING * 2,
      height: rect.height + PADDING * 2,
    });

    // Scroll element into view if needed
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [step.target]);

  useEffect(() => {
    // Small delay to allow DOM to settle
    const timer = setTimeout(updatePosition, 100);
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [updatePosition]);

  if (!targetRect) return null;

  // Calculate tooltip position
  const tooltipStyle = getTooltipPosition(targetRect, step.placement);
  const isLastStep = currentStep === totalSteps - 1;

  return (
    <div className="fixed inset-0 z-[9999]" onClick={onSkip}>
      {/* Overlay with cutout using clip-path */}
      <div
        className="absolute inset-0 bg-black/60 transition-all duration-300"
        style={{
          clipPath: `polygon(
            0% 0%, 0% 100%,
            ${targetRect.left}px 100%,
            ${targetRect.left}px ${targetRect.top}px,
            ${targetRect.left + targetRect.width}px ${targetRect.top}px,
            ${targetRect.left + targetRect.width}px ${targetRect.top + targetRect.height}px,
            ${targetRect.left}px ${targetRect.top + targetRect.height}px,
            ${targetRect.left}px 100%,
            100% 100%, 100% 0%
          )`,
        }}
      />

      {/* Spotlight border glow */}
      <div
        className="absolute rounded-xl border border-indigo-400/40 shadow-[0_0_20px_rgba(99,102,241,0.2)] transition-all duration-300 pointer-events-none"
        style={{
          top: targetRect.top,
          left: targetRect.left,
          width: targetRect.width,
          height: targetRect.height,
        }}
      />

      {/* Tooltip */}
      <div
        className="absolute w-80 bg-gray-900/80 light:bg-white/80 backdrop-blur-lg border border-white/[0.15] light:border-gray-300/40 rounded-2xl shadow-2xl p-5 transition-all duration-300"
        style={tooltipStyle}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onSkip}
          className="absolute top-3 right-3 p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Content */}
        <h3 className="text-base font-semibold text-white light:text-gray-900 mb-2 pr-6">
          {step.title}
        </h3>
        <p className="text-sm text-gray-300 light:text-gray-600 leading-relaxed mb-4">
          {step.message}
        </p>

        {/* Footer: dots + button */}
        <div className="flex items-center justify-between">
          {/* Step dots */}
          <div className="flex gap-1.5">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  i === currentStep
                    ? 'bg-indigo-400'
                    : i < currentStep
                      ? 'bg-indigo-400/40'
                      : 'bg-gray-600'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onSkip}
              className="text-xs text-gray-400 hover:text-gray-200 transition-colors"
            >
              Skip
            </button>
            <button
              onClick={onNext}
              className="px-4 py-1.5 text-sm font-medium rounded-lg bg-indigo-500 text-white hover:bg-indigo-400 transition-colors"
            >
              {isLastStep ? 'Done' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function getTooltipPosition(
  rect: TargetRect,
  placement: TourStep['placement']
): React.CSSProperties {
  const gap = 12;

  switch (placement) {
    case 'bottom':
      return {
        top: rect.top + rect.height + gap,
        left: Math.max(16, rect.left + rect.width / 2 - 160), // center horizontally, 160 = half of w-80
      };
    case 'top':
      return {
        bottom: window.innerHeight - rect.top + gap,
        left: Math.max(16, rect.left + rect.width / 2 - 160),
      };
    case 'right':
      return {
        top: rect.top,
        left: rect.left + rect.width + gap,
      };
    case 'left':
      return {
        top: rect.top,
        right: window.innerWidth - rect.left + gap,
      };
  }
}
```

**Step 2: Commit**

```bash
git add components/tour/TourSpotlight.tsx
git commit -m "feat: add TourSpotlight component with glassmorphism tooltip"
```

---

### Task 4: Create DraftTour orchestrator

**Files:**
- Create: `components/tour/DraftTour.tsx`

**Step 1: Create the orchestrator**

This component manages tour lifecycle: detects first draft, auto-expands it, starts tour, and advances steps.

```tsx
'use client';

import { useEffect, useRef } from 'react';
import { TourSpotlight } from './TourSpotlight';
import { useTourState } from '@/lib/hooks/useTourState';

interface DraftTourProps {
  hasDrafts: boolean;
  expandedDraftId: string | null;
  onExpandFirstDraft: () => void;
}

export function DraftTour({
  hasDrafts,
  expandedDraftId,
  onExpandFirstDraft,
}: DraftTourProps) {
  const {
    isActive,
    currentStep,
    totalSteps,
    step,
    startTour,
    nextStep,
    skipTour,
  } = useTourState();

  const hasTriggered = useRef(false);

  // Auto-trigger tour when first draft appears
  useEffect(() => {
    if (hasDrafts && !hasTriggered.current) {
      hasTriggered.current = true;
      startTour();
    }
  }, [hasDrafts, startTour]);

  // After step 0 (draft row), auto-expand the first draft before showing step 1
  const handleNext = () => {
    if (currentStep === 0 && !expandedDraftId) {
      onExpandFirstDraft();
      // Wait for expansion animation before advancing
      setTimeout(() => {
        nextStep();
      }, 400);
    } else {
      nextStep();
    }
  };

  if (!isActive || !step) return null;

  return (
    <TourSpotlight
      step={step}
      currentStep={currentStep}
      totalSteps={totalSteps}
      onNext={handleNext}
      onSkip={skipTour}
    />
  );
}
```

**Step 2: Commit**

```bash
git add components/tour/DraftTour.tsx
git commit -m "feat: add DraftTour orchestrator with auto-trigger on first draft"
```

---

### Task 5: Integrate DraftTour into DraftsView

**Files:**
- Modify: `components/dashboard/DraftsView.tsx:249-256`
- Modify: `components/DraftsTable.tsx` (expose expandedDraftId and expand function)

**Step 1: Add expandedDraftId and expand callback to DraftsTable**

In `DraftsTable.tsx`, the `expandedDraftId` state and `toggleExpanded` function are internal. We need to expose them or lift them up. The simplest approach: add optional props for the tour to control expansion.

Add to the DraftsTable props interface:

```tsx
interface DraftsTableProps {
  // ... existing props
  tourExpandRef?: React.MutableRefObject<{
    expandedDraftId: string | null;
    expandFirst: () => void;
  } | null>;
}
```

Inside DraftsTable, after the `expandedDraftId` state is declared, add:

```tsx
useEffect(() => {
  if (tourExpandRef) {
    tourExpandRef.current = {
      expandedDraftId,
      expandFirst: () => {
        if (drafts.length > 0) {
          toggleExpanded(drafts[0].id);
        }
      },
    };
  }
}, [tourExpandRef, expandedDraftId, drafts, toggleExpanded]);
```

**Step 2: Wire up DraftTour in DraftsView**

In `DraftsView.tsx`, add after the existing state declarations (~line 58):

```tsx
import { DraftTour } from '@/components/tour/DraftTour';

// Inside the component, after existing state:
const tourExpandRef = useRef<{
  expandedDraftId: string | null;
  expandFirst: () => void;
} | null>(null);
```

Then render `<DraftTour>` right before the closing of the main container (around line 256):

```tsx
<DraftsTable
  drafts={drafts}
  total={total}
  page={page}
  totalPages={totalPages}
  onPageChange={handlePageChange}
  onDraftUpdated={handleDraftUpdated}
  tourExpandRef={tourExpandRef}
/>

<DraftTour
  hasDrafts={drafts.length > 0}
  expandedDraftId={tourExpandRef.current?.expandedDraftId ?? null}
  onExpandFirstDraft={() => tourExpandRef.current?.expandFirst()}
/>
```

**Step 3: Commit**

```bash
git add components/dashboard/DraftsView.tsx components/DraftsTable.tsx
git commit -m "feat: integrate DraftTour into DraftsView with table expansion control"
```

---

### Task 6: Test and verify

**Step 1: Clear localStorage to simulate first-time user**

Open browser DevTools console:
```javascript
localStorage.removeItem('replysequence-draft-tour-completed');
```

**Step 2: Run dev server and verify**

```bash
npm run dev
```

Navigate to dashboard with at least one draft. Verify:
- Tour overlay appears automatically
- Step 1 highlights the draft row
- Clicking "Next" expands the draft and advances to step 2
- Steps 2-4 highlight Edit, Refine, Regenerate buttons respectively
- Step 5 highlights the send section
- "Done" on last step dismisses tour
- Refreshing page does NOT show tour again
- "Skip" at any step dismisses and persists

**Step 3: Test mobile responsive behavior**

Resize browser to mobile width. Verify tooltip remains visible and readable.

**Step 4: Build check**

```bash
npx next build
```

Expected: No TypeScript errors, no build failures.

**Step 5: Commit final adjustments**

```bash
git add -A
git commit -m "feat: draft workflow tour - polish and responsive fixes"
```

---

### Task 7: Update ClickUp task

**Step 1: Update task status to ready for review**

Update ClickUp task `86ag0cyax` status to `ready for review` and set Phase to `Testing`.
