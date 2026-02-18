# CLAUDE.md - AI Assistant Reference

> Quick reference for Claude Code and AI assistants working on ReplySequence

**Last Updated:** February 5, 2026

---

## Project Context

**Name:** ReplySequence
**Purpose:** Zoom/Meet/Teams -> AI email drafts -> CRM automation
**Stack:** Next.js 16, PostgreSQL/Drizzle, Clerk, Claude API, Resend, Airtable
**Status:** Week 2/12 MVP Sprint (Jan 27 - Mar 21, 2026)

**Location:** `/Volumes/just_a_little_nerd/replysequence`
**Production:** https://replysequence.vercel.app

---

## Key File Locations

### API Routes
```
app/api/webhooks/zoom/route.ts       # Zoom webhook handler
app/api/webhooks/teams/route.ts      # Teams webhook handler
app/api/webhooks/meet/route.ts       # Meet webhook handler
app/api/drafts/route.ts              # Draft list endpoint
app/api/drafts/[id]/route.ts         # Draft by ID
app/api/drafts/send/route.ts         # Email sending endpoint
app/api/drafts/update/route.ts       # Draft update endpoint
```

### Core Logic
```
lib/process-zoom-event.ts            # Zoom event processing
lib/process-teams-event.ts           # Teams event processing
lib/process-meet-event.ts            # Meet event processing
lib/generate-draft.ts                # AI draft generation
lib/claude-api.ts                    # Claude SDK client + streaming API
lib/transcript/vtt-parser.ts         # VTT transcript parsing
lib/transcript/downloader.ts         # Transcript download
lib/email.ts                         # Email sending via Resend
lib/airtable.ts                      # Airtable CRM integration
lib/webhook-retry.ts                 # Webhook retry logic
lib/idempotency/index.ts             # Duplicate prevention (Redis)
```

### Database
```
lib/db/schema.ts                     # Drizzle schema (all tables)
lib/db/index.ts                      # Database client
drizzle.config.ts                    # Drizzle configuration
drizzle/                             # Migrations folder
```

### Configuration
```
.env.local                           # Environment variables (not committed)
.env.example                         # Template for environment setup
```

---

## Critical Patterns

### 1. Webhook Processing Flow

```typescript
// Standard webhook pattern (see app/api/webhooks/zoom/route.ts)
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  // 1. Get raw body for signature verification
  const rawBody = await request.text();

  // 2. Verify webhook signature
  const signature = request.headers.get('x-zm-signature') || '';
  if (!verifyZoomSignature(rawBody, signature, timestamp)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  // 3. Parse payload
  const payload = JSON.parse(rawBody);

  // 4. Idempotency check via Redis lock
  const lockKey = `${event_type}-${meeting_uuid}`;
  const acquired = await acquireEventLock(lockKey);
  if (!acquired) {
    return NextResponse.json({ received: true, duplicate: true }, { status: 200 });
  }

  // 5. Store raw event for audit trail
  const rawEvent = await storeRawEvent(eventType, eventId, rawBody);

  // 6. Process event (downloads transcript, creates meeting, generates draft)
  await processZoomEvent(rawEvent);

  // 7. Always return 200 to prevent platform retries
  return NextResponse.json({ received: true }, { status: 200 });
}
```

### 2. Claude API Usage

The project uses the Anthropic SDK with a singleton pattern:

```typescript
// lib/claude-api.ts
import Anthropic from '@anthropic-ai/sdk';

let claudeClient: Anthropic | null = null;

export function getClaudeClient(): Anthropic {
  if (!claudeClient) {
    claudeClient = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
      timeout: 20 * 1000,  // 20 seconds for Vercel
      maxRetries: 2,
    });
  }
  return claudeClient;
}

// Model: claude-sonnet-4-20250514
export const CLAUDE_MODEL = 'claude-sonnet-4-20250514';
```

Draft generation (lib/generate-draft.ts) includes:
- Meeting type detection (sales_call, internal_sync, etc.)
- Quality scoring (0-100)
- Action item extraction
- Retry with exponential backoff

### 3. Database Queries (Drizzle ORM)

```typescript
import { db, meetings, drafts, transcripts } from '@/lib/db';
import { eq, desc } from 'drizzle-orm';

// Insert
const [meeting] = await db
  .insert(meetings)
  .values({
    platform: 'zoom',
    zoomMeetingId: payload.uuid,
    hostEmail: payload.host_email,
    status: 'processing',
  })
  .returning();

// Query
const { data } = await db
  .select()
  .from(drafts)
  .where(eq(drafts.meetingId, meetingId))
  .orderBy(desc(drafts.createdAt))
  .limit(1);

// Update
await db
  .update(meetings)
  .set({ status: 'completed', processingStep: 'completed' })
  .where(eq(meetings.id, meetingId));
```

### 4. Error Handling

```typescript
// Always use try-catch with structured JSON logging
try {
  const result = await processWebhook(payload);
  console.log(JSON.stringify({
    level: 'info',
    message: 'Webhook processed successfully',
    meetingId: result.meetingId,
    duration: Date.now() - startTime,
  }));
  return NextResponse.json({ success: true }, { status: 200 });
} catch (error) {
  console.log(JSON.stringify({
    level: 'error',
    tag: '[WEBHOOK-ERROR]',
    message: 'Webhook processing failed',
    platform: 'zoom',
    error: error instanceof Error ? error.message : String(error),
    timestamp: new Date().toISOString(),
  }));

  // Record failure for retry
  await recordWebhookFailure('zoom', eventType, payload, errorMessage);

  // Still return 200 to prevent platform retries
  return NextResponse.json({ received: true }, { status: 200 });
}
```

---

## Common Gotchas

### 1. Webhook Timeouts

**Issue:** Vercel has timeout limits (60s configured, but default is 10s on hobby)
**Solution:**
- `export const maxDuration = 60;` at top of route file
- Process async where possible
- Use Redis for idempotency to handle retries gracefully

### 2. Idempotency

**Issue:** Platforms retry webhooks on failures
**Solution:** Redis-based locks in `lib/idempotency/index.ts`
```typescript
const lockKey = `${event_type}-${meeting_uuid}`;
const acquired = await acquireEventLock(lockKey);
if (!acquired) return; // Already processing
```

### 3. OAuth Token Encryption

**Issue:** OAuth tokens need secure storage
**Solution:** AES-256-GCM encryption in `lib/encryption.ts`
- Tokens stored encrypted in `*_connections` tables
- Service role for server-side operations

### 4. VTT Speaker Detection

**Issue:** Some platforms don't include speaker names in VTT
**Workaround:** Parser assigns "Speaker 1", "Speaker 2" labels

---

## Development Workflows

### Adding New Platform Integration

1. Create webhook route: `app/api/webhooks/[platform]/route.ts`
2. Create types: `lib/[platform]/types.ts`
3. Implement processor: `lib/process-[platform]-event.ts`
4. Add OAuth flow: `app/api/auth/[platform]/route.ts` and callback
5. Add connection table to schema if needed
6. Test with ngrok: `ngrok http 3000`

### Testing Changes

```bash
# Local development
npm run dev

# Build (catches TypeScript errors)
npm run build

# Database operations
npm run db:push      # Push schema changes
npm run db:studio    # Open Drizzle Studio
```

### Debugging Webhooks

```bash
# View Vercel logs
vercel logs https://replysequence.vercel.app --since 10m

# Filter by tag
vercel logs ... | grep "WEBHOOK-ERROR"

# Local webhook testing
ngrok http 3000
# Use ngrok URL in platform webhook settings
```

---

## Security Notes

### API Keys
- Never commit `.env.local`
- Use Vercel environment variables for production
- Rotate keys if accidentally exposed

### Webhook Verification
- Always verify signatures before processing
- Use platform-specific verification (Zoom: HMAC, Teams: Graph validation)
- Return 401 for invalid signatures

### Database Access
- OAuth tokens encrypted at rest
- User-scoped queries via Clerk userId
- Service role for webhooks (no user context)

---

## Quick Commands

```bash
# Development
npm run dev                 # Start dev server
npm run build              # Production build
npm run worker             # Run BullMQ worker

# Database
npm run db:push            # Push schema changes
npm run db:generate        # Generate migrations
npm run db:migrate         # Run migrations
npm run db:studio          # Open Drizzle Studio

# Deployment
git push origin main       # Auto-deploys to Vercel
vercel                     # Manual deploy
vercel logs                # View production logs
```

---

## When Things Break

### Webhook Not Triggering
1. Check Vercel logs for errors
2. Verify webhook URL in platform settings
3. Test signature verification locally
4. Check Redis connection for idempotency

### Draft Generation Failing
1. Verify ANTHROPIC_API_KEY is set
2. Check API usage/rate limits
3. Review transcript content (empty?)
4. Check `drafts` table for error messages

### Database Errors
1. Verify DATABASE_URL connection
2. Check migration status: `npm run db:push`
3. Review schema changes in `lib/db/schema.ts`
4. Check Drizzle Studio: `npm run db:studio`

### OAuth Flow Issues
1. Verify redirect URIs match exactly
2. Check token expiry in `*_connections` tables
3. Verify scopes in platform app settings
4. Check encryption key consistency

---

Plan Mode Review Protocol

Review this plan thoroughly before making any code changes. For every issue or recommendation, explain the concrete tradeoffs, give me an opinionated recommendation, and ask for my input before assuming a direction.

My Engineering Preferences

DRY is important—flag repetition aggressively.
Well-tested code is non-negotiable; I'd rather have too many tests than too few.
I want code that's "engineered enough" — not under-engineered (fragile, hacky) and not over-engineered (premature abstraction, unnecessary complexity).
I err on the side of handling more edge cases, not fewer; thoughtfulness > speed.
Bias toward explicit over clever.

1. Architecture Review

Evaluate:
Overall system design and component boundaries.
Dependency graph and coupling concerns.
Data flow patterns and potential bottlenecks.
Scaling characteristics and single points of failure.
Security architecture (auth, data access, API boundaries).

2. Code Quality Review

Evaluate:
Code organization and module structure.
DRY violations—be aggressive here.
Error handling patterns and missing edge cases (call these out explicitly).
Technical debt hotspots.
Areas that are over-engineered or under-engineered relative to my preferences.

3. Test Review

Evaluate:
Test coverage gaps (unit, integration, e2e).
Test quality and assertion strength.
Missing edge case coverage—be thorough.
Untested failure modes and error paths.

4. Performance Review

Evaluate:
N+1 queries and database access patterns.
Memory-usage concerns.
Caching opportunities.
Slow or high-complexity code paths.

For Each Issue You Find

Describe the problem concretely, with file and line references.
Present 2–3 options, including "do nothing" where that's reasonable.
For each option, specify: implementation effort, risk, impact on other code, and maintenance burden.
Give me your recommended option and why, mapped to my preferences above.
Then explicitly ask whether I agree or want to choose a different direction before proceeding.

Workflow and Interaction

Do not assume my priorities on timeline or scale.
After each section, pause and ask for my feedback before moving on.

Before You Start

Ask if I want one of two options:

1/ BIG CHANGE: Work through this interactively, one section at a time (Architecture → Code Quality → Tests → Performance) with at most 4 top issues in each section.

2/ SMALL CHANGE: Work through interactively ONE question per review section.

FOR EACH STAGE OF REVIEW: output the explanation and pros and cons AND your opinionated recommendation, then use AskUserQuestion. NUMBER issues, give LETTERS for options. Make the recommended option always the 1st option.

**For questions:** See README.md or contact jimmy@playgroundgiants.com