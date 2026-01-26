# ReplySequence Debugging Log

## Issue: Webhook Processing Hung at Step 10 (January 25, 2026)

### Symptom
- Webhook received `recording.transcript_completed` event
- Processing started successfully through Step 9
- Hung indefinitely at Step 10: "Checking for existing transcript in DB"
- Function timed out after 5 minutes with no error logs

### Root Cause
Query was fetching ALL columns from transcripts table including:
- `speakerSegments` (JSONB - potentially megabytes)
- `vttContent` (TEXT - full VTT file)
- `content` (TEXT - full transcript text)

Just to check if a record EXISTS.

```typescript
// The problematic query
const [existingTranscript] = await db
  .select()  // ← Fetches ALL columns
  .from(transcripts)
  .where(eq(transcripts.meetingId, meetingId))
  .limit(1);
```

### Solution
1. Changed query to only fetch ID: `.select({ id: transcripts.id })`
2. Added 5s timeout wrapper with fallback
3. Added granular logging (10A, 10B, 10C)
4. Applied same optimization to insert/update queries

```typescript
// The fixed query
const transcriptQuery = db
  .select({ id: transcripts.id })  // ← Only fetches UUID
  .from(transcripts)
  .where(eq(transcripts.meetingId, meetingId))
  .limit(1);

const queryResult = await withDbTimeout(transcriptQuery, 5000, 'check existing transcript');
```

### Performance Impact
- Before: Potentially fetching 1-5MB of data for existence check
- After: Fetching 36 bytes (UUID only)
- Expected speedup: 100-1000x faster

### Key Learning
**ALWAYS use selective `.select()` when checking existence.**
Never fetch large JSONB/TEXT columns unless you need them.

### Code Pattern to Follow

```typescript
// BAD - Fetches everything including large JSONB/TEXT columns
const existing = await db.select().from(table).where(eq(table.id, id)).limit(1);

// GOOD - Only fetches what you need
const existing = await db.select({ id: table.id }).from(table).where(eq(table.id, id)).limit(1);

// GOOD - With timeout wrapper for serverless
const result = await withDbTimeout(
  db.select({ id: table.id }).from(table).where(eq(table.id, id)).limit(1),
  5000,
  'check existing record'
);
```

### Timeout Wrapper Pattern

```typescript
async function withDbTimeout<T>(
  queryPromise: Promise<T>,
  timeoutMs: number,
  queryName: string
): Promise<{ result: T; timedOut: false } | { result: null; timedOut: true }> {
  let timeoutId: NodeJS.Timeout;

  const timeoutPromise = new Promise<{ result: null; timedOut: true }>((resolve) => {
    timeoutId = setTimeout(() => {
      log('error', `Database query timed out: ${queryName}`, { timeoutMs });
      resolve({ result: null, timedOut: true });
    }, timeoutMs);
  });

  const result = await Promise.race([
    queryPromise.then(r => ({ result: r, timedOut: false as const })),
    timeoutPromise,
  ]);
  clearTimeout(timeoutId!);
  return result;
}
```

### Related Files
- `lib/process-zoom-event.ts` - Contains `fetchAndStoreTranscript()` with Step 10-12
- `lib/process-zoom-event.ts` - Contains `withDbTimeout()` helper function

### Commits
- `999a660` - "fix: Step 10 database query hang - add timeout and optimize query"
- `ebf0406` - "fix: add comprehensive logging and timeout handling to webhook"
- `9d19f1a` - "debug: add step-by-step logging to handleTranscriptCompleted"

### Investigation Timeline
1. Added step-by-step logging (Steps 1-16) to identify hang location
2. Logs revealed hang at Step 10 after successful transcript download
3. Identified query was fetching all columns including large JSONB/TEXT
4. Fixed by selecting only ID column and adding timeout wrapper
5. Applied same pattern to Step 11 and Step 12 operations

---

## Issue: Webhook Handler Not Executing (January 25, 2026)

### Symptom
- Webhook received `recording.transcript_completed` event
- Log showed "Routing to handleTranscriptCompleted"
- No further logs appeared
- Function hung without any error

### Root Cause
Redis `acquireEventLock()` was hanging because:
1. Redis connection using `lazyConnect: true` waits forever on first command
2. If `REDIS_URL` not configured, defaults to `localhost:6379` which doesn't exist in Vercel

### Solution
1. Added 3s timeout wrapper around Redis operations
2. Skip idempotency check if `REDIS_URL` not configured
3. Added comprehensive entry/exit logging with env var checks

### Commit
- `ebf0406` - "fix: add comprehensive logging and timeout handling to webhook"

---
