/**
 * Cron Job: Auto-Retweet @replysequence → @atinylittlenerd
 *
 * Runs twice daily. Fetches recent @replysequence posts via Typefully API,
 * checks which haven't been quote-tweeted yet, and creates quote-tweet
 * drafts on @atinylittlenerd with immediate publish.
 *
 * Schedule: 0 10,22 * * * (10 AM + 10 PM UTC)
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { autoRetweets } from '@/lib/db/schema';
import { inArray } from 'drizzle-orm';
import {
  listPublishedDrafts,
  createQuoteTweet,
  SOCIAL_SET_REPLYSEQUENCE,
  SOCIAL_SET_ATINYLITTLENERD,
} from '@/lib/typefully';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const TAG = '[AUTO-RT]';

function verifyCronAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader === `Bearer ${cronSecret}`) return true;
  if (request.headers.get('x-vercel-cron')) return true;
  if (process.env.NODE_ENV === 'development') return true;

  return false;
}

export async function GET(request: NextRequest) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();

  try {
    // 1. Fetch recent published @replysequence posts
    const drafts = await listPublishedDrafts(SOCIAL_SET_REPLYSEQUENCE, 20);

    // 2. Filter to posts that have an X/Twitter URL
    const xPosts = drafts.filter((d) => d.x_published_url);

    if (xPosts.length === 0) {
      console.log(JSON.stringify({
        level: 'info',
        tag: TAG,
        message: 'No published X posts found',
        duration: Date.now() - startTime,
      }));
      return NextResponse.json({ processed: 0, quoted: 0, failed: 0, skipped: 0 });
    }

    // 3. Batch-check which posts have already been quote-tweeted
    const draftIds = xPosts.map((d) => d.id);
    const existing = await db
      .select({ sourceTypefullyDraftId: autoRetweets.sourceTypefullyDraftId })
      .from(autoRetweets)
      .where(inArray(autoRetweets.sourceTypefullyDraftId, draftIds));

    const existingIds = new Set(existing.map((r) => r.sourceTypefullyDraftId));

    const newPosts = xPosts.filter((d) => !existingIds.has(d.id));

    let quoted = 0;
    let failed = 0;

    // 4. Create quote-tweets for new posts
    for (const post of newPosts) {
      try {
        const result = await createQuoteTweet(
          SOCIAL_SET_ATINYLITTLENERD,
          post.x_published_url!,
        );

        await db.insert(autoRetweets).values({
          sourceTypefullyDraftId: post.id,
          sourceXUrl: post.x_published_url!,
          sourcePublishedAt: post.published_at ? new Date(post.published_at) : null,
          quoteTypefullyDraftId: result.id,
          quoteStatus: 'published',
        });

        quoted++;

        console.log(JSON.stringify({
          level: 'info',
          tag: TAG,
          message: 'Quote-tweet created',
          sourceDraftId: post.id,
          sourceUrl: post.x_published_url,
          quoteDraftId: result.id,
        }));
      } catch (error) {
        failed++;

        const errorMessage = error instanceof Error ? error.message : String(error);

        await db.insert(autoRetweets).values({
          sourceTypefullyDraftId: post.id,
          sourceXUrl: post.x_published_url!,
          sourcePublishedAt: post.published_at ? new Date(post.published_at) : null,
          quoteStatus: 'failed',
          errorMessage,
        });

        console.log(JSON.stringify({
          level: 'error',
          tag: TAG,
          message: 'Quote-tweet failed',
          sourceDraftId: post.id,
          sourceUrl: post.x_published_url,
          error: errorMessage,
        }));
      }
    }

    const skipped = existingIds.size;
    const duration = Date.now() - startTime;

    console.log(JSON.stringify({
      level: 'info',
      tag: TAG,
      message: 'Auto-retweet cron completed',
      processed: xPosts.length,
      quoted,
      failed,
      skipped,
      duration,
    }));

    return NextResponse.json({ processed: xPosts.length, quoted, failed, skipped });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    console.log(JSON.stringify({
      level: 'error',
      tag: TAG,
      message: 'Auto-retweet cron failed',
      error: errorMessage,
      duration: Date.now() - startTime,
    }));

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
