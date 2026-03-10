// scripts/blog-agent/analyze.ts
import { callClaudeAPI } from '@/lib/claude-api';
import type { PainPoint, AnalyzedTopic } from './types';

const COMPETITOR_NAMES = [
  'gong', 'chorus', 'fireflies', 'otter', 'fathom', 'avoma',
  'grain', 'clari', 'salesloft', 'outreach', 'hubspot',
];

export function pickPostFormat(painPoints: PainPoint[]): 'problem-solution' | 'comparison' {
  const text = painPoints.map((p) => p.text.toLowerCase()).join(' ');
  const mentionsCompetitor = COMPETITOR_NAMES.some((name) => text.includes(name));
  const mentionsAlternative = /alternative|instead|replace|switch|better than|compared to/i.test(text);

  return mentionsCompetitor || mentionsAlternative ? 'comparison' : 'problem-solution';
}

export function extractKeywords(painPoints: PainPoint[]): string[] {
  const text = painPoints.map((p) => p.text).join(' ').toLowerCase();
  const keyPhrases = [
    'follow-up email', 'follow up email', 'meeting follow-up', 'meeting notes',
    'sales call', 'crm update', 'action items', 'post-meeting', 'meeting recap',
    'sales automation', 'email automation', 'meeting transcript',
  ];
  return keyPhrases.filter((phrase) => text.includes(phrase));
}

export function deduplicateAgainstExisting<T extends { slug: string }>(
  topics: T[],
  existingSlugs: string[]
): T[] {
  const slugSet = new Set(existingSlugs);
  return topics.filter((t) => !slugSet.has(t.slug));
}

export async function analyzePainPoints(painPoints: PainPoint[]): Promise<AnalyzedTopic | null> {
  if (painPoints.length === 0) return null;

  const topPainPoints = [...painPoints]
    .sort((a, b) => b.engagement - a.engagement)
    .slice(0, 10);

  const postFormat = pickPostFormat(topPainPoints);
  const extractedKeywords = extractKeywords(topPainPoints);

  const painPointSummary = topPainPoints
    .map((p, i) => `${i + 1}. [${p.source}] (${p.engagement} engagement) "${p.text}"`)
    .join('\n');

  const systemPrompt = `You are an SEO content strategist. Analyze these pain points from social media and propose a blog post topic.

Return ONLY valid JSON with this structure:
{
  "primaryKeyword": "the main SEO keyword phrase to target (3-5 words)",
  "secondaryKeywords": ["2-3 related keyword phrases"],
  "title": "SEO-optimized blog post title (includes primary keyword, under 60 chars)",
  "slug": "url-friendly-slug-from-title",
  "postFormat": "${postFormat}"
}`;

  const userPrompt = `Pain points found on social media:

${painPointSummary}

Keywords already detected: ${extractedKeywords.join(', ') || 'none'}

Proposed format: ${postFormat}

Analyze these pain points and propose the most compelling blog post topic that would rank well for SEO and resonate with sales professionals frustrated by meeting follow-up workflows.`;

  try {
    const { content } = await callClaudeAPI({
      systemPrompt,
      userPrompt,
      maxTokens: 500,
    });

    const parsed = JSON.parse(content);

    return {
      painPoints: topPainPoints,
      primaryKeyword: parsed.primaryKeyword,
      secondaryKeywords: parsed.secondaryKeywords,
      postFormat: parsed.postFormat || postFormat,
      title: parsed.title,
      slug: parsed.slug,
    };
  } catch (error) {
    console.log(JSON.stringify({
      level: 'error',
      message: 'Failed to analyze pain points',
      error: error instanceof Error ? error.message : String(error),
    }));
    return null;
  }
}
