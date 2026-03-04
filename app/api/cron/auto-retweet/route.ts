/**
 * Cron Job: Auto Quote-Tweet @replysequence → @j1mmyhackett
 *
 * Runs twice daily. Finds the most recent @replysequence post that hasn't
 * been quote-tweeted yet, generates unique commentary in Jimmy's voice
 * via Claude API, and schedules it to the next free Typefully slot.
 *
 * Only processes 1 post per run to avoid spamming the timeline.
 * Only considers posts from the last 7 days.
 *
 * Schedule: 0 10,22 * * * (10 AM + 10 PM UTC = 5 AM + 5 PM CT)
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { autoRetweets } from '@/lib/db/schema';
import { inArray } from 'drizzle-orm';
import {
  listPublishedDrafts,
  createQuoteTweet,
  SOCIAL_SET_REPLYSEQUENCE,
  SOCIAL_SET_JIMMY,
} from '@/lib/typefully';
import { callClaudeAPI } from '@/lib/claude-api';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const TAG = '[AUTO-RT]';
const MAX_AGE_DAYS = 7;

const QUOTE_TWEET_SYSTEM_PROMPT = `You are ghostwriting a quote-tweet for Jimmy Hackett (@j1mmyhackett), a Houston-based solopreneur who builds SaaS products.

Jimmy's voice:
- Short, punchy sentences. Lots of line breaks.
- Direct and confident but not arrogant
- Builder identity — he ships fast, shares transparently
- Uses "I" and speaks from personal experience
- Conversational, like texting a friend who's also a founder
- No hashtags, no emojis, no "check this out" cliches
- Sometimes asks a provocative question
- Sometimes adds a personal anecdote or hot take

You're quote-tweeting a post from @replysequence, Jimmy's product account. The quote-tweet should feel like Jimmy the human endorsing/amplifying his own product naturally — NOT like a bot, NOT like marketing copy.

Good examples of his style:
- "Built this because I was tired of forgetting what people said 5 minutes after hanging up."
- "The gap between 'great call' and 'great follow-up' is where deals die."
- "Every sales rep I've talked to has the same problem. Nobody has time to write emails after back-to-back calls."

Rules:
- Max 200 characters (short punchy quote-tweets perform best)
- Return ONLY the tweet text, nothing else
- No quotes around the text
- Never start with "This" or "Check out"
- Vary your approach: sometimes a hot take, sometimes a question, sometimes a personal story snippet
- The original post content is provided so you can reference specifics`;

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
    const drafts = await listPublishedDrafts(SOCIAL_SET_REPLYSEQUENCE, 10);

    // 2. Filter to X posts published within the last 7 days
    const cutoff = new Date(Date.now() - MAX_AGE_DAYS * 24 * 60 * 60 * 1000);
    const xPosts = drafts.filter((d) => {
      if (!d.x_published_url || !d.published_at) return false;
      return new Date(d.published_at) > cutoff;
    });

    if (xPosts.length === 0) {
      console.log(JSON.stringify({ level: 'info', tag: TAG, message: 'No recent X posts found' }));
      return NextResponse.json({ processed: 0, quoted: 0, skipped: 0 });
    }

    // 3. Check which posts have already been quote-tweeted
    const draftIds = xPosts.map((d) => d.id);
    const existing = await db
      .select({ sourceTypefullyDraftId: autoRetweets.sourceTypefullyDraftId })
      .from(autoRetweets)
      .where(inArray(autoRetweets.sourceTypefullyDraftId, draftIds));

    const existingIds = new Set(existing.map((r) => r.sourceTypefullyDraftId));
    const newPosts = xPosts.filter((d) => !existingIds.has(d.id));

    if (newPosts.length === 0) {
      console.log(JSON.stringify({ level: 'info', tag: TAG, message: 'All posts already quoted', skipped: existingIds.size }));
      return NextResponse.json({ processed: xPosts.length, quoted: 0, skipped: existingIds.size });
    }

    // 4. Pick the OLDEST unquoted post (chronological order)
    const post = newPosts[newPosts.length - 1];

    // 5. Generate unique quote-tweet text via Claude
    const { content: quoteText } = await callClaudeAPI({
      systemPrompt: QUOTE_TWEET_SYSTEM_PROMPT,
      userPrompt: `Original @replysequence post:\n\n${post.preview}\n\nWrite a quote-tweet for this in Jimmy's voice.`,
      maxTokens: 100,
    });

    const trimmedText = quoteText.trim();

    console.log(JSON.stringify({
      level: 'info',
      tag: TAG,
      message: 'Generated quote-tweet text',
      text: trimmedText,
      sourceDraftId: post.id,
    }));

    // 6. Create quote-tweet scheduled to next free slot
    try {
      const result = await createQuoteTweet(
        SOCIAL_SET_JIMMY,
        post.x_published_url!,
        trimmedText,
      );

      await db.insert(autoRetweets).values({
        sourceTypefullyDraftId: post.id,
        sourceXUrl: post.x_published_url!,
        sourcePublishedAt: post.published_at ? new Date(post.published_at) : null,
        quoteTypefullyDraftId: result.id,
        quoteStatus: 'published',
      });

      console.log(JSON.stringify({
        level: 'info',
        tag: TAG,
        message: 'Quote-tweet scheduled',
        sourceDraftId: post.id,
        quoteDraftId: result.id,
        text: trimmedText,
        duration: Date.now() - startTime,
      }));

      return NextResponse.json({
        processed: xPosts.length,
        quoted: 1,
        skipped: existingIds.size,
        text: trimmedText,
      });
    } catch (error) {
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
        error: errorMessage,
      }));

      return NextResponse.json({ processed: xPosts.length, quoted: 0, failed: 1, skipped: existingIds.size });
    }
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
