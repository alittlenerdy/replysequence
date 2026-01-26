# ReplySequence Current State

**Last Updated:** January 25, 2026
**Status:** Production-ready, webhook processing verified working

---

## Deployment Status

- **URL:** https://replysequence.vercel.app
- **Status:** READY (deployed successfully)
- **Region:** iad1 (US East)
- **Vercel Plan:** Pro (60s function timeout enabled)

---

## Tech Stack

### Framework & Runtime
- **Next.js:** 16.x (App Router)
- **Node.js:** 24.x
- **Deployment:** Vercel (Fluid Compute enabled)

### Infrastructure
- **Database:** PostgreSQL via Supabase (Drizzle ORM)
- **Cache/Queue:** Redis via Upstash
- **AI:** Claude API (Sonnet 4) for draft generation

---

## What's Working (January 25, 2026)

### Zoom Integration
- Webhook endpoint receiving all event types
- Signature verification working
- Idempotency via Redis locks
- `meeting.ended` events processed
- `recording.completed` events processed
- `recording.transcript_completed` events processed

### Transcript Pipeline
- Download using `download_token` from webhook payload
- VTT parsing with speaker segments
- Storage in database with full text search support

### Draft Generation
- Claude API integration with 25s timeout
- Automatic draft generation after transcript storage
- Cost tracking (input/output tokens, USD)

---

## Resolved Issues

### Step 10 Database Query Hang (RESOLVED)
- **Issue:** Query hung at "Checking for existing transcript in DB"
- **Root Cause:** Fetching ALL columns including large JSONB/TEXT fields
- **Solution:** Select only ID column, add 5s timeout wrapper
- **Details:** See `/DEBUGGING_LOG.md`

### Redis Connection Hang (RESOLVED)
- **Issue:** Handler hung after "Routing to handleTranscriptCompleted"
- **Root Cause:** Redis lazyConnect waiting forever if REDIS_URL not set
- **Solution:** 3s timeout wrapper, skip idempotency if Redis unavailable

---

## Database Query Best Practices

**CRITICAL:** Always use selective `.select()` to avoid fetching large columns.

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

See `/DEBUGGING_LOG.md` for the full `withDbTimeout()` implementation.

---

## Environment Variables Required

```bash
# Database
DATABASE_URL=postgresql://...

# Redis (Upstash)
REDIS_URL=rediss://...

# Zoom
ZOOM_WEBHOOK_SECRET_TOKEN=...

# AI
ANTHROPIC_API_KEY=...
```

---

## Key Files

| File | Purpose |
|------|---------|
| `app/api/webhooks/zoom/route.ts` | Webhook handler with comprehensive logging |
| `lib/process-zoom-event.ts` | Event processing with step logging |
| `lib/claude-api.ts` | Claude API with timeout handling |
| `lib/idempotency/index.ts` | Redis lock with timeout |
| `lib/db/index.ts` | Database connection pool |

---

## Logging Pattern

All handlers use step-by-step logging for debugging:

```
>>> HANDLER ENTRY: handleTranscriptCompleted
A1: Checking payload structure
A2: About to call acquireEventLock
A4: About to call storeRawEvent
A5: About to call processZoomEvent
>>> processZoomEvent ENTRY
B1: About to update rawEvents status
Step 1: Parsing transcript_completed payload
Step 10A: About to query for existing transcript
Step 10B: Executing transcript query with timeout
Step 10C: Query completed successfully
Step 11A: Inserting new transcript
Step 11B: Transcript inserted successfully
Step 12A: Updating meeting status to ready
Step 12B: Meeting status updated to ready
Step 13: Preparing draft generation
Step 15: Calling generateDraft
<<< HANDLER EXIT: Returning 200 OK
```

---

## Next Steps

1. Monitor production logs for any remaining issues
2. Verify draft quality with real meeting transcripts
3. Build approval/send UI for generated drafts
4. Add email sending via Resend
5. Integrate HubSpot for CRM contact matching

---

## Related Documentation

- `/DEBUGGING_LOG.md` - Detailed debugging notes and solutions
- `/build-log.md` - Chronological development log
- `/CLAUDE.md` - Instructions for Claude Code

---
