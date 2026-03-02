/**
 * Generates/updates a user's writing style profile by analyzing
 * their edit patterns across recent drafts.
 *
 * Called after every 5th edited draft (not on every send).
 * Uses Claude Haiku for cost efficiency (~$0.001 per call).
 */

import { getClaudeClient } from '@/lib/claude-api';
import { db, users, drafts, meetings } from '@/lib/db';
import { eq, isNotNull, desc, and, sql } from 'drizzle-orm';

const HAIKU_MODEL = 'claude-haiku-4-5-20251001';
const EDITS_BEFORE_REFRESH = 5;

export interface StyleProfile {
  toneAdjustments: string;
  structuralPreferences: string;
  contentPatterns: string;
  avoidances: string;
  sampleCount: number;
  lastUpdated: string;
}

/**
 * Check if the user's style profile needs refreshing.
 * Returns true if they have N+ edits since last profile update.
 */
export async function shouldRefreshStyleProfile(userId: string): Promise<boolean> {
  const [user] = await db
    .select({ styleProfile: users.styleProfile })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const currentProfile = user?.styleProfile as StyleProfile | null;
  const lastCount = currentProfile?.sampleCount ?? 0;

  // Count total edited drafts for this user
  const [result] = await db
    .select({ count: sql<number>`count(*)` })
    .from(drafts)
    .innerJoin(meetings, eq(drafts.meetingId, meetings.id))
    .where(
      and(
        eq(meetings.userId, userId),
        isNotNull(drafts.userEditedBody)
      )
    );

  const totalEdits = Number(result?.count ?? 0);
  return totalEdits >= lastCount + EDITS_BEFORE_REFRESH;
}

/**
 * Generate or update a user's writing style profile.
 */
export async function generateStyleProfile(userId: string): Promise<StyleProfile> {
  // Get recent edited drafts for this user
  const recentEdits = await db
    .select({
      originalBody: drafts.originalBody,
      userEditedBody: drafts.userEditedBody,
      editDiffScore: drafts.editDiffScore,
    })
    .from(drafts)
    .innerJoin(meetings, eq(drafts.meetingId, meetings.id))
    .where(
      and(
        eq(meetings.userId, userId),
        isNotNull(drafts.userEditedBody),
        isNotNull(drafts.originalBody)
      )
    )
    .orderBy(desc(drafts.createdAt))
    .limit(15);

  if (recentEdits.length === 0) {
    throw new Error('No edited drafts found for style profile generation');
  }

  // Get existing profile for context
  const [user] = await db
    .select({ styleProfile: users.styleProfile })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const existingProfile = user?.styleProfile as StyleProfile | null;

  // Build edit examples for Claude - only include meaningfully edited drafts
  const editExamples = recentEdits
    .filter(e => e.originalBody && e.userEditedBody && e.editDiffScore !== null && e.editDiffScore < 95)
    .slice(0, 10)
    .map((edit, i) => `
--- Edit ${i + 1} (${edit.editDiffScore}% similar) ---
ORIGINAL: ${edit.originalBody!.slice(0, 500)}
EDITED: ${edit.userEditedBody!.slice(0, 500)}
`).join('\n');

  if (!editExamples.trim()) {
    // No meaningful edits to learn from
    return existingProfile ?? {
      toneAdjustments: 'No significant edits detected yet',
      structuralPreferences: 'No significant edits detected yet',
      contentPatterns: 'No significant edits detected yet',
      avoidances: 'No significant edits detected yet',
      sampleCount: recentEdits.length,
      lastUpdated: new Date().toISOString(),
    };
  }

  const client = getClaudeClient();

  const response = await client.messages.create({
    model: HAIKU_MODEL,
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `Analyze these email drafts where a user edited the AI-generated version. Identify consistent patterns in what they change.

${existingProfile ? `Previous style profile (update this):\n${JSON.stringify(existingProfile, null, 2)}\n` : ''}

${editExamples}

Respond in this exact JSON format:
{
  "toneAdjustments": "How they adjust tone (e.g., 'softens language, uses contractions, avoids exclamation marks')",
  "structuralPreferences": "How they restructure (e.g., 'adds personal note before CTA, shortens paragraphs')",
  "contentPatterns": "What content they add/change (e.g., 'adds pricing details for sales calls, includes timeline')",
  "avoidances": "What they consistently remove or avoid (e.g., 'removes exclamation marks, avoids jargon')"
}

Be specific and concise. Each field should be 1-2 sentences max. Only include patterns you see repeated across multiple edits.`,
    }],
  });

  const content = response.content[0];
  if (content.type !== 'text') throw new Error('Unexpected response type');

  const parsed = JSON.parse(content.text);

  const profile: StyleProfile = {
    toneAdjustments: parsed.toneAdjustments,
    structuralPreferences: parsed.structuralPreferences,
    contentPatterns: parsed.contentPatterns,
    avoidances: parsed.avoidances,
    sampleCount: recentEdits.length,
    lastUpdated: new Date().toISOString(),
  };

  // Save to user record
  await db
    .update(users)
    .set({ styleProfile: profile })
    .where(eq(users.id, userId));

  return profile;
}
