# SEO Blog Agent Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an automated agent that scrapes pain points from X/Twitter (Reddit later), generates SEO blog posts via Claude API using the user's voice preferences, creates GitHub PRs, and notifies via Slack.

**Architecture:** GitHub Actions cron triggers a Node.js script pipeline: scrape → analyze → generate → PR → notify. Each step is a separate module in `scripts/blog-agent/`. The agent appends new blog posts to the existing `lib/blog-data.ts` array and opens a PR for review.

**Tech Stack:** TypeScript, tsx runner, Twitter API v2, Anthropic SDK, GitHub CLI (`gh`), Slack Webhook API, Vitest

---

## File Structure

```
scripts/blog-agent/
├── index.ts              — Main orchestrator: runs the full pipeline
├── scrape-twitter.ts     — Fetch recent tweets matching pain point keywords
├── scrape-reddit.ts      — Fetch Reddit posts (stubbed, activated when creds available)
├── analyze.ts            — Extract pain points, keywords, pick post format
├── generate.ts           — Generate blog post via Claude API with voice prefs
├── publish.ts            — Create git branch, update blog-data.ts, open PR
├── notify.ts             — Post to Slack #blog-drafts channel
└── types.ts              — Shared types (PainPoint, BlogDraft, etc.)

.github/workflows/
└── blog-agent.yml        — Cron schedule (Mon/Wed/Fri 9am CST)

__tests__/scripts/blog-agent/
├── analyze.test.ts       — Pain point extraction tests
├── generate.test.ts      — Blog post generation tests
├── publish.test.ts       — blog-data.ts manipulation tests
├── notify.test.ts        — Slack notification tests
└── index.test.ts         — Orchestrator pipeline tests
```

**Existing files modified:**
- `lib/blog-data.ts` — new posts appended by agent PRs (no structural changes)

---

## Chunk 1: Types and Twitter Scraper

### Task 1: Define shared types

**Files:**
- Create: `scripts/blog-agent/types.ts`

- [ ] **Step 1: Create types file**

```typescript
// scripts/blog-agent/types.ts

export interface PainPoint {
  source: 'twitter' | 'reddit';
  text: string;
  author: string;
  url: string;
  engagement: number; // likes + retweets or upvotes
  timestamp: string;
}

export interface AnalyzedTopic {
  painPoints: PainPoint[];
  primaryKeyword: string;
  secondaryKeywords: string[];
  postFormat: 'problem-solution' | 'comparison';
  title: string;
  slug: string;
}

export interface BlogDraft {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  date: string;
  author: string;
  tags: string[];
  readingTime: number;
}

export interface VoicePreferences {
  aiTone: 'professional' | 'casual' | 'friendly' | 'concise';
  aiCustomInstructions: string | null;
  userRole: string | null;
}
```

- [ ] **Step 2: Commit**

```bash
git add scripts/blog-agent/types.ts
git commit -m "feat(blog-agent): add shared types for blog agent pipeline"
```

---

### Task 2: Build Twitter scraper

**Files:**
- Create: `scripts/blog-agent/scrape-twitter.ts`
- Test: `__tests__/scripts/blog-agent/scrape-twitter.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// __tests__/scripts/blog-agent/scrape-twitter.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { scrapePainPoints, SEARCH_KEYWORDS, buildSearchQuery } from '@/scripts/blog-agent/scrape-twitter';
import type { PainPoint } from '@/scripts/blog-agent/types';

describe('scrape-twitter', () => {
  describe('buildSearchQuery', () => {
    it('combines keywords with OR and excludes retweets', () => {
      const query = buildSearchQuery(['meeting follow-up', 'CRM pain']);
      expect(query).toContain('meeting follow-up');
      expect(query).toContain('CRM pain');
      expect(query).toContain('-is:retweet');
      expect(query).toContain('lang:en');
    });
  });

  describe('SEARCH_KEYWORDS', () => {
    it('contains relevant sales/meeting keywords', () => {
      expect(SEARCH_KEYWORDS.length).toBeGreaterThan(3);
      expect(SEARCH_KEYWORDS.some(k => k.includes('follow-up') || k.includes('follow up'))).toBe(true);
    });
  });

  describe('scrapePainPoints', () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    it('returns empty array when TWITTER_BEARER_TOKEN is not set', async () => {
      const originalEnv = process.env.TWITTER_BEARER_TOKEN;
      delete process.env.TWITTER_BEARER_TOKEN;
      const result = await scrapePainPoints();
      expect(result).toEqual([]);
      if (originalEnv) process.env.TWITTER_BEARER_TOKEN = originalEnv;
    });

    it('transforms Twitter API response into PainPoint array', async () => {
      const mockResponse = {
        data: [
          {
            id: '123',
            text: 'I hate writing follow-up emails after every sales call',
            author_id: 'user1',
            created_at: '2026-03-10T10:00:00Z',
            public_metrics: { like_count: 15, retweet_count: 3, reply_count: 2, quote_count: 1 },
          },
        ],
        includes: {
          users: [{ id: 'user1', username: 'salesrep1' }],
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      process.env.TWITTER_BEARER_TOKEN = 'test-token';
      const result = await scrapePainPoints();

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        source: 'twitter',
        text: expect.stringContaining('follow-up emails'),
        author: 'salesrep1',
        engagement: 18, // 15 likes + 3 retweets
      });
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run __tests__/scripts/blog-agent/scrape-twitter.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement Twitter scraper**

```typescript
// scripts/blog-agent/scrape-twitter.ts
import type { PainPoint } from './types';

export const SEARCH_KEYWORDS = [
  'meeting follow-up email',
  'sales meeting follow up',
  'CRM after meeting',
  'writing follow-up emails',
  'sales call follow up pain',
  'meeting notes to email',
  'post-meeting email',
  'hate writing follow-ups',
  'meeting recap email',
  'sales follow up automation',
];

export function buildSearchQuery(keywords: string[]): string {
  const keywordPart = keywords.map((k) => `"${k}"`).join(' OR ');
  return `(${keywordPart}) lang:en -is:retweet -is:reply`;
}

interface TwitterTweet {
  id: string;
  text: string;
  author_id: string;
  created_at: string;
  public_metrics: {
    like_count: number;
    retweet_count: number;
    reply_count: number;
    quote_count: number;
  };
}

interface TwitterUser {
  id: string;
  username: string;
}

interface TwitterResponse {
  data?: TwitterTweet[];
  includes?: { users?: TwitterUser[] };
  meta?: { result_count: number };
}

export async function scrapePainPoints(): Promise<PainPoint[]> {
  const token = process.env.TWITTER_BEARER_TOKEN;
  if (!token) {
    console.log(JSON.stringify({ level: 'warn', message: 'TWITTER_BEARER_TOKEN not set, skipping Twitter scrape' }));
    return [];
  }

  const query = buildSearchQuery(SEARCH_KEYWORDS);
  const params = new URLSearchParams({
    query,
    max_results: '50',
    'tweet.fields': 'author_id,created_at,public_metrics',
    expansions: 'author_id',
    'user.fields': 'username',
    sort_order: 'relevancy',
  });

  const url = `https://api.twitter.com/2/tweets/search/recent?${params}`;

  try {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      console.log(JSON.stringify({
        level: 'error',
        message: 'Twitter API request failed',
        status: response.status,
        statusText: response.statusText,
      }));
      return [];
    }

    const data: TwitterResponse = await response.json();

    if (!data.data || data.data.length === 0) {
      console.log(JSON.stringify({ level: 'info', message: 'No tweets found matching pain point keywords' }));
      return [];
    }

    const userMap = new Map<string, string>();
    for (const user of data.includes?.users ?? []) {
      userMap.set(user.id, user.username);
    }

    const painPoints: PainPoint[] = data.data.map((tweet) => ({
      source: 'twitter' as const,
      text: tweet.text,
      author: userMap.get(tweet.author_id) ?? 'unknown',
      url: `https://x.com/${userMap.get(tweet.author_id) ?? 'i'}/status/${tweet.id}`,
      engagement: tweet.public_metrics.like_count + tweet.public_metrics.retweet_count,
      timestamp: tweet.created_at,
    }));

    // Sort by engagement, take top 20
    painPoints.sort((a, b) => b.engagement - a.engagement);

    console.log(JSON.stringify({
      level: 'info',
      message: `Scraped ${painPoints.length} pain points from Twitter`,
      total: data.data.length,
      kept: Math.min(painPoints.length, 20),
    }));

    return painPoints.slice(0, 20);
  } catch (error) {
    console.log(JSON.stringify({
      level: 'error',
      message: 'Twitter scrape failed',
      error: error instanceof Error ? error.message : String(error),
    }));
    return [];
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run __tests__/scripts/blog-agent/scrape-twitter.test.ts`
Expected: PASS (all 4 tests)

- [ ] **Step 5: Commit**

```bash
git add scripts/blog-agent/scrape-twitter.ts __tests__/scripts/blog-agent/scrape-twitter.test.ts
git commit -m "feat(blog-agent): add Twitter pain point scraper with tests"
```

---

### Task 3: Stub Reddit scraper

**Files:**
- Create: `scripts/blog-agent/scrape-reddit.ts`

- [ ] **Step 1: Create stubbed Reddit scraper**

```typescript
// scripts/blog-agent/scrape-reddit.ts
import type { PainPoint } from './types';

export const SUBREDDITS = [
  'sales',
  'salesforce',
  'coldcalling',
  'B2Bsales',
  'startups',
];

export const SEARCH_TERMS = [
  'follow-up email',
  'meeting notes',
  'CRM update after meeting',
  'sales call recap',
  'post-meeting',
];

/**
 * Scrape Reddit for pain points.
 * Requires REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET env vars.
 * Returns empty array until credentials are configured.
 */
export async function scrapePainPoints(): Promise<PainPoint[]> {
  const clientId = process.env.REDDIT_CLIENT_ID;
  const clientSecret = process.env.REDDIT_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.log(JSON.stringify({
      level: 'info',
      message: 'Reddit credentials not configured, skipping Reddit scrape',
    }));
    return [];
  }

  // TODO: Implement Reddit OAuth2 + scraping when credentials are available
  // 1. POST https://www.reddit.com/api/v1/access_token (client_credentials grant)
  // 2. GET https://oauth.reddit.com/r/{subreddit}/search?q={term}&sort=relevance&t=week
  // 3. Transform posts into PainPoint[]
  console.log(JSON.stringify({ level: 'info', message: 'Reddit scraper not yet implemented' }));
  return [];
}
```

- [ ] **Step 2: Commit**

```bash
git add scripts/blog-agent/scrape-reddit.ts
git commit -m "feat(blog-agent): add stubbed Reddit scraper (activated when creds available)"
```

---

## Chunk 2: Analyze and Generate

### Task 4: Build pain point analyzer

**Files:**
- Create: `scripts/blog-agent/analyze.ts`
- Test: `__tests__/scripts/blog-agent/analyze.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// __tests__/scripts/blog-agent/analyze.test.ts
import { describe, it, expect, vi } from 'vitest';
import { analyzePainPoints, pickPostFormat, extractKeywords, deduplicateAgainstExisting } from '@/scripts/blog-agent/analyze';
import type { PainPoint } from '@/scripts/blog-agent/types';

vi.mock('@/lib/claude-api', () => ({
  callClaudeAPI: vi.fn().mockResolvedValue({
    content: JSON.stringify({
      primaryKeyword: 'sales follow-up emails',
      secondaryKeywords: ['meeting follow-up', 'sales automation'],
      title: 'Why Sales Teams Waste Hours on Follow-Up Emails',
      slug: 'why-sales-teams-waste-hours-follow-up-emails',
      postFormat: 'problem-solution',
    }),
    inputTokens: 500,
    outputTokens: 100,
    stopReason: 'end_turn',
  }),
  CLAUDE_MODEL: 'claude-sonnet-4-20250514',
}));

const samplePainPoints: PainPoint[] = [
  {
    source: 'twitter',
    text: 'I spend 30 minutes after every sales call writing follow-up emails. There has to be a better way.',
    author: 'salesrep1',
    url: 'https://x.com/salesrep1/status/1',
    engagement: 45,
    timestamp: '2026-03-10T10:00:00Z',
  },
  {
    source: 'twitter',
    text: 'Our team tried Gong but the follow-up email feature is terrible. Looking for alternatives.',
    author: 'salesmanager2',
    url: 'https://x.com/salesmanager2/status/2',
    engagement: 30,
    timestamp: '2026-03-10T11:00:00Z',
  },
  {
    source: 'twitter',
    text: 'Meeting notes are useless if they dont turn into action items and emails automatically',
    author: 'founder3',
    url: 'https://x.com/founder3/status/3',
    engagement: 60,
    timestamp: '2026-03-10T09:00:00Z',
  },
];

describe('analyze', () => {
  describe('pickPostFormat', () => {
    it('returns comparison when pain points mention competitor tools', () => {
      const format = pickPostFormat([samplePainPoints[1]]);
      expect(format).toBe('comparison');
    });

    it('returns problem-solution for general frustrations', () => {
      const format = pickPostFormat([samplePainPoints[0]]);
      expect(format).toBe('problem-solution');
    });
  });

  describe('extractKeywords', () => {
    it('extracts relevant keywords from pain point text', () => {
      const keywords = extractKeywords(samplePainPoints);
      expect(keywords.length).toBeGreaterThan(0);
      expect(keywords.some(k => k.includes('follow-up') || k.includes('follow up'))).toBe(true);
    });
  });

  describe('deduplicateAgainstExisting', () => {
    it('filters out topics that match existing blog slugs', () => {
      const existingSlugs = ['hidden-cost-slow-meeting-follow-ups'];
      const topics = [
        { slug: 'hidden-cost-slow-meeting-follow-ups', title: 'duplicate' },
        { slug: 'new-unique-topic', title: 'new' },
      ];
      const filtered = deduplicateAgainstExisting(topics, existingSlugs);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].slug).toBe('new-unique-topic');
    });
  });

  describe('analyzePainPoints', () => {
    it('returns null when no pain points provided', async () => {
      const result = await analyzePainPoints([]);
      expect(result).toBeNull();
    });

    it('returns an AnalyzedTopic from valid pain points', async () => {
      const result = await analyzePainPoints(samplePainPoints);
      expect(result).not.toBeNull();
      expect(result!.primaryKeyword).toBeTruthy();
      expect(result!.title).toBeTruthy();
      expect(result!.slug).toBeTruthy();
      expect(result!.postFormat).toMatch(/^(problem-solution|comparison)$/);
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run __tests__/scripts/blog-agent/analyze.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement analyzer**

```typescript
// scripts/blog-agent/analyze.ts
import { callClaudeAPI } from '@/lib/claude-api';
import type { PainPoint, AnalyzedTopic } from './types';

const COMPETITOR_NAMES = [
  'gong', 'chorus', 'fireflies', 'otter', 'fathom', 'avoma',
  'grain', 'clari', 'salesloft', 'outreach', 'hubspot',
];

export function pickPostFormat(painPoints: PainPoint[]): 'problem-solution' | 'comparison' {
  const text = painPoints.map((p) => p.text.toLowerCase()).join(' ');
  const mentionsCompetitor = COMPETITOR_NAMES.some((name) => text.includes(name));
  const mentionsAlternative = /alternative|instead|replace|switch|better than|compared to/i.test(text);

  return mentionsCompetitor || mentionsAlternative ? 'comparison' : 'problem-solution';
}

export function extractKeywords(painPoints: PainPoint[]): string[] {
  const text = painPoints.map((p) => p.text).join(' ').toLowerCase();
  const keyPhrases = [
    'follow-up email', 'follow up email', 'meeting follow-up', 'meeting notes',
    'sales call', 'CRM update', 'action items', 'post-meeting', 'meeting recap',
    'sales automation', 'email automation', 'meeting transcript',
  ];
  return keyPhrases.filter((phrase) => text.includes(phrase.toLowerCase()));
}

export function deduplicateAgainstExisting<T extends { slug: string }>(
  topics: T[],
  existingSlugs: string[]
): T[] {
  const slugSet = new Set(existingSlugs);
  return topics.filter((t) => !slugSet.has(t.slug));
}

export async function analyzePainPoints(painPoints: PainPoint[]): Promise<AnalyzedTopic | null> {
  if (painPoints.length === 0) return null;

  // Sort by engagement and take top 10 for analysis
  const topPainPoints = [...painPoints]
    .sort((a, b) => b.engagement - a.engagement)
    .slice(0, 10);

  const postFormat = pickPostFormat(topPainPoints);
  const extractedKeywords = extractKeywords(topPainPoints);

  const painPointSummary = topPainPoints
    .map((p, i) => `${i + 1}. [${p.source}] (${p.engagement} engagement) "${p.text}"`)
    .join('\n');

  const systemPrompt = `You are an SEO content strategist. Analyze these pain points from social media and propose a blog post topic.

Return ONLY valid JSON with this structure:
{
  "primaryKeyword": "the main SEO keyword phrase to target (3-5 words)",
  "secondaryKeywords": ["2-3 related keyword phrases"],
  "title": "SEO-optimized blog post title (includes primary keyword, under 60 chars)",
  "slug": "url-friendly-slug-from-title",
  "postFormat": "${postFormat}"
}`;

  const userPrompt = `Pain points found on social media:

${painPointSummary}

Keywords already detected: ${extractedKeywords.join(', ') || 'none'}

Proposed format: ${postFormat}

Analyze these pain points and propose the most compelling blog post topic that would rank well for SEO and resonate with sales professionals frustrated by meeting follow-up workflows.`;

  try {
    const { content } = await callClaudeAPI({
      systemPrompt,
      userPrompt,
      maxTokens: 500,
    });

    const parsed = JSON.parse(content);

    return {
      painPoints: topPainPoints,
      primaryKeyword: parsed.primaryKeyword,
      secondaryKeywords: parsed.secondaryKeywords,
      postFormat: parsed.postFormat || postFormat,
      title: parsed.title,
      slug: parsed.slug,
    };
  } catch (error) {
    console.log(JSON.stringify({
      level: 'error',
      message: 'Failed to analyze pain points',
      error: error instanceof Error ? error.message : String(error),
    }));
    return null;
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run __tests__/scripts/blog-agent/analyze.test.ts`
Expected: PASS (all 5 tests)

- [ ] **Step 5: Commit**

```bash
git add scripts/blog-agent/analyze.ts __tests__/scripts/blog-agent/analyze.test.ts
git commit -m "feat(blog-agent): add pain point analyzer with keyword extraction and format selection"
```

---

### Task 5: Build blog post generator

**Files:**
- Create: `scripts/blog-agent/generate.ts`
- Test: `__tests__/scripts/blog-agent/generate.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// __tests__/scripts/blog-agent/generate.test.ts
import { describe, it, expect, vi } from 'vitest';
import { generateBlogPost, buildSystemPrompt, calculateReadingTime } from '@/scripts/blog-agent/generate';
import type { AnalyzedTopic, VoicePreferences } from '@/scripts/blog-agent/types';

vi.mock('@/lib/claude-api', () => ({
  callClaudeAPI: vi.fn().mockResolvedValue({
    content: JSON.stringify({
      excerpt: 'Test excerpt about follow-up emails.',
      content: Array(200).fill('Test content word').join(' '),
      tags: ['sales', 'follow-up'],
    }),
    inputTokens: 1000,
    outputTokens: 2000,
    stopReason: 'end_turn',
  }),
  CLAUDE_MODEL: 'claude-sonnet-4-20250514',
}));

describe('generate', () => {
  describe('calculateReadingTime', () => {
    it('calculates reading time at ~200 words per minute', () => {
      const words400 = Array(400).fill('word').join(' ');
      expect(calculateReadingTime(words400)).toBe(2);
    });

    it('rounds up partial minutes', () => {
      const words300 = Array(300).fill('word').join(' ');
      expect(calculateReadingTime(words300)).toBe(2); // 1.5 rounds up
    });

    it('returns minimum of 1 minute', () => {
      expect(calculateReadingTime('short')).toBe(1);
    });
  });

  describe('buildSystemPrompt', () => {
    it('includes voice preferences when provided', () => {
      const prefs: VoicePreferences = {
        aiTone: 'casual',
        aiCustomInstructions: 'Use short paragraphs',
        userRole: 'founder',
      };
      const prompt = buildSystemPrompt(prefs);
      expect(prompt).toContain('casual');
      expect(prompt).toContain('Use short paragraphs');
      expect(prompt).toContain('founder');
    });

    it('uses professional defaults when no prefs', () => {
      const prompt = buildSystemPrompt(null);
      expect(prompt).toContain('professional');
    });
  });

  describe('generateBlogPost', () => {
    it('returns a valid BlogDraft from analyzed topic', async () => {
      const topic: AnalyzedTopic = {
        painPoints: [],
        primaryKeyword: 'sales follow-up emails',
        secondaryKeywords: ['meeting follow-up'],
        postFormat: 'problem-solution',
        title: 'Why Sales Teams Waste Hours on Follow-Up Emails',
        slug: 'why-sales-teams-waste-hours-follow-up-emails',
      };

      const draft = await generateBlogPost(topic, null);
      expect(draft).not.toBeNull();
      expect(draft!.title).toBe(topic.title);
      expect(draft!.slug).toBe(topic.slug);
      expect(draft!.author).toBe('Jimmy Daly');
      expect(draft!.excerpt).toBeTruthy();
      expect(draft!.content).toBeTruthy();
      expect(draft!.tags.length).toBeGreaterThan(0);
      expect(draft!.readingTime).toBeGreaterThanOrEqual(1);
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run __tests__/scripts/blog-agent/generate.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement generator**

```typescript
// scripts/blog-agent/generate.ts
import { callClaudeAPI } from '@/lib/claude-api';
import type { AnalyzedTopic, BlogDraft, VoicePreferences } from './types';

export function calculateReadingTime(content: string): number {
  const words = content.split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

export function buildSystemPrompt(prefs: VoicePreferences | null): string {
  const tone = prefs?.aiTone ?? 'professional';
  const role = prefs?.userRole ?? 'sales professional';
  const customInstructions = prefs?.aiCustomInstructions ?? '';

  return `You are a blog content writer for ReplySequence, an AI-powered meeting follow-up tool. Write in a ${tone} tone as if you are a ${role} writing for peers in the sales industry.

Key writing guidelines:
- Write 800-1500 words of substantive content
- Use markdown formatting (## for H2 headings, **bold**, lists)
- Start with a hook that resonates with the reader's pain
- Include specific data points or examples where possible
- End with a clear takeaway that positions AI meeting follow-up as the solution (without being overly salesy)
- Use "you" and "your" to speak directly to the reader
- Break up text with subheadings every 2-3 paragraphs
${customInstructions ? `\nAdditional style instructions: ${customInstructions}` : ''}

Return ONLY valid JSON with this structure:
{
  "excerpt": "1-2 sentence hook for the blog listing page (under 200 chars)",
  "content": "full markdown blog post content (800-1500 words)",
  "tags": ["2-4 relevant tags for filtering"]
}`;
}

export async function generateBlogPost(
  topic: AnalyzedTopic,
  prefs: VoicePreferences | null
): Promise<BlogDraft | null> {
  const systemPrompt = buildSystemPrompt(prefs);

  const painPointContext = topic.painPoints
    .slice(0, 5)
    .map((p) => `- "${p.text}" (${p.source}, ${p.engagement} engagement)`)
    .join('\n');

  const formatInstruction =
    topic.postFormat === 'comparison'
      ? 'Write a comparison/alternatives style post. Compare approaches or tools, helping readers evaluate their options.'
      : 'Write a problem-solution style post. Lead with the pain point, explain why it matters, then present the solution.';

  const userPrompt = `Write a blog post with this title: "${topic.title}"

Target SEO keyword: ${topic.primaryKeyword}
Secondary keywords to naturally include: ${topic.secondaryKeywords.join(', ')}

Format: ${formatInstruction}

Real pain points from social media that inspired this topic:
${painPointContext}

Write the full blog post now.`;

  try {
    const { content } = await callClaudeAPI({
      systemPrompt,
      userPrompt,
      maxTokens: 4096,
    });

    const parsed = JSON.parse(content);
    const today = new Date().toISOString().split('T')[0];

    return {
      title: topic.title,
      slug: topic.slug,
      excerpt: parsed.excerpt,
      content: parsed.content,
      date: today,
      author: 'Jimmy Daly',
      tags: parsed.tags,
      readingTime: calculateReadingTime(parsed.content),
    };
  } catch (error) {
    console.log(JSON.stringify({
      level: 'error',
      message: 'Failed to generate blog post',
      error: error instanceof Error ? error.message : String(error),
    }));
    return null;
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run __tests__/scripts/blog-agent/generate.test.ts`
Expected: PASS (all 5 tests)

- [ ] **Step 5: Commit**

```bash
git add scripts/blog-agent/generate.ts __tests__/scripts/blog-agent/generate.test.ts
git commit -m "feat(blog-agent): add blog post generator with voice preferences and SEO targeting"
```

---

## Chunk 3: Publish, Notify, Orchestrate

### Task 6: Build publisher (blog-data.ts updater + PR creator)

**Files:**
- Create: `scripts/blog-agent/publish.ts`
- Test: `__tests__/scripts/blog-agent/publish.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// __tests__/scripts/blog-agent/publish.test.ts
import { describe, it, expect } from 'vitest';
import { formatBlogPostEntry, getExistingSlugs } from '@/scripts/blog-agent/publish';
import type { BlogDraft } from '@/scripts/blog-agent/types';

describe('publish', () => {
  describe('formatBlogPostEntry', () => {
    it('formats a BlogDraft as a TypeScript object literal', () => {
      const draft: BlogDraft = {
        title: 'Test Post Title',
        slug: 'test-post-title',
        excerpt: 'A test excerpt.',
        content: 'Some **markdown** content.\n\nWith paragraphs.',
        date: '2026-03-10',
        author: 'Jimmy Daly',
        tags: ['sales', 'testing'],
        readingTime: 3,
      };

      const formatted = formatBlogPostEntry(draft);
      expect(formatted).toContain("title: 'Test Post Title'");
      expect(formatted).toContain("slug: 'test-post-title'");
      expect(formatted).toContain("date: '2026-03-10'");
      expect(formatted).toContain("author: 'Jimmy Daly'");
      expect(formatted).toContain("tags: ['sales', 'testing']");
      expect(formatted).toContain('readingTime: 3');
      expect(formatted).toContain('excerpt:');
      expect(formatted).toContain('content: `');
    });
  });

  describe('getExistingSlugs', () => {
    it('extracts slugs from blog-data.ts content', () => {
      const fileContent = `
export const blogPosts: BlogPost[] = [
  {
    title: 'First Post',
    slug: 'first-post',
    excerpt: 'test',
    content: 'test',
    date: '2026-01-01',
    author: 'Jimmy Daly',
    tags: ['test'],
    readingTime: 3,
  },
  {
    title: 'Second Post',
    slug: 'second-post',
    excerpt: 'test',
    content: 'test',
    date: '2026-01-02',
    author: 'Jimmy Daly',
    tags: ['test'],
    readingTime: 4,
  },
];`;
      const slugs = getExistingSlugs(fileContent);
      expect(slugs).toContain('first-post');
      expect(slugs).toContain('second-post');
      expect(slugs).toHaveLength(2);
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run __tests__/scripts/blog-agent/publish.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement publisher**

```typescript
// scripts/blog-agent/publish.ts
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'fs';
import { execSync } from 'child_process';
import { join } from 'path';
import { tmpdir } from 'os';
import type { BlogDraft } from './types';

const BLOG_DATA_PATH = 'lib/blog-data.ts';

export function getExistingSlugs(fileContent: string): string[] {
  const slugRegex = /slug:\s*['"]([^'"]+)['"]/g;
  const slugs: string[] = [];
  let match;
  while ((match = slugRegex.exec(fileContent)) !== null) {
    slugs.push(match[1]);
  }
  return slugs;
}

export function formatBlogPostEntry(draft: BlogDraft): string {
  const escapedContent = draft.content.replace(/`/g, '\\`').replace(/\$/g, '\\$');
  const escapedExcerpt = draft.excerpt.replace(/'/g, "\\'");
  const escapedTitle = draft.title.replace(/'/g, "\\'");

  return `  {
    title: '${escapedTitle}',
    slug: '${draft.slug}',
    excerpt:
      '${escapedExcerpt}',
    date: '${draft.date}',
    author: '${draft.author}',
    tags: [${draft.tags.map((t) => `'${t}'`).join(', ')}],
    readingTime: ${draft.readingTime},
    content: \`
${escapedContent}
\`,
  }`;
}

function exec(cmd: string): string {
  return execSync(cmd, { encoding: 'utf-8' }).trim();
}

export async function publishDraft(draft: BlogDraft): Promise<{ prUrl: string; branch: string } | null> {
  try {
    const blogDataContent = readFileSync(BLOG_DATA_PATH, 'utf-8');

    // Check for duplicate slug
    const existingSlugs = getExistingSlugs(blogDataContent);
    if (existingSlugs.includes(draft.slug)) {
      console.log(JSON.stringify({
        level: 'warn',
        message: 'Blog post with this slug already exists',
        slug: draft.slug,
      }));
      return null;
    }

    // Create branch
    const branchName = `blog/${draft.date}-${draft.slug}`;
    exec('git checkout main');
    exec('git pull origin main');
    exec(`git checkout -b ${branchName}`);

    // Insert new post at the beginning of the array
    const newEntry = formatBlogPostEntry(draft);
    const updatedContent = blogDataContent.replace(
      'export const blogPosts: BlogPost[] = [',
      `export const blogPosts: BlogPost[] = [\n${newEntry},`
    );
    writeFileSync(BLOG_DATA_PATH, updatedContent);

    // Commit and push
    exec(`git add ${BLOG_DATA_PATH}`);
    exec(`git commit -m "feat(blog): add post \\"${draft.title}\\""`);
    exec(`git push origin ${branchName}`);

    // Create PR using --body-file to avoid shell escaping issues
    const prBody = `## New Blog Post: ${draft.title}

**Excerpt:** ${draft.excerpt}

**Tags:** ${draft.tags.join(', ')}
**Reading Time:** ${draft.readingTime} min
**Format:** Auto-generated from social media pain points

---
*Generated by the SEO Blog Agent*`;

    const tmpDir = mkdtempSync(join(tmpdir(), 'blog-agent-'));
    const bodyFile = join(tmpDir, 'pr-body.md');
    writeFileSync(bodyFile, prBody);

    let prUrl: string;
    try {
      prUrl = exec(
        `gh pr create --title "Blog: ${draft.title.replace(/"/g, '\\"')}" --body-file "${bodyFile}" --base main --head ${branchName} --assignee alittlenerdy`
      );
    } finally {
      rmSync(tmpDir, { recursive: true, force: true });
    }

    console.log(JSON.stringify({
      level: 'info',
      message: 'Blog post PR created',
      prUrl,
      branch: branchName,
      slug: draft.slug,
    }));

    return { prUrl, branch: branchName };
  } catch (error) {
    console.log(JSON.stringify({
      level: 'error',
      message: 'Failed to publish blog draft',
      error: error instanceof Error ? error.message : String(error),
    }));
    return null;
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run __tests__/scripts/blog-agent/publish.test.ts`
Expected: PASS (all 3 tests)

- [ ] **Step 5: Commit**

```bash
git add scripts/blog-agent/publish.ts __tests__/scripts/blog-agent/publish.test.ts
git commit -m "feat(blog-agent): add publisher with blog-data.ts manipulation and PR creation"
```

---

### Task 7: Build Slack notifier

**Files:**
- Create: `scripts/blog-agent/notify.ts`

- [ ] **Step 1: Implement Slack notifier**

```typescript
// scripts/blog-agent/notify.ts

const SLACK_CHANNEL_ID = 'C0ALL6NQSLQ'; // #blog-drafts

export async function notifySlack(params: {
  title: string;
  excerpt: string;
  tags: string[];
  prUrl: string;
}): Promise<void> {
  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) {
    console.log(JSON.stringify({ level: 'warn', message: 'SLACK_BOT_TOKEN not set, skipping Slack notification' }));
    return;
  }

  const blocks = [
    {
      type: 'header',
      text: { type: 'plain_text', text: 'New Blog Draft Ready for Review' },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*${params.title}*\n\n${params.excerpt}`,
      },
    },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `Tags: ${params.tags.map((t) => `\`${t}\``).join(' ')}`,
        },
      ],
    },
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: { type: 'plain_text', text: 'Review PR' },
          url: params.prUrl,
          style: 'primary',
        },
      ],
    },
  ];

  try {
    const response = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        channel: SLACK_CHANNEL_ID,
        blocks,
        text: `New blog draft: ${params.title}`, // fallback
      }),
    });

    const data = await response.json();
    if (!data.ok) {
      console.log(JSON.stringify({ level: 'error', message: 'Slack notification failed', error: data.error }));
    } else {
      console.log(JSON.stringify({ level: 'info', message: 'Slack notification sent', channel: SLACK_CHANNEL_ID }));
    }
  } catch (error) {
    console.log(JSON.stringify({
      level: 'error',
      message: 'Slack notification failed',
      error: error instanceof Error ? error.message : String(error),
    }));
  }
}
```

- [ ] **Step 2: Write tests for Slack notifier**

Create: `__tests__/scripts/blog-agent/notify.test.ts`

```typescript
// __tests__/scripts/blog-agent/notify.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { notifySlack } from '@/scripts/blog-agent/notify';

describe('notify', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('skips notification when SLACK_BOT_TOKEN is not set', async () => {
    delete process.env.SLACK_BOT_TOKEN;
    global.fetch = vi.fn();
    await notifySlack({ title: 'Test', excerpt: 'Test', tags: ['test'], prUrl: 'https://github.com/pr/1' });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('sends Block Kit message to correct channel', async () => {
    process.env.SLACK_BOT_TOKEN = 'test-token';
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ ok: true }),
    });

    await notifySlack({
      title: 'Why Sales Teams Waste Hours',
      excerpt: 'A deep dive into follow-up friction.',
      tags: ['sales', 'automation'],
      prUrl: 'https://github.com/alittlenerdy/replysequence/pull/42',
    });

    expect(global.fetch).toHaveBeenCalledWith(
      'https://slack.com/api/chat.postMessage',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token',
        }),
      })
    );

    const body = JSON.parse((global.fetch as any).mock.calls[0][1].body);
    expect(body.channel).toBe('C0ALL6NQSLQ');
    expect(body.blocks).toHaveLength(4);
    expect(body.blocks[0].type).toBe('header');
    expect(body.blocks[3].elements[0].url).toContain('pull/42');
  });

  it('handles Slack API errors gracefully', async () => {
    process.env.SLACK_BOT_TOKEN = 'test-token';
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ ok: false, error: 'channel_not_found' }),
    });

    // Should not throw
    await expect(
      notifySlack({ title: 'Test', excerpt: 'Test', tags: ['test'], prUrl: 'https://github.com/pr/1' })
    ).resolves.toBeUndefined();
  });
});
```

- [ ] **Step 3: Run tests to verify they pass**

Run: `npx vitest run __tests__/scripts/blog-agent/notify.test.ts`
Expected: PASS (all 3 tests)

- [ ] **Step 4: Commit**

```bash
git add scripts/blog-agent/notify.ts __tests__/scripts/blog-agent/notify.test.ts
git commit -m "feat(blog-agent): add Slack notifier for #blog-drafts channel with tests"
```

---

### Task 8: Build orchestrator

**Files:**
- Create: `scripts/blog-agent/index.ts`
- Test: `__tests__/scripts/blog-agent/index.test.ts`

- [ ] **Step 1: Implement main orchestrator**

```typescript
// scripts/blog-agent/index.ts
import { scrapePainPoints as scrapeTwitter } from './scrape-twitter';
import { scrapePainPoints as scrapeReddit } from './scrape-reddit';
import { analyzePainPoints } from './analyze';
import { generateBlogPost } from './generate';
import { publishDraft, getExistingSlugs } from './publish';
import { notifySlack } from './notify';
import { deduplicateAgainstExisting } from './analyze';
import { readFileSync } from 'fs';
import { db, users } from '@/lib/db';
import { eq } from 'drizzle-orm';
import type { VoicePreferences } from './types';

const BLOG_DATA_PATH = 'lib/blog-data.ts';
// Jimmy's Clerk user ID — used to fetch voice preferences for blog generation
const ADMIN_CLERK_ID = process.env.ADMIN_CLERK_ID;

async function getVoicePreferences(): Promise<VoicePreferences | null> {
  if (!ADMIN_CLERK_ID) {
    console.log(JSON.stringify({ level: 'info', message: 'ADMIN_CLERK_ID not set, using default voice' }));
    return null;
  }

  try {
    const [user] = await db
      .select({
        aiTone: users.aiTone,
        aiCustomInstructions: users.aiCustomInstructions,
        userRole: users.userRole,
      })
      .from(users)
      .where(eq(users.clerkId, ADMIN_CLERK_ID))
      .limit(1);

    return user as VoicePreferences ?? null;
  } catch (error) {
    console.log(JSON.stringify({
      level: 'warn',
      message: 'Failed to fetch voice preferences, using defaults',
      error: error instanceof Error ? error.message : String(error),
    }));
    return null;
  }
}

export async function main() {
  console.log(JSON.stringify({ level: 'info', message: 'Blog agent starting' }));
  const startTime = Date.now();

  // Step 1: Scrape pain points from all sources
  const [twitterPainPoints, redditPainPoints] = await Promise.all([
    scrapeTwitter(),
    scrapeReddit(),
  ]);

  const allPainPoints = [...twitterPainPoints, ...redditPainPoints];
  console.log(JSON.stringify({
    level: 'info',
    message: 'Scraping complete',
    twitter: twitterPainPoints.length,
    reddit: redditPainPoints.length,
    total: allPainPoints.length,
  }));

  if (allPainPoints.length === 0) {
    console.log(JSON.stringify({ level: 'info', message: 'No pain points found, exiting' }));
    return;
  }

  // Step 2: Analyze and pick topic
  const topic = await analyzePainPoints(allPainPoints);
  if (!topic) {
    console.log(JSON.stringify({ level: 'info', message: 'Analysis produced no viable topic, exiting' }));
    return;
  }

  // Step 3: Check for duplicates against existing posts
  const blogDataContent = readFileSync(BLOG_DATA_PATH, 'utf-8');
  const existingSlugs = getExistingSlugs(blogDataContent);
  const [deduplicated] = deduplicateAgainstExisting([topic], existingSlugs);
  if (!deduplicated) {
    console.log(JSON.stringify({ level: 'info', message: 'Topic already covered, exiting', slug: topic.slug }));
    return;
  }

  // Step 4: Get voice preferences
  const voicePrefs = await getVoicePreferences();

  // Step 5: Generate blog post
  const draft = await generateBlogPost(topic, voicePrefs);
  if (!draft) {
    console.log(JSON.stringify({ level: 'error', message: 'Blog post generation failed' }));
    process.exit(1);
  }

  console.log(JSON.stringify({
    level: 'info',
    message: 'Blog post generated',
    title: draft.title,
    slug: draft.slug,
    readingTime: draft.readingTime,
    wordCount: draft.content.split(/\s+/).length,
  }));

  // Step 6: Create PR
  const result = await publishDraft(draft);
  if (!result) {
    console.log(JSON.stringify({ level: 'error', message: 'PR creation failed' }));
    process.exit(1);
  }

  // Step 7: Notify Slack
  await notifySlack({
    title: draft.title,
    excerpt: draft.excerpt,
    tags: draft.tags,
    prUrl: result.prUrl,
  });

  const elapsed = Date.now() - startTime;
  console.log(JSON.stringify({
    level: 'info',
    message: 'Blog agent completed successfully',
    elapsed,
    prUrl: result.prUrl,
    branch: result.branch,
  }));
}

main().catch((error) => {
  console.log(JSON.stringify({
    level: 'error',
    message: 'Blog agent failed',
    error: error instanceof Error ? error.message : String(error),
  }));
  process.exit(1);
});
```

- [ ] **Step 2: Write orchestrator tests**

Create: `__tests__/scripts/blog-agent/index.test.ts`

```typescript
// __tests__/scripts/blog-agent/index.test.ts
// Note: This tests the pipeline logic by importing the main function.
// We need to refactor index.ts to export `main` for testability.
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock all dependencies
vi.mock('@/scripts/blog-agent/scrape-twitter', () => ({
  scrapePainPoints: vi.fn(),
}));
vi.mock('@/scripts/blog-agent/scrape-reddit', () => ({
  scrapePainPoints: vi.fn(),
}));
vi.mock('@/scripts/blog-agent/analyze', () => ({
  analyzePainPoints: vi.fn(),
  deduplicateAgainstExisting: vi.fn(),
}));
vi.mock('@/scripts/blog-agent/generate', () => ({
  generateBlogPost: vi.fn(),
}));
vi.mock('@/scripts/blog-agent/publish', () => ({
  publishDraft: vi.fn(),
  getExistingSlugs: vi.fn(),
}));
vi.mock('@/scripts/blog-agent/notify', () => ({
  notifySlack: vi.fn(),
}));
vi.mock('@/lib/db', () => ({
  db: { select: vi.fn().mockReturnValue({ from: vi.fn().mockReturnValue({ where: vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue([]) }) }) }) },
  users: {},
}));
vi.mock('drizzle-orm', () => ({
  eq: vi.fn(),
}));
vi.mock('fs', async () => {
  const actual = await vi.importActual('fs');
  return {
    ...actual,
    readFileSync: vi.fn().mockReturnValue('export const blogPosts: BlogPost[] = []'),
  };
});

import { scrapePainPoints as scrapeTwitter } from '@/scripts/blog-agent/scrape-twitter';
import { scrapePainPoints as scrapeReddit } from '@/scripts/blog-agent/scrape-reddit';
import { analyzePainPoints, deduplicateAgainstExisting } from '@/scripts/blog-agent/analyze';
import { generateBlogPost } from '@/scripts/blog-agent/generate';
import { publishDraft, getExistingSlugs } from '@/scripts/blog-agent/publish';
import { notifySlack } from '@/scripts/blog-agent/notify';

describe('blog agent orchestrator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Prevent process.exit from killing tests
    vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
  });

  it('exits gracefully when no pain points are found', async () => {
    (scrapeTwitter as any).mockResolvedValue([]);
    (scrapeReddit as any).mockResolvedValue([]);

    // Import and run main (need to structure index.ts to export main)
    const { main } = await import('@/scripts/blog-agent/index');
    await main();

    expect(analyzePainPoints).not.toHaveBeenCalled();
    expect(generateBlogPost).not.toHaveBeenCalled();
  });

  it('exits when topic is duplicate', async () => {
    (scrapeTwitter as any).mockResolvedValue([{ source: 'twitter', text: 'test', author: 'a', url: '', engagement: 1, timestamp: '' }]);
    (scrapeReddit as any).mockResolvedValue([]);
    (analyzePainPoints as any).mockResolvedValue({ slug: 'existing-post', title: 'Test', painPoints: [], primaryKeyword: '', secondaryKeywords: [], postFormat: 'problem-solution' });
    (getExistingSlugs as any).mockReturnValue(['existing-post']);
    (deduplicateAgainstExisting as any).mockReturnValue([]);

    const { main } = await import('@/scripts/blog-agent/index');
    await main();

    expect(generateBlogPost).not.toHaveBeenCalled();
  });
});
```

**Note:** The orchestrator's `main` function must be exported for testability. Update `index.ts` to add `export` before `async function main()`.

- [ ] **Step 3: Run orchestrator tests**

Run: `npx vitest run __tests__/scripts/blog-agent/index.test.ts`
Expected: PASS (both tests)

- [ ] **Step 4: Commit**

```bash
git add scripts/blog-agent/index.ts __tests__/scripts/blog-agent/index.test.ts
git commit -m "feat(blog-agent): add orchestrator with pipeline tests"
```

---

## Chunk 4: GitHub Actions Workflow

### Task 9: Create GitHub Actions workflow

**Files:**
- Create: `.github/workflows/blog-agent.yml`

- [ ] **Step 1: Create workflow file**

```yaml
# .github/workflows/blog-agent.yml
name: SEO Blog Agent

on:
  schedule:
    # Mon/Wed/Fri at 9:00 AM CST (15:00 UTC)
    - cron: '0 15 * * 1,3,5'
  workflow_dispatch: # Allow manual triggers

concurrency:
  group: blog-agent
  cancel-in-progress: false

env:
  NODE_VERSION: '20'

jobs:
  generate-blog-post:
    name: Generate Blog Post
    runs-on: ubuntu-latest
    timeout-minutes: 10

    permissions:
      contents: write
      pull-requests: write

    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          token: ${{ secrets.GITHUB_TOKEN }}

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Configure git
        run: |
          git config user.name "ReplySequence Blog Agent"
          git config user.email "blog-agent@replysequence.com"

      - name: Run blog agent
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          TWITTER_BEARER_TOKEN: ${{ secrets.TWITTER_BEARER_TOKEN }}
          REDDIT_CLIENT_ID: ${{ secrets.REDDIT_CLIENT_ID }}
          REDDIT_CLIENT_SECRET: ${{ secrets.REDDIT_CLIENT_SECRET }}
          SLACK_BOT_TOKEN: ${{ secrets.SLACK_BOT_TOKEN }}
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          ADMIN_CLERK_ID: ${{ secrets.ADMIN_CLERK_ID }}
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: npx tsx scripts/blog-agent/index.ts
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/blog-agent.yml
git commit -m "feat(blog-agent): add GitHub Actions workflow with Mon/Wed/Fri schedule"
```

---

### Task 10: Add npm script and verify full build

- [ ] **Step 1: Add npm script to package.json**

Add to `scripts` in `package.json`:
```json
"blog-agent": "tsx scripts/blog-agent/index.ts"
```

- [ ] **Step 2: Run full test suite**

Run: `npx vitest run`
Expected: All tests pass including new blog-agent tests

- [ ] **Step 3: Run build to verify no TypeScript errors**

Run: `npx next build`
Expected: Build succeeds (blog-agent scripts are not part of Next.js build, but imports from `@/lib/` must be valid)

- [ ] **Step 4: Commit**

```bash
git add package.json
git commit -m "feat(blog-agent): add npm script and verify build"
```

---

## Post-Implementation: GitHub Secrets Setup

After all code is merged, add these secrets to the replysequence GitHub repo (Settings → Secrets and variables → Actions):

- [ ] `ANTHROPIC_API_KEY` — from Vercel env vars
- [ ] `TWITTER_BEARER_TOKEN` — from jimmy-ops/.env.local
- [ ] `SLACK_BOT_TOKEN` — from Slack workspace
- [ ] `DATABASE_URL` — from Vercel/Supabase
- [ ] `ADMIN_CLERK_ID` — Jimmy's Clerk user ID
- [ ] `REDDIT_CLIENT_ID` — when available
- [ ] `REDDIT_CLIENT_SECRET` — when available
