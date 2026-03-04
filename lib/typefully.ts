/**
 * Typefully REST API client
 *
 * Minimal client for the auto-retweet cron job:
 * - Fetch published drafts from @replysequence
 * - Create quote-tweet drafts on @atinylittlenerd
 */

const TYPEFULLY_BASE_URL = 'https://api.typefully.com/v2';

export const SOCIAL_SET_REPLYSEQUENCE = 283435;
export const SOCIAL_SET_ATINYLITTLENERD = 266757;

function getApiKey(): string {
  const key = process.env.TYPEFULLY_API_KEY;
  if (!key) throw new Error('TYPEFULLY_API_KEY is not set');
  return key;
}

function headers(): HeadersInit {
  return {
    Authorization: `Bearer ${getApiKey()}`,
    'Content-Type': 'application/json',
  };
}

export interface TypefullyDraft {
  id: number;
  text: string;
  status: string;
  published_at: string | null;
  x_published_url: string | null;
}

export interface TypefullyListResponse {
  results: TypefullyDraft[];
  next: string | null;
}

/**
 * Fetch recently published drafts for a social set.
 * Returns newest first, limited to `limit` results.
 */
export async function listPublishedDrafts(
  socialSetId: number,
  limit = 20
): Promise<TypefullyDraft[]> {
  const url = `${TYPEFULLY_BASE_URL}/social-sets/${socialSetId}/drafts?status=published&order_by=-published_at&limit=${limit}`;

  const res = await fetch(url, { headers: headers() });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Typefully API error ${res.status}: ${body}`);
  }

  const data: TypefullyListResponse = await res.json();
  return data.results;
}

/**
 * Create a quote-tweet draft and publish immediately.
 * An empty string as text creates a pure quote-tweet.
 */
export async function createQuoteTweet(
  socialSetId: number,
  quotePostUrl: string,
  text = ''
): Promise<{ id: number }> {
  const url = `${TYPEFULLY_BASE_URL}/social-sets/${socialSetId}/drafts`;

  const res = await fetch(url, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      platforms: {
        x: {
          enabled: true,
          posts: [
            {
              text: text || '\u200B', // zero-width space fallback if empty rejected
              quote_post_url: quotePostUrl,
            },
          ],
        },
      },
      publish_at: 'now',
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Typefully create draft error ${res.status}: ${body}`);
  }

  return res.json();
}
