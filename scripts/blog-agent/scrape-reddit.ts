// scripts/blog-agent/scrape-reddit.ts
import type { PainPoint } from './types';

export const SUBREDDITS = [
  'sales',
  'salesforce',
  'coldcalling',
  'B2Bsales',
  'startups',
  'EntrepreneurRideAlong',
  'SaaS',
  'hubspot',
];

export const SEARCH_TERMS = [
  // Follow-up pain
  'follow-up email after meeting',
  'forget to follow up',
  'generic follow up',
  'hate writing follow-ups',
  // CRM admin
  'CRM update after meeting',
  'logging notes CRM',
  'too much admin sales',
  'manual data entry CRM',
  // Meeting intelligence
  'meeting notes useless',
  'action items from calls',
  'sales call recap',
  'meeting transcript',
  // Deal momentum
  'prospect ghosting',
  'deal went cold no follow up',
  'automated follow up sequence',
  // Tool frustration
  'salesloft alternative',
  'outreach alternative',
  'gong too expensive',
  'fireflies not enough',
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
