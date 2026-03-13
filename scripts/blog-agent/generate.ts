// scripts/blog-agent/generate.ts
import { callClaudeAPI } from '@/lib/claude-api';
import type { AnalyzedTopic, BlogDraft, VoicePreferences } from './types';

export function calculateReadingTime(content: string): number {
  const words = content.split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

export function buildSystemPrompt(prefs: VoicePreferences | null): string {
  const tone = prefs?.aiTone ?? 'professional';
  const role = prefs?.userRole ?? 'sales professional';
  const customInstructions = prefs?.aiCustomInstructions ?? '';

  return `You are a blog content writer for ReplySequence, the AI-powered follow-up layer for sales. ReplySequence turns sales conversations into next actions automatically — after a Zoom, Teams, or Meet call it analyzes the transcript and generates personalized follow-up emails, triggers multi-step sequences for unresponsive prospects, syncs everything to CRM, and provides conversational meeting intelligence. Write in a ${tone} tone as if you are a ${role} writing for peers in the sales industry.

Key writing guidelines:
- Write 800-1500 words of substantive content
- Use markdown formatting (## for H2 headings, **bold**, lists)
- Start with a hook that resonates with the reader's pain
- Include specific data points or examples where possible
- End with a clear takeaway that positions AI meeting follow-up as the solution (without being overly salesy)
- Use "you" and "your" to speak directly to the reader
- Break up text with subheadings every 2-3 paragraphs
${customInstructions ? `\nAdditional style instructions: ${customInstructions}` : ''}

Return ONLY valid JSON with this structure:
{
  "excerpt": "1-2 sentence hook for the blog listing page (under 200 chars)",
  "content": "full markdown blog post content (800-1500 words)",
  "tags": ["2-4 relevant tags for filtering"]
}`;
}

export async function generateBlogPost(
  topic: AnalyzedTopic,
  prefs: VoicePreferences | null
): Promise<BlogDraft | null> {
  const systemPrompt = buildSystemPrompt(prefs);

  const painPointContext = topic.painPoints
    .slice(0, 5)
    .map((p) => `- "${p.text}" (${p.source}, ${p.engagement} engagement)`)
    .join('\n');

  const formatInstruction =
    topic.postFormat === 'comparison'
      ? 'Write a comparison/alternatives style post. Compare approaches or tools, helping readers evaluate their options.'
      : 'Write a problem-solution style post. Lead with the pain point, explain why it matters, then present the solution.';

  const userPrompt = `Write a blog post with this title: "${topic.title}"

Target SEO keyword: ${topic.primaryKeyword}
Secondary keywords to naturally include: ${topic.secondaryKeywords.join(', ')}

Format: ${formatInstruction}

Real pain points from social media that inspired this topic:
${painPointContext}

Write the full blog post now.`;

  try {
    const { content } = await callClaudeAPI({
      systemPrompt,
      userPrompt,
      maxTokens: 4096,
    });

    // Strip markdown code fences if Claude wraps the JSON
    const cleaned = content.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
    const parsed = JSON.parse(cleaned);
    const today = new Date().toISOString().split('T')[0];

    return {
      title: topic.title,
      slug: topic.slug,
      excerpt: parsed.excerpt,
      content: parsed.content,
      date: today,
      author: 'Jimmy Daly',
      tags: parsed.tags,
      readingTime: calculateReadingTime(parsed.content),
    };
  } catch (error) {
    console.log(JSON.stringify({
      level: 'error',
      message: 'Failed to generate blog post',
      error: error instanceof Error ? error.message : String(error),
    }));
    return null;
  }
}
