# Data Flywheel Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build an AI learning flywheel that improves draft quality over time by learning from user edits (style learning) and referencing past interactions with contacts (contact memory).

**Architecture:** Prompt enrichment approach -- at draft generation time, query existing DB tables for the user's style profile and contact interaction history, then inject that context into the Claude prompt alongside existing `aiTone`/`aiCustomInstructions`. No vector store or new infrastructure needed.

**Tech Stack:** Drizzle ORM (PostgreSQL), Claude API (Sonnet for drafts, Haiku for style extraction), Next.js API routes, React components (Tailwind + Framer Motion)

---

## Task 1: Schema Migration -- Add Flywheel Columns

**Files:**
- Modify: `lib/db/schema.ts:225-301` (drafts table) and `lib/db/schema.ts:338-387` (users table)

**Step 1: Add styleProfile column to users table**

In `lib/db/schema.ts`, add after `onboardingEmailsUnsubscribed` (line 375):

```typescript
    // Data flywheel: learned writing style profile
    styleProfile: jsonb('style_profile').$type<{
      toneAdjustments: string;
      structuralPreferences: string;
      contentPatterns: string;
      avoidances: string;
      sampleCount: number;
      lastUpdated: string;
    }>(),
```

**Step 2: Add flywheel columns to drafts table**

In `lib/db/schema.ts`, add after `lastRefinementInstruction` (line 286):

```typescript
    // Data flywheel: edit tracking
    originalBody: text('original_body'), // AI-generated body before user edits
    userEditedBody: text('user_edited_body'), // What user actually sent (after edits)
    editDiffScore: integer('edit_diff_score'), // 0-100, how similar original vs edited
    // Data flywheel: context tracking
    flywheelContextUsed: boolean('flywheel_context_used').default(false),
    flywheelMetadata: jsonb('flywheel_metadata').$type<{
      styleProfileUsed: boolean;
      styleEditCount: number;
      contactHistoryUsed: boolean;
      contactEmailCount: number;
      contactMeetingCount: number;
      contactEmail: string | null;
      referencedMeetingIds: string[];
      referencedDraftIds: string[];
    }>(),
```

**Step 3: Add index for contact memory queries**

In the drafts table index array (line 291-300), add:

```typescript
    index('drafts_sent_to_idx').on(table.sentTo),
```

**Step 4: Push schema changes**

Run: `npm run db:push`
Expected: Schema changes applied to PostgreSQL

**Step 5: Commit**

```
git add lib/db/schema.ts
git commit -m "feat(flywheel): add style profile and edit tracking columns to schema"
```

---

## Task 2: Capture Original Body on Draft Generation

**Files:**
- Modify: `lib/generate-draft.ts:365-386`

**Step 1: Store originalBody when inserting draft**

In `lib/generate-draft.ts`, modify the draft insert at line 365-386. Add `originalBody: finalBody` to the values object:

```typescript
      // Store draft in database
      const [draft] = await db
        .insert(drafts)
        .values({
          meetingId,
          transcriptId,
          subject: parsed.subject,
          body: finalBody,
          originalBody: finalBody, // NEW: capture AI-generated body for flywheel
          model: CLAUDE_MODEL,
          // ... rest unchanged
        })
        .returning();
```

**Step 2: Verify the column is populated**

Run: `npm run dev` and trigger a draft generation (or check via Drizzle Studio)
Expected: New drafts have `original_body` populated with the same value as `body`

**Step 3: Commit**

```
git add lib/generate-draft.ts
git commit -m "feat(flywheel): capture original AI-generated body on draft creation"
```

---

## Task 3: Track User Edits on Draft Send

**Files:**
- Modify: `app/api/drafts/send/route.ts:18-80`
- Modify: `lib/dashboard-queries.ts:411-416`

**Step 1: Update send route to capture edited body**

In `app/api/drafts/send/route.ts`, after fetching the draft (around line 73-80), the current `body` on the draft IS the user-edited version (they edit via the update endpoint). We need to save it as `userEditedBody` and calculate the diff score.

Add after the draft ownership verification (around line 80), before email sending:

```typescript
    // Flywheel: capture the user-edited body and calculate similarity
    const originalBody = draft.originalBody;
    const currentBody = draft.body; // This is the potentially-edited version

    if (originalBody && currentBody !== originalBody) {
      const { calculateEditDiffScore } = await import('@/lib/flywheel/similarity');
      const editDiffScore = calculateEditDiffScore(originalBody, currentBody);

      await db
        .update(drafts)
        .set({
          userEditedBody: currentBody,
          editDiffScore,
        })
        .where(eq(drafts.id, draftId));
    }
```

Note: Import `drafts` from schema and `eq` from drizzle-orm at the top of the file (already imported on line 14).

**Step 2: Commit**

```
git add app/api/drafts/send/route.ts
git commit -m "feat(flywheel): capture user edits and diff score on send"
```

---

## Task 4: Build Similarity Scorer

**Files:**
- Create: `lib/flywheel/similarity.ts`

**Step 1: Create the flywheel directory**

```bash
mkdir -p lib/flywheel
```

**Step 2: Write the similarity scorer**

Create `lib/flywheel/similarity.ts`:

```typescript
/**
 * Calculate how different a user's edited draft is from the AI original.
 * Returns 0-100 where 100 = identical, 0 = completely different.
 *
 * Uses word-level Jaccard similarity for speed and simplicity.
 * No external dependencies needed.
 */

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(Boolean);
}

export function calculateEditDiffScore(original: string, edited: string): number {
  const originalTokens = new Set(tokenize(original));
  const editedTokens = new Set(tokenize(edited));

  if (originalTokens.size === 0 && editedTokens.size === 0) return 100;
  if (originalTokens.size === 0 || editedTokens.size === 0) return 0;

  let intersection = 0;
  for (const token of originalTokens) {
    if (editedTokens.has(token)) intersection++;
  }

  const union = new Set([...originalTokens, ...editedTokens]).size;
  return Math.round((intersection / union) * 100);
}

/**
 * Extract what the user changed between original and edited drafts.
 * Returns a human-readable summary of the changes.
 */
export function describeEdits(original: string, edited: string): string {
  const origLines = original.split('\n').filter(Boolean);
  const editLines = edited.split('\n').filter(Boolean);

  const added = editLines.filter(l => !origLines.includes(l));
  const removed = origLines.filter(l => !editLines.includes(l));

  const parts: string[] = [];
  if (added.length > 0) parts.push(`Added ${added.length} lines`);
  if (removed.length > 0) parts.push(`Removed ${removed.length} lines`);
  if (edited.length > original.length * 1.2) parts.push('Made email longer');
  if (edited.length < original.length * 0.8) parts.push('Made email shorter');

  return parts.length > 0 ? parts.join('. ') : 'Minor edits';
}
```

**Step 3: Commit**

```
git add lib/flywheel/similarity.ts
git commit -m "feat(flywheel): add word-level similarity scorer for edit tracking"
```

---

## Task 5: Build Style Profile Generator

**Files:**
- Create: `lib/flywheel/style-profile.ts`
- Reference: `lib/claude-api.ts` for Haiku model usage

**Step 1: Create style profile generator**

Create `lib/flywheel/style-profile.ts`:

```typescript
/**
 * Generates/updates a user's writing style profile by analyzing
 * their edit patterns across recent drafts.
 *
 * Called after every 5th edited draft (not on every send).
 * Uses Claude Haiku for cost efficiency (~$0.001 per call).
 */

import { getClaudeClient } from '@/lib/claude-api';
import { db, users, drafts } from '@/lib/db';
import { eq, isNotNull, desc, and } from 'drizzle-orm';

const HAIKU_MODEL = 'claude-haiku-4-5-20251001';
const EDITS_BEFORE_REFRESH = 5;

interface StyleProfile {
  toneAdjustments: string;
  structuralPreferences: string;
  contentPatterns: string;
  avoidances: string;
  sampleCount: number;
  lastUpdated: string;
}

/**
 * Check if the user's style profile needs refreshing.
 * Returns true if they have N+ edits since last profile update.
 */
export async function shouldRefreshStyleProfile(userId: string): Promise<boolean> {
  const [user] = await db
    .select({ styleProfile: users.styleProfile })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const currentProfile = user?.styleProfile as StyleProfile | null;
  const lastCount = currentProfile?.sampleCount ?? 0;

  // Count edits since last profile generation
  const [result] = await db
    .select({ count: db.$count(drafts) })
    .from(drafts)
    .innerJoin(
      db.select({ id: db.$raw('meetings.id'), userId: db.$raw('meetings.user_id') }).from(db.$raw('meetings')),
      eq(drafts.meetingId, db.$raw('meetings.id'))
    )
    .where(
      and(
        eq(db.$raw('meetings.user_id'), userId),
        isNotNull(drafts.userEditedBody)
      )
    );

  const totalEdits = Number(result?.count ?? 0);
  return totalEdits >= lastCount + EDITS_BEFORE_REFRESH;
}

/**
 * Generate or update a user's writing style profile.
 */
export async function generateStyleProfile(userId: string): Promise<StyleProfile> {
  // Get recent edited drafts
  const recentEdits = await db
    .select({
      originalBody: drafts.originalBody,
      userEditedBody: drafts.userEditedBody,
      editDiffScore: drafts.editDiffScore,
    })
    .from(drafts)
    .innerJoin(
      db.select().from(db.$raw('meetings')),
      eq(drafts.meetingId, db.$raw('meetings.id'))
    )
    .where(
      and(
        eq(db.$raw('meetings.user_id'), userId),
        isNotNull(drafts.userEditedBody),
        isNotNull(drafts.originalBody)
      )
    )
    .orderBy(desc(drafts.createdAt))
    .limit(15); // Analyze last 15 edits

  if (recentEdits.length === 0) {
    throw new Error('No edited drafts found for style profile generation');
  }

  // Get existing profile for context
  const [user] = await db
    .select({ styleProfile: users.styleProfile })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const existingProfile = user?.styleProfile as StyleProfile | null;

  // Build edit examples for Claude
  const editExamples = recentEdits
    .filter(e => e.originalBody && e.userEditedBody && e.editDiffScore !== null && e.editDiffScore < 95) // Only include meaningfully edited drafts
    .slice(0, 10)
    .map((edit, i) => `
--- Edit ${i + 1} (${edit.editDiffScore}% similar) ---
ORIGINAL: ${edit.originalBody!.slice(0, 500)}
EDITED: ${edit.userEditedBody!.slice(0, 500)}
`).join('\n');

  if (!editExamples.trim()) {
    // No meaningful edits to learn from
    return existingProfile ?? {
      toneAdjustments: 'No significant edits detected yet',
      structuralPreferences: 'No significant edits detected yet',
      contentPatterns: 'No significant edits detected yet',
      avoidances: 'No significant edits detected yet',
      sampleCount: recentEdits.length,
      lastUpdated: new Date().toISOString(),
    };
  }

  const client = getClaudeClient();

  const response = await client.messages.create({
    model: HAIKU_MODEL,
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `Analyze these email drafts where a user edited the AI-generated version. Identify consistent patterns in what they change.

${existingProfile ? `Previous style profile (update this):\n${JSON.stringify(existingProfile, null, 2)}\n` : ''}

${editExamples}

Respond in this exact JSON format:
{
  "toneAdjustments": "How they adjust tone (e.g., 'softens language, uses contractions, avoids exclamation marks')",
  "structuralPreferences": "How they restructure (e.g., 'adds personal note before CTA, shortens paragraphs')",
  "contentPatterns": "What content they add/change (e.g., 'adds pricing details for sales calls, includes timeline')",
  "avoidances": "What they consistently remove or avoid (e.g., 'removes exclamation marks, avoids jargon')"
}

Be specific and concise. Each field should be 1-2 sentences max. Only include patterns you see repeated across multiple edits.`,
    }],
  });

  const content = response.content[0];
  if (content.type !== 'text') throw new Error('Unexpected response type');

  const parsed = JSON.parse(content.text);

  const profile: StyleProfile = {
    toneAdjustments: parsed.toneAdjustments,
    structuralPreferences: parsed.structuralPreferences,
    contentPatterns: parsed.contentPatterns,
    avoidances: parsed.avoidances,
    sampleCount: recentEdits.length,
    lastUpdated: new Date().toISOString(),
  };

  // Save to user record
  await db
    .update(users)
    .set({ styleProfile: profile })
    .where(eq(users.id, userId));

  return profile;
}
```

**Important note:** The raw SQL joins above are pseudocode -- the actual implementation should use proper Drizzle ORM joins with the `meetings` table import. The implementing agent should reference the existing join patterns in `lib/dashboard-queries.ts` (e.g., lines 80-120) for the correct syntax.

**Step 2: Trigger profile refresh after send**

In `app/api/drafts/send/route.ts`, after the edit tracking code from Task 3, add (non-blocking):

```typescript
    // Flywheel: check if style profile needs refresh (non-blocking)
    if (originalBody && currentBody !== originalBody) {
      import('@/lib/flywheel/style-profile').then(async ({ shouldRefreshStyleProfile, generateStyleProfile }) => {
        try {
          const needsRefresh = await shouldRefreshStyleProfile(dbUser.id);
          if (needsRefresh) {
            await generateStyleProfile(dbUser.id);
            console.log(JSON.stringify({
              level: 'info',
              message: 'Style profile refreshed',
              userId: dbUser.id,
            }));
          }
        } catch (err) {
          console.log(JSON.stringify({
            level: 'error',
            message: 'Style profile refresh failed',
            error: err instanceof Error ? err.message : String(err),
          }));
        }
      });
    }
```

**Step 3: Commit**

```
git add lib/flywheel/style-profile.ts app/api/drafts/send/route.ts
git commit -m "feat(flywheel): add style profile generator using Claude Haiku"
```

---

## Task 6: Build Contact Memory Retriever

**Files:**
- Create: `lib/flywheel/contact-memory.ts`

**Step 1: Create contact memory retriever**

Create `lib/flywheel/contact-memory.ts`:

```typescript
/**
 * Retrieves past interaction history with a specific contact.
 * Used at draft generation time to give Claude context about
 * the relationship with the email recipient.
 */

import { db, drafts, meetings } from '@/lib/db';
import { eq, and, desc, sql, isNotNull } from 'drizzle-orm';

export interface ContactHistory {
  pastEmails: Array<{
    subject: string;
    sentAt: Date;
    replied: boolean;
    opened: boolean;
  }>;
  pastMeetings: Array<{
    topic: string | null;
    startTime: Date | null;
    summary: string | null;
    meetingType: string | null;
  }>;
}

export interface ContactContext {
  recipientEmail: string;
  emailCount: number;
  meetingCount: number;
  promptBlock: string; // Ready to inject into Claude prompt
}

/**
 * Get past interaction history with a specific contact.
 * Returns up to 5 past emails and 5 past meetings.
 */
export async function getContactHistory(
  userId: string,
  recipientEmail: string
): Promise<ContactHistory> {
  // Past emails sent to this contact
  const pastEmails = await db
    .select({
      subject: drafts.subject,
      sentAt: drafts.sentAt,
      repliedAt: drafts.repliedAt,
      openedAt: drafts.openedAt,
    })
    .from(drafts)
    .innerJoin(meetings, eq(drafts.meetingId, meetings.id))
    .where(
      and(
        eq(meetings.userId, userId),
        eq(drafts.sentTo, recipientEmail),
        isNotNull(drafts.sentAt)
      )
    )
    .orderBy(desc(drafts.sentAt))
    .limit(5);

  // Past meetings involving this contact
  // participants is a JSONB array of {name, email} objects
  const pastMeetings = await db
    .select({
      topic: meetings.topic,
      startTime: meetings.startTime,
      summary: meetings.summary,
      meetingType: sql<string>`(
        SELECT d."meeting_type" FROM drafts d
        WHERE d."meeting_id" = ${meetings.id}
        LIMIT 1
      )`,
    })
    .from(meetings)
    .where(
      and(
        eq(meetings.userId, userId),
        sql`${meetings.participants}::jsonb @> ${JSON.stringify([{ email: recipientEmail }])}::jsonb`
      )
    )
    .orderBy(desc(meetings.startTime))
    .limit(5);

  return {
    pastEmails: pastEmails.map(e => ({
      subject: e.subject,
      sentAt: e.sentAt!,
      replied: !!e.repliedAt,
      opened: !!e.openedAt,
    })),
    pastMeetings: pastMeetings.map(m => ({
      topic: m.topic,
      startTime: m.startTime,
      summary: m.summary,
      meetingType: m.meetingType,
    })),
  };
}

/**
 * Build a prompt-ready context block from contact history.
 * Returns null if no prior interactions exist.
 */
export async function buildContactContext(
  userId: string,
  recipientEmail: string
): Promise<ContactContext | null> {
  const history = await getContactHistory(userId, recipientEmail);

  if (history.pastEmails.length === 0 && history.pastMeetings.length === 0) {
    return null;
  }

  let promptBlock = `\n## CONTACT HISTORY (${recipientEmail})\n`;
  promptBlock += `You have prior interactions with this recipient. Reference them naturally.\n\n`;

  if (history.pastEmails.length > 0) {
    promptBlock += `Past emails sent:\n`;
    for (const email of history.pastEmails) {
      const date = email.sentAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const status = email.replied ? '(replied)' : email.opened ? '(opened, no reply)' : '(no response)';
      promptBlock += `- ${date}: "${email.subject}" ${status}\n`;
    }
    promptBlock += '\n';
  }

  if (history.pastMeetings.length > 0) {
    promptBlock += `Past meetings together:\n`;
    for (const meeting of history.pastMeetings) {
      const date = meeting.startTime?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) ?? 'Unknown date';
      const summary = meeting.summary ? ` - ${meeting.summary.slice(0, 150)}` : '';
      promptBlock += `- ${date}: ${meeting.topic ?? 'Meeting'}${summary}\n`;
    }
  }

  return {
    recipientEmail,
    emailCount: history.pastEmails.length,
    meetingCount: history.pastMeetings.length,
    promptBlock,
  };
}
```

**Step 2: Commit**

```
git add lib/flywheel/contact-memory.ts
git commit -m "feat(flywheel): add contact memory retriever for past interaction context"
```

---

## Task 7: Inject Flywheel Context into Draft Generation

**Files:**
- Modify: `lib/prompts/optimized-followup.ts:15-39` (FollowUpContext interface)
- Modify: `lib/prompts/optimized-followup.ts:176-236` (buildOptimizedPrompt function)
- Modify: `lib/generate-draft.ts:196-262` (context building)

**Step 1: Extend FollowUpContext interface**

In `lib/prompts/optimized-followup.ts`, add to the `FollowUpContext` interface (after line 38):

```typescript
  // Data flywheel context
  styleProfile?: {
    toneAdjustments: string;
    structuralPreferences: string;
    contentPatterns: string;
    avoidances: string;
    sampleCount: number;
  } | null;
  contactContext?: {
    recipientEmail: string;
    emailCount: number;
    meetingCount: number;
    promptBlock: string;
  } | null;
```

**Step 2: Inject flywheel context into prompt builder**

In `lib/prompts/optimized-followup.ts`, modify `buildOptimizedPrompt` (line 176). After the `additionalContext` block (line 222-224), add:

```typescript
  // Inject flywheel context: user's writing style
  if (context.styleProfile && context.styleProfile.sampleCount > 0) {
    prompt += `\n\n## USER WRITING STYLE (learned from ${context.styleProfile.sampleCount} past edits):
Adapt your writing to match these preferences:
- Tone: ${context.styleProfile.toneAdjustments}
- Structure: ${context.styleProfile.structuralPreferences}
- Content: ${context.styleProfile.contentPatterns}
- Avoid: ${context.styleProfile.avoidances}`;
  }

  // Inject flywheel context: contact history
  if (context.contactContext) {
    prompt += context.contactContext.promptBlock;
  }
```

**Step 3: Fetch and pass flywheel context in generate-draft.ts**

In `lib/generate-draft.ts`, after fetching user AI preferences (line 196-219), add:

```typescript
  // Fetch flywheel context (style profile + contact memory)
  let styleProfile = null;
  let contactContext = null;
  if (userId) {
    try {
      // Style profile is already on the user record
      const [userWithProfile] = await db
        .select({ styleProfile: users.styleProfile })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      styleProfile = userWithProfile?.styleProfile ?? null;

      // Contact memory: look up recipient from participants
      if (participants.length > 0) {
        const { buildContactContext } = await import('./flywheel/contact-memory');
        const recipientEmail = context.hostEmail; // Will need refinement - see note below
        if (recipientEmail) {
          contactContext = await buildContactContext(userId, recipientEmail);
        }
      }
    } catch {
      // Non-blocking — flywheel context is optional
    }
  }
```

Then add to the `optimizedContext` object (line 247-262):

```typescript
  const optimizedContext: FollowUpContext = {
    // ... existing fields (unchanged)
    styleProfile,
    contactContext,
  };
```

**Step 4: Store flywheel metadata on the draft**

In the draft insert (line 365-386), add:

```typescript
          flywheelContextUsed: !!(styleProfile || contactContext),
          flywheelMetadata: (styleProfile || contactContext) ? {
            styleProfileUsed: !!styleProfile,
            styleEditCount: styleProfile?.sampleCount ?? 0,
            contactHistoryUsed: !!contactContext,
            contactEmailCount: contactContext?.emailCount ?? 0,
            contactMeetingCount: contactContext?.meetingCount ?? 0,
            contactEmail: contactContext?.recipientEmail ?? null,
            referencedMeetingIds: [],
            referencedDraftIds: [],
          } : null,
```

**Step 5: Commit**

```
git add lib/prompts/optimized-followup.ts lib/generate-draft.ts
git commit -m "feat(flywheel): inject style profile and contact memory into draft generation prompt"
```

---

## Task 8: Add Citations UI to Draft Display

**Files:**
- Explore: `components/` for draft display components
- The implementing agent should find the draft card/editor component and add the AI Context badge

**Step 1: Find the draft display component**

Search for components that render draft `body` and `subject`. The main component is likely in `components/dashboard/` or `components/DraftEditor.tsx`.

**Step 2: Add AI Context badge**

Below the draft body, add a collapsible section:

```tsx
{draft.flywheelContextUsed && draft.flywheelMetadata && (
  <div className="mt-4 p-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800">
    <button
      onClick={() => setShowFlywheelDetails(!showFlywheelDetails)}
      className="flex items-center gap-2 text-sm w-full"
    >
      <svg className="w-4 h-4 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
        <path d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" />
      </svg>
      <span className="font-medium text-indigo-700 dark:text-indigo-300">
        AI Context
      </span>
      <span className="text-indigo-500 dark:text-indigo-400 text-xs ml-auto">
        {showFlywheelDetails ? 'Hide' : 'Show'} details
      </span>
    </button>
    {showFlywheelDetails && (
      <div className="mt-2 space-y-1 text-xs text-indigo-600 dark:text-indigo-400">
        {draft.flywheelMetadata.styleProfileUsed && (
          <p>Writing style: Adapted to your preferences (based on {draft.flywheelMetadata.styleEditCount} past edits)</p>
        )}
        {draft.flywheelMetadata.contactHistoryUsed && (
          <p>Contact history: Referenced {draft.flywheelMetadata.contactEmailCount} past emails, {draft.flywheelMetadata.contactMeetingCount} past meetings with {draft.flywheelMetadata.contactEmail}</p>
        )}
      </div>
    )}
  </div>
)}
```

**Step 3: Add state for toggle**

```tsx
const [showFlywheelDetails, setShowFlywheelDetails] = useState(false);
```

**Step 4: Commit**

```
git add components/
git commit -m "feat(flywheel): add AI Context citation badge to draft display"
```

---

## Task 9: Add Flywheel Marketing Section to Homepage

**Files:**
- Modify: `app/page.tsx` (add section after existing features)

**Step 1: Find insertion point**

Look for the last feature section before the CTA/footer. Add a new `<section>` after it.

**Step 2: Add flywheel section**

```tsx
{/* Data Flywheel Section */}
<section className="py-20 px-4 relative z-10">
  <div className="max-w-5xl mx-auto">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="text-center mb-12"
    >
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-6">
        <span className="text-sm font-medium text-indigo-400">Adaptive AI</span>
      </div>
      <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
        AI That Learns <span className="text-indigo-400">Your Voice</span>
      </h2>
      <p className="text-gray-400 max-w-2xl mx-auto">
        Every edit teaches the AI your writing style. The more you use ReplySequence,
        the less editing you need.
      </p>
    </motion.div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[
        {
          title: 'Learns Your Style',
          description: 'The AI notices when you soften language, add details, or restructure emails — and adapts.',
        },
        {
          title: 'Remembers Contacts',
          description: 'References past meetings and emails with each contact for natural, contextual follow-ups.',
        },
        {
          title: 'Gets Better Over Time',
          description: 'Every draft you send makes the next one more accurate. Your AI improves with you.',
        },
      ].map((item, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.1 }}
          className="p-6 rounded-xl border border-gray-800 bg-gray-900/50"
        >
          <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
          <p className="text-sm text-gray-400">{item.description}</p>
        </motion.div>
      ))}
    </div>
  </div>
</section>
```

**Step 3: Commit**

```
git add app/page.tsx
git commit -m "feat(flywheel): add 'AI That Learns Your Voice' section to homepage"
```

---

## Task 10: End-to-End Integration Test

**Files:**
- The implementing agent should manually verify the full flow works

**Step 1: Verify schema migration applied**

Run: `npm run db:push`
Check: No errors, new columns visible in Drizzle Studio

**Step 2: Generate a draft and verify originalBody is captured**

Trigger a draft generation and check the database.
Expected: `original_body` column is populated.

**Step 3: Edit and send a draft, verify edit tracking**

Edit a draft body, then send it.
Expected: `user_edited_body` and `edit_diff_score` are populated.

**Step 4: After 5+ edited sends, verify style profile generates**

Check the user's `style_profile` column.
Expected: JSON profile with tone/structure/content/avoidance patterns.

**Step 5: Generate a new draft with flywheel context**

Generate another draft for a contact you've emailed before.
Expected: `flywheel_context_used` is true, `flywheel_metadata` has counts.

**Step 6: Verify citations badge shows in UI**

View the generated draft in the dashboard.
Expected: "AI Context" badge is visible with correct counts.

**Step 7: Commit final integration verification**

```
git commit --allow-empty -m "chore(flywheel): verified end-to-end flywheel integration"
```
