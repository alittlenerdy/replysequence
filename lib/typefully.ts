/**
 * Typefully REST API client
 *
 * Used by:
 * - Auto-retweet cron (quote-tweet @replysequence → @atinylittlenerd)
 * - Blog distribution (create thread + LinkedIn drafts)
 * - Daily content cron (NewsAPI → drafts with images)
 */

const TYPEFULLY_BASE_URL = 'https://api.typefully.com/v2';

export const SOCIAL_SET_REPLYSEQUENCE = 283435;
export const SOCIAL_SET_JIMMY = 266757;

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
  preview: string;
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
 * Create a tweet thread draft on X. Schedules to next free slot by default.
 */
export async function createThreadDraft(
  socialSetId: number,
  posts: { text: string }[],
  scheduleSlot: 'next-free-slot' | 'queue' = 'next-free-slot'
): Promise<{ id: number }> {
  const url = `${TYPEFULLY_BASE_URL}/social-sets/${socialSetId}/drafts`;

  const res = await fetch(url, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      platforms: {
        x: {
          enabled: true,
          posts: posts.map(p => ({ text: p.text })),
        },
      },
      schedule: scheduleSlot,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Typefully create thread error ${res.status}: ${body}`);
  }

  return res.json();
}

/**
 * Create a LinkedIn post draft. Schedules to next free slot by default.
 */
export async function createLinkedInDraft(
  socialSetId: number,
  text: string,
  scheduleSlot: 'next-free-slot' | 'queue' = 'next-free-slot'
): Promise<{ id: number }> {
  const url = `${TYPEFULLY_BASE_URL}/social-sets/${socialSetId}/drafts`;

  const res = await fetch(url, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      platforms: {
        linkedin: {
          enabled: true,
          posts: [{ text }],
        },
      },
      schedule: scheduleSlot,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Typefully create LinkedIn draft error ${res.status}: ${body}`);
  }

  return res.json();
}

/**
 * Upload an image to Typefully and get back a media_id.
 * Takes raw image bytes (Buffer), uploads to S3 presigned URL.
 */
export async function uploadImage(
  socialSetId: number,
  imageBuffer: Buffer,
  fileName: string
): Promise<string> {
  // Step 1: Get presigned upload URL
  const url = `${TYPEFULLY_BASE_URL}/social-sets/${socialSetId}/media/upload`;
  const res = await fetch(url, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ file_name: fileName }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Typefully media upload error ${res.status}: ${body}`);
  }

  const { media_id, upload_url } = await res.json();

  // Step 2: PUT image bytes to presigned URL (no extra headers)
  const uploadRes = await fetch(upload_url, {
    method: 'PUT',
    body: imageBuffer,
  });

  if (!uploadRes.ok) {
    throw new Error(`S3 upload failed ${uploadRes.status}`);
  }

  return media_id;
}

/**
 * Create a draft with image on both X and optionally LinkedIn.
 * Saves as draft (not scheduled) so user can review first.
 */
export async function createDraftWithImage(
  socialSetId: number,
  params: {
    title: string;
    xText: string;
    linkedInText?: string;
    mediaId: string;
    scratchpadText?: string;
  }
): Promise<{ id: number }> {
  const url = `${TYPEFULLY_BASE_URL}/social-sets/${socialSetId}/drafts`;

  const platforms: Record<string, unknown> = {
    x: {
      enabled: true,
      posts: [{ text: params.xText, media_ids: [params.mediaId] }],
    },
  };

  if (params.linkedInText) {
    platforms.linkedin = {
      enabled: true,
      posts: [{ text: params.linkedInText, media_ids: [params.mediaId] }],
    };
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      draft_title: params.title,
      platforms,
      scratchpad_text: params.scratchpadText || null,
      // Intentionally NOT setting publish_at — saved as draft for review
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Typefully create draft error ${res.status}: ${body}`);
  }

  return res.json();
}

/**
 * Create a quote-tweet draft on X. Schedules to next free slot by default.
 */
export async function createQuoteTweet(
  socialSetId: number,
  quotePostUrl: string,
  text: string,
  publishAt: string = 'now'
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
              text,
              quote_post_url: quotePostUrl,
            },
          ],
        },
      },
      publish_at: publishAt,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Typefully create draft error ${res.status}: ${body}`);
  }

  return res.json();
}
