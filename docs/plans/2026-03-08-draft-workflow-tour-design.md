# Draft Workflow Tour — Design Document

**Date:** 2026-03-08
**Status:** Approved
**ClickUp Task:** https://app.clickup.com/t/86ag0cyax

## Problem

New users see their first AI-generated draft but don't understand the draft workflow — the difference between Edit, Refine, and Regenerate, or how to go from draft to sent email. There's no onboarding or guidance within the drafts experience.

## Solution

A 5-step guided tour that triggers automatically when a user's first draft is generated. Custom-built spotlight overlay with glassmorphism tooltips, zero external dependencies.

## Approach

**Custom tour component** (~300-400 lines). No library — keeps bundle lean, matches existing design language (FloatingToolbar glassmorphism), gives full control over animations and positioning.

## Tour Steps

| Step | Target Element | Title | Message |
|------|---------------|-------|---------|
| 1 | Draft row | Your first draft is ready | ReplySequence analyzed your meeting transcript and wrote this email draft. Click to expand and see it. |
| 2 | Edit button | Edit directly | Make manual changes to the subject or body. Use this for quick tweaks — fixing a name, adjusting a detail. |
| 3 | Refine button | Refine with AI | Ask AI to improve the draft — make it more concise, add urgency, fix grammar, or give custom instructions. You'll see a before/after comparison. |
| 4 | Regenerate button | Start fresh with a template | Generate a completely new draft using a different template. Templates like "Sales Follow-up" or "Discovery Call" change the entire structure and focus. |
| 5 | Send section | Send when ready | Choose your recipient, review the draft, and send. The email goes from your connected email account. |

## Architecture

### New Files
- `components/tour/DraftTour.tsx` — Tour orchestrator, manages step state, renders overlay
- `components/tour/TourSpotlight.tsx` — Reusable spotlight overlay + positioned tooltip
- `lib/hooks/useTourState.ts` — Hook for tour visibility, step progression, completion persistence

### Integration Points
- `DraftsView.tsx` — Renders `<DraftTour />` when first draft detected and tour not yet completed
- Target elements get `data-tour-step="step-name"` attributes for positioning

### Visual Design
- **Overlay:** Semi-transparent dark backdrop (`bg-black/60`) with spotlight cutout around target
- **Tooltip:** Glassmorphism card matching FloatingToolbar style — `backdrop-blur-xl bg-white/10 border border-white/20`
- **Navigation:** "Next" button (cyan accent), step indicator dots, "Skip tour" link
- **Animation:** CSS transitions on spotlight position/size between steps

### State Management
- `localStorage` key: `replysequence-draft-tour-completed`
- Auto-triggers when: user has drafts + tour not completed + first draft panel is expanded
- "Skip tour" and completing final step both set the completion flag
- Tour auto-expands first draft row before starting step 2

### Responsive Behavior
- Desktop: Tooltip positioned right or below target element
- Mobile: Tooltip renders as bottom sheet below spotlight
- Tour pauses if user navigates away, resumes on return

## Current Draft UI Reference

### Editing (DraftInlinePanel.tsx)
Two-mode: Preview → Edit. Subject input + RichTextEditor. Save/Cancel buttons.

### Refinement (ConversationalRefine.tsx)
Modal with 6 quick suggestions (concise, urgency, friendly, formal, CTA, grammar) + custom input. Three phases: input → loading → before/after preview.

### Regeneration (DraftInlinePanel.tsx + meeting-templates.ts)
Template picker strip at bottom of panel. 10 system templates filtered by meeting type. Click → loading → new draft replaces current.

### Layout
```
┌─────────────────────────────────────────────────────────┐
│ DraftInlinePanel                                        │
├───────────────────────────┬─────────────────────────────┤
│ Left (7/12)               │ Right (5/12)                │
│ Subject + Editor          │ Meeting Summary             │
│ Edit/Refine/Regenerate    │ Topics, Decisions           │
│ Send + Recipients         │ Action Items, Attendees     │
│ Template picker           │                             │
└───────────────────────────┴─────────────────────────────┘
```
