/**
 * NewsAPI Trend Monitoring & Content Hooks
 *
 * Pulls real-time headlines from 150,000+ sources relevant to ReplySequence's
 * positioning (sales follow-ups, meeting intelligence, CRM automation).
 * Feeds into the blog content pipeline alongside Twitter and Reddit scrapers.
 *
 * Free tier: 100 requests/day (we use ~4 per run, runs 3x/week = ~12/week)
 * Docs: https://newsapi.org/docs
 */

import type { PainPoint } from './types';

const NEWSAPI_BASE = 'https://newsapi.org/v2';

/** Domain authority scoring (rough weights for engagement proxy) */
const DOMAIN_SCORES: Record<string, number> = {
  'techcrunch.com': 95,
  'forbes.com': 90,
  'businessinsider.com': 85,
  'venturebeat.com': 80,
  'inc.com': 75,
  'theverge.com': 70,
  'wired.com': 70,
  'fastcompany.com': 65,
  'zdnet.com': 60,
  'siliconangle.com': 55,
};

/** Keyword categories tuned for RS positioning */
const SEARCH_QUERIES = [
  'AI sales follow-up OR meeting intelligence OR sales automation',
  'CRM automation OR deal tracking AI OR sales productivity',
  '"follow-up email" OR "meeting transcript" OR "call recording" sales',
  'Gong OR Salesloft OR Outreach.io OR meeting AI tool',
];

interface NewsAPIArticle {
  title: string;
  description: string | null;
  author: string | null;
  url: string;
  source: { id: string | null; name: string };
  publishedAt: string;
}

interface NewsAPIResponse {
  status: string;
  totalResults: number;
  articles: NewsAPIArticle[];
}

/**
 * Scrape NewsAPI for trending sales/AI content.
 * Returns empty array if NEWSAPI_API_KEY is not set.
 */
export async function scrapePainPoints(): Promise<PainPoint[]> {
  const apiKey = process.env.NEWSAPI_API_KEY;

  if (!apiKey) {
    console.log(JSON.stringify({
      level: 'info',
      message: 'NEWSAPI_API_KEY not configured, skipping NewsAPI scrape',
    }));
    return [];
  }

  const allArticles: NewsAPIArticle[] = [];

  for (const query of SEARCH_QUERIES) {
    try {
      const params = new URLSearchParams({
        q: query,
        language: 'en',
        sortBy: 'relevance',
        pageSize: '10',
        apiKey,
      });

      const res = await fetch(`${NEWSAPI_BASE}/everything?${params}`);

      if (!res.ok) {
        console.log(JSON.stringify({
          level: 'warn',
          message: `NewsAPI request failed: ${res.status}`,
          query,
        }));
        continue;
      }

      const data: NewsAPIResponse = await res.json();
      if (data.status === 'ok' && data.articles) {
        allArticles.push(...data.articles);
      }
    } catch (err) {
      console.log(JSON.stringify({
        level: 'error',
        message: 'NewsAPI fetch error',
        query,
        error: err instanceof Error ? err.message : String(err),
      }));
    }
  }

  // Deduplicate by URL
  const seen = new Set<string>();
  const unique = allArticles.filter((a) => {
    if (seen.has(a.url)) return false;
    seen.add(a.url);
    return true;
  });

  // Convert to PainPoint format with engagement proxy from domain authority
  const painPoints: PainPoint[] = unique.map((article) => {
    const domain = extractDomain(article.url);
    const domainScore = DOMAIN_SCORES[domain] ?? 30;

    // Combine title + description for richer pain point text
    const text = article.description
      ? `${article.title} — ${article.description}`
      : article.title;

    return {
      source: 'newsapi' as const,
      text,
      author: article.author || article.source.name,
      url: article.url,
      engagement: domainScore, // Use domain authority as engagement proxy
      timestamp: article.publishedAt,
    };
  });

  // Sort by engagement (domain authority) descending
  painPoints.sort((a, b) => b.engagement - a.engagement);

  console.log(JSON.stringify({
    level: 'info',
    message: `NewsAPI scraped ${painPoints.length} articles from ${SEARCH_QUERIES.length} queries`,
    totalRaw: allArticles.length,
    deduped: unique.length,
  }));

  return painPoints.slice(0, 25); // Cap at 25 results
}

function extractDomain(url: string): string {
  try {
    const hostname = new URL(url).hostname;
    return hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}
