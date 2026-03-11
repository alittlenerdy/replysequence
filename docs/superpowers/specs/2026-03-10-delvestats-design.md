# DelveStats — Design Spec

> Open-source, self-hosted AI API cost monitoring dashboard

**Domain:** delvestats.com
**Repo:** GitHub (MIT license)
**Deploy:** Vercel (one-click deploy button)

---

## Problem

Every developer using AI APIs has to check multiple billing dashboards (Anthropic, Google AI, OpenAI) separately. There's no unified view of total spend, per-model breakdown, or trend tracking across providers. Existing solutions (Helicone, LangSmith) require routing API calls through a proxy — DelveStats reads usage data directly from each provider's API.

## Solution

A Next.js dashboard that polls each provider's usage API on a schedule, stores normalized data in SQLite, and displays unified cost/usage metrics. Configurable webhook alerts when spend exceeds thresholds.

## Stack

- **Framework:** Next.js (App Router)
- **Database:** SQLite via Drizzle ORM
- **Deployment:** Vercel
- **Config:** `.env.local` (API keys, webhook URL, thresholds)
- **License:** MIT

## Providers (v1)

1. **Anthropic** — `/v1/usage` endpoint
2. **Google AI (Gemini)** — Cloud Billing API or AI Studio
3. **OpenAI** — `/v1/organization/usage` endpoint
4. **Kimi** — Usage API

### Provider Adapter Interface

```typescript
interface UsageProvider {
  name: string;
  fetchUsage(startDate: Date, endDate: Date): Promise<UsageRecord[]>;
  isConfigured(): boolean;
}
```

Each provider is a single file implementing this interface. Adding a new provider = one file.

## Data Model (SQLite)

### usage_records
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | Auto-increment |
| provider | TEXT | e.g., "anthropic", "google", "openai", "kimi" |
| model | TEXT | e.g., "claude-sonnet-4", "gemini-2.0-flash" |
| input_tokens | INTEGER | Input/prompt tokens |
| output_tokens | INTEGER | Output/completion tokens |
| cost_usd | REAL | Cost in USD |
| recorded_at | TEXT | When this record was created |
| period_start | TEXT | Start of the usage period |
| period_end | TEXT | End of the usage period |

### alert_rules
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | Auto-increment |
| provider | TEXT (nullable) | Null = all providers combined |
| threshold_usd | REAL | Dollar threshold |
| period | TEXT | "daily", "weekly", or "monthly" |
| webhook_url | TEXT | URL to POST alert payload |
| enabled | INTEGER | Boolean |
| last_triggered | TEXT | ISO timestamp |

### poll_log
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | Auto-increment |
| provider | TEXT | Which provider was polled |
| status | TEXT | "ok" or "error" |
| error_msg | TEXT | Error details if failed |
| polled_at | TEXT | ISO timestamp |

## Dashboard Layout

Single page with three sections:

### 1. Overview (top)
- Total spend cards: today, this week, this month
- 30-day cost trend bar chart (color-coded by provider)
- Provider breakdown with progress bars showing relative spend

### 2. Provider Cards (middle)
- Each provider rendered as a card with colored left border
- Model-level breakdown inside each card (tokens + cost)
- Expandable/collapsible

### 3. Data Table (bottom)
- Sortable columns: provider, model, tokens (in/out), cost, trend (% change)
- Filterable by provider, date range
- Summary row at top

## Data Collection

- Vercel Cron job runs hourly
- Polls each configured provider's usage API
- Normalizes response into `usage_records` schema
- Logs poll result to `poll_log`
- After polling, runs alert threshold checks

## Alert System

- After each poll cycle, compare current period spend against `alert_rules`
- If threshold exceeded and not recently triggered, POST JSON payload to `webhook_url`
- Payload is Slack-formatted by default (Block Kit compatible)
- Works with any webhook endpoint (Discord, Teams, Zapier, custom)
- Configurable via `.env.local`:
  - `ALERT_WEBHOOK_URL` — where to send alerts
  - `ALERT_DAILY_THRESHOLD` — daily spend limit in USD
  - `ALERT_WEEKLY_THRESHOLD` — weekly spend limit
  - `ALERT_MONTHLY_THRESHOLD` — monthly spend limit

## Configuration (.env.local)

```env
# Provider API Keys (read-only keys recommended)
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_AI_API_KEY=AI...
OPENAI_API_KEY=sk-...
KIMI_API_KEY=...

# Webhook Notifications
ALERT_WEBHOOK_URL=https://hooks.slack.com/services/...
ALERT_DAILY_THRESHOLD=10
ALERT_WEEKLY_THRESHOLD=50
ALERT_MONTHLY_THRESHOLD=150

# Cron Auth
CRON_SECRET=...
```

## Open Source & GitHub

- Clean README: description, screenshot, "Deploy to Vercel" button, setup steps
- `.env.example` with all vars documented
- `CONTRIBUTING.md` for adding new providers
- MIT license

## Out of Scope (v1)

- Settings UI (use `.env` instead)
- Docker deployment (Vercel-first)
- Per-project or per-agent cost attribution
- User authentication (single-user dashboard)
- Real-time streaming (poll-based only)

## Future (v2+)

- Settings page with key management UI
- Docker Compose support
- Per-agent cost tagging
- Budget forecasting
- Multi-user with auth
- More providers (Mistral, Cohere, AWS Bedrock)
