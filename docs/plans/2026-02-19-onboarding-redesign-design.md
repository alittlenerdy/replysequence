# Onboarding Redesign: Email + AI Voice Focus

**Date:** 2026-02-19
**Status:** Approved
**Goal:** Restructure onboarding to emphasize email connection and AI voice setup as core product features

## Context

The current 5-step onboarding (Welcome, Meeting Platform, Calendar, Test Draft, Delivery Mode) buries email connection and AI customization in post-onboarding Settings. Users don't discover that they can send from their own Gmail/Outlook or customize how drafts sound until they dig into Settings. Calendar connection is not on the critical path.

## New Onboarding Flow (6 Steps)

### Step 1: Welcome (existing, unchanged)

Keep the current welcome screen that explains what ReplySequence does.

### Step 2: Connect Meeting Platform (existing, unchanged)

Zoom, Teams, or Google Meet connection via existing OAuth flows.

### Step 3: Connect Email Account (NEW)

**Purpose:** Get users to connect Gmail or Outlook so drafts send from their real address.

**Layout:**
- Headline: "Send emails from your inbox"
- Subtext: "Connect your email so follow-ups come from you, not a generic noreply address. Recipients are 3x more likely to open emails from real people."
- Two large cards side by side:
  - Gmail (Google logo, "Connect Gmail", one-click OAuth)
  - Outlook (Microsoft logo, "Connect Outlook", one-click OAuth)
- After connection: green checkmark with connected email displayed
- Skip option: "I'll do this later" link at bottom with warning that emails will come from noreply@replysequence.com

**Technical:**
- Reuses existing OAuth flows at `/api/auth/gmail` and `/api/auth/outlook`
- `returnTo` param set to `/onboarding?step=3&connected=true`
- Add `emailConnected: boolean` to `user_onboarding` table

### Step 4: Set Up Your AI Voice (NEW)

**Purpose:** Let users personalize how AI drafts sound. This is where they feel ownership of the product.

**Layout (3 sub-sections on one page):**

**a. Email Tone (required)**
- 4 selectable cards with live preview text that changes on selection
- Options: Professional (default, recommended), Casual, Friendly, Concise
- Each card shows a 1-2 sentence example

**b. Custom Instructions (optional)**
- Text area: "Any specific instructions for your AI?"
- Quick-add chips: "Always mention our free trial", "Keep under 150 words", "Include a next step", "Use bullet points"
- Clicking a chip appends text to the area

**c. Email Signature (optional)**
- Text area with placeholder example signature
- Note: "This will be appended to every AI-generated email"

**Technical:**
- Saves via existing `PUT /api/user/preferences` endpoint
- Writes to `users.aiTone`, `users.aiCustomInstructions`, `users.aiSignature`

### Step 5: Connect CRM (NEW, optional)

**Purpose:** Encourage CRM connection while it's top of mind.

**Layout:**
- Headline: "Sync meetings to your CRM"
- Subtext: "Automatically log meetings, contacts, and sent emails."
- Two cards:
  - HubSpot (OAuth connect via existing `/api/auth/hubspot`)
  - Airtable (API key entry via existing flow)
- Clear "Skip for now" option, no pressure
- Add `crmConnected: boolean` to `user_onboarding` table

### Step 6: Delivery Mode + Finish (modified existing)

**Purpose:** Choose review vs auto-send workflow, see setup summary.

**Layout:**
- Keep existing `StepEmailPreferences` component (review vs auto-send cards)
- After selection, show summary card of everything configured before redirecting to dashboard:
  - Meeting platform: connected/skipped
  - Email: connected email or "using default"
  - AI voice: selected tone
  - CRM: connected/skipped
  - Delivery: review or auto-send

## DB Changes

Add to `user_onboarding` table:
- `emailConnected: boolean` (default false)
- `crmConnected: boolean` (default false)

Remove from `user_onboarding`:
- `calendarConnected` (move calendar to Settings-only)

Update `currentStep` to support 6 steps (was 5).

## Calendar Migration

Calendar connection (Google Calendar, Outlook Calendar) moves from onboarding to the Settings > Integrations page. The existing `StepCalendar.tsx` component is removed from onboarding but the OAuth flows and integration settings remain unchanged.

## Files to Create/Modify

### New Components
- `components/onboarding/StepEmailConnect.tsx` (step 3)
- `components/onboarding/StepAIVoice.tsx` (step 4)
- `components/onboarding/StepCRM.tsx` (step 5)

### Modified Components
- `app/onboarding/page.tsx` (step orchestration, 5->6 steps)
- `components/onboarding/StepEmailPreferences.tsx` (add summary card)

### Removed from Onboarding
- `components/onboarding/StepCalendar.tsx` (or repurpose)
- `components/onboarding/StepTestDraft.tsx` (dropped from flow)

### DB
- Migration: add `emailConnected`, `crmConnected` to `user_onboarding`
- Migration: update step count handling

### API
- `app/api/onboarding/progress/route.ts` (handle new step data)
- `app/api/onboarding/complete/route.ts` (validate 6 steps)
