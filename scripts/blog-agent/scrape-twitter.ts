// scripts/blog-agent/scrape-twitter.ts
import type { PainPoint } from './types';

export const SEARCH_KEYWORDS = [
  // Core follow-up pain
  'meeting follow-up email',
  'hate writing follow-ups',
  'forgot to follow up',
  'never followed up',
  'follow up fell through',
  'generic follow-up email',
  'great speaking with you email',
  // Post-meeting admin burden
  'updating CRM after meeting',
  'logging meeting notes CRM',
  'sales admin work',
  'too much time on admin',
  'manual CRM updates',
  'sales reps wasting time',
  // Meeting intelligence
  'meeting transcript action items',
  'sales call recap',
  'what was discussed in meeting',
  'meeting notes nobody reads',
  // Sequence / deal momentum
  'deal went cold',
  'prospect ghosted',
  'prospect stopped responding',
  'sales follow up sequence',
  'automated follow up sales',
  // Competitor frustration
  'gong alternative',
  'fireflies alternative',
  'salesloft follow up',
  'outreach sequence pain',
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
