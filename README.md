# ReplySequence

Turn Zoom and Microsoft Teams meetings into perfect follow-up emails.

## Features

- **Multi-Platform Support**: Zoom and Microsoft Teams integration
- **AI-Powered Drafts**: Claude generates context-aware follow-up emails
- **Quality Scoring**: Automatic scoring (0-100) with meeting type detection
- **Dashboard**: View, edit, and send drafts from a unified interface
- **Email Integration**: Send emails via Resend with one click
- **CRM Integration**: Automatic logging to Airtable with contact matching

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Redis instance
- Zoom and/or Microsoft Teams app credentials

### Installation

```bash
npm install
cp .env.example .env.local
# Configure your environment variables
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

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

## Environment Variables

See `.env.example` for all required variables:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `ZOOM_*` | Zoom Server-to-Server OAuth credentials |
| `MICROSOFT_TEAMS_*` | Azure AD App Registration credentials |
| `ANTHROPIC_API_KEY` | Claude API key for draft generation |
| `RESEND_API_KEY` | Resend API key for email sending |
| `CLERK_*` | Clerk authentication keys |
| `AIRTABLE_API_KEY` | Airtable personal access token |
| `AIRTABLE_BASE_ID` | Airtable base ID (starts with `app`) |

## Architecture

```
app/
├── api/
│   ├── webhooks/
│   │   ├── zoom/       # Zoom webhook endpoint
│   │   └── teams/      # Teams webhook endpoint
│   └── drafts/         # Draft CRUD + send APIs
├── dashboard/          # Draft management UI
lib/
├── process-zoom-event.ts    # Zoom event processing
├── process-teams-event.ts   # Teams event processing
├── teams-api.ts             # Graph API client
├── generate-draft.ts        # Claude draft generation
├── email.ts                 # Resend email sending
└── airtable.ts              # Airtable CRM integration
```

## Deploy on Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/replysequence)

Required environment variables must be set in Vercel project settings.
