# SEO Blog Agent — Design Spec

**Date:** 2026-03-10
**Status:** Approved
**Owner:** Claude Code

## Purpose

Automated agent that scrapes pain points from Reddit and X/Twitter, generates SEO-optimized blog posts using Claude API with the user's voice preferences, creates GitHub PRs for review, and notifies via Slack.

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Pipeline model | Draft-and-review | Editorial control over published content |
| Data sources | Reddit + X/Twitter | Reddit for depth/long-tail, X for trending takes |
| Post formats | Mix of problem-solution + comparison | Broader keyword coverage, less repetitive |
| Draft delivery | GitHub PR + Slack notification | Fits existing git workflow, Slack for nudge |
| Scheduler | GitHub Actions cron | Generous timeouts, native PR creation, free |
| Voice/tone | Pull from user_preferences table | Consistent with all AI-generated content |

## Pipeline

```
GitHub Actions Cron (Mon/Wed/Fri 9am CST)
  → Scrape Reddit + X for pain points
  → Extract keywords, select post format
  → Generate draft via Claude API (using voice prefs)
  → Create git branch, append post to blog-data.ts, open PR
  → Post to #blog-drafts Slack channel with title, excerpt, PR link
  → Jimmy reviews PR → merge = publish
```

## File Structure

```
.github/workflows/blog-agent.yml    — cron schedule + orchestration
scripts/blog-agent/scrape.ts        — Reddit + X scraping (modular per source)
scripts/blog-agent/analyze.ts       — pain point extraction + keyword analysis
scripts/blog-agent/generate.ts      — Claude draft generation with voice prefs
scripts/blog-agent/publish.ts       — create branch, update blog-data.ts, open PR
scripts/blog-agent/notify.ts        — Slack webhook notification
```

### Existing file modified

- `lib/blog-data.ts` — new posts appended by agent PRs

## Data Sources

### Reddit
- Subreddits: r/sales, r/salesforce, r/coldcalling, r/B2Bsales, r/startups
- Search for posts mentioning: meeting follow-ups, CRM pain, sales automation, email drafting
- Use Reddit API (OAuth2 script app)
- **Status:** Credentials pending — agent works with X only until Reddit is configured

### X / Twitter
- Search recent tweets with keywords: meeting follow-up, sales meetings, CRM frustration, follow-up emails
- Use Twitter API v2 with Bearer Token
- **Status:** Credentials available

## Blog Post Generation

### Input
- Scraped pain points (raw posts/tweets)
- Extracted keywords and themes
- User voice preferences from `user_preferences` table (role, tone, custom instructions)

### Output (matches BlogPost interface)
```typescript
{
  title: string;       // SEO-optimized, includes primary keyword
  slug: string;        // URL-friendly, derived from title
  excerpt: string;     // 1-2 sentence hook for blog grid
  content: string;     // Full markdown blog post (800-1500 words)
  date: string;        // Generation date (YYYY-MM-DD)
  author: string;      // "Jimmy Daly"
  tags: string[];      // 2-4 relevant tags for filtering
  readingTime: number; // Calculated from word count
}
```

### Post Format Selection
Agent decides per pain point:
- **Problem-solution** — when pain point describes a specific frustration with a clear fix
- **Comparison/alternative** — when pain point mentions competing tools or asks "what should I use instead"

### Claude Prompt Strategy
- System prompt includes voice preferences + SEO writing guidelines
- User prompt includes the scraped pain points, extracted keywords, and format instruction
- Model: claude-sonnet-4-20250514 (same as draft generation)
- Deduplication: agent checks existing blog-data.ts slugs to avoid duplicate topics

## PR Creation

- Branch name: `blog/YYYY-MM-DD-{slug}`
- Commit message: `feat(blog): add post "{title}"`
- PR title: `Blog: {title}`
- PR body: excerpt + tags + source pain points summary
- Auto-assigns to Jimmy

## Slack Notification

- Channel: `#blog-drafts` (ID: `C0ALL6NQSLQ`)
- Message format: title, excerpt, tags, link to PR
- Uses Slack Bot Token for posting

## Secrets Required (GitHub Actions)

| Secret | Source | Status |
|--------|--------|--------|
| `ANTHROPIC_API_KEY` | Existing | Have it |
| `TWITTER_BEARER_TOKEN` | Existing | Have it |
| `REDDIT_CLIENT_ID` | reddit.com/prefs/apps | Pending |
| `REDDIT_CLIENT_SECRET` | reddit.com/prefs/apps | Pending |
| `SLACK_BOT_TOKEN` | Existing | Have it |
| `DATABASE_URL` | Existing | Have it |
| `GH_TOKEN` | Auto-provided by Actions | Automatic |

## Schedule

- **Frequency:** Monday, Wednesday, Friday at 9:00 AM CST (15:00 UTC)
- **Output:** 1 post per run = ~3 posts/week
- **Timeout:** 10 minutes max per run

## Edge Cases

- **No good pain points found:** Agent logs "no actionable pain points" and exits cleanly. No PR created.
- **Duplicate topic:** Agent checks existing slugs and skips if too similar.
- **API rate limits:** Exponential backoff on Reddit/X APIs. Claude API already has retry logic.
- **Voice prefs not set:** Falls back to default professional tone matching existing blog posts.
- **Reddit not configured:** Agent runs X-only mode until Reddit credentials are added.
