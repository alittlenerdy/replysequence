# Data Flywheel Design: Style Learning + Contact Memory

**Date:** 2026-02-25
**Status:** Approved
**Origin:** [SaaStr: The Wave of AI Agent Churn to Come](https://www.saastr.com/the-wave-of-ai-agent-churn-to-come-prompts-are-portable/)

## Problem

AI agent products face churn pressure because prompts are portable -- a competitor can replicate your core AI behavior by copy-pasting a prompt. ReplySequence needs stickiness mechanisms that go beyond the prompt layer.

## Solution

Build a **data flywheel** with two components:

1. **Style Learning Engine** -- learns from user edits to improve future drafts
2. **Contact Memory** -- references past interactions with email recipients

Together, these create a moat that compounds with usage: the more meetings a user processes, the better their drafts get. This is impossible to replicate by switching tools.

## Approach

**Prompt Enrichment (no new infrastructure).** At draft generation time, query existing DB tables for user edit history and contact interaction history, then inject that context into the Claude prompt alongside existing `customInstructions` and `aiTone`.

No vector store, no embeddings, no fine-tuning. Evolve to embeddings later if prompt context limits become a bottleneck.

---

## Component 1: Style Learning Engine

### How It Works

1. User receives AI-generated draft, edits it, then sends
2. System captures the diff between original draft and sent version
3. Every N edits (e.g., 5), a Claude call summarizes the edit patterns into a structured style profile
4. Style profile stored as JSON on the `users` table
5. At draft generation time, the style profile is injected into the system prompt

### Style Profile Schema

```json
{
  "toneAdjustments": "User consistently softens language, prefers 'would love to' over 'want to'",
  "structuralPreferences": "Always adds a brief personal note before the CTA",
  "contentPatterns": "Adds specific pricing/timeline details for sales calls",
  "avoidances": "Removes exclamation marks, avoids 'circle back'",
  "sampleCount": 12,
  "lastUpdated": "2026-02-25T18:30:00Z"
}
```

### Data Changes

- Add `styleProfile` (JSONB, nullable) column to `users` table
- Add `originalDraftBody` column to `drafts` table (store the AI-generated version before user edits)
- Add `userEditedBody` column to `drafts` table (store what the user actually sent)

### Prompt Integration

Added as a `<user_style>` block in the system prompt for `lib/generate-draft.ts`:

```
<user_style>
This user has the following writing preferences based on 12 past edits:
- Tone: Softens language, prefers 'would love to' over 'want to'
- Structure: Always adds a brief personal note before the CTA
- Content: Adds specific pricing/timeline details for sales calls
- Avoids: Exclamation marks, 'circle back', 'synergy'
</user_style>
```

### Style Profile Generation

A background function (or triggered after every 5th edit) calls Claude with:
- The last N edit diffs (original vs. sent)
- The existing style profile (if any)
- Instructions to update/refine the profile

This keeps the profile fresh without running on every single draft.

---

## Component 2: Contact Memory

### How It Works

1. At draft generation time, extract recipient email(s) from meeting participants
2. Query `drafts` table for past emails sent to that contact
3. Query `meetings` table for past meetings involving that contact
4. Build a contact context block and inject into the prompt
5. Claude naturally references prior interactions in the draft

### Contact Context (Injected Into Prompt)

```xml
<contact_history recipient="sarah@acme.com">
Past emails:
- Feb 10: "Follow-up: Pricing Discussion" (replied Feb 11)
- Jan 28: "Meeting Notes: Product Demo" (opened, no reply)

Past meetings:
- Feb 10: Sales call - discussed enterprise pricing, Sarah asked about SSO
- Jan 28: Product demo - showed CRM integration, action item: send case study
</contact_history>
```

### Limits

- Last 5 emails per contact
- Last 5 meetings per contact
- Keeps prompt size manageable (~500-800 tokens per contact)

### Data Changes

No new tables needed. Queries against existing:
- `drafts.recipientEmail` for past emails
- `meetings` participant data for past meetings
- `emailEvents` for reply/open status

### Query Pattern

```sql
-- Past emails to this contact
SELECT subject, "createdAt", "sentAt"
FROM drafts
WHERE "userId" = $1
  AND "recipientEmail" = $2
  AND status = 'sent'
ORDER BY "createdAt" DESC
LIMIT 5;

-- Past meetings with this contact
SELECT topic, "startTime", summary
FROM meetings
WHERE "userId" = $1
  AND participants @> $2  -- contains recipient email
ORDER BY "startTime" DESC
LIMIT 5;
```

---

## Component 3: Visibility & Citations

### Draft Card UI

- **"AI Context" badge** on drafts that used style/contact data
- **Expandable section** below draft showing:
  - "Writing style: Adapted to your preferences (based on N past edits)"
  - "Contact history: Referenced N past emails, N past meetings with [contact]"
  - Clickable references linking to past meetings/drafts

### Draft Response Schema Addition

```typescript
// Added to draft generation response
draftContext: {
  styleProfileUsed: boolean;
  styleEditCount: number;        // "based on 12 past edits"
  contactHistoryUsed: boolean;
  contactEmailCount: number;     // past emails referenced
  contactMeetingCount: number;   // past meetings referenced
  contactEmail: string;          // the recipient
  referencedMeetings: string[];  // meeting IDs for linking
  referencedDrafts: string[];    // draft IDs for linking
}
```

### Marketing Site

- New feature section on homepage: "AI That Learns Your Voice"
- Visual flywheel: meetings -> drafts -> edits -> smarter drafts
- Emphasize: "The more you use it, the better it gets"

---

## Implementation Sequence

1. **Schema changes** -- add columns to users/drafts tables, run migration
2. **Edit tracking** -- capture original vs. edited draft bodies
3. **Style profile generation** -- background function to analyze edits and build profile
4. **Contact history queries** -- build efficient queries for past interactions
5. **Prompt integration** -- inject style + contact context into generate-draft.ts
6. **Citations UI** -- add AI Context badge and expandable references to draft cards
7. **Marketing page** -- add flywheel feature section to homepage

## Estimated Effort

| Component | Effort |
|-----------|--------|
| Schema migration | 1h |
| Edit tracking | 2h |
| Style profile generation | 3h |
| Contact history queries | 2h |
| Prompt integration | 3h |
| Citations UI | 3h |
| Marketing page section | 2h |
| **Total** | **16h** |
