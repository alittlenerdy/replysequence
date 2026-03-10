/**
 * Blog Social Distribution
 * Generates tweet thread excerpts and LinkedIn post from a blog draft,
 * then creates Typefully drafts on @replysequence and @atinylittlenerd.
 */

import { callClaudeAPI } from '@/lib/claude-api';
import {
  createThreadDraft,
  createLinkedInDraft,
  createQuoteTweet,
  SOCIAL_SET_REPLYSEQUENCE,
  SOCIAL_SET_JIMMY,
} from '@/lib/typefully';
import type { BlogDraft } from './types';

const BLOG_BASE_URL = 'https://www.replysequence.com/blog';

/**
 * Generate social media content and create Typefully drafts.
 * Non-blocking — failures don't stop the blog pipeline.
 */
export async function distributeBlogPost(draft: BlogDraft): Promise<{
  tweetThreadId?: number;
  linkedInDraftId?: number;
  quoteRtId?: number;
}> {
  const apiKey = process.env.TYPEFULLY_API_KEY;
  if (!apiKey) {
    console.log(JSON.stringify({ level: 'warn', message: 'TYPEFULLY_API_KEY not set, skipping distribution' }));
    return {};
  }

  const blogUrl = `${BLOG_BASE_URL}/${draft.slug}`;
  const result: { tweetThreadId?: number; linkedInDraftId?: number; quoteRtId?: number } = {};

  // Step 1: Generate social content via Claude
  const socialContent = await generateSocialContent(draft, blogUrl);
  if (!socialContent) return result;

  // Step 2: Create tweet thread on @replysequence
  try {
    const threadPosts = socialContent.tweets.map(text => ({ text }));
    // Add the blog link to the last tweet
    const lastIdx = threadPosts.length - 1;
    threadPosts[lastIdx].text += `\n\n${blogUrl}`;

    const threadResult = await createThreadDraft(SOCIAL_SET_REPLYSEQUENCE, threadPosts, 'next-free-slot');
    result.tweetThreadId = threadResult.id;

    console.log(JSON.stringify({
      level: 'info',
      message: 'Tweet thread draft created',
      draftId: threadResult.id,
      tweetCount: threadPosts.length,
    }));
  } catch (error) {
    console.log(JSON.stringify({
      level: 'error',
      message: 'Failed to create tweet thread',
      error: error instanceof Error ? error.message : String(error),
    }));
  }

  // Step 3: Create LinkedIn post on @replysequence
  try {
    const linkedInResult = await createLinkedInDraft(
      SOCIAL_SET_REPLYSEQUENCE,
      socialContent.linkedin,
      'next-free-slot',
    );
    result.linkedInDraftId = linkedInResult.id;

    console.log(JSON.stringify({
      level: 'info',
      message: 'LinkedIn draft created',
      draftId: linkedInResult.id,
    }));
  } catch (error) {
    console.log(JSON.stringify({
      level: 'error',
      message: 'Failed to create LinkedIn draft',
      error: error instanceof Error ? error.message : String(error),
    }));
  }

  // Step 4: Create quote-tweet on @atinylittlenerd
  if (result.tweetThreadId) {
    try {
      const { content: quoteText } = await callClaudeAPI({
        systemPrompt: `You are ghostwriting a quote-tweet for Jimmy Hackett (@j1mmyhackett). Short, punchy, personal. Max 200 characters. No hashtags, no emojis. Return ONLY the tweet text.`,
        userPrompt: `Blog post title: "${draft.title}"\n\nExcerpt: ${draft.excerpt}\n\nWrite a quote-tweet amplifying this in Jimmy's builder voice.`,
        maxTokens: 100,
      });

      // We can't quote-tweet a thread that isn't published yet,
      // so just create a standalone tweet referencing the blog
      const rtResult = await createThreadDraft(
        SOCIAL_SET_JIMMY,
        [{ text: `${quoteText.trim()}\n\n${blogUrl}` }],
        'next-free-slot',
      );
      result.quoteRtId = rtResult.id;

      console.log(JSON.stringify({
        level: 'info',
        message: 'Jimmy amplification draft created',
        draftId: rtResult.id,
        text: quoteText.trim(),
      }));
    } catch (error) {
      console.log(JSON.stringify({
        level: 'error',
        message: 'Failed to create Jimmy amplification',
        error: error instanceof Error ? error.message : String(error),
      }));
    }
  }

  return result;
}

/**
 * Use Claude to generate tweet thread and LinkedIn post from blog content
 */
async function generateSocialContent(
  draft: BlogDraft,
  blogUrl: string,
): Promise<{ tweets: string[]; linkedin: string } | null> {
  const systemPrompt = `You generate social media content from blog posts.

Return ONLY valid JSON with this structure:
{
  "tweets": ["tweet 1", "tweet 2", "tweet 3", "tweet 4"],
  "linkedin": "LinkedIn post text here"
}

Rules for tweets (X/Twitter thread):
- 3-4 tweets in the thread
- Each tweet max 280 characters
- First tweet: Hook with the main insight (no "New blog post" intros)
- Middle tweets: Key takeaways or surprising stats
- Last tweet: CTA referencing the blog (the URL will be appended automatically)
- No hashtags, no emojis
- Punchy, direct, conversational tone

Rules for LinkedIn:
- 150-300 words
- Start with a hook line (question or bold statement)
- Include 2-3 key insights from the post
- End with a call to read the full post
- Professional but not corporate
- Include the blog URL: ${blogUrl}
- Use line breaks for readability`;

  const userPrompt = `Generate social media content for this blog post:

Title: ${draft.title}
Excerpt: ${draft.excerpt}
Tags: ${draft.tags.join(', ')}

Content (first 2000 chars):
${draft.content.substring(0, 2000)}

Generate the tweets and LinkedIn post.`;

  try {
    const { content } = await callClaudeAPI({
      systemPrompt,
      userPrompt,
      maxTokens: 1000,
    });

    const cleaned = content.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
    const parsed = JSON.parse(cleaned);

    if (!Array.isArray(parsed.tweets) || !parsed.linkedin) {
      console.log(JSON.stringify({ level: 'error', message: 'Invalid social content structure' }));
      return null;
    }

    return {
      tweets: parsed.tweets.slice(0, 4),
      linkedin: parsed.linkedin,
    };
  } catch (error) {
    console.log(JSON.stringify({
      level: 'error',
      message: 'Failed to generate social content',
      error: error instanceof Error ? error.message : String(error),
    }));
    return null;
  }
}
