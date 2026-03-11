# ReplySequence Master Roadmap

> **Vision:** Transform from AI meeting follow-up tool into a full **AI Deal Acceleration Platform**
>
> **Last Updated:** March 11, 2026
>
> **Stack:** Next.js 16, PostgreSQL/Drizzle, Clerk, Claude API, Resend, Stripe

---

## Table of Contents

0. [System Architecture](#system-architecture)
1. [Phase 1 — Core Follow-Up Automation](#phase-1--core-follow-up-automation)
2. [Phase 2 — Deal Intelligence](#phase-2--deal-intelligence)
3. [Phase 3 — Sales Copilot](#phase-3--sales-copilot)
4. [Phase 4 — Agentic GTM Automation](#phase-4--agentic-gtm-automation)
5. [Infrastructure & Integrations](#infrastructure--integrations)
6. [Marketing & Growth](#marketing--growth)
7. [Dependency Graph](#dependency-graph)
8. [7-Day Execution Plan](#7-day-execution-plan)

---

## System Architecture

Every AI feature in ReplySequence flows through a three-layer pipeline:

```
┌─────────────────────────────────────────────────────────┐
│                    MEETING PLATFORMS                      │
│              Zoom  ·  Google Meet  ·  Teams               │
└───────────────────────┬─────────────────────────────────┘
                        │ webhook + transcript download
                        ▼
┌─────────────────────────────────────────────────────────┐
│              SIGNAL EXTRACTION ENGINE                     │
│                    (86ag3qhxx)                            │
│                                                          │
│  Single Claude API call with structured JSON output.     │
│  Extracts 6 signal types from every transcript:          │
│                                                          │
│  commitment · risk · stakeholder · objection             │
│  timeline · budget                                       │
│                                                          │
│  Each signal includes: type, value, confidence, quote    │
│  Output: Typed SignalExtractionResult JSON               │
│  File: lib/signal-extractor.ts                           │
└───────────────────────┬─────────────────────────────────┘
                        │ structured signals
                        ▼
┌─────────────────────────────────────────────────────────┐
│            CONVERSATION CONTEXT STORE                    │
│                    (86ag3p3gj)                            │
│                                                          │
│  Persistent deal context database. Three core tables:    │
│                                                          │
│  deal_context: company, stage, stakeholders, risks       │
│  signal: typed records linked to meetings + deals        │
│  meeting: transcript ref, summary, signal count          │
│                                                          │
│  Updated after every meeting. Deduplicates signals.      │
│  Denormalized JSONB summaries for fast dashboard reads.  │
│  File: lib/context-store.ts                              │
└───────────────────────┬─────────────────────────────────┘
                        │ enriched deal context
                        ▼
┌─────────────────────────────────────────────────────────┐
│                  DECISION ENGINES                         │
│                                                          │
│  ┌──────────────────┐  ┌──────────────────────────┐     │
│  │ Next Step        │  │ Deal Risk Detector        │     │
│  │ Prediction       │  │ (86ag3cjeh)               │     │
│  │ (86ag3p35f)      │  │                           │     │
│  └──────────────────┘  └──────────────────────────┘     │
│  ┌──────────────────┐  ┌──────────────────────────┐     │
│  │ Reply            │  │ AI Mutual Action Plan     │     │
│  │ Intelligence     │  │ Generator                 │     │
│  │ (86ag3nuzg)      │  │ (86ag3p3at)               │     │
│  └──────────────────┘  └──────────────────────────┘     │
│  ┌──────────────────┐  ┌──────────────────────────┐     │
│  │ Deal Health      │  │ Auto CRM Field            │     │
│  │ Scoring          │  │ Population                │     │
│  │ (86ag3nv2x)      │  │ (86ag3cn9y)               │     │
│  └──────────────────┘  └──────────────────────────┘     │
└─────────────────────────────────────────────────────────┘
```

### How the layers interact

1. **Signal Extraction Engine** runs immediately after transcript download in `lib/process-*-event.ts`. It makes one Claude API call per meeting, extracting all signal types in a single pass. Output is a typed JSON object validated against Zod schemas.

2. **Conversation Context Store** receives the signal output and persists it. It matches signals to existing deal contexts (or creates new ones), deduplicates against prior signals, and updates denormalized JSONB summaries on the deal_context record for fast reads.

3. **Decision Engines** are consumers of the Context Store. Each engine queries deal_context + signals to make decisions:
   - **Next Step Prediction:** Cross-references new signals with deal history to rank optimal next actions
   - **Deal Risk Detector:** Aggregates risk signals across meetings to calculate composite risk scores
   - **Reply Intelligence Agent:** Uses deal context to generate contextually appropriate response drafts
   - **MAP Generator:** Extracts commitment signals to build buyer/seller action plan documents
   - **Deal Health Scoring:** Combines signals from all engines into a single 0-100 health score
   - **Auto CRM Population:** Maps signal data to CRM fields and pushes updates

This architecture ensures every AI feature works from the same data, signals are extracted once and reused everywhere, and new decision engines can be added without modifying the extraction layer.

---

## Phase 1 — Core Follow-Up Automation

**Status:** MVP Sprint (Week 7/12) — Beta launch pending Google OAuth verification
**Timeline:** Jan 27 – Mar 21, 2026

The foundation. Zoom/Meet/Teams meetings → AI-generated email drafts → one-click send from user's inbox. Every feature here must be rock-solid before building upward.

### Shipped / In Progress

| Feature | ClickUp ID | Status | Description |
|---------|-----------|--------|-------------|
| Zoom Webhook Processing | — | Deployed | Receive meeting.ended events, download transcripts, process via Claude |
| Teams Webhook Processing | — | Deployed | Graph API subscription, transcript extraction |
| Meet Webhook Processing | — | Deployed | Google Calendar events → transcript retrieval |
| AI Draft Generation | — | Deployed | Claude claude-sonnet-4-20250514, meeting type detection, quality scoring, action items |
| Email Sending (Resend) | `86ag3b05h` | Dev | Resend API integration for transactional email delivery |
| Smart Follow-Up Sequences | `86ag3cjw4` | Planning | Multi-step sequence generation: immediate summary, 48hr check-in, 1-week nudge |
| Auto Next-Step Tracking | `86ag3ch40` | Planning | Extract action items, track completion, nudge on overdue |
| Auto Proposal/Document Drafting | `86ag3chwj` | Planning | Generate proposals, SOWs, one-pagers from meeting context |
| Slack Integration | `86ag3ckcu` | Planning | Post meeting summaries and draft links to Slack channels |

### Key Architecture Decisions

- **Webhook-first**: All platforms push events; we never poll
- **Idempotency**: Redis-based locks prevent duplicate processing
- **Encryption**: OAuth tokens encrypted with AES-256-GCM at rest
- **Draft-only**: Emails are always drafts first — nothing sends without explicit user approval

---

## Phase 2 — Deal Intelligence

**Timeline:** March – May 2026
**Dependency:** Phase 1 core loop must be stable
**Current Phase:** Validation and hardening of intelligence pipeline (as of March 11, 2026)

Transform isolated meeting summaries into persistent, cross-meeting deal context. This is where ReplySequence stops being a productivity tool and becomes a deal intelligence platform.

### Signal Extraction Engine (BUILT — VALIDATING)

**Status:** Code complete, deployed, awaiting real-world validation

| Subtask | ClickUp ID | Status | Description |
|---------|-----------|--------|-------------|
| **Parent: Signal Extraction Engine** | `86ag3qhxx` | Ready for Review | Extract structured signals from every transcript |
| Structured JSON output + validation | `86ag3qjnd` | Ready for Review | Zod schemas, 6 signal types, `lib/signals/types.ts` |
| Commitment extraction | `86ag3qjam` | Ready for Review | Extracted via Claude prompt in `lib/signals/extract.ts` |
| Objection detection | `86ag3qjcg` | Ready for Review | Included in unified extraction prompt |
| Risk signal detection | `86ag3qjej` | Ready for Review | Included in unified extraction prompt |
| Stakeholder detection | `86ag3qjj9` | Ready for Review | Name + role extraction with speaker attribution |
| Timeline + budget signals | `86ag3qjk6` | Ready for Review | Included in unified extraction prompt |
| Context Store integration | `86ag3qjrb` | Ready for Review | Writes to `signals` table via `insertSignals()` |

**Key files:** `lib/signals/extract.ts`, `lib/signals/types.ts`, `__tests__/lib/signals-extract.test.ts` (14 tests)

### Conversation Context Store (BUILT — VALIDATING)

**Status:** Code complete, schema pushed to PostgreSQL, awaiting real-world validation

| Subtask | ClickUp ID | Status | Description |
|---------|-----------|--------|-------------|
| **Parent: Conversation Context Store** | `86ag3p3gj` | Ready for Review | Foundational data layer for all Phase 2+ features |
| deal_context Data Model | `86ag3p7ru` | Built | `deal_contexts` + `signals` tables in `lib/db/schema.ts` |
| Objection & Commitment Tracking | `86ag3p7x9` | Built | JSONB arrays on `deal_contexts` via `updateAccumulatedContext()` |
| Deal Risk Signal Detection | `86ag3p7ye` | Built | `lib/signals/risk-detector.ts` — MEDDIC-inspired categories |
| Post-Meeting Auto-Update Pipeline | `86ag3p80c` | Built | Fire-and-forget in `process-*-event.ts` pipelines |
| Semantic Search (pgvector) | `86ag3p82t` | Backlog | Not started — deferred until after validation |

**Key files:** `lib/context-store.ts`, `lib/db/schema.ts`, `__tests__/lib/context-store.test.ts` (7 tests)

### Decision Engines (BUILT — VALIDATING)

**Status:** Code complete, integrated as downstream signal consumers

| Engine | ClickUp ID | Status | Description |
|--------|-----------|--------|-------------|
| **Next Step Prediction Engine** | `86ag3p35f` | Ready for Review | `lib/signals/next-steps.ts` — explicit vs predicted, confidence scoring |
| **Deal Risk Detector** | `86ag3cjeh` | Ready for Review | `lib/signals/risk-detector.ts` — 7 MEDDIC categories, severity + mitigation |

Both engines run in parallel after signal extraction via `Promise.allSettled` (fire-and-forget, non-blocking).

### Validation Phase (IN PROGRESS)

| Task | ClickUp ID | Owner | Est. |
|------|-----------|-------|------|
| **Parent: Intelligence Pipeline Validation** | `86ag3w7j9` | Jimmy | 8h |
| Verify tables/indexes in PostgreSQL | `86ag3w8cz` | Jimmy | 0.5h |
| Run real end-to-end meeting test | `86ag3w8g3` | Jimmy | 1h |
| Inspect signals via debug API | `86ag3w8jc` | Jimmy | 0.5h |
| Validate next-step output quality | `86ag3w8mv` | Jimmy | 1h |
| Validate risk detection quality | `86ag3w8ru` | Jimmy | 1h |
| Create gold-test transcript set | `86ag3w8wy` | Claude | 2h |
| Document false positives/negatives | `86ag3w8zx` | Jimmy | 1h |
| Check extraction latency | `86ag3w921` | Jimmy | 0.5h |

### E2E Validation — March 11, 2026

**Status: PASSED** — Full intelligence pipeline validated in production.

**Test Meeting:** `6873866a` — "E2E - ReplySequence - Zoom - Jimmy - March 11, 2026 - 5:55pm"

| Pipeline Stage | Result |
|---|---|
| Webhook ingestion | Zoom recording.completed → meeting created |
| Transcript download | VTT parsed successfully |
| Draft generation | Quality score 97 — "Pricing proposal + Alex's technical review materials" |
| Signal extraction | 8 signals: 2 commitment, 1 stakeholder, 2 risk, 1 budget, 2 timeline |
| Next-step prediction | Downstream consumer ran (fire-and-forget) |
| Risk detection | Downstream consumer ran (fire-and-forget) |
| MAP generation | 7-step plan — "ReplySequence — March Integration Action Plan" |

**Key Observations:**
- Signal confidence scores range 0.85–0.95 (appropriate for explicit statements)
- MAP correctly distinguished commitment (2), next_step (2), and risk_mitigation (3) sources
- Zero "recommended" steps — all evidence-based from transcript signals
- Pipeline latency: meeting → all artifacts generated within webhook processing window
- No errors in Vercel production logs

**Deployment Notes:**
- Database tables created via Supabase migration (drizzle-kit push had interactive prompt issues)
- Code deployed via git push to main → Vercel auto-deploy (commit ea34fd5)
- Single database across all environments (dkkvjytiqffiugwmlbjl)

### AI Meeting Memory

| Feature | ClickUp ID | Priority | Due | Description |
|---------|-----------|----------|-----|-------------|
| **Parent: AI Meeting Memory** | `86ag3ckz2` | High | — | Persistent context across all meetings with a contact/deal |
| **Contact Memory System** | `86ag3cmq4` | High | — | Per-contact relationship history and preferences |

### Deal Risk & Health

| Feature | ClickUp ID | Priority | Due | Description |
|---------|-----------|----------|-----|-------------|
| **Deal Risk Detector** | `86ag3cjeh` | High | — | Competitive intelligence from transcript signals |
| **Deal Health Scoring** | `86ag3nv2x` | High | — | Composite health score from engagement, risk, velocity |
| Opportunity Health Dashboard | `86ag3p8f8` | High | May 15 | Visual pipeline health view at /dashboard/pipeline |

### Next Step Prediction

| Subtask | ClickUp ID | Priority | Due | Description |
|---------|-----------|----------|-----|-------------|
| **Parent: Next Step Prediction Engine** | `86ag3p35f` | High | May 15 | Predict optimal next action after each meeting |
| Signal Classification Engine | `86ag3p7de` | High | Apr 25 | Taxonomy of 20+ signal types from transcripts |
| Deal Context Cross-Reference | `86ag3p7ex` | High | May 1 | Weight signals by deal stage relevance |
| Action Ranking & Scoring | `86ag3p7fy` | High | May 8 | Top 3 actions with confidence percentages |
| Auto-Generate Next Action | `86ag3p7h1` | Normal | May 15 | One-click execution of predicted action |

### CRM Intelligence

| Feature | ClickUp ID | Priority | Due | Description |
|---------|-----------|----------|-----|-------------|
| **Auto CRM Field Population** | `86ag3cn9y` | Normal | — | Auto-update deal stage, probability, next steps in CRM |

### Copy-to-CRM Quick Export (Viral Feature)

| Subtask | ClickUp ID | Priority | Due | Description |
|---------|-----------|----------|-----|-------------|
| **Parent: Copy-to-CRM Quick Export** | `86ag3qj51` | High | May 1 | One-click export of meeting recaps to CRM tools |
| Export UI button + target selector | `86ag3qk2g` | High | Apr 18 | Dropdown component showing available export targets |
| Copy to clipboard (markdown) | `86ag3qjuk` | High | Apr 20 | Structured markdown with summary, actions, next steps |
| Copy to HubSpot (Deal Note) | `86ag3qjwt` | High | Apr 25 | HubSpot Engagements API with auto-deal matching |
| Copy to Salesforce (Opportunity) | `86ag3qjym` | Normal | Apr 30 | Salesforce REST API with contact email matching |
| Copy to Notion (Database page) | `86ag3qk0n` | Low | May 1 | Notion API with OAuth, new integration |

---

## Phase 3 — Sales Copilot

**Timeline:** May – June 2026
**Dependency:** Phase 2 deal_context and meeting memory

Proactive intelligence that tells reps what to do before they ask.

### Pre-Meeting Intelligence

| Feature | ClickUp ID | Priority | Due | Description |
|---------|-----------|----------|-----|-------------|
| **Pre-Meeting Intelligence** | `86ag3cnqe` | Normal | — | Research prospects before calls, surface relevant context |

### Mutual Action Plans

| Subtask | ClickUp ID | Priority | Due | Description |
|---------|-----------|----------|-----|-------------|
| **Parent: AI Mutual Action Plan Generator** | `86ag3p3at` | High | May 30 | Auto-generate shared buyer/seller roadmaps from transcripts |
| Commitment Extraction Engine | `86ag3p7j8` | High | May 8 | Classify buyer vs seller commitments with timelines |
| MAP Document Generator | `86ag3p7ju` | High | May 15 | React + PDF generation with progress tracking |
| Shareable MAP Links | `86ag3p7ma` | Normal | May 22 | Viral distribution with open tracking and CRM integration |

### Deal Recaps (Viral Growth)

| Subtask | ClickUp ID | Priority | Due | Description |
|---------|-----------|----------|-----|-------------|
| **Parent: AI Deal Recap Sharing** | `86ag3p3pv` | High | May 15 | Shareable deal summaries that circulate in prospect orgs |
| Visual Summary Generator | `86ag3p84p` | High | May 1 | Timeline, stakeholders, decisions, next steps with OG images |
| Shareable Links + Open Tracking | `86ag3p863` | High | May 8 | Unique URLs with analytics and forwarding support |
| PDF Export & Email Distribution | `86ag3p874` | Normal | May 15 | One-click email to all participants via Resend |

### Call Coaching

| Feature | ClickUp ID | Priority | Due | Description |
|---------|-----------|----------|-----|-------------|
| **Call Coaching Insights** | `86ag3nw09` | Normal | — | Talk ratio analysis, question quality scoring, coaching suggestions |

---

## Phase 4 — Agentic GTM Automation

**Timeline:** June+ 2026
**Dependency:** Phase 2-3 intelligence layer

The endgame. ReplySequence operates as an autonomous AI SDR/CSM that handles the entire post-meeting lifecycle without human intervention (with approval gates).

### Reply Intelligence Agent

| Subtask | ClickUp ID | Priority | Due | Description |
|---------|-----------|----------|-----|-------------|
| **Parent: Reply Intelligence Agent** | `86ag3nuzg` | High | Apr 15 | Classify inbound replies, generate contextual responses, auto-schedule follow-ups |
| Intent Classification Engine | `86ag3nvem` | High | May 15 | 8 categories: interested, objection, question, commitment, delegation, delay, not now, unsubscribe |
| Contextual Response Generation | `86ag3nvf4` | High | May 22 | AI drafts that reference deal history and prior commitments |
| Smart Follow-Up Scheduling | `86ag3nvg0` | High | May 30 | Optimal timing based on engagement patterns, auto-pause on reply |
| Signal-Based CRM Stage Detection | `86ag3nvgd` | Normal | Jun 5 | Auto-update deal stage from reply intent signals |
| CRM Integration Layer | `86ag3nvh5` | Normal | Jun 10 | Push updates to HubSpot/Salesforce/Sheets |
| Buyer Intent Detection | `86ag3p8d9` | High | Apr 30 | Deep signal analysis: buying, competitive, disengagement |

### Pipeline Automation

| Feature | ClickUp ID | Priority | Due | Description |
|---------|-----------|----------|-----|-------------|
| **Deal Health Scoring** | `86ag3nv2x` | High | — | Composite score from engagement + risk + velocity |
| **Pipeline Stage Auto-Detection** | `86ag3nvb4` | Normal | — | Auto-move deals through pipeline based on conversation signals |
| **Automated Meeting Booking** | `86ag3nv6e` | Normal | — | Detect scheduling intent, propose times, send calendar links |

---

## Infrastructure & Integrations

### Active Integrations

| Integration | Status | Notes |
|------------|--------|-------|
| Zoom | Deployed | Webhook + OAuth, transcript download |
| Google Meet | Deployed | Calendar events + transcript retrieval |
| Microsoft Teams | Deployed | Graph API subscription |
| Clerk Auth | Deployed | User management, OAuth flows |
| Stripe | Deployed | Subscription billing (Free/Pro/Team) |
| Gmail (OAuth) | Pending | Google OAuth verification submitted |
| Outlook | Deployed | OAuth + email sending |
| Resend | `86ag3b05h` | High priority, Q1 target |

### Planned Integrations

| Integration | ClickUp ID | Purpose |
|------------|-----------|---------|
| HubSpot CRM | — | Deal sync, contact enrichment |
| Salesforce CRM | — | Enterprise CRM integration |
| Google Sheets | — | Lightweight CRM alternative |
| NewsAPI | `86ag3azxe` | Company news for pre-meeting briefs |
| Clearbit | `86ag3azr9` | Contact/company enrichment |
| Abstract API | `86ag3azh6` | Email validation |
| Hunter.io | `86ag3azan` | Email discovery |

### SEO & Content

| Feature | ClickUp ID | Description |
|---------|-----------|-------------|
| SEO Compare Pages | `86ag3exzf` | vs Gong, Otter, Fireflies, Chorus, Fathom, Avoma, Grain, tl;dv |
| SEO Content Pipeline | `86ag3nw6j` | Programmatic SEO for long-tail keywords |

---

## Marketing & Growth

| Task | ClickUp ID | Priority | Description |
|------|-----------|----------|-------------|
| Founder Content Series | `86ag3ew3d` | High | Jimmy's daily video content for LinkedIn/Twitter |
| Cold Outreach (Saleshandy) | `86ag3exgq` | High | 400 leads loaded, sending from tryreplysequence.com |
| Demo Content & Video | `86ag3ewky` | High | Product demo for landing page and outreach |
| Case Study Framework | `86ag3ewzx` | Normal | Template for beta user success stories |
| Viral Demo Experience | `86ag3eza5` | Normal | Interactive demo without signup |
| Product Hunt Launch | `86ag3eyk5` | Normal | Coordinated PH launch campaign |
| Marketing Framework | `86ag3a7ed` | Normal | Overall GTM strategy and positioning |

---

## Dependency Graph

```
Phase 1: Core Follow-Up (NOW)
├── Zoom/Meet/Teams webhooks ✅
├── AI Draft Generation ✅
├── Resend Email Integration (in progress)
├── Smart Follow-Up Sequences
├── Auto Next-Step Tracking
└── Slack Integration

Phase 2: Deal Intelligence (Apr-May)
├── Signal Extraction Engine ← FOUNDATIONAL, build first
│   ├── Structured JSON output + Zod validation
│   ├── Commitment extraction
│   ├── Objection detection
│   ├── Risk signal detection
│   ├── Stakeholder detection
│   ├── Timeline + budget signals
│   └── Context Store integration
├── Conversation Context Store ← depends on Signal Extraction Engine
│   ├── deal_context + signal schema
│   ├── Transcript storage per contact
│   ├── Objection & commitment tracking
│   ├── Risk signal detection & storage
│   ├── Post-meeting auto-update pipeline
│   └── Semantic search (pgvector, v2)
├── AI Meeting Memory ← depends on Context Store
├── Contact Memory System ← depends on Meeting Memory
├── Deal Risk Detector ← depends on Context Store signals
├── Deal Health Scoring ← depends on Risk Detector
├── Next Step Prediction Engine ← depends on Context Store
├── Auto CRM Field Population ← depends on Context Store
└── Copy-to-CRM Quick Export ← depends on draft system + CRM OAuth

Phase 3: Sales Copilot (May-Jun)
├── Pre-Meeting Intelligence ← depends on Context Store + enrichment APIs
├── AI Mutual Action Plan Generator ← depends on Context Store commitments
├── AI Deal Recap Sharing ← depends on Context Store (viral growth lever)
└── Call Coaching Insights

Phase 4: Agentic GTM (Jun+)
├── Reply Intelligence Agent ← depends on Context Store + Follow-Up Sequences
├── Pipeline Stage Auto-Detection ← depends on Deal Health + CRM sync
├── Automated Meeting Booking ← depends on Reply Intelligence
└── Deal Health Scoring (enhanced) ← depends on all Phase 2 signals
```

---

## Key Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Follow-up coverage | 100% of meetings | meetings with drafts / total meetings |
| Time to first draft | < 5 minutes | webhook received → draft available |
| Draft acceptance rate | > 70% | drafts sent / drafts generated |
| User activation | Connect + first draft in < 10 min | onboarding funnel tracking |
| Viral coefficient | > 0.3 | new signups from shared recaps/MAPs |

---

## Competitive Positioning

| Phase | Positioning | Competitive Moat |
|-------|------------|-----------------|
| 1 | "AI follow-up for every meeting" | Speed + simplicity vs Gong/Otter complexity |
| 2 | "AI deal intelligence from conversations" | Cross-meeting context vs single-meeting tools |
| 3 | "Your AI sales copilot" | Proactive intelligence vs reactive transcription |
| 4 | "Autonomous deal acceleration" | Agentic GTM vs manual pipeline management |

---

## 7-Day Execution Plan

Based on architectural dependency order. Owner: Claude Code.

### Day 1-2: Resend Email Integration (`86ag3b05h`)
**Why first:** Blocks all email sending — follow-up sequences, MAP distribution, recap sharing, reminders.
- Build React Email templates for each notification type
- Set up automated triggers (webhook-driven + cron)
- Configure delivery tracking via Resend webhooks
- Verify tryreplysequence.com domain deliverability
- **Sprint:** Week 8 | **List:** Sprint 2

### Day 3-4: Conversation Context Store (`86ag3p3gj`)
**Why next:** Foundational data layer blocking 10+ downstream features.
- Create `deal_context`, `signal`, and related tables in Drizzle schema
- Run migration
- Build `lib/context-store.ts` — the upsert/query layer
- Build REST API endpoints: `/api/deal-context/` CRUD
- Integration test: manually trigger context creation from a test transcript
- **Sprint:** Week 8 | **List:** Sprint 2

### Day 5: Signal Extraction Engine (`86ag3qhxx`)
**Why next:** Feeds structured data into the Context Store built on Day 3-4.
- Create `types/signals.ts` with Zod schemas for all 6 signal types
- Create `lib/prompts/signal-extraction.ts` with Claude system prompt + few-shot examples
- Create `lib/signal-extractor.ts` — single Claude call, JSON mode, validation
- Wire into `lib/process-*-event.ts` pipeline (after transcript download)
- Connect output to Context Store upsert
- **Sprint:** Week 8 | **List:** Sprint 2

### Day 6: Auto Next-Step Tracking (`86ag3ch40`)
**Why next:** Natural extension of existing draft generation. First consumer of Context Store.
- Add `next_steps` table to Drizzle schema
- Extend `generateDraft()` to also return structured action items
- Build `/api/next-steps/` CRUD endpoints
- Build dashboard widget: `components/dashboard/NextStepTimeline.tsx`
- **Sprint:** Week 8 | **List:** Sprint 2

### Day 7: Smart Follow-Up Sequences (`86ag3cjw4`)
**Why next:** Blocks Reply Intelligence Agent (Phase 4 killer feature). Immediate user value.
- Add `email_sequences` + `sequence_emails` tables
- Build `lib/sequence-generator.ts` — Claude call for full sequence
- Build sequence editor UI: `components/dashboard/SequenceEditor.tsx`
- Build cron sender: `app/api/cron/sequence-sender/route.ts`
- Wire Resend webhooks for open/reply tracking + auto-pause
- **Sprint:** Week 8 | **List:** Sprint 2
