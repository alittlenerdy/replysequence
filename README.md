# ReplySequence

> AI-powered follow-up automation for sales teams. Zoom/Meet/Teams meetings -> Intelligent email drafts -> Auto-logged to CRM.

**Status:** Week 2/12 MVP Sprint (Target: March 2026 Pilot Launch)

---

## What It Does

ReplySequence transforms meeting recordings into personalized follow-up emails automatically:

1. **Meeting Happens** - Zoom, Google Meet, or Microsoft Teams
2. **Transcript Captured** - VTT file downloaded via webhook
3. **AI Generates Draft** - Claude analyzes conversation, creates email
4. **Review & Send** - User reviews in dashboard, clicks send
5. **CRM Logged** - Email automatically logged to Airtable

**Key Features:**
- Multi-platform support (Zoom, Teams, Meet)
- Context-aware draft generation with quality scoring
- Action item extraction
- Meeting type detection (sales call, internal sync, etc.)
- Onboarding flow with sample draft generation

---

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Redis instance
- Clerk account (authentication)
- Anthropic API key

### Installation

```bash
# Clone repository
git clone https://github.com/yourusername/replysequence.git
cd replysequence

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your keys

# Run database migrations
npm run db:push

# Start development server
npm run dev
```

Visit http://localhost:3000

---

## Project Structure

```
replysequence/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   ├── webhooks/             # Platform webhooks (zoom, teams, meet)
│   │   ├── drafts/               # Draft CRUD endpoints
│   │   ├── auth/                 # OAuth callback handlers
│   │   ├── integrations/         # Platform status/disconnect
│   │   ├── stripe/               # Billing webhooks
│   │   └── onboarding/           # Onboarding progress
│   ├── dashboard/                # User dashboard pages
│   ├── onboarding/               # Onboarding flow
│   └── (auth)/                   # Clerk auth pages
├── components/                   # React components
│   ├── analytics/                # Charts and stats
│   ├── dashboard/                # Dashboard components
│   ├── onboarding/               # Onboarding steps
│   ├── processing/               # Processing animations
│   └── ui/                       # UI primitives
├── lib/                          # Business logic
│   ├── db/                       # Drizzle ORM (schema, client)
│   ├── zoom/                     # Zoom webhook verification
│   ├── teams/                    # Teams types
│   ├── meet/                     # Meet types
│   ├── prompts/                  # AI prompts
│   ├── transcript/               # VTT parser, downloader
│   ├── security/                 # Rate limiting, validation
│   ├── generate-draft.ts         # AI draft generation
│   ├── claude-client.ts          # Claude SDK client
│   ├── email.ts                  # Resend integration
│   ├── airtable.ts               # CRM integration
│   └── webhook-retry.ts          # Retry logic
├── scripts/                      # Testing scripts
└── drizzle/                      # Database migrations
```

---

## Platform Setup

### Zoom Integration

1. Create a Server-to-Server OAuth app in [Zoom Marketplace](https://marketplace.zoom.us/)
2. Add these scopes: `recording:read`, `meeting:read`
3. Enable webhooks for: `recording.completed`, `recording.transcript_completed`
4. Set webhook URL to: `https://yourdomain.com/api/webhooks/zoom`
5. Copy credentials to `.env.local`:
   ```
   ZOOM_ACCOUNT_ID=xxx
   ZOOM_CLIENT_ID=xxx
   ZOOM_CLIENT_SECRET=xxx
   ZOOM_WEBHOOK_SECRET_TOKEN=xxx
   ```

### Microsoft Teams Integration

1. Register an app in [Azure Portal](https://portal.azure.com/) > App Registrations
2. Add API permissions:
   - `OnlineMeetingTranscript.Read.All` (Application)
   - `OnlineMeeting.Read.All` (Application)
3. Grant admin consent for your organization
4. Create a Graph API subscription for transcript notifications:
   ```
   POST https://graph.microsoft.com/v1.0/subscriptions
   {
     "changeType": "created",
     "notificationUrl": "https://yourdomain.com/api/webhooks/teams",
     "resource": "communications/onlineMeetings/getAllTranscripts",
     "expirationDateTime": "2025-02-01T00:00:00Z",
     "clientState": "your_webhook_secret"
   }
   ```
5. Copy credentials to `.env.local`:
   ```
   MICROSOFT_TEAMS_TENANT_ID=xxx
   MICROSOFT_TEAMS_CLIENT_ID=xxx
   MICROSOFT_TEAMS_CLIENT_SECRET=xxx
   MICROSOFT_TEAMS_WEBHOOK_SECRET=xxx
   ```

**Note**: Teams transcript notifications may have reliability issues. See [Microsoft docs](https://learn.microsoft.com/en-us/graph/teams-changenotifications-callrecording-and-calltranscript) for known limitations.

### Google Meet Integration

1. Create OAuth credentials in [Google Cloud Console](https://console.cloud.google.com/)
2. Enable Google Meet API
3. Set redirect URI: `https://yourdomain.com/api/auth/meet/callback`

---

## Environment Variables

Create `.env.local` (see `.env.example` for full list):

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `ZOOM_*` | Zoom Server-to-Server OAuth credentials |
| `MICROSOFT_TEAMS_*` | Azure AD App Registration credentials |
| `ANTHROPIC_API_KEY` | Claude API key for draft generation |
| `RESEND_API_KEY` | Resend API key for email sending |
| `CLERK_*` | Clerk authentication keys |
| `AIRTABLE_*` | Airtable CRM credentials |
| `STRIPE_*` | Stripe billing credentials |
| `POSTHOG_*` | PostHog analytics keys |

---

## Database Schema

Key tables:

| Table | Purpose |
|-------|---------|
| `meetings` | Meeting records from all platforms |
| `transcripts` | Parsed transcript content |
| `drafts` | AI-generated email drafts |
| `users` | Clerk users and platform connections |
| `zoom_connections` | Encrypted Zoom OAuth tokens |
| `teams_connections` | Encrypted Teams OAuth tokens |
| `meet_connections` | Encrypted Google OAuth tokens |
| `webhook_failures` | Failed webhooks for retry |

Database commands:

```bash
npm run db:push      # Push schema changes
npm run db:generate  # Generate migrations
npm run db:migrate   # Run migrations
npm run db:studio    # Open Drizzle Studio
```

---

## API Endpoints

### Webhooks

| Endpoint | Purpose |
|----------|---------|
| `POST /api/webhooks/zoom` | Zoom recording events |
| `POST /api/webhooks/teams` | Teams recording events |
| `POST /api/webhooks/meet` | Meet recording events |

### Draft Management

| Endpoint | Purpose |
|----------|---------|
| `GET /api/drafts` | List user's drafts |
| `GET /api/drafts/[id]` | Get draft by ID |
| `POST /api/drafts/send` | Send draft via email |
| `PUT /api/drafts/update` | Update draft content |

### OAuth

| Endpoint | Purpose |
|----------|---------|
| `GET /api/auth/zoom` | Initiate Zoom OAuth |
| `GET /api/auth/teams` | Initiate Teams OAuth |
| `GET /api/auth/meet` | Initiate Google OAuth |

---

## Testing

### Local Development

```bash
npm run dev           # Start dev server
npm run build         # Production build (type checks)
```

### Testing Webhooks

```bash
# Expose local server (requires ngrok)
ngrok http 3000

# Use ngrok URL in platform webhook settings
```

---

## Deployment

**Production:** https://replysequence.vercel.app

### Deploy to Vercel

```bash
# Push to main branch (auto-deploys)
git push origin main

# Or manual deploy
vercel
```

Add all environment variables in Vercel project settings.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/replysequence)

---

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 16 (App Router) |
| Database | PostgreSQL + Drizzle ORM |
| Auth | Clerk |
| AI | Claude (Anthropic SDK) |
| Email | Resend |
| CRM | Airtable |
| Payments | Stripe |
| Queue | Redis + BullMQ |
| Analytics | PostHog |
| Error Tracking | Sentry |
| Deployment | Vercel |

---

## Additional Documentation

- [CLAUDE.md](./CLAUDE.md) - AI assistant reference for developers

---

## Support

**Creator:** Jimmy Hackett
**Email:** jimmy@playgroundgiants.com
**Project:** https://replysequence.vercel.app
