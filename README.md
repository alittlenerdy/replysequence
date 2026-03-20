# ReplySequence

> Every tool records the meeting. None of them send the follow-up.

ReplySequence turns every sales call into personalized follow-ups, multi-step sequences, tracked next steps, and CRM updates -- automatically.

**Production:** https://www.replysequence.com

---

## How It Works

1. **Have your meeting** -- Zoom, Google Meet, or Microsoft Teams. ReplySequence captures the transcript automatically via Recall.ai.
2. **AI generates everything** -- Personalized follow-up email, multi-step sequence, next steps with due dates, deal risk flags, and CRM updates. All from the transcript, in seconds.
3. **Review, approve, automate** -- Send the follow-up. Activate the sequence. Confirm next steps. The pipeline runs itself.

---

## Features

### Core Platform
- **AI Follow-Ups** -- Draft emails that reference the real conversation, not generic templates
- **Multi-Step Sequences** -- Automated nurture flows triggered by each meeting
- **Meeting Intelligence** -- Next steps extracted with due dates, risk flags for budget/timeline/champion gaps
- **Pipeline Automation** -- CRM updates, deal health scores, and opportunity tracking

### Dashboard
- **Command Center** -- Post-call system panel with draft review, sequence status, and next steps
- **Pipeline Intelligence** -- Opportunity health scoring, deals at risk alerts, time savings tracking
- **Meeting Inbox** -- All meetings with status badges, platform filters, and follow-up tracking
- **Drafts** -- Review and send AI-generated emails with quality scores
- **Sequences** -- Monitor multi-step follow-up campaigns with step-level status
- **Contacts** -- Auto-populated from meeting participants with relationship strength indicators
- **Analytics** -- Follow-up coverage, ROI calculator, engagement metrics, sequence performance
- **Settings** -- Email tone selection, AI instructions, integration management

### Integrations
- **Meeting platforms:** Zoom, Google Meet, Microsoft Teams (via Recall.ai)
- **CRM:** HubSpot, Salesforce, Google Sheets
- **Email:** Gmail, Outlook (via Resend for sending)
- **Calendar:** Google Calendar, Outlook Calendar
- **Billing:** Stripe (Free / Pro $19/mo / Team $29/mo)

---

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 16 (App Router) |
| Database | PostgreSQL + Drizzle ORM (45 tables) |
| Auth | Clerk |
| AI | Claude (Anthropic SDK) |
| Email Sending | Resend |
| Meeting Recording | Recall.ai |
| CRM | HubSpot, Salesforce, Google Sheets |
| Payments | Stripe |
| Analytics | PostHog |
| Error Tracking | Sentry |
| Deployment | Vercel |

---

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Clerk account
- Anthropic API key

### Installation

```bash
git clone https://github.com/alittlenerdy/replysequence.git
cd replysequence
npm install
cp .env.example .env.local
# Edit .env.local with your keys
npm run db:push
npm run dev
```

Visit http://localhost:3000

---

## Project Structure

```
replysequence/
├── app/                          # Next.js App Router
│   ├── api/                      # 100+ API routes
│   │   ├── webhooks/             # Platform webhooks (zoom, teams, meet, calendar, recall)
│   │   ├── drafts/               # Draft CRUD, send, regenerate, refine
│   │   ├── sequences/            # Sequence management, step rewriting
│   │   ├── meetings/             # Meeting detail, intelligence queries
│   │   ├── contacts/             # Contact aggregation
│   │   ├── analytics/            # Analytics data endpoints
│   │   ├── keywords/             # Keyword and topic tracking
│   │   ├── auth/                 # OAuth callbacks (zoom, teams, meet, gmail, etc.)
│   │   ├── stripe/               # Billing webhooks
│   │   ├── cron/                 # 14 scheduled jobs
│   │   └── onboarding/           # Onboarding progress
│   ├── dashboard/                # 8 dashboard pages
│   │   ├── meetings/             # Meeting inbox
│   │   ├── drafts/               # Draft review
│   │   ├── sequences/            # Sequence management
│   │   ├── contacts/             # Contact list
│   │   ├── analytics/            # Analytics dashboard
│   │   └── settings/             # AI, integrations, email, account
│   ├── blog/                     # Blog with 22 articles
│   ├── compare/                  # Comparison pages (9 competitors)
│   ├── demo/                     # Interactive demo
│   ├── pricing/                  # Pricing page
│   └── (auth)/                   # Clerk auth pages
├── components/                   # React components
│   ├── analytics/                # Charts (recharts), stats, engagement
│   ├── dashboard/                # Dashboard widgets and cards
│   ├── landing/                  # Marketing page components
│   ├── layout/                   # Header, Footer
│   └── ui/                       # UI primitives (badges, buttons, modals)
├── lib/                          # Business logic
│   ├── db/                       # Drizzle ORM schema (45 tables)
│   ├── agents/                   # AI agent definitions
│   ├── prompts/                  # AI prompt templates
│   ├── security/                 # Rate limiting, validation
│   ├── generate-draft.ts         # AI draft generation pipeline
│   ├── sequence-scheduler.ts     # Sequence step scheduling
│   ├── process-*-event.ts        # Platform-specific processing
│   └── dashboard-queries.ts      # Dashboard data queries
└── drizzle/                      # Database migrations
```

---

## Database

45 tables covering:

| Domain | Tables |
|--------|--------|
| Core | users, meetings, transcripts, drafts |
| Connections | zoom, teams, meet, calendar, outlook, hubspot, salesforce, sheets, gmail |
| Intelligence | signals, dealContexts, mutualActionPlans, mapSteps, trackedKeywords |
| Sequences | emailSequences, sequenceSteps |
| Engagement | emailEvents, emailConnections, emailTemplates |
| Contacts | contacts, contactMemories, meetingMemories |
| Operations | webhookFailures, deadLetterQueue, agentActions |

```bash
npm run db:push      # Push schema changes
npm run db:generate  # Generate migrations
npm run db:migrate   # Run migrations
npm run db:studio    # Open Drizzle Studio
```

---

## Deployment

Auto-deploys to Vercel on push to `main`.

```bash
npm run build        # Production build
npm run lint         # Lint check
git push origin main # Deploy
```

---

## Documentation

- [CLAUDE.md](./CLAUDE.md) -- AI assistant configuration
- [DESIGN.md](./DESIGN.md) -- Design system and visual guidelines

---

## Support

**Creator:** Jimmy Hackett
**Company:** Playground Giants
**Email:** jimmy@replysequence.com
**Website:** https://www.replysequence.com
