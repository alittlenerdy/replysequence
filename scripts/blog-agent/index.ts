import { scrapePainPoints as scrapeTwitter } from './scrape-twitter';
import { scrapePainPoints as scrapeReddit } from './scrape-reddit';
import { scrapePainPoints as scrapeNewsAPI } from './scrape-newsapi';
import { analyzePainPoints, deduplicateAgainstExisting } from './analyze';
import { generateBlogPost } from './generate';
import { publishDraft, getExistingSlugs } from './publish';
import { notifySlack } from './notify';
import { generateHeroImage } from './generate-image';
import { distributeBlogPost } from './distribute';
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
  const [twitterPainPoints, redditPainPoints, newsPainPoints] = await Promise.all([
    scrapeTwitter(),
    scrapeReddit(),
    scrapeNewsAPI(),
  ]);

  const allPainPoints = [...twitterPainPoints, ...redditPainPoints, ...newsPainPoints];
  console.log(JSON.stringify({
    level: 'info',
    message: 'Scraping complete',
    twitter: twitterPainPoints.length,
    reddit: redditPainPoints.length,
    newsapi: newsPainPoints.length,
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

  // Step 6: Generate hero image (non-blocking — post publishes without image if this fails)
  const heroImage = await generateHeroImage({
    title: draft.title,
    tags: draft.tags,
    slug: draft.slug,
    date: draft.date,
  });
  if (heroImage) {
    draft.heroImage = heroImage;
  }

  // Step 7: Create PR
  const result = await publishDraft(draft);
  if (!result) {
    console.log(JSON.stringify({ level: 'error', message: 'PR creation failed' }));
    process.exit(1);
  }

  // Step 8: Create social media drafts (non-blocking)
  const socialResult = await distributeBlogPost(draft).catch((err) => {
    console.log(JSON.stringify({
      level: 'error',
      message: 'Social distribution failed (non-blocking)',
      error: err instanceof Error ? err.message : String(err),
    }));
    return { tweetThreadId: undefined, linkedInDraftId: undefined, quoteRtId: undefined };
  });

  console.log(JSON.stringify({
    level: 'info',
    message: 'Social distribution complete',
    tweetThreadId: socialResult.tweetThreadId ?? null,
    linkedInDraftId: socialResult.linkedInDraftId ?? null,
    quoteRtId: socialResult.quoteRtId ?? null,
  }));

  // Step 9: Notify Slack
  await notifySlack({
    title: draft.title,
    excerpt: draft.excerpt,
    tags: draft.tags,
    prUrl: result.prUrl,
    branch: result.branch,
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
