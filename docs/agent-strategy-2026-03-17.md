# ReplySequence Agent Strategy

**Date**: 2026-03-17
**Author**: Claude (Senior Product Architect)
**Status**: Implementation-ready planning document

---

## 1. Executive Summary

### Product Philosophy

ReplySequence should become the platform where **every follow-up email, every CRM update, every next step, and every meeting insight happens automatically** — unless the user wants to intervene. Agents aren't a feature. They're the product.

The right mental model: **ReplySequence is your AI sales ops teammate that watches every meeting, drafts every follow-up, keeps your CRM honest, and tells you what to do next.** The user's job is to show up to meetings and approve the work.

### Where Agents Should Live

Agents should be **invisible infrastructure** — not a separate tab, not a chatbot sidebar, not an "AI playground." They should appear as:
- **Automatic actions** that happen after triggers (meeting ends → draft appears → sequence starts → CRM updates)
- **Inline suggestions** that surface at decision points (next step cards, deal risk alerts, response intent badges)
- **One-click escalations** where the user reviews and approves ("Send this draft" / "Update CRM" / "Start sequence")

The user should never think "I need to go use the AI feature." They should think "My follow-up is already written."

### What NOT to Build

- No generic "agent builder" or "create your own agent" interface
- No chatbot/conversational UI as the primary interaction model (the existing MeetingChat is fine as a secondary feature)
- No "AI settings page" with 50 knobs — keep it opinionated
- No autonomous email sending without explicit user opt-in and a proven trust ramp
- No agent marketplace or plugin system
- No multi-agent orchestration visible to the user — that's implementation, not product

### Highest-Leverage Opportunities (Ordered)

1. **Post-meeting autopilot** — Meeting ends → draft + next steps + CRM update happen automatically. This is 80% built already.
2. **Sequence intelligence** — Generated sequences that adapt based on recipient engagement signals.
3. **Inbox assistant** — Classify incoming replies, suggest responses, detect buying signals.
4. **Contact intelligence** — Auto-enrich contacts before meetings, build relationship memory across interactions.
5. **Pipeline autopilot** — Auto-update deal stages, surface risk alerts, generate weekly pipeline digests.

---

## 2. Agent Opportunity Map

### Meeting Intelligence

| Use Case | User Value | Trigger | Inputs | Output | Risk | Priority | Phase |
|----------|-----------|---------|--------|--------|------|----------|-------|
| Post-meeting draft generation | Saves 15-30 min per meeting | Automatic (transcript ready) | Transcript, participants, meeting type, contact history, user tone prefs | Email draft with action items | Low (exists today) | P0 | 1 |
| Meeting summary + key moments | Quick review without re-watching | Automatic (transcript ready) | Transcript | Structured summary, key quotes, decisions | Low (exists today) | P0 | 1 |
| Signal extraction | Know deal health without manual notes | Automatic (transcript ready) | Transcript, deal context | Signals: commitments, risks, objections, budget, timeline, stakeholders | Low (exists today) | P0 | 1 |
| Pre-meeting briefing | Walk into meetings prepared | Scheduled (30 min before meeting) | Calendar event, past meetings with attendees, CRM data | Email briefing with context, talking points, open items | Low (exists today) | P0 | 1 |
| Next-step extraction | Never lose track of commitments | Automatic (transcript ready) | Transcript, participants | Actionable next steps with owners and deadlines | Low (exists today) | P0 | 1 |
| Meeting-to-meeting continuity | "Last time we discussed X" context | Automatic (new meeting with known contact) | Contact memory, past meeting summaries | Context block injected into pre-meeting briefing and draft | Medium | P1 | 2 |

### Sequences & Follow-ups

| Use Case | User Value | Trigger | Inputs | Output | Risk | Priority | Phase |
|----------|-----------|---------|--------|--------|------|----------|-------|
| Follow-up sequence generation | Automated multi-touch cadence | Automatic (after initial draft sent) | Meeting context, initial draft, recipient info | 3-step sequence with varied angles | Low (exists today) | P0 | 1 |
| Adaptive sequence timing | Send when engagement is high | Event-driven (open/click detected) | Email events, engagement patterns | Adjusted send time for next step | Medium | P1 | 2 |
| Sequence step rewrite | Refresh stale follow-ups | Manual (user clicks "Rewrite") | Original step, engagement data, contact history | Rewritten step with new angle | Low | P1 | 2 |
| Engagement-triggered branching | Different follow-up if opened vs ignored | Event-driven (engagement signals) | Buyer intent signals, sequence state | Branch to appropriate next step | High | P2 | 3 |
| Sequence pause/resume intelligence | Don't follow up if deal closed or meeting booked | Event-driven (calendar/CRM update) | Calendar events, CRM deal stage | Auto-pause sequence + notify user | Medium | P1 | 2 |

### Contacts & Enrichment

| Use Case | User Value | Trigger | Inputs | Output | Risk | Priority | Phase |
|----------|-----------|---------|--------|--------|------|----------|-------|
| Contact auto-creation | No manual data entry | Automatic (new meeting participant) | Meeting participants, email headers | Contact record with name, email, company | Low | P0 | 1 |
| Contact enrichment | Know who you're meeting before you meet | Scheduled (before meeting) / Manual | Email address, name | Company, title, LinkedIn, recent news, shared connections | Medium (external API) | P1 | 2 |
| Relationship memory | AI remembers every interaction | Automatic (after each meeting/email) | All past interactions with contact | Relationship summary, communication preferences, key topics | Low (partially exists) | P1 | 2 |
| Contact scoring | Prioritize hot leads | Scheduled (daily) | Engagement data, meeting frequency, signal history | Lead temperature score with explanation | Medium | P2 | 3 |

### Inbox & Communications

| Use Case | User Value | Trigger | Inputs | Output | Risk | Priority | Phase |
|----------|-----------|---------|--------|--------|------|----------|-------|
| Reply classification | Know what needs attention | Event-driven (email reply received) | Reply content, thread context | Intent label: interested / objection / question / scheduling / not-now / unsubscribe | Medium | P1 | 2 |
| Reply draft suggestion | Respond faster to hot leads | Event-driven (reply classified as high-intent) | Reply content, meeting history, contact memory | Suggested response draft | Medium | P1 | 2 |
| Stale thread detection | Don't let deals go cold | Scheduled (daily) | Draft/sequence state, last activity timestamps | Alert: "No reply from Sarah in 7 days — suggest re-engage?" | Low | P1 | 2 |
| Out-of-office detection | Don't waste sequence steps on OOO | Event-driven (auto-reply received) | Reply content | Pause sequence + reschedule based on return date | Low | P1 | 2 |

### Pipeline & Deals

| Use Case | User Value | Trigger | Inputs | Output | Risk | Priority | Phase |
|----------|-----------|---------|--------|--------|------|----------|-------|
| Deal stage auto-update | CRM always accurate | Automatic (after meeting) | Transcript signals, deal context | Updated deal stage in CRM | Low (exists today) | P0 | 1 |
| Deal risk alerts | Catch problems before they kill deals | Event-driven (risk signal detected) | Signals, health score, engagement data | Dashboard alert + optional Slack notification | Low (partially exists) | P1 | 2 |
| Weekly pipeline digest | Know your pipeline without checking CRM | Scheduled (weekly) | All deal contexts, health scores, recent activity | Email/Slack digest with pipeline summary | Low | P2 | 3 |
| Win/loss analysis | Learn from outcomes | Manual (deal marked closed) | All meetings, signals, sequences for deal | Structured analysis: what worked, what didn't, key moments | Medium | P2 | 3 |

### CRM & Notes

| Use Case | User Value | Trigger | Inputs | Output | Risk | Priority | Phase |
|----------|-----------|---------|--------|--------|------|----------|-------|
| CRM field auto-populate | Never manually update CRM after meetings | Automatic (after meeting) | Transcript, deal inference | HubSpot/Salesforce field updates | Low (exists today) | P0 | 1 |
| Meeting notes → CRM notes | Full context in CRM without copy-paste | Automatic (after meeting) | Summary, action items, key quotes | CRM activity/note record | Low | P1 | 2 |
| CRM data quality alerts | Catch stale or missing fields | Scheduled (weekly) | CRM connection, deal contexts | "3 deals missing close date" alerts | Low | P2 | 3 |

### QA & Safeguards

| Use Case | User Value | Trigger | Inputs | Output | Risk | Priority | Phase |
|----------|-----------|---------|--------|--------|------|----------|-------|
| Draft quality scoring | Only send good emails | Automatic (after generation) | Draft content, meeting context | Quality score with issue flags | Low (exists today) | P0 | 1 |
| Draft grading (Haiku) | Second opinion on draft quality | Automatic (after generation) | Draft content | Letter grade + improvement suggestions | Low (exists today) | P0 | 1 |
| Tone consistency check | Brand voice compliance | Automatic (before send) | Draft, user's tone preferences, past sent emails | Pass/flag with suggested edits | Low | P1 | 2 |
| PII/sensitive content detection | Prevent accidental data leaks | Automatic (before send) | Draft content | Flag if PII, pricing, or confidential info detected | Low | P1 | 2 |
| Human approval queue | Trust ramp for automation | Event-driven (draft ready) | Draft, quality score, auto-send preference | Approval notification (email/Slack/dashboard) | Low (partially exists) | P0 | 1 |

### Analytics & Reporting

| Use Case | User Value | Trigger | Inputs | Output | Risk | Priority | Phase |
|----------|-----------|---------|--------|--------|------|----------|-------|
| Time-saved tracking | Justify ROI | Automatic (ongoing) | Meeting count, draft count, auto-send rate | "You saved 12 hours this week" widget | Low (partially exists) | P0 | 1 |
| Engagement analytics | Know what works | Scheduled (daily) | Email events, sequence performance | Open/reply rates by meeting type, template, tone | Low | P1 | 2 |
| AI action log | Transparency on what agents did | Automatic (every agent action) | Agent execution logs | "AI generated 5 drafts, updated 3 CRM records, paused 1 sequence" feed | Low | P1 | 2 |
| Coaching insights | Get better at selling | Scheduled (weekly) | Transcript analytics, signal patterns, outcomes | "You talk 70% of the time in discovery calls — try asking more questions" | Medium | P2 | 3 |

### Notifications & Hooks

| Use Case | User Value | Trigger | Inputs | Output | Risk | Priority | Phase |
|----------|-----------|---------|--------|--------|------|----------|-------|
| Slack draft notification | Review from where you work | Automatic (draft ready) | Draft content, meeting context | Slack message with approve/edit buttons | Low (exists today) | P0 | 1 |
| Slack deal alerts | Real-time deal intelligence | Event-driven (risk/buying signal) | Signal data | Slack alert with context | Low | P1 | 2 |
| Email digest | Daily summary of AI activity | Scheduled (daily morning) | All agent actions from past 24h | Email summary | Low | P2 | 3 |

---

## 3. Recommended Agent Systems

### 1. Draft Generation Agent (EXISTS — enhance)
- **Purpose**: Generate follow-up email drafts from meeting transcripts
- **Where**: Runs automatically after transcript processing; output appears in Dashboard > Drafts
- **User-facing**: Yes — draft appears in editor for review/edit/send
- **MVP scope**: Already built. Meeting → transcript → Claude generates draft with action items, subject line, quality score
- **Future scope**: Template selection based on meeting type, contact history injection, A/B subject lines, multi-recipient drafts

### 2. Sequence Agent (EXISTS — enhance)
- **Purpose**: Generate and manage multi-step follow-up sequences
- **Where**: Triggered after initial draft is sent; manages sequence_steps lifecycle
- **User-facing**: Yes — Sequences page shows steps, timing, status
- **MVP scope**: Already built. 3-step sequence (check-in, value nudge, breakup) generated via Claude
- **Future scope**: Adaptive timing, engagement-triggered branching, pause/resume intelligence, step rewriting

### 3. Signal Extraction Agent (EXISTS — enhance)
- **Purpose**: Extract deal signals (commitments, risks, objections, budget, timeline, stakeholders) from transcripts
- **Where**: Runs in parallel with draft generation in webhook pipeline
- **User-facing**: Yes — signals appear on meeting detail page
- **MVP scope**: Already built. 6 signal categories with confidence scores, feeds into deal health
- **Future scope**: Cross-meeting signal trends, signal-driven alerts, signal accuracy feedback loop

### 4. Pre-Meeting Briefing Agent (EXISTS — enhance)
- **Purpose**: Generate contextual briefings before meetings
- **Where**: Cron job runs 30 min before calendar events; briefing sent via email
- **User-facing**: Yes — email briefing + viewable in dashboard
- **MVP scope**: Already built. Past meetings, attendee history, open action items
- **Future scope**: Contact enrichment data, CRM deal context, suggested talking points, competitive intel

### 5. CRM Sync Agent (EXISTS — enhance)
- **Purpose**: Auto-populate CRM fields from meeting intelligence
- **Where**: Runs after meeting processing (fire-and-forget)
- **Background**: Yes — user sees results in CRM
- **MVP scope**: Already built. Deal stage inference, close probability, next action, HubSpot + Salesforce sync
- **Future scope**: Bi-directional sync (CRM changes → RS updates), meeting notes as CRM activities, multi-object support

### 6. Buyer Intent Agent (EXISTS — enhance)
- **Purpose**: Detect buying/cooling signals from email engagement patterns
- **Where**: Runs when email events arrive (opens, clicks, replies)
- **Background**: Yes — feeds into deal health score
- **MVP scope**: Already built. Buying/competitive/disengagement signal detection from email events
- **Future scope**: Real-time intent scoring on contacts page, trigger sequence branching, Slack alerts for hot signals

### 7. Contact Intelligence Agent (NEW — P1)
- **Purpose**: Build and maintain a living profile of every contact
- **Where**: Dashboard > Contacts; also feeds into draft generation and briefings
- **User-facing**: Yes — contact detail page with AI-generated profile
- **MVP scope**: Auto-create contact records from meeting participants. Aggregate all interactions (meetings, emails, sequences) into a relationship summary. Show communication preferences learned from past interactions.
- **Future scope**: External enrichment (company, title, LinkedIn), contact scoring, relationship health

### 8. Inbox Agent (NEW — P1)
- **Purpose**: Classify incoming replies and suggest responses
- **Where**: Dashboard > Drafts (replies tab) or future Inbox view
- **User-facing**: Yes — reply classification badges + suggested response drafts
- **MVP scope**: Classify replies into intent categories (interested, objection, question, scheduling, not-now, unsubscribe). Surface classification on drafts/inbox view. Detect out-of-office auto-replies.
- **Future scope**: One-click response drafts, auto-pause sequences on OOO, thread summarization

### 9. Sequence Intelligence Agent (NEW — P1)
- **Purpose**: Make sequences smarter based on engagement data
- **Where**: Background process that adjusts sequence behavior
- **Background**: Yes — user sees adjusted timing/content
- **MVP scope**: Auto-pause sequences when calendar meeting is booked with recipient. Auto-pause on out-of-office detection. Notify user of stale threads.
- **Future scope**: Engagement-optimized send times, step rewriting based on recipient signals, branching logic

### 10. Pipeline Digest Agent (NEW — P2)
- **Purpose**: Generate periodic pipeline summaries with actionable insights
- **Where**: Scheduled email/Slack digest; also powers analytics dashboard
- **User-facing**: Yes — digest email + dashboard widgets
- **MVP scope**: Weekly email summarizing: deals advanced, deals at risk, meetings this week, follow-ups pending, time saved
- **Future scope**: Coaching insights ("you close faster when you send proposals within 48h"), win/loss analysis

### 11. QA Review Agent (EXISTS — enhance)
- **Purpose**: Quality-gate for all AI-generated content
- **Where**: Runs inline during draft generation; gates auto-send
- **Background**: Yes — user sees quality score on draft
- **MVP scope**: Already built. Quality scoring + Haiku grading. Blocks auto-send below threshold.
- **Future scope**: PII detection, tone consistency checking, brand voice compliance, sensitivity flags

### 12. Task Extraction Agent (NEW — P2)
- **Purpose**: Turn meeting commitments into actionable tasks
- **Where**: Dashboard + optional push to external tools (CRM, Slack)
- **User-facing**: Yes — task list on meeting detail + next-steps timeline
- **MVP scope**: Extract tasks with owners and deadlines from transcript. Display in next-steps timeline (partially exists). Allow user to mark complete → sync to CRM.
- **Future scope**: Auto-create tasks in external project management tools, deadline reminders, cross-meeting task deduplication

---

## 4. Product Architecture Recommendations

### Shared Agent Execution Layer

Don't build a generic agent framework. You already have the right pattern:

```
Trigger (webhook/cron/user action)
  → Context Assembly (gather relevant data)
    → Claude API call (with structured prompt)
      → Parse + Validate (Zod schemas)
        → Write results (DB + CRM + notifications)
          → Log (usage, cost, quality metrics)
```

Formalize this into a thin wrapper:

```typescript
// lib/agents/core.ts
interface AgentExecution<TInput, TOutput> {
  name: string;
  assembleContext: (input: TInput) => Promise<AgentContext>;
  systemPrompt: string;
  buildPrompt: (context: AgentContext) => string;
  parseResponse: (raw: string) => TOutput;
  validate: (output: TOutput) => boolean;
  onSuccess: (output: TOutput) => Promise<void>;
  onFailure: (error: Error) => Promise<void>;
}
```

This is ~100 lines of code. It standardizes logging, cost tracking, retries, and error handling without overengineering.

### Prompt/Template System

Already well-structured in `lib/prompts/`. Keep this pattern:
- One file per prompt domain (`optimized-followup.ts`, `discovery-call.ts`, `document-templates.ts`)
- System prompts as constants
- Builder functions that assemble user prompts from context
- Parser functions that extract structured data from Claude responses

Add: a `lib/prompts/` index that exports all prompt templates for easy A/B testing later.

### Context Assembly Layer

Already partially built via `lib/flywheel/contact-memory.ts`, `lib/context-store.ts`, `lib/meeting-memory.ts`. Formalize:

```typescript
// lib/agents/context.ts
async function assembleAgentContext(userId: string, meetingId?: string): Promise<AgentContext> {
  // Parallel fetch: user prefs, contact history, deal context, past meetings
  const [userPrefs, contactHistory, dealContext, meetingHistory] = await Promise.all([...]);
  return { userPrefs, contactHistory, dealContext, meetingHistory };
}
```

### Approval / Review Layer

Three tiers based on user trust level:
1. **Review mode** (default): Agent generates, user reviews and clicks Send
2. **Auto-send mode** (opt-in): Agent generates and sends if quality score > threshold. User gets notification.
3. **Full autopilot** (future): Agent generates, sends, and manages sequences. User gets daily digest.

Already partially implemented via `auto-send.ts`. Extend to cover CRM updates and sequence actions.

### Logging / Observability

Already solid with structured JSON logging and `[TAG]` prefixes. Add:
- `usage_logs` table tracking per-agent costs (already exists)
- Agent execution log in dashboard ("AI Actions" feed)
- Sentry breadcrumbs on every agent execution (already using Sentry)

### Memory / Context Storage

Already built:
- `contact_memories` table for relationship context
- `meeting_memories` table for cross-meeting continuity
- `deal_contexts` table for pipeline state
- `signals` table for extracted intelligence

This is sufficient. Don't add a vector database or embeddings system yet.

### Retry / Error Handling

Already using `MAX_RETRIES = 3` with exponential backoff in `generate-draft.ts`. Standardize this across all agent calls via the execution layer.

### Human-in-the-Loop Controls

- **Draft approval**: Send/edit/discard buttons on every draft (exists)
- **Sequence approval**: Sequence preview before activation (exists)
- **CRM update preview**: Show what will be written to CRM before sync (NEW — add)
- **Auto-send toggle**: Per-user setting with quality threshold (exists)
- **Agent activity log**: Show all agent actions so user maintains trust (NEW — add)

### Safety / Guardrails

- Quality scoring gates auto-send (exists)
- Haiku second-opinion grading (exists)
- Usage limits per plan tier (exists)
- Add: PII detection scan before any email send
- Add: Rate limiting on Claude API calls per user per hour
- Add: "Emergency stop" — user can pause all automation instantly

### Analytics on Agent Usage

Track per-user, per-agent:
- Executions count
- Success/failure rate
- Average quality score
- Cost (tokens + dollars)
- Time saved (estimated)
- User edit rate (how often they modify AI output)

Most of this data is already in `usage_logs`. Add a dashboard widget.

### Settings / Admin Controls

Keep it simple. One settings section with:
- Tone preference (exists)
- Auto-send toggle + quality threshold (exists)
- Notification preferences (email/Slack)
- CRM sync toggle per field
- "Pause all AI" emergency switch

---

## 5. UX Recommendations

### Post-Meeting Flow (Exists — Polish)

**Trigger**: Meeting ends → transcript processed → draft ready
**UI**: Dashboard shows notification badge. Clicking opens draft in editor.
**Approval**: Edit in rich text editor → Send button. Auto-send users get notification instead.
**Output**: Draft with quality score badge, action items checklist, meeting type tag.

**Recommendation**: Add a "Meeting processed" toast/notification that links directly to the draft. Currently users have to navigate to find it.

### Sequences (Exists — Enhance)

**Trigger**: After first draft is sent, sequence auto-generates
**UI**: Sequences page shows timeline of steps with status (scheduled/sent/opened/replied)
**Configuration**: Minimal — user can edit individual steps, adjust timing
**Approval**: Each step should be previewable. Auto-send users get steps sent automatically; review users get notification before each send.

**Recommendation**: Add engagement indicators on each step (open/click icons). Add "Regenerate this step" button.

### Next Steps (Exists — Enhance)

**Trigger**: Extracted from transcript automatically
**UI**: Next-step timeline on meeting detail page
**Interaction**: Checkbox to mark complete → triggers CRM sync

**Recommendation**: Add due date badges. Add "Overdue" highlighting. Surface overdue next-steps on dashboard home.

### Contacts (NEW)

**Trigger**: Auto-created from meeting participants
**UI**: Contacts page with list view. Contact detail shows: all meetings, all emails, relationship summary, engagement score.
**Automatic**: Contact creation is automatic. Enrichment is triggered before meetings.
**Manual**: User can manually add contacts, edit details.

**Recommendation**: Start with a simple contacts list that aggregates existing data. Don't build enrichment until Phase 2.

### Inbox / Replies (NEW — Phase 2)

**Trigger**: Reply received on tracked email
**UI**: Badge on reply showing intent classification (interested / objection / question / etc.)
**Interaction**: Click reply → see suggested response. One-click to use it, or edit.
**Automatic**: Classification is automatic. Response drafting requires user trigger.

**Recommendation**: Don't build a full inbox. Add reply classification as badges on the Drafts page where replies already show up.

### Pipeline / Deal Health (Exists — Surface Better)

**Trigger**: Health score updates after each meeting/engagement event
**UI**: Dashboard home should show deal risk alerts prominently. Meeting detail shows health score.
**Automatic**: Health score calculation is automatic.

**Recommendation**: The deal health data exists but is undersurfaced. Add a "Deals at Risk" card on dashboard home with the 3 most at-risk deals.

### AI Actions Feed (NEW)

**Trigger**: Every agent action
**UI**: Small feed/log on dashboard showing recent AI actions: "Generated draft for meeting with Sarah", "Updated HubSpot deal stage to Negotiation", "Paused sequence — meeting booked with recipient"
**Purpose**: Build trust through transparency. Users need to see what automation is doing.

**Recommendation**: Simple reverse-chronological feed. 10 most recent actions. Expandable for details.

### Settings (Exists — Consolidate)

Current AI settings are in onboarding and scattered. Consolidate into one Settings > AI Preferences section:
- Tone (dropdown)
- Role (dropdown)
- Custom instructions (text field)
- Auto-send toggle + threshold
- Notification preferences
- "Pause all AI" toggle

---

## 6. Prioritized Roadmap

### Phase 1: Post-Meeting Autopilot (Complete the Core Loop)

**Goal**: Make the meeting → draft → sequence → CRM update pipeline bulletproof and delightful.

**Duration**: 2-3 weeks

**Included agent systems**:
- Draft Generation Agent (polish)
- Sequence Agent (polish)
- Signal Extraction Agent (polish)
- Pre-Meeting Briefing Agent (polish)
- CRM Sync Agent (polish)
- QA Review Agent (polish)
- Human Approval Flow (polish)

**Why first**: This is 80% built. The remaining 20% is polish, reliability, and UX quality. Shipping a bulletproof core loop is worth more than starting new features.

**Key deliverables**:
- Fix draft quality issues from code review (error handling, race conditions)
- Add "Meeting processed" notification flow
- Add CRM update preview before sync
- Add AI actions feed to dashboard
- Consolidate AI settings
- Add contacts auto-creation from meeting participants
- Improve time-saved tracking widget
- Fix onboarding state management bugs

**Dependencies**: None (all infrastructure exists)

**Risk**: Low — enhancing existing features

### Phase 2: Intelligence Layer (Make It Smarter)

**Goal**: Add engagement-awareness, contact intelligence, and inbox assistance.

**Duration**: 4-6 weeks

**Included agent systems**:
- Contact Intelligence Agent (new)
- Inbox Agent (new)
- Sequence Intelligence Agent (new)
- Enhanced Buyer Intent Agent
- Meeting-to-meeting continuity

**Why second**: These features differentiate ReplySequence from simple "meeting → email" tools. They create a compounding intelligence layer where the product gets smarter the more you use it.

**Key deliverables**:
- Contacts page with aggregated interaction history
- Reply intent classification (badges on drafts page)
- Auto-pause sequences on meeting booked / OOO detected
- Stale thread alerts
- Contact relationship summaries
- Engagement-optimized sequence timing
- Tone consistency checking

**Dependencies**: Phase 1 stability

**Risk**: Medium — new features requiring Claude prompt engineering and UI work

### Phase 3: Proactive Intelligence (The Product Thinks For You)

**Goal**: ReplySequence proactively surfaces insights and takes action.

**Duration**: 6-8 weeks

**Included agent systems**:
- Pipeline Digest Agent (new)
- Task Extraction Agent (enhanced)
- Contact Scoring
- Coaching Insights
- Win/Loss Analysis
- Engagement-triggered sequence branching
- Weekly pipeline digest
- Advanced analytics

**Why third**: These features require sufficient data accumulation and user trust. They're also less urgent than core loop reliability and basic intelligence.

**Key deliverables**:
- Weekly pipeline digest email
- Coaching insights ("your discovery calls run too long")
- Contact scoring on contacts page
- Win/loss analysis on closed deals
- Sequence branching based on engagement
- Advanced engagement analytics
- CRM data quality alerts

**Dependencies**: Phase 2 contact and pipeline data

**Risk**: Medium-High — requires significant data and prompt engineering

---

## 7. ClickUp Implementation Tasks

### EPIC 1: Agent Execution Foundation

**Objective**: Standardize how all agents execute, log, and handle errors.
**Why it matters**: Every agent improvement multiplies across the platform. Without this, each agent has bespoke error handling and logging.
**Priority**: P0
**Dependencies**: None

#### Task 1.1: Create shared agent execution wrapper
- **Description**: Create `lib/agents/core.ts` with a standardized execution wrapper that handles context assembly, Claude API calls, response parsing, validation, error handling, retries, cost tracking, and structured logging.
- **Why it matters**: Currently each agent (draft gen, signal extraction, CRM auto-populate, etc.) has its own retry logic, error handling, and logging. Standardizing prevents bugs and makes every agent more reliable.
- **Acceptance criteria**:
  - `executeAgent<TInput, TOutput>()` function that wraps any agent execution
  - Automatic structured logging with agent name, duration, token usage, cost
  - Automatic retry with exponential backoff (configurable, default 3 retries)
  - Automatic Sentry breadcrumb on every execution
  - Automatic usage_logs insertion
  - Type-safe input/output via generics
- **Technical notes**: Model after existing patterns in `generate-draft.ts` (retries, cost tracking). Extract common patterns, don't reinvent.
- **Dependencies**: None
- **Priority**: P0
- **Estimated effort**: M
- **Owner type**: Backend / AI
- **Phase**: 1

#### Task 1.2: Migrate draft generation to agent wrapper
- **Description**: Refactor `lib/generate-draft.ts` to use the new agent execution wrapper while preserving all existing behavior.
- **Why it matters**: Draft generation is the highest-traffic agent. Migrating it validates the wrapper and improves its reliability.
- **Acceptance criteria**:
  - Draft generation uses `executeAgent()` wrapper
  - All existing tests pass
  - Logging output matches new structured format
  - Cost tracking flows through wrapper
  - No behavior changes visible to user
- **Technical notes**: Keep `generate-draft.ts` as the public API; internally delegate to wrapper. Don't change the function signature.
- **Dependencies**: Task 1.1
- **Priority**: P0
- **Estimated effort**: S
- **Owner type**: Backend
- **Phase**: 1

#### Task 1.3: Migrate signal extraction to agent wrapper
- **Description**: Refactor `lib/signals/extract.ts` to use the agent execution wrapper.
- **Why it matters**: Signals power deal health, next steps, and risk detection. Standardizing error handling prevents silent failures.
- **Acceptance criteria**:
  - Signal extraction uses `executeAgent()` wrapper
  - All existing behavior preserved
  - Structured logging replaces custom `logMetric` calls
- **Dependencies**: Task 1.1
- **Priority**: P0
- **Estimated effort**: S
- **Owner type**: Backend
- **Phase**: 1

#### Task 1.4: Migrate CRM auto-populate to agent wrapper
- **Description**: Refactor `lib/crm-auto-populate.ts` to use the agent execution wrapper.
- **Acceptance criteria**: Uses wrapper. Existing behavior preserved. Structured logging.
- **Dependencies**: Task 1.1
- **Priority**: P0
- **Estimated effort**: S
- **Owner type**: Backend
- **Phase**: 1

#### Task 1.5: Migrate pre-meeting briefing to agent wrapper
- **Description**: Refactor `lib/pre-meeting-briefing.ts` to use the agent execution wrapper.
- **Acceptance criteria**: Uses wrapper. Existing behavior preserved. Structured logging.
- **Dependencies**: Task 1.1
- **Priority**: P0
- **Estimated effort**: S
- **Owner type**: Backend
- **Phase**: 1

#### Task 1.6: Migrate sequence generator to agent wrapper
- **Description**: Refactor `lib/sequence-generator.ts` to use the agent execution wrapper.
- **Acceptance criteria**: Uses wrapper. Existing behavior preserved.
- **Dependencies**: Task 1.1
- **Priority**: P0
- **Estimated effort**: S
- **Owner type**: Backend
- **Phase**: 1

---

### EPIC 2: Post-Meeting Pipeline Reliability

**Objective**: Fix the bugs and gaps identified in code review that affect the core meeting → draft → sequence pipeline.
**Why it matters**: The core loop is the product. If it's unreliable, nothing else matters.
**Priority**: P0
**Dependencies**: None (can run in parallel with Epic 1)

#### Task 2.1: Add OAuth state validation to Meet/Gmail/Zoom/Outlook callbacks
- **Description**: Implement cookie-based state parameter validation for the 4 OAuth providers that currently only decode base64 without server-side verification. Follow the existing HubSpot/Salesforce pattern.
- **Why it matters**: CRITICAL security vulnerability — enables CSRF attacks on OAuth flows.
- **Acceptance criteria**:
  - All 4 callbacks set a state cookie during auth initiation
  - All 4 callbacks validate the cookie matches the returned state
  - State includes timestamp; reject states older than 10 minutes
  - Error redirects use generic error message (no stack trace in URL)
- **Technical notes**: HubSpot callback (`app/api/auth/hubspot/callback/route.ts`) is the reference implementation.
- **Dependencies**: None
- **Priority**: P0
- **Estimated effort**: M
- **Owner type**: Backend
- **Phase**: 1

#### Task 2.2: Add meeting ownership checks
- **Description**: Add userId/hostEmail verification to `app/api/meetings/[meetingId]/route.ts` and all sub-routes (summary, signals, recipients, map, reprocess, status).
- **Why it matters**: Any authenticated user can currently read any meeting by ID.
- **Acceptance criteria**:
  - GET /api/meetings/[meetingId] returns 403 if user is not the meeting host
  - All sub-routes (summary, signals, recipients, etc.) inherit the same check
  - Admin override option for future admin features
- **Dependencies**: None
- **Priority**: P0
- **Estimated effort**: S
- **Owner type**: Backend
- **Phase**: 1

#### Task 2.3: Wrap multi-step DB operations in transactions
- **Description**: Identify all API routes that perform multiple related DB writes and wrap them in `db.transaction()`. Priority: disconnect handlers, draft send flow, meeting processing pipeline.
- **Why it matters**: Partial writes leave orphaned records and inconsistent state.
- **Acceptance criteria**:
  - Email/calendar/platform disconnect handlers use transactions
  - Draft send flow (send + update status + track events + CRM sync trigger) uses transaction for DB writes
  - Meeting processing pipeline (meeting update + draft insert + signal insert) uses transaction
- **Technical notes**: Drizzle supports `db.transaction(async (tx) => { ... })`. Use `tx` instead of `db` for all queries inside.
- **Dependencies**: None
- **Priority**: P0
- **Estimated effort**: M
- **Owner type**: Backend
- **Phase**: 1

#### Task 2.4: Add fetch timeouts to all external API calls
- **Description**: Add AbortController with timeout to every `fetch()` call in `lib/` that calls external APIs (Recall.ai, Google, Microsoft, HubSpot, Salesforce, Resend, Slack).
- **Why it matters**: External calls without timeouts can hang indefinitely, blocking serverless function execution.
- **Acceptance criteria**:
  - Every external fetch in lib/ uses AbortController with 15-second timeout
  - Timeout errors are caught and logged with the external service name
  - Existing retry logic respects timeout errors
- **Technical notes**: Create a `lib/fetch-with-timeout.ts` utility. Don't modify the Claude API client (it already has timeout config).
- **Dependencies**: None
- **Priority**: P0
- **Estimated effort**: M
- **Owner type**: Backend
- **Phase**: 1

#### Task 2.5: Fix token refresh race conditions
- **Description**: Add database-level locking to token refresh operations in `lib/meet-token.ts`, `lib/teams-token.ts`, and `lib/email-sender.ts` to prevent concurrent refresh attempts.
- **Why it matters**: Multiple concurrent requests can trigger simultaneous token refreshes, causing token invalidation.
- **Acceptance criteria**:
  - Token refresh uses optimistic locking (version field) or SELECT FOR UPDATE
  - Only one refresh executes when multiple concurrent requests arrive
  - Other requests wait for refresh to complete and use the new token
- **Technical notes**: Simplest approach: add a `tokenVersion` column. Only refresh if version matches; update version atomically on refresh.
- **Dependencies**: Database migration
- **Priority**: P0
- **Estimated effort**: L
- **Owner type**: Backend
- **Phase**: 1

#### Task 2.6: Fix onboarding state race condition
- **Description**: Combine the two independent useEffect hooks in `app/onboarding/page.tsx` into a single synchronized flow that loads progress first, then applies OAuth callback overrides.
- **Why it matters**: OAuth callback state gets overwritten by loadProgress defaults when both run simultaneously.
- **Acceptance criteria**:
  - Single useEffect handles both loadProgress and OAuth callback
  - OAuth state correctly persists through the flow
  - emailError prop threaded to StepEmailConnect component
  - SessionStorage sync issues resolved (single source of truth from server)
- **Dependencies**: None
- **Priority**: P0
- **Estimated effort**: M
- **Owner type**: Frontend
- **Phase**: 1

---

### EPIC 3: AI Actions & Transparency

**Objective**: Give users visibility into what agents are doing, building trust for automation.
**Why it matters**: Users won't enable auto-send if they can't see and trust what the AI does.
**Priority**: P0
**Dependencies**: None

#### Task 3.1: Create agent_actions database table
- **Description**: Create a table to log every agent action (draft generated, CRM updated, sequence created, etc.) with the agent name, action type, entity reference, timestamp, and cost.
- **Why it matters**: Powers the AI actions feed and analytics.
- **Acceptance criteria**:
  - Table: `agent_actions(id, userId, agentName, actionType, entityType, entityId, summary, inputTokens, outputTokens, costUsd, durationMs, createdAt)`
  - Migration created and applied
  - Drizzle schema added
- **Dependencies**: None
- **Priority**: P0
- **Estimated effort**: S
- **Owner type**: Backend
- **Phase**: 1

#### Task 3.2: Log agent actions from execution wrapper
- **Description**: Add automatic `agent_actions` insertion to the agent execution wrapper created in Task 1.1.
- **Acceptance criteria**:
  - Every agent execution creates an agent_actions record
  - Record includes summary, cost, duration
  - Failed executions are also logged with error flag
- **Dependencies**: Task 1.1, Task 3.1
- **Priority**: P0
- **Estimated effort**: S
- **Owner type**: Backend
- **Phase**: 1

#### Task 3.3: Build AI Actions feed API endpoint
- **Description**: Create `GET /api/agent-actions` that returns the most recent agent actions for the authenticated user.
- **Acceptance criteria**:
  - Returns 20 most recent actions, paginated
  - Filterable by agent name, action type, date range
  - Includes entity links (meetingId, draftId, etc.)
- **Dependencies**: Task 3.1
- **Priority**: P0
- **Estimated effort**: S
- **Owner type**: Backend
- **Phase**: 1

#### Task 3.4: Build AI Actions feed UI component
- **Description**: Create a `RecentAIActions` component (file already exists as stub) that displays the agent actions feed on the dashboard.
- **Why it matters**: Users need to see what automation is doing to build trust.
- **Acceptance criteria**:
  - Shows 10 most recent actions with icons per agent type
  - Each action links to the relevant entity (draft, meeting, etc.)
  - Shows timestamp in relative format ("2 hours ago")
  - Shows total cost saved / time saved summary at top
  - Auto-refreshes every 60 seconds
- **Dependencies**: Task 3.3
- **Priority**: P0
- **Estimated effort**: M
- **Owner type**: Frontend
- **Phase**: 1

---

### EPIC 4: Contacts Foundation

**Objective**: Auto-create and aggregate contact records from meeting participants.
**Why it matters**: Contact intelligence is the foundation for personalization, enrichment, and relationship tracking.
**Priority**: P0
**Dependencies**: None

#### Task 4.1: Create contacts table and schema
- **Description**: The contacts API route exists but check if the schema supports: name, email, company, title, first seen date, last interaction date, total meetings, total emails, total sequences, relationship summary, notes.
- **Acceptance criteria**:
  - Contacts schema supports all fields above
  - Migration created if needed
  - Unique constraint on (userId, email)
- **Dependencies**: None
- **Priority**: P0
- **Estimated effort**: S
- **Owner type**: Backend
- **Phase**: 1

#### Task 4.2: Auto-create contacts from meeting participants
- **Description**: After each meeting is processed, create or update contact records for all non-host participants.
- **Acceptance criteria**:
  - New contacts created for first-time participants
  - Existing contacts get `lastInteractionAt` and `totalMeetings` updated
  - Contact name parsed from participant data
  - No duplicate contacts per email per user
- **Technical notes**: Add to the meeting processing pipeline after draft generation.
- **Dependencies**: Task 4.1
- **Priority**: P0
- **Estimated effort**: M
- **Owner type**: Backend
- **Phase**: 1

#### Task 4.3: Build contacts page with interaction history
- **Description**: Enhance the existing Dashboard > Contacts page to show all contacts with aggregated interaction data.
- **Acceptance criteria**:
  - Contact list view with name, email, company, last interaction, meeting count, email count
  - Click contact → detail view showing all meetings and emails with this person
  - Search and filter by name/email/company
  - Relationship summary (from contact_memories) displayed on detail view
- **Dependencies**: Task 4.1, Task 4.2
- **Priority**: P1
- **Estimated effort**: L
- **Owner type**: Frontend
- **Phase**: 1

---

### EPIC 5: Sequence Polish & Intelligence

**Objective**: Make sequences more reliable and engagement-aware.
**Why it matters**: Sequences that ignore context (OOO replies, booked meetings) waste shots and annoy recipients.
**Priority**: P1
**Dependencies**: Epic 2 (reliability fixes)

#### Task 5.1: Auto-pause sequence on meeting booked
- **Description**: When a calendar event is created with a recipient who has an active sequence, auto-pause the sequence and notify the user.
- **Acceptance criteria**:
  - Calendar sync detects new meeting with sequence recipient
  - Sequence status changes to 'paused' with reason 'meeting_booked'
  - User gets notification (email or dashboard)
  - Sequence can be manually resumed
- **Dependencies**: Calendar sync working
- **Priority**: P1
- **Estimated effort**: M
- **Owner type**: Backend
- **Phase**: 2

#### Task 5.2: Detect and handle out-of-office replies
- **Description**: When an auto-reply is received on a tracked email, classify it as OOO. Extract return date if mentioned. Pause active sequences for this recipient.
- **Acceptance criteria**:
  - OOO detection via simple pattern matching on reply content (not Claude — too expensive)
  - Return date extraction (regex for common date patterns)
  - Active sequences paused with reason 'ooo' and estimated resume date
  - User notification with return date
- **Dependencies**: Email reply tracking
- **Priority**: P1
- **Estimated effort**: M
- **Owner type**: Backend
- **Phase**: 2

#### Task 5.3: Stale thread detection and alerts
- **Description**: Daily cron that identifies sent drafts with no reply after 7+ days and no active sequence. Surface these as "needs attention" on dashboard.
- **Acceptance criteria**:
  - Cron identifies stale threads (sent, no reply, no active sequence, > 7 days)
  - Dashboard shows "X threads need attention" alert
  - User can click to see list and take action (resend, archive, start sequence)
- **Dependencies**: None
- **Priority**: P1
- **Estimated effort**: M
- **Owner type**: Full-stack
- **Phase**: 2

#### Task 5.4: Sequence step rewrite action
- **Description**: Add a "Rewrite" button on each sequence step that regenerates the step content using Claude with updated context (engagement data, time passed, contact history).
- **Acceptance criteria**:
  - "Rewrite" button on sequence step cards
  - Regeneration uses current engagement data as context
  - User can preview before accepting rewrite
  - Original content preserved (can undo)
- **Dependencies**: Task 1.1 (agent wrapper)
- **Priority**: P1
- **Estimated effort**: M
- **Owner type**: Full-stack
- **Phase**: 2

---

### EPIC 6: Inbox Intelligence

**Objective**: Classify incoming replies and surface actionable insights.
**Why it matters**: Knowing if a reply means "interested" vs "not now" vs "unsubscribe" changes what you do next.
**Priority**: P1
**Dependencies**: Email tracking, reply detection

#### Task 6.1: Build reply intent classifier
- **Description**: Create `lib/agents/classify-reply.ts` that classifies email replies into intent categories using Claude Haiku (cheap, fast).
- **Why it matters**: This is the foundation of inbox intelligence.
- **Acceptance criteria**:
  - Classifications: interested, objection, question, scheduling, not_now, unsubscribe, out_of_office, other
  - Uses Haiku for cost efficiency (< $0.001 per classification)
  - Returns confidence score
  - Stores classification on draft record (new column: `replyIntent`, `replyIntentConfidence`)
- **Technical notes**: Use Haiku, not Sonnet — this is a simple classification task.
- **Dependencies**: Task 1.1
- **Priority**: P1
- **Estimated effort**: M
- **Owner type**: AI / Backend
- **Phase**: 2

#### Task 6.2: Trigger classification on reply received
- **Description**: When the Resend webhook detects a reply, trigger the reply intent classifier.
- **Acceptance criteria**:
  - Webhook handler triggers classifier for new replies
  - Classification stored on draft record
  - Agent action logged
- **Dependencies**: Task 6.1
- **Priority**: P1
- **Estimated effort**: S
- **Owner type**: Backend
- **Phase**: 2

#### Task 6.3: Display reply intent badges in Drafts view
- **Description**: Show intent classification badges on draft cards in the Drafts page for drafts that have received replies.
- **Acceptance criteria**:
  - Color-coded badge: green (interested), yellow (question/scheduling), orange (objection/not_now), red (unsubscribe)
  - Badge visible on draft list and detail views
  - Filter drafts by reply intent
- **Dependencies**: Task 6.2
- **Priority**: P1
- **Estimated effort**: S
- **Owner type**: Frontend
- **Phase**: 2

---

### EPIC 7: Pipeline Visibility

**Objective**: Surface deal health and risk data prominently in the dashboard.
**Why it matters**: Deal intelligence exists in the DB but is undersurfaced. Users don't see the value.
**Priority**: P1
**Dependencies**: Signal extraction working

#### Task 7.1: Build "Deals at Risk" dashboard card
- **Description**: Create a dashboard card showing the top 3-5 deals with declining health scores or high-severity risk signals.
- **Acceptance criteria**:
  - Card shows deal name, health score, primary risk, last activity date
  - Clicking a deal links to the meeting detail page
  - Card visible on dashboard home
  - Empty state when no deals are at risk
- **Dependencies**: Health score calculation
- **Priority**: P1
- **Estimated effort**: M
- **Owner type**: Frontend
- **Phase**: 2

#### Task 7.2: CRM update preview before sync
- **Description**: When auto-populating CRM fields, show the user what will be written before it happens (for users not in auto-send mode).
- **Acceptance criteria**:
  - After meeting processing, show "CRM Update Preview" card on meeting detail
  - Shows old value vs new value for each field
  - "Approve" and "Skip" buttons
  - Auto-sync users get it pushed automatically (existing behavior)
- **Dependencies**: CRM auto-populate working
- **Priority**: P1
- **Estimated effort**: M
- **Owner type**: Full-stack
- **Phase**: 2

---

### EPIC 8: Settings Consolidation

**Objective**: One place for all AI preferences and automation controls.
**Why it matters**: Current settings are scattered across onboarding and multiple settings tabs.
**Priority**: P1
**Dependencies**: None

#### Task 8.1: Consolidate AI settings into single settings section
- **Description**: Create a unified "AI & Automation" section in Settings that includes: tone, role, custom instructions, auto-send toggle + threshold, notification preferences, and "Pause all AI" toggle.
- **Acceptance criteria**:
  - Single AI settings section in Settings page
  - All existing AI preferences migrated
  - Changes save immediately (optimistic update with rollback)
  - "Pause all AI" toggle stops all agent executions for this user
- **Dependencies**: None
- **Priority**: P1
- **Estimated effort**: M
- **Owner type**: Frontend
- **Phase**: 1

---

### EPIC 9: Analytics & Time Savings

**Objective**: Show users the value they're getting from ReplySequence.
**Why it matters**: If users can't quantify time saved, they won't pay or refer.
**Priority**: P1
**Dependencies**: Task 3.1 (agent_actions table)

#### Task 9.1: Enhanced time-saved tracking
- **Description**: Calculate and display time saved per meeting (draft writing time, CRM update time, sequence creation time) based on agent_actions data.
- **Acceptance criteria**:
  - TimeSavingsWidget shows: meetings processed, drafts generated, CRM updates, sequences created, total hours saved
  - Calculation: draft = 15 min saved, CRM update = 5 min saved, sequence = 20 min saved, briefing = 10 min saved
  - Shows weekly and monthly totals
  - Shows dollar value saved (using user's configured hourly rate)
- **Dependencies**: Task 3.1
- **Priority**: P1
- **Estimated effort**: M
- **Owner type**: Full-stack
- **Phase**: 1

---

### EPIC 10: Phase 3 — Proactive Intelligence

**Objective**: Pipeline digests, coaching, and advanced automation.
**Priority**: P2
**Dependencies**: Phase 1 + 2

#### Task 10.1: Weekly pipeline digest email
- **Description**: Cron job that generates and sends a weekly email summarizing: meetings this week, deals advanced, deals at risk, follow-ups pending, time saved.
- **Estimated effort**: L
- **Phase**: 3

#### Task 10.2: Coaching insights from meeting patterns
- **Description**: Analyze transcript patterns across meetings to surface coaching suggestions (talk ratio, question frequency, monologue length).
- **Estimated effort**: XL
- **Phase**: 3

#### Task 10.3: Contact scoring model
- **Description**: Score contacts based on engagement velocity, meeting frequency, and signal patterns.
- **Estimated effort**: L
- **Phase**: 3

#### Task 10.4: Engagement-triggered sequence branching
- **Description**: Allow sequences to branch based on engagement signals (opened vs ignored, clicked vs didn't, replied vs ghosted).
- **Estimated effort**: XL
- **Phase**: 3

#### Task 10.5: Win/loss analysis agent
- **Description**: When a deal is marked closed, generate a structured analysis of what worked and what didn't across all meetings and interactions.
- **Estimated effort**: L
- **Phase**: 3

---

## 8. Recommended First 15 Tasks

Ordered for maximum leverage:

1. **Task 2.1**: Fix OAuth state validation (CRITICAL security)
2. **Task 2.2**: Add meeting ownership checks (CRITICAL security)
3. **Task 1.1**: Create shared agent execution wrapper (foundation)
4. **Task 2.3**: Wrap DB operations in transactions (data integrity)
5. **Task 2.4**: Add fetch timeouts to external API calls (reliability)
6. **Task 3.1**: Create agent_actions table (transparency foundation)
7. **Task 2.5**: Fix token refresh race conditions (reliability)
8. **Task 2.6**: Fix onboarding state race condition (UX bug)
9. **Task 1.2**: Migrate draft generation to agent wrapper (validation)
10. **Task 3.2**: Log agent actions from wrapper (transparency)
11. **Task 4.1**: Contacts table and schema (contacts foundation)
12. **Task 4.2**: Auto-create contacts from meeting participants (value)
13. **Task 3.3**: Build agent actions API endpoint (transparency)
14. **Task 3.4**: Build AI actions feed UI (trust building)
15. **Task 8.1**: Consolidate AI settings (UX polish)

This sequence delivers: security fixes → infrastructure → transparency → contacts → polish.

---

## 9. Suggested Workstreams

### Database / Schema Work
- Agent actions table (Task 3.1)
- Contacts schema enhancements (Task 4.1)
- Token version column for locking (Task 2.5)
- Reply intent columns on drafts (Task 6.1)
- OAuth state cookie handling (Task 2.1)

### Backend / API Work
- Agent execution wrapper (Task 1.1)
- All agent migrations (Tasks 1.2-1.6)
- OAuth state validation (Task 2.1)
- Meeting ownership checks (Task 2.2)
- Transaction wrapping (Task 2.3)
- Fetch timeouts (Task 2.4)
- Token refresh locking (Task 2.5)
- Agent actions API (Task 3.3)
- Contact auto-creation (Task 4.2)
- Sequence pause on meeting booked (Task 5.1)
- OOO detection (Task 5.2)
- Stale thread detection (Task 5.3)
- Reply intent classifier (Task 6.1)

### AI / Prompt Work
- Reply intent classification prompt (Task 6.1)
- Sequence step rewrite prompt (Task 5.4)
- Contact relationship summary prompt (Task 4.3)
- Pipeline digest generation (Task 10.1)
- Coaching insights prompts (Task 10.2)

### Frontend / UI Work
- Fix onboarding state management (Task 2.6)
- AI actions feed component (Task 3.4)
- Contacts page (Task 4.3)
- Reply intent badges (Task 6.3)
- Deals at risk card (Task 7.1)
- CRM update preview (Task 7.2)
- AI settings consolidation (Task 8.1)
- Time savings widget enhancement (Task 9.1)

### Analytics / Telemetry Work
- Agent action logging (Task 3.2)
- Time savings calculation (Task 9.1)
- Agent cost tracking (via execution wrapper)
- Engagement analytics (Phase 2)

### QA / Review / Testing Work
- OAuth flow security testing (after Task 2.1)
- Transaction integrity testing (after Task 2.3)
- Agent wrapper integration tests (after Task 1.1)
- End-to-end meeting → draft → sequence pipeline test
- Reply classification accuracy testing (after Task 6.1)

### Documentation Work
- Agent system architecture doc (after Epic 1)
- API documentation for new endpoints (ongoing)
- Prompt engineering runbook for tuning agent prompts

---

## 10. Final Recommendation

**Build the reliability layer first.** You have an 80% complete product with real AI features that already work. The biggest risk isn't missing features — it's unreliable features. Fix the security issues (OAuth state, ownership checks), add transactions, add timeouts. This takes 2-3 days of focused work.

**Then add transparency.** The agent_actions feed is the single most important new feature for adoption. Users need to see and trust what automation is doing before they'll turn on auto-send.

**Then build contacts.** Contact intelligence is where the compounding happens. Every meeting enriches the contact graph, which makes every future draft better, every briefing smarter, every sequence more personalized.

**Don't build inbox or pipeline features until Phase 1 is bulletproof.** It's tempting to add Inbox Intelligence and Pipeline Digests because they sound impressive. But if the core meeting → draft → sequence loop has bugs, adding more features just adds more surface area for failures.

**Don't build a generic agent framework.** You don't need one. The thin execution wrapper (Task 1.1) is the right level of abstraction — it standardizes logging, retries, and cost tracking without the overhead of a framework. Every agent is still just a function that calls Claude with a structured prompt.

**Ship the first 15 tasks in 2 weeks.** That's your "agents V1" — a product where meetings automatically produce drafts, sequences, CRM updates, and next steps, and the user can see everything the AI did in a single feed. That's the story for beta launch.

---

## CLICKUP COPY BLOCKS

### Epic: Agent Execution Foundation
> Standardize how all agents execute, log, and handle errors. Creates shared execution wrapper used by every AI feature.

**Task: Create shared agent execution wrapper**
`lib/agents/core.ts` — executeAgent<TInput, TOutput>() with retries, logging, Sentry, cost tracking, usage_logs insertion
- [ ] Generic executeAgent function with type-safe I/O
- [ ] Exponential backoff retry (default 3)
- [ ] Structured JSON logging with agent name, duration, tokens, cost
- [ ] Sentry breadcrumb per execution
- [ ] Auto-insert usage_logs record
- [ ] Unit tests

**Task: Migrate draft generation to agent wrapper**
Refactor `lib/generate-draft.ts` to use executeAgent() internally. No behavior changes.
- [ ] Draft gen delegates to wrapper
- [ ] All existing behavior preserved
- [ ] Logging matches new format

**Task: Migrate signal extraction to agent wrapper**
Refactor `lib/signals/extract.ts` to use executeAgent().
- [ ] Signal extraction uses wrapper
- [ ] Replaces custom logMetric calls

**Task: Migrate CRM auto-populate to agent wrapper**
Refactor `lib/crm-auto-populate.ts` to use executeAgent().

**Task: Migrate pre-meeting briefing to agent wrapper**
Refactor `lib/pre-meeting-briefing.ts` to use executeAgent().

**Task: Migrate sequence generator to agent wrapper**
Refactor `lib/sequence-generator.ts` to use executeAgent().

---

### Epic: Post-Meeting Pipeline Reliability
> Fix security and reliability bugs in the core meeting → draft → sequence pipeline. Must be done before beta launch.

**Task: Fix OAuth state validation (4 providers)**
Add cookie-based state validation to Meet, Gmail, Zoom, Outlook callbacks. Match HubSpot pattern.
- [ ] State cookie set during auth initiation for all 4 providers
- [ ] Callback validates cookie matches returned state
- [ ] State includes timestamp; reject > 10 minutes
- [ ] Error redirects use generic message (no stack traces)

**Task: Add meeting ownership checks**
`app/api/meetings/[meetingId]/route.ts` + sub-routes — verify authenticated user is meeting host.
- [ ] GET returns 403 if user is not host
- [ ] All sub-routes (summary, signals, etc.) inherit check

**Task: Wrap multi-step DB operations in transactions**
Add `db.transaction()` to disconnect handlers, draft send flow, meeting processing pipeline.
- [ ] Disconnect handlers wrapped
- [ ] Draft send flow wrapped
- [ ] Meeting processing pipeline wrapped

**Task: Add fetch timeouts to external API calls**
Create `lib/fetch-with-timeout.ts` utility. Apply to all external fetch calls in lib/.
- [ ] Utility created with 15s default timeout
- [ ] All external fetches use utility
- [ ] Timeout errors logged with service name

**Task: Fix token refresh race conditions**
Add optimistic locking (version field) to token refresh in meet-token.ts, teams-token.ts, email-sender.ts.
- [ ] tokenVersion column migration
- [ ] Refresh only executes if version matches
- [ ] Concurrent requests wait for refresh result

**Task: Fix onboarding state race condition**
Combine dual useEffect hooks in onboarding/page.tsx into single synchronized flow.
- [ ] Single useEffect for loadProgress + OAuth callback
- [ ] emailError prop threaded to StepEmailConnect
- [ ] Single source of truth (server state, not sessionStorage)

---

### Epic: AI Actions & Transparency
> Give users visibility into what agents are doing. Builds trust for automation.

**Task: Create agent_actions database table**
`agent_actions(id, userId, agentName, actionType, entityType, entityId, summary, inputTokens, outputTokens, costUsd, durationMs, status, createdAt)`
- [ ] Migration created and applied
- [ ] Drizzle schema added
- [ ] Indexed on userId + createdAt

**Task: Log agent actions from execution wrapper**
Auto-insert agent_actions record on every executeAgent() call.
- [ ] Success executions logged
- [ ] Failed executions logged with error status
- [ ] Cost and duration included

**Task: Build agent actions API endpoint**
`GET /api/agent-actions` — paginated list of recent agent actions for authenticated user.
- [ ] 20 per page, cursor pagination
- [ ] Filter by agentName, actionType, dateRange
- [ ] Includes entity links

**Task: Build AI Actions feed UI component**
Dashboard component showing 10 most recent AI actions with icons, timestamps, and links.
- [ ] Reverse-chronological feed
- [ ] Icons per agent type
- [ ] Relative timestamps
- [ ] Links to relevant entities
- [ ] Summary stat at top (total actions this week, time saved)

---

### Epic: Contacts Foundation
> Auto-create and aggregate contact records from meeting participants.

**Task: Verify/extend contacts schema**
Ensure contacts table has: name, email, company, title, firstSeenAt, lastInteractionAt, totalMeetings, totalEmails, relationshipSummary, notes.
- [ ] Schema verified or migration created
- [ ] Unique constraint on (userId, email)

**Task: Auto-create contacts from meeting participants**
After meeting processing, upsert contact records for all non-host participants.
- [ ] New contacts created for first-time participants
- [ ] Existing contacts updated (lastInteractionAt, totalMeetings)
- [ ] No duplicates per email per user

**Task: Build contacts page with interaction history**
Dashboard > Contacts — list view with search, filter, and contact detail with all interactions.
- [ ] List view: name, email, company, last interaction, meeting count
- [ ] Detail view: all meetings + emails with this person
- [ ] Search by name/email/company
- [ ] Relationship summary displayed

---

### Epic: Sequence Polish & Intelligence
> Make sequences engagement-aware and smarter.

**Task: Auto-pause sequence on meeting booked**
Calendar sync detects new meeting with sequence recipient → pause sequence → notify user.
- [ ] Detection logic in calendar sync pipeline
- [ ] Sequence status → 'paused', reason → 'meeting_booked'
- [ ] User notification

**Task: Detect and handle OOO replies**
Pattern-match auto-replies as OOO. Extract return date. Pause sequences.
- [ ] OOO detection via regex (not Claude)
- [ ] Return date extraction
- [ ] Sequence paused with resume date

**Task: Stale thread detection and alerts**
Daily cron: find drafts sent 7+ days ago with no reply and no active sequence.
- [ ] Cron identifies stale threads
- [ ] Dashboard "X threads need attention" alert
- [ ] User can act (resend, archive, start sequence)

**Task: Sequence step rewrite action**
"Rewrite" button on sequence step that regenerates with updated engagement context.
- [ ] Button on step cards
- [ ] Regeneration uses current engagement data
- [ ] Preview before accept
- [ ] Undo available

---

### Epic: Inbox Intelligence
> Classify reply intent and surface actionable insights.

**Task: Build reply intent classifier**
`lib/agents/classify-reply.ts` — Haiku-based classification into 8 intent categories.
- [ ] Classifications: interested, objection, question, scheduling, not_now, unsubscribe, ooo, other
- [ ] Uses Haiku (< $0.001 per classification)
- [ ] Stores replyIntent + confidence on draft record
- [ ] Migration for new columns

**Task: Trigger classification on reply received**
Resend webhook → trigger classifier for new replies.
- [ ] Webhook handler triggers classifier
- [ ] Classification stored
- [ ] Agent action logged

**Task: Display reply intent badges in Drafts view**
Color-coded badges on draft cards showing reply intent.
- [ ] Green (interested), yellow (question), orange (objection), red (unsubscribe)
- [ ] Visible on list + detail views
- [ ] Filter by intent

---

### Epic: Pipeline Visibility
> Surface deal health and risk data in the dashboard.

**Task: Build "Deals at Risk" dashboard card**
Top 3-5 deals with declining health scores or risk signals.
- [ ] Card on dashboard home
- [ ] Shows deal name, health score, risk, last activity
- [ ] Links to meeting detail
- [ ] Empty state

**Task: CRM update preview before sync**
Show old vs new values before CRM auto-populate writes.
- [ ] Preview card on meeting detail
- [ ] Old vs new value comparison
- [ ] Approve / Skip buttons

---

### Epic: Settings Consolidation
> One place for all AI preferences and automation controls.

**Task: Consolidate AI settings**
Unified "AI & Automation" section in Settings: tone, role, instructions, auto-send, notifications, pause toggle.
- [ ] Single settings section
- [ ] All existing prefs migrated
- [ ] Optimistic save with rollback
- [ ] "Pause all AI" toggle

---

### Epic: Analytics & Time Savings
> Show users the value they're getting.

**Task: Enhanced time-saved tracking**
Calculate and display hours/dollars saved per meeting based on agent_actions data.
- [ ] Meetings processed, drafts, CRM updates, sequences in widget
- [ ] Weekly + monthly totals
- [ ] Dollar value using configured hourly rate
