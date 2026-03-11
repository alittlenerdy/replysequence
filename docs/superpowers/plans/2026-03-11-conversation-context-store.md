# Conversation Context Store Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the foundational data layer (deal_contexts + signals tables) that all Phase 2+ intelligence features depend on.

**Architecture:** Two new Drizzle tables — `deal_contexts` (per-deal accumulated context) and `signals` (per-meeting extracted signals). The `meetings` table gets an optional FK to `deal_contexts`. A query module (`lib/context-store.ts`) provides typed CRUD helpers. The Signal Extraction Engine (future task) will write to these tables; Decision Engines will read from them.

**Tech Stack:** Drizzle ORM, PostgreSQL, Vitest, Zod (validation)

---

## File Structure

| File | Responsibility |
|------|---------------|
| `lib/db/schema.ts` (modify) | Add `deal_contexts` table, `signals` table, `signalTypeEnum`, FK on meetings, type exports |
| `lib/context-store.ts` (create) | Query helpers: upsert deal context, insert signals, get deal context with signals, link meeting to deal |
| `lib/signals/types.ts` (create) | Zod schemas for signal validation — shared between extraction engine and store |
| `__tests__/lib/context-store.test.ts` (create) | Unit tests for context store query helpers |
| `__tests__/lib/signals-types.test.ts` (create) | Unit tests for Zod signal validation schemas |

---

## Chunk 1: Schema & Types

### Task 1: Define Signal Type Zod Schemas

**Files:**
- Create: `lib/signals/types.ts`
- Test: `__tests__/lib/signals-types.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// __tests__/lib/signals-types.test.ts
import { describe, it, expect } from 'vitest';
import {
  signalSchema,
  SignalType,
  SIGNAL_TYPES,
} from '@/lib/signals/types';

describe('signalSchema', () => {
  it('validates a valid commitment signal', () => {
    const result = signalSchema.safeParse({
      type: 'commitment',
      value: 'Will send contract by Friday',
      confidence: 0.85,
      speaker: 'Jane Doe',
      quote: 'I will have the contract over to you by end of day Friday',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid signal type', () => {
    const result = signalSchema.safeParse({
      type: 'invalid_type',
      value: 'test',
      confidence: 0.5,
    });
    expect(result.success).toBe(false);
  });

  it('rejects confidence outside 0-1 range', () => {
    const result = signalSchema.safeParse({
      type: 'risk',
      value: 'Budget concerns',
      confidence: 1.5,
    });
    expect(result.success).toBe(false);
  });

  it('allows optional speaker and quote fields', () => {
    const result = signalSchema.safeParse({
      type: 'objection',
      value: 'Price is too high',
      confidence: 0.7,
    });
    expect(result.success).toBe(true);
  });

  it('exports all 6 signal types', () => {
    expect(SIGNAL_TYPES).toEqual([
      'commitment', 'risk', 'stakeholder', 'objection', 'timeline', 'budget',
    ]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run __tests__/lib/signals-types.test.ts`
Expected: FAIL — module `@/lib/signals/types` not found

- [ ] **Step 3: Write minimal implementation**

```typescript
// lib/signals/types.ts
import { z } from 'zod';

/**
 * The 6 signal types extracted from meeting transcripts.
 * Used by Signal Extraction Engine → Conversation Context Store pipeline.
 */
export const SIGNAL_TYPES = [
  'commitment',
  'risk',
  'stakeholder',
  'objection',
  'timeline',
  'budget',
] as const;

export type SignalType = (typeof SIGNAL_TYPES)[number];

/**
 * Zod schema for a single extracted signal.
 * Validates data coming from Claude API before database insertion.
 */
export const signalSchema = z.object({
  type: z.enum(SIGNAL_TYPES),
  value: z.string().min(1).max(2000),
  confidence: z.number().min(0).max(1),
  speaker: z.string().max(255).optional(),
  quote: z.string().max(5000).optional(),
});

export type Signal = z.infer<typeof signalSchema>;

/**
 * Schema for validating a batch of signals from one extraction run.
 */
export const signalBatchSchema = z.object({
  signals: z.array(signalSchema).max(100),
});

export type SignalBatch = z.infer<typeof signalBatchSchema>;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run __tests__/lib/signals-types.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```
git add lib/signals/types.ts __tests__/lib/signals-types.test.ts
git commit -m "feat: add Zod signal type schemas for Context Store validation"
```

---

### Task 2: Add Database Tables to Schema

**Files:**
- Modify: `lib/db/schema.ts` (append near end, before type exports)

- [ ] **Step 1: Add signal_type enum and deal_contexts table to schema**

Append to `lib/db/schema.ts` before the final type export block:

```typescript
// ============================================================
// Conversation Context Store
// ============================================================

// Signal type enum for meeting transcript analysis
export const signalTypeEnum = pgEnum('signal_type', [
  'commitment', 'risk', 'stakeholder', 'objection', 'timeline', 'budget',
]);

// Deal stage tracking
export type DealStage =
  | 'prospecting'
  | 'qualification'
  | 'discovery'
  | 'proposal'
  | 'negotiation'
  | 'closed_won'
  | 'closed_lost';

// Deal contexts table — accumulated context per deal/company
export const dealContexts = pgTable(
  'deal_contexts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    // Company/deal identification
    companyName: varchar('company_name', { length: 500 }).notNull(),
    companyDomain: varchar('company_domain', { length: 255 }),
    dealStage: varchar('deal_stage', { length: 50 }).$type<DealStage>().default('prospecting'),
    // Accumulated context (updated after each meeting)
    stakeholders: jsonb('stakeholders').$type<string[]>().default([]),
    objections: jsonb('objections').$type<string[]>().default([]),
    commitments: jsonb('commitments').$type<string[]>().default([]),
    risks: jsonb('risks').$type<string[]>().default([]),
    nextSteps: jsonb('next_steps').$type<string[]>().default([]),
    // Reference to most recent meeting
    lastMeetingId: uuid('last_meeting_id').references(() => meetings.id, { onDelete: 'set null' }),
    lastMeetingAt: timestamp('last_meeting_at', { withTimezone: true }),
    // Stats
    meetingCount: integer('meeting_count').notNull().default(0),
    signalCount: integer('signal_count').notNull().default(0),
    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('deal_contexts_user_id_idx').on(table.userId),
    index('deal_contexts_company_name_idx').on(table.companyName),
    index('deal_contexts_company_domain_idx').on(table.companyDomain),
    index('deal_contexts_deal_stage_idx').on(table.dealStage),
    index('deal_contexts_last_meeting_at_idx').on(table.lastMeetingAt),
    uniqueIndex('deal_contexts_user_company_idx').on(table.userId, table.companyDomain),
  ]
);

// Signals table — individual signals extracted from meeting transcripts
export const signals = pgTable(
  'signals',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    meetingId: uuid('meeting_id')
      .notNull()
      .references(() => meetings.id, { onDelete: 'cascade' }),
    dealContextId: uuid('deal_context_id')
      .references(() => dealContexts.id, { onDelete: 'set null' }),
    // Signal data
    type: signalTypeEnum('type').notNull(),
    value: text('value').notNull(),
    confidence: decimal('confidence', { precision: 3, scale: 2 }).notNull(), // 0.00 to 1.00
    speaker: varchar('speaker', { length: 255 }),
    quote: text('quote'),
    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('signals_meeting_id_idx').on(table.meetingId),
    index('signals_deal_context_id_idx').on(table.dealContextId),
    index('signals_type_idx').on(table.type),
    index('signals_confidence_idx').on(table.confidence),
    index('signals_created_at_idx').on(table.createdAt),
  ]
);

// Type exports for Context Store
export type DealContext = typeof dealContexts.$inferSelect;
export type NewDealContext = typeof dealContexts.$inferInsert;
export type SignalRecord = typeof signals.$inferSelect;
export type NewSignalRecord = typeof signals.$inferInsert;
```

- [ ] **Step 2: Add optional dealContextId FK to meetings table**

In the `meetings` table definition in `lib/db/schema.ts`, add after the `isDemo` field:

```typescript
    // Context Store: optional link to accumulated deal context
    dealContextId: uuid('deal_context_id'),
```

Note: We use a plain uuid column without a `.references()` call here to avoid circular dependency issues (deal_contexts references meetings.id for lastMeetingId, and meetings references deal_contexts.id). The FK constraint will be created in the migration SQL.

Add an index for it in the meetings table's index array:

```typescript
    index('meetings_deal_context_id_idx').on(table.dealContextId),
```

- [ ] **Step 3: Verify schema compiles**

Run: `npx tsc --noEmit lib/db/schema.ts` (or just run the build)
Expected: No type errors

- [ ] **Step 4: Generate migration**

Run: `npm run db:generate`
Expected: A new migration file in `drizzle/` with CREATE TABLE for `deal_contexts`, `signals`, the new enum, and ALTER TABLE for meetings

- [ ] **Step 5: Review the generated migration SQL**

Read the latest file in `drizzle/` and verify:
- `CREATE TYPE signal_type` enum
- `CREATE TABLE deal_contexts` with all columns
- `CREATE TABLE signals` with all columns and FK constraints
- `ALTER TABLE meetings ADD COLUMN deal_context_id`
- All indexes created

- [ ] **Step 6: Commit**

```
git add lib/db/schema.ts drizzle/
git commit -m "feat: add deal_contexts and signals tables for Conversation Context Store"
```

---

## Chunk 2: Query Helpers & Tests

### Task 3: Build Context Store Query Module

**Files:**
- Create: `lib/context-store.ts`
- Test: `__tests__/lib/context-store.test.ts`

- [ ] **Step 1: Write failing tests for context store helpers**

```typescript
// __tests__/lib/context-store.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the database module before importing anything that uses it
vi.mock('@/lib/db', () => {
  const mockReturning = vi.fn().mockResolvedValue([{ id: 'mock-deal-id' }]);
  const mockValues = vi.fn().mockReturnValue({
    returning: mockReturning,
    onConflictDoUpdate: vi.fn().mockReturnValue({ returning: mockReturning }),
  });
  const mockSet = vi.fn().mockReturnValue({
    where: vi.fn().mockReturnValue({
      returning: vi.fn().mockResolvedValue([{ id: 'mock-deal-id', meetingCount: 1 }]),
    }),
  });
  const mockWhere = vi.fn().mockReturnValue({
    limit: vi.fn().mockResolvedValue([]),
    orderBy: vi.fn().mockReturnValue({
      limit: vi.fn().mockResolvedValue([]),
    }),
  });
  const mockFrom = vi.fn().mockReturnValue({
    where: mockWhere,
    innerJoin: vi.fn().mockReturnValue({
      where: mockWhere,
      orderBy: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue([]),
      }),
    }),
  });

  return {
    db: {
      select: vi.fn().mockReturnValue({ from: mockFrom }),
      insert: vi.fn().mockReturnValue({ values: mockValues }),
      update: vi.fn().mockReturnValue({ set: mockSet }),
    },
    dealContexts: { id: 'deal_contexts.id' },
    signals: { id: 'signals.id' },
    meetings: { id: 'meetings.id' },
  };
});

import {
  upsertDealContext,
  insertSignals,
  getDealContextWithSignals,
} from '@/lib/context-store';

describe('context-store', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('upsertDealContext', () => {
    it('accepts valid deal context params', async () => {
      // Should not throw with valid params
      await expect(upsertDealContext({
        userId: '123e4567-e89b-12d3-a456-426614174000',
        companyName: 'Acme Corp',
        companyDomain: 'acme.com',
      })).resolves.toBeDefined();
    });
  });

  describe('insertSignals', () => {
    it('accepts valid signal array', async () => {
      await expect(insertSignals({
        meetingId: '123e4567-e89b-12d3-a456-426614174000',
        signals: [
          { type: 'commitment', value: 'Send proposal by Friday', confidence: 0.9 },
          { type: 'risk', value: 'Budget freeze Q2', confidence: 0.7 },
        ],
      })).resolves.toBeDefined();
    });

    it('returns empty array for empty signals', async () => {
      const result = await insertSignals({
        meetingId: '123e4567-e89b-12d3-a456-426614174000',
        signals: [],
      });
      expect(result).toEqual([]);
    });
  });

  describe('getDealContextWithSignals', () => {
    it('returns null for non-existent deal context', async () => {
      const result = await getDealContextWithSignals('non-existent-id');
      expect(result).toBeNull();
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run __tests__/lib/context-store.test.ts`
Expected: FAIL — module `@/lib/context-store` not found

- [ ] **Step 3: Write context store implementation**

```typescript
// lib/context-store.ts
/**
 * Conversation Context Store — Query Helpers
 *
 * Provides typed CRUD operations for the deal_contexts and signals tables.
 * Used by:
 *   - Signal Extraction Engine (writes signals after transcript processing)
 *   - Decision Engines (reads accumulated context for predictions)
 *   - Dashboard (displays deal intelligence)
 */

import { db } from '@/lib/db';
import { dealContexts, signals, meetings } from '@/lib/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import type { Signal } from '@/lib/signals/types';
import type { DealStage, NewDealContext, NewSignalRecord } from '@/lib/db/schema';

// ── Upsert Deal Context ──────────────────────────────────────────────

interface UpsertDealContextParams {
  userId: string;
  companyName: string;
  companyDomain?: string;
  dealStage?: DealStage;
}

/**
 * Create or update a deal context for a user + company.
 * Uses companyDomain as the dedup key when available.
 */
export async function upsertDealContext(params: UpsertDealContextParams) {
  const { userId, companyName, companyDomain, dealStage } = params;

  // Try to find existing by user + domain (if domain provided)
  if (companyDomain) {
    const [existing] = await db
      .select()
      .from(dealContexts)
      .where(
        and(
          eq(dealContexts.userId, userId),
          eq(dealContexts.companyDomain, companyDomain),
        )
      )
      .limit(1);

    if (existing) {
      const [updated] = await db
        .update(dealContexts)
        .set({
          companyName,
          ...(dealStage && { dealStage }),
          updatedAt: new Date(),
        })
        .where(eq(dealContexts.id, existing.id))
        .returning();
      return updated;
    }
  }

  // Create new
  const [created] = await db
    .insert(dealContexts)
    .values({
      userId,
      companyName,
      companyDomain: companyDomain || null,
      dealStage: dealStage || 'prospecting',
    })
    .returning();

  return created;
}

// ── Insert Signals ───────────────────────────────────────────────────

interface InsertSignalsParams {
  meetingId: string;
  dealContextId?: string;
  signals: Signal[];
}

/**
 * Insert a batch of extracted signals for a meeting.
 * Returns the inserted signal records.
 */
export async function insertSignals(params: InsertSignalsParams) {
  const { meetingId, dealContextId, signals: signalBatch } = params;

  if (signalBatch.length === 0) return [];

  const rows: NewSignalRecord[] = signalBatch.map((s) => ({
    meetingId,
    dealContextId: dealContextId || null,
    type: s.type,
    value: s.value,
    confidence: String(s.confidence),
    speaker: s.speaker || null,
    quote: s.quote || null,
  }));

  const inserted = await db
    .insert(signals)
    .values(rows)
    .returning();

  return inserted;
}

// ── Read Deal Context ────────────────────────────────────────────────

/**
 * Get a deal context by ID, including its recent signals.
 */
export async function getDealContextWithSignals(dealContextId: string) {
  const [dealContext] = await db
    .select()
    .from(dealContexts)
    .where(eq(dealContexts.id, dealContextId))
    .limit(1);

  if (!dealContext) return null;

  const dealSignals = await db
    .select()
    .from(signals)
    .where(eq(signals.dealContextId, dealContextId))
    .orderBy(desc(signals.createdAt));

  return {
    ...dealContext,
    signals: dealSignals,
  };
}

/**
 * Get deal context for a user + company domain.
 */
export async function getDealContextByDomain(userId: string, companyDomain: string) {
  const [dealContext] = await db
    .select()
    .from(dealContexts)
    .where(
      and(
        eq(dealContexts.userId, userId),
        eq(dealContexts.companyDomain, companyDomain),
      )
    )
    .limit(1);

  return dealContext || null;
}

/**
 * Get all deal contexts for a user, ordered by most recent meeting.
 */
export async function listDealContexts(userId: string) {
  return db
    .select()
    .from(dealContexts)
    .where(eq(dealContexts.userId, userId))
    .orderBy(desc(dealContexts.lastMeetingAt));
}

// ── Link Meeting to Deal ─────────────────────────────────────────────

interface LinkMeetingParams {
  meetingId: string;
  dealContextId: string;
}

/**
 * Associate a meeting with a deal context and update the deal's
 * lastMeetingId, lastMeetingAt, and meetingCount.
 */
export async function linkMeetingToDeal(params: LinkMeetingParams) {
  const { meetingId, dealContextId } = params;

  // Update the meeting's dealContextId
  await db
    .update(meetings)
    .set({ dealContextId })
    .where(eq(meetings.id, meetingId));

  // Get meeting startTime for lastMeetingAt
  const [meeting] = await db
    .select({ startTime: meetings.startTime })
    .from(meetings)
    .where(eq(meetings.id, meetingId))
    .limit(1);

  // Update deal context counters
  const [updated] = await db
    .update(dealContexts)
    .set({
      lastMeetingId: meetingId,
      lastMeetingAt: meeting?.startTime || new Date(),
      meetingCount: await db
        .select()
        .from(meetings)
        .where(eq(meetings.dealContextId, dealContextId))
        .then((rows) => rows.length),
      updatedAt: new Date(),
    })
    .where(eq(dealContexts.id, dealContextId))
    .returning();

  return updated;
}

// ── Update Accumulated Context ───────────────────────────────────────

interface UpdateAccumulatedContextParams {
  dealContextId: string;
  stakeholders?: string[];
  objections?: string[];
  commitments?: string[];
  risks?: string[];
  nextSteps?: string[];
  signalCount?: number;
}

/**
 * Update the accumulated context fields on a deal context.
 * Called after signal extraction to merge new signals into the running totals.
 */
export async function updateAccumulatedContext(params: UpdateAccumulatedContextParams) {
  const { dealContextId, ...fields } = params;

  const setFields: Record<string, unknown> = { updatedAt: new Date() };
  if (fields.stakeholders) setFields.stakeholders = fields.stakeholders;
  if (fields.objections) setFields.objections = fields.objections;
  if (fields.commitments) setFields.commitments = fields.commitments;
  if (fields.risks) setFields.risks = fields.risks;
  if (fields.nextSteps) setFields.nextSteps = fields.nextSteps;
  if (fields.signalCount !== undefined) setFields.signalCount = fields.signalCount;

  const [updated] = await db
    .update(dealContexts)
    .set(setFields)
    .where(eq(dealContexts.id, dealContextId))
    .returning();

  return updated;
}

// ── Get Signals for Meeting ──────────────────────────────────────────

/**
 * Get all signals extracted from a specific meeting.
 */
export async function getSignalsForMeeting(meetingId: string) {
  return db
    .select()
    .from(signals)
    .where(eq(signals.meetingId, meetingId))
    .orderBy(desc(signals.confidence));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run __tests__/lib/context-store.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```
git add lib/context-store.ts __tests__/lib/context-store.test.ts
git commit -m "feat: add context store query helpers with tests"
```

---

### Task 4: Push Schema to Database & Verify Build

- [ ] **Step 1: Push schema changes to development database**

Run: `npm run db:push`
Expected: Tables `deal_contexts` and `signals` created, `meetings` table altered with `deal_context_id`

- [ ] **Step 2: Run full test suite**

Run: `npx vitest run`
Expected: All existing tests still pass, new tests pass

- [ ] **Step 3: Run production build**

Run: `npx next build` (with `run_in_background: true`)
Expected: No TypeScript errors, successful build

- [ ] **Step 4: Commit migration (if any generated)**

```
git add drizzle/
git commit -m "chore: add Context Store migration"
```

---

### Task 5: Final Integration Verification

- [ ] **Step 1: Verify db/index.ts re-exports new tables**

The existing `export * from './schema'` in `lib/db/index.ts` automatically re-exports all new tables and types. Verify by checking that `import { dealContexts, signals } from '@/lib/db'` resolves correctly in a test.

- [ ] **Step 2: Update ClickUp task status**

Mark the Conversation Context Store parent task and subtasks as "ready for review" in ClickUp.

- [ ] **Step 3: Final commit with all changes**

```
git add -A
git commit -m "feat: Conversation Context Store — schema, query helpers, signal types, and tests"
```
