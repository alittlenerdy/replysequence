// scripts/blog-agent/analyze.ts
import { callClaudeAPI } from '@/lib/claude-api';
import type { PainPoint, AnalyzedTopic } from './types';

const COMPETITOR_NAMES = [
  'gong', 'chorus', 'fireflies', 'otter', 'fathom', 'avoma',
  'grain', 'clari', 'salesloft', 'outreach', 'hubspot',
  'apollo', 'instantly', 'lemlist', 'mixmax', 'yesware',
  'saleshandy', 'mailshake', 'reply.io', 'woodpecker',
];

export function pickPostFormat(painPoints: PainPoint[]): 'problem-solution' | 'comparison' {
  const text = painPoints.map((p) => p.text.toLowerCase()).join(' ');
  const mentionsCompetitor = COMPETITOR_NAMES.some((name) => text.includes(name));
  const mentionsAlternative = /alternative|instead|replace|switch|better than|compared to|vs\b|versus/i.test(text);

  return mentionsCompetitor || mentionsAlternative ? 'comparison' : 'problem-solution';
}

export function extractKeywords(painPoints: PainPoint[]): string[] {
  const text = painPoints.map((p) => p.text).join(' ').toLowerCase();
  const keyPhrases = [
    'follow-up email', 'follow up email', 'meeting follow-up', 'meeting notes',
    'sales call', 'crm update', 'action items', 'post-meeting', 'meeting recap',
    'sales automation', 'email automation', 'meeting transcript',
    'deal went cold', 'prospect ghosted', 'forgot to follow up',
    'manual crm', 'admin work', 'logging notes', 'data entry',
    'follow-up sequence', 'multi-step', 'automated sequence',
    'generic email', 'great speaking with you', 'personalized follow-up',
    'meeting intelligence', 'conversation intelligence', 'sales pipeline',
    'writing style', 'tone match', 'ai email',
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

  const currentYear = new Date().getFullYear();

  const systemPrompt = `You are an SEO content strategist. Analyze these pain points from social media and propose a blog post topic.

Important: The current year is ${currentYear}. If you reference a year in the title, use ${currentYear}. Never use past years like 2024 or 2025.

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

Analyze these pain points and propose the most compelling blog post topic that would rank well for SEO and resonate with sales professionals frustrated by any of these workflows:
- Writing personalized follow-up emails after sales calls
- Forgetting to follow up or sending generic "great speaking with you" emails
- Manually updating CRM after every meeting
- Deals going cold because nobody followed up
- Spending too much time on admin instead of selling
- Not having meeting intelligence or searchable transcripts
- Follow-up sequences that feel robotic instead of context-aware`;

  try {
    const { content } = await callClaudeAPI({
      systemPrompt,
      userPrompt,
      maxTokens: 500,
    });

    // Strip markdown code fences if Claude wraps the JSON
    const cleaned = content.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
    const parsed = JSON.parse(cleaned);

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
