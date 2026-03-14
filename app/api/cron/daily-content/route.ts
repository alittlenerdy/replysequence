/**
 * Cron Job: Daily Content Pipeline
 *
 * NewsAPI → Claude (generate posts) → Gemini (generate images) → Slack approval
 * On approve → Typefully draft published immediately
 *
 * Runs daily at 7 AM CT. Pulls trending articles about sales/AI,
 * generates 3 social posts with branded images, sends to Slack
 * with Approve/Skip buttons. Approved posts go to Typefully immediately.
 *
 * Schedule: 0 12 * * * (7 AM CT = 12:00 UTC)
 */

import { NextRequest, NextResponse } from 'next/server';
import { callClaudeAPI, log } from '@/lib/claude-api';
import {
  uploadImage,
  SOCIAL_SET_REPLYSEQUENCE,
  SOCIAL_SET_JIMMY,
} from '@/lib/typefully';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

const TAG = '[DAILY-CONTENT]';
const SLACK_CHANNEL = 'C0AL6K62Q23';

// Pending posts stored in memory for approval callback
// In production, use a database table — but for MVP this works with Vercel's
// function lifecycle (approval must happen before the function cold-starts again)
// We'll persist to a simple JSON structure that the webhook handler reads.

// ── Weekly color rotation ────────────────────────────────────────────

const DAY_THEMES: Record<number, { name: string; primary: string; accent: string }> = {
  0: { name: 'Teal Cyan', primary: '#0891B2', accent: '#22D3EE' },
  1: { name: 'Electric Blue', primary: '#2563EB', accent: '#60A5FA' },
  2: { name: 'Indigo Purple', primary: '#5B6CFF', accent: '#818CF8' },
  3: { name: 'Emerald Green', primary: '#059669', accent: '#34D399' },
  4: { name: 'Warm Amber', primary: '#D97706', accent: '#FBBF24' },
  5: { name: 'Teal Cyan', primary: '#0891B2', accent: '#22D3EE' },
  6: { name: 'Warm Amber', primary: '#D97706', accent: '#FBBF24' },
};

// ── NewsAPI fetch ────────────────────────────────────────────────────

const NEWSAPI_QUERIES = [
  'AI sales follow-up OR meeting intelligence OR sales automation',
  'CRM automation OR deal tracking AI OR sales productivity',
  '"sales tools" OR "meeting transcript" OR "AI email"',
];

interface NewsArticle {
  title: string;
  description: string | null;
  url: string;
  source: { name: string };
  publishedAt: string;
}

async function fetchTrendingArticles(): Promise<NewsArticle[]> {
  const apiKey = process.env.NEWSAPI_API_KEY;
  if (!apiKey) {
    log('warn', `${TAG} NEWSAPI_API_KEY not set`);
    return [];
  }

  const articles: NewsArticle[] = [];

  for (const query of NEWSAPI_QUERIES) {
    try {
      const params = new URLSearchParams({
        q: query,
        language: 'en',
        sortBy: 'publishedAt',
        pageSize: '5',
        apiKey,
      });

      const res = await fetch(`https://newsapi.org/v2/everything?${params}`);
      if (!res.ok) continue;

      const data = await res.json();
      if (data.status === 'ok' && data.articles) {
        articles.push(...data.articles);
      }
    } catch {
      // Continue with other queries
    }
  }

  const seen = new Set<string>();
  return articles.filter((a) => {
    if (seen.has(a.url)) return false;
    seen.add(a.url);
    return true;
  }).slice(0, 10);
}

// ── Claude post generation ───────────────────────────────────────────

interface GeneratedPost {
  xText: string;
  linkedInText?: string;
  imagePrompt: string;
  title: string;
  account: 'replysequence' | 'personal';
}

async function generatePosts(articles: NewsArticle[]): Promise<GeneratedPost[]> {
  const articleSummaries = articles
    .map((a, i) => `${i + 1}. "${a.title}" — ${a.source.name}\n   ${a.description || ''}`)
    .join('\n\n');

  const response = await callClaudeAPI({
    systemPrompt: `You are a social media strategist for ReplySequence, an AI-powered sales follow-up tool. ReplySequence connects to Zoom/Meet/Teams and generates ready-to-send follow-up emails in 8 seconds after every meeting. It also auto-syncs to CRM, extracts deal signals, detects risks, and tracks next steps.

Generate exactly 3 social media posts inspired by these trending articles. Each post should connect the news trend to a ReplySequence pain point or feature.

Rules:
- Post 1: For @replysequence (Twitter + LinkedIn). Twitter version under 280 chars. LinkedIn version 3-5 paragraphs with hashtags. Always use @replysequence not just "ReplySequence" on Twitter.
- Post 2: For @replysequence (Twitter only). Under 280 chars. Punchy, data-driven or tip-based.
- Post 3: For Jimmy's personal account @atinylittlenerd (Twitter only). Founder perspective, authentic, under 280 chars. Reference @replysequence.

For each post, also provide a short image prompt for an abstract geometric illustration (NO TEXT in image).

Respond with JSON only:
{
  "posts": [
    {
      "title": "Draft title for internal reference",
      "account": "replysequence",
      "xText": "Twitter text here",
      "linkedInText": "LinkedIn text here (or null)",
      "imagePrompt": "Abstract illustration of..."
    }
  ]
}`,
    userPrompt: `Today's trending articles in sales/AI:\n\n${articleSummaries}`,
    maxTokens: 2048,
  });

  let jsonStr = response.content.trim();
  if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
  }

  try {
    const parsed = JSON.parse(jsonStr);
    return parsed.posts || [];
  } catch {
    log('error', `${TAG} Failed to parse Claude response`, { preview: response.content.slice(0, 200) });
    return [];
  }
}

// ── Gemini image generation ──────────────────────────────────────────

async function generateImage(prompt: string, theme: { name: string; primary: string; accent: string }): Promise<Buffer | null> {
  const apiKey = process.env.GOOGLE_GENAI_API_KEY;
  if (!apiKey) return null;

  const { GoogleGenAI } = await import('@google/genai');
  const ai = new GoogleGenAI({ apiKey });

  const fullPrompt = `${prompt}\n\nColor palette: primary ${theme.primary} (${theme.name}), accent ${theme.accent}, dark background. Style: abstract, geometric, minimalist, modern SaaS aesthetic. 16:9 aspect ratio. High contrast. NO text, NO words, NO letters anywhere in the image.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: fullPrompt,
      config: { responseModalities: ['image', 'text'] },
    });

    const parts = response.candidates?.[0]?.content?.parts;
    if (parts) {
      for (const part of parts) {
        if (part.inlineData?.data) {
          return Buffer.from(part.inlineData.data, 'base64');
        }
      }
    }
    return null;
  } catch (err) {
    log('error', `${TAG} Gemini failed`, { error: err instanceof Error ? err.message : String(err) });
    return null;
  }
}

// ── Slack notification with approval buttons ─────────────────────────

async function sendToSlackForApproval(post: GeneratedPost, mediaId: string | null, socialSetId: number): Promise<boolean> {
  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) {
    log('warn', `${TAG} SLACK_BOT_TOKEN not set`);
    return false;
  }

  const accountLabel = post.account === 'personal' ? '@atinylittlenerd (personal)' : '@replysequence';
  const platforms = post.linkedInText ? 'X + LinkedIn' : 'X only';

  // Build approval value — JSON payload the webhook handler will parse
  const approvalData = JSON.stringify({
    socialSetId,
    xText: post.xText,
    linkedInText: post.linkedInText || null,
    mediaId: mediaId || null,
    title: post.title,
  });

  const blocks = [
    {
      type: 'header',
      text: { type: 'plain_text', text: `Content Draft: ${post.title}` },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Account:* ${accountLabel} | *Platforms:* ${platforms}`,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Tweet:*\n>${post.xText.split('\n').join('\n>')}`,
      },
    },
    ...(post.linkedInText ? [{
      type: 'section' as const,
      text: {
        type: 'mrkdwn' as const,
        text: `*LinkedIn:*\n${post.linkedInText.slice(0, 500)}${post.linkedInText.length > 500 ? '...' : ''}`,
      },
    }] : []),
    {
      type: 'actions',
      block_id: `content_approve_${Date.now()}`,
      elements: [
        {
          type: 'button',
          text: { type: 'plain_text', text: 'Approve & Post' },
          style: 'primary',
          action_id: 'content_approve',
          value: approvalData,
        },
        {
          type: 'button',
          text: { type: 'plain_text', text: 'Skip' },
          style: 'danger',
          action_id: 'content_skip',
          value: post.title,
        },
      ],
    },
  ];

  try {
    const res = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        channel: SLACK_CHANNEL,
        blocks,
        text: `Content draft: ${post.title}`,
      }),
    });

    const data = await res.json();
    if (!data.ok) {
      log('error', `${TAG} Slack post failed`, { error: data.error });
      return false;
    }
    return true;
  } catch (err) {
    log('error', `${TAG} Slack post error`, { error: err instanceof Error ? err.message : String(err) });
    return false;
  }
}

// ── Main pipeline ────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  log('info', `${TAG} Daily content pipeline starting`);

  try {
    // Step 1: Fetch trending articles
    const articles = await fetchTrendingArticles();
    log('info', `${TAG} Fetched ${articles.length} trending articles`);

    // Step 2: Generate posts via Claude
    const postsInput = articles.length > 0 ? articles : [{
      title: 'Sales teams continue to struggle with post-meeting follow-ups',
      description: 'Studies show 40% of follow-ups are sent late, costing teams deal momentum.',
      url: 'https://replysequence.com',
      source: { name: 'Industry Report' },
      publishedAt: new Date().toISOString(),
    }];

    const posts = await generatePosts(postsInput);
    if (posts.length === 0) {
      return NextResponse.json({ success: false, error: 'No posts generated' });
    }

    log('info', `${TAG} Generated ${posts.length} posts`);

    // Step 3: Generate images, upload to Typefully, send to Slack for approval
    const today = new Date();
    const theme = DAY_THEMES[today.getDay()];
    let sentToSlack = 0;

    for (const post of posts) {
      const socialSetId = post.account === 'personal'
        ? SOCIAL_SET_JIMMY
        : SOCIAL_SET_REPLYSEQUENCE;

      // Generate image
      const imageBuffer = await generateImage(post.imagePrompt, theme);

      // Upload image to Typefully (pre-upload so it's ready for instant publish on approve)
      let mediaId: string | null = null;
      if (imageBuffer) {
        try {
          const fileName = `content-${Date.now()}-${Math.random().toString(36).slice(2, 6)}.png`;
          mediaId = await uploadImage(socialSetId, imageBuffer, fileName);
        } catch (err) {
          log('warn', `${TAG} Image upload failed, posting without image`, {
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }

      // Send to Slack with Approve/Skip buttons
      const sent = await sendToSlackForApproval(post, mediaId, socialSetId);
      if (sent) sentToSlack++;
    }

    const durationMs = Date.now() - startTime;
    log('info', `${TAG} Pipeline complete`, {
      articlesScanned: articles.length,
      postsGenerated: posts.length,
      sentToSlack,
      durationMs,
    });

    return NextResponse.json({
      success: true,
      articlesScanned: articles.length,
      postsGenerated: posts.length,
      sentToSlack,
      durationMs,
    });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    log('error', `${TAG} Pipeline crashed`, { error: errMsg });
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
