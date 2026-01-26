/**
 * Draft Quality Scoring System
 *
 * Evaluates generated drafts on multiple dimensions:
 * - Subject specificity (generic vs specific)
 * - Action item clarity (vague vs actionable)
 * - Context relevance (references transcript content)
 * - Length appropriateness
 * - Structure quality
 */

import type { ParsedDraftResponse } from './prompts/optimized-followup';

export interface QualityScore {
  overall: number; // 0-100
  breakdown: {
    subjectScore: number; // 0-25
    bodyScore: number; // 0-25
    actionItemsScore: number; // 0-25
    structureScore: number; // 0-25
  };
  issues: string[]; // List of quality issues found
  suggestions: string[]; // Improvement suggestions
}

/**
 * Generic subject line patterns to penalize
 */
const GENERIC_SUBJECT_PATTERNS = [
  /^follow[- ]?up$/i,
  /^quick follow[- ]?up$/i,
  /^follow[- ]?up from (our |the )?meeting$/i,
  /^great (talking|meeting|chatting)/i,
  /^nice to meet/i,
  /^thank you for your time$/i,
  /^recap$/i,
  /^meeting recap$/i,
  /^our (call|meeting|conversation)$/i,
  /^checking in$/i,
  /^touching base$/i,
];

/**
 * Good subject line patterns to reward
 */
const SPECIFIC_SUBJECT_PATTERNS = [
  /\b(proposal|quote|pricing|demo|poc)\b/i,
  /\b(deadline|timeline|by \w+day)\b/i,
  /\b(next steps|action items)\b/i,
  /\b\d+\b/, // Contains numbers (specific)
  /\b(api|integration|deployment|bug|issue)\b/i,
  /\b(Q[1-4]|Q\d)\b/i, // Quarter references
];

/**
 * Generic body phrases to penalize
 */
const GENERIC_BODY_PHRASES = [
  'it was great meeting you',
  'it was nice talking',
  'thanks for your time',
  'hope this email finds you well',
  'just wanted to follow up',
  'as discussed',
  'as we discussed',
  'per our conversation',
  'let me know if you have any questions',
  'feel free to reach out',
  'please don\'t hesitate',
  'at your earliest convenience',
];

/**
 * Good structure indicators
 */
const STRUCTURE_INDICATORS = {
  hasGreeting: /^(hi|hello|hey|dear)\s+\w+/i,
  hasCTA: /(would you|could you|can we|shall we|let's|please|schedule|book|send)/i,
  hasNextStep: /(next step|moving forward|going forward|I'll|we'll|I will|we will)/i,
  hasSignature: /(best|regards|thanks|cheers|sincerely),?\s*$/im,
};

/**
 * Score a generated draft for quality
 */
export function scoreDraft(
  draft: ParsedDraftResponse,
  transcript: string
): QualityScore {
  const issues: string[] = [];
  const suggestions: string[] = [];

  // Score subject line (0-25)
  const subjectScore = scoreSubject(draft.subject, transcript, issues, suggestions);

  // Score body (0-25)
  const bodyScore = scoreBody(draft.body, transcript, issues, suggestions);

  // Score action items (0-25)
  const actionItemsScore = scoreActionItems(draft.actionItems, issues, suggestions);

  // Score structure (0-25)
  const structureScore = scoreStructure(draft.body, issues, suggestions);

  const overall = subjectScore + bodyScore + actionItemsScore + structureScore;

  const result: QualityScore = {
    overall,
    breakdown: {
      subjectScore,
      bodyScore,
      actionItemsScore,
      structureScore,
    },
    issues,
    suggestions,
  };

  // Log quality score
  console.log(JSON.stringify({
    level: 'info',
    message: 'Draft quality scored',
    overall: result.overall,
    breakdown: result.breakdown,
    issueCount: issues.length,
  }));

  return result;
}

/**
 * Score subject line (0-25)
 */
function scoreSubject(
  subject: string,
  transcript: string,
  issues: string[],
  suggestions: string[]
): number {
  let score = 25; // Start with max

  // Check length (ideal: 30-60 chars)
  if (subject.length > 60) {
    score -= 5;
    issues.push('Subject line too long (>60 chars)');
    suggestions.push('Shorten subject to under 60 characters');
  } else if (subject.length < 15) {
    score -= 3;
    issues.push('Subject line too short (<15 chars)');
  }

  // Penalize generic patterns
  for (const pattern of GENERIC_SUBJECT_PATTERNS) {
    if (pattern.test(subject)) {
      score -= 8;
      issues.push(`Generic subject line pattern: "${subject}"`);
      suggestions.push('Make subject line more specific by referencing a topic from the meeting');
      break; // Only penalize once for generic
    }
  }

  // Reward specific patterns
  let specificBonus = 0;
  for (const pattern of SPECIFIC_SUBJECT_PATTERNS) {
    if (pattern.test(subject)) {
      specificBonus += 2;
    }
  }
  score = Math.min(25, score + specificBonus);

  // Check if subject references transcript content
  const transcriptWords = transcript.toLowerCase().split(/\s+/);
  const subjectWords = subject.toLowerCase().split(/\s+/);
  const commonWords = subjectWords.filter(
    w => w.length > 4 && transcriptWords.includes(w)
  );
  if (commonWords.length === 0) {
    score -= 3;
    issues.push('Subject doesn\'t reference transcript content');
  }

  return Math.max(0, score);
}

/**
 * Score body content (0-25)
 */
function scoreBody(
  body: string,
  transcript: string,
  issues: string[],
  suggestions: string[]
): number {
  let score = 25;
  const lowerBody = body.toLowerCase();

  // Check length (ideal: 100-300 words)
  const wordCount = body.split(/\s+/).length;
  if (wordCount > 300) {
    score -= 5;
    issues.push(`Body too long (${wordCount} words)`);
    suggestions.push('Shorten to under 200 words for better engagement');
  } else if (wordCount < 50) {
    score -= 5;
    issues.push(`Body too short (${wordCount} words)`);
    suggestions.push('Add more context from the meeting discussion');
  }

  // Penalize generic phrases
  let genericCount = 0;
  for (const phrase of GENERIC_BODY_PHRASES) {
    if (lowerBody.includes(phrase)) {
      genericCount++;
    }
  }
  if (genericCount > 0) {
    score -= genericCount * 3;
    issues.push(`Contains ${genericCount} generic phrase(s)`);
    suggestions.push('Replace generic phrases with specific references to the conversation');
  }

  // Check for transcript content references
  // Extract significant phrases from transcript (5+ char words)
  const transcriptPhrases = transcript
    .toLowerCase()
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 20);

  let contentReferences = 0;
  for (const phrase of transcriptPhrases) {
    const words = phrase.split(/\s+/).filter(w => w.length > 5);
    for (const word of words.slice(0, 3)) { // Check first 3 significant words
      if (lowerBody.includes(word)) {
        contentReferences++;
        break;
      }
    }
  }

  if (contentReferences < 2) {
    score -= 5;
    issues.push('Few references to transcript content');
    suggestions.push('Reference 2-3 specific points from the conversation');
  }

  return Math.max(0, score);
}

/**
 * Score action items (0-25)
 */
function scoreActionItems(
  actionItems: ParsedDraftResponse['actionItems'],
  issues: string[],
  suggestions: string[]
): number {
  // If no action items, give partial credit but flag it
  if (!actionItems || actionItems.length === 0) {
    issues.push('No action items extracted');
    suggestions.push('Extract action items with owner and deadline');
    return 10; // Partial credit - some meetings genuinely have no action items
  }

  let score = 25;

  // Check each action item
  for (const item of actionItems) {
    // Check for owner
    if (!item.owner || item.owner.toLowerCase() === 'tbd' || item.owner.toLowerCase() === 'unknown') {
      score -= 3;
      issues.push(`Action item missing owner: "${item.task.substring(0, 30)}..."`);
    }

    // Check for deadline
    if (!item.deadline || item.deadline.toLowerCase() === 'tbd' || item.deadline.toLowerCase() === 'asap') {
      score -= 2;
      issues.push(`Action item missing specific deadline: "${item.task.substring(0, 30)}..."`);
    }

    // Check task is specific (not too short)
    if (item.task.length < 10) {
      score -= 2;
      issues.push(`Action item too vague: "${item.task}"`);
    }
  }

  // Penalize too many action items
  if (actionItems.length > 5) {
    score -= 3;
    issues.push(`Too many action items (${actionItems.length})`);
    suggestions.push('Limit to 5 most important action items');
  }

  return Math.max(0, score);
}

/**
 * Score email structure (0-25)
 */
function scoreStructure(
  body: string,
  issues: string[],
  suggestions: string[]
): number {
  let score = 25;

  // Check for greeting
  if (!STRUCTURE_INDICATORS.hasGreeting.test(body)) {
    score -= 5;
    issues.push('Missing personalized greeting');
    suggestions.push('Start with a personalized greeting (Hi [Name],)');
  }

  // Check for CTA
  if (!STRUCTURE_INDICATORS.hasCTA.test(body)) {
    score -= 5;
    issues.push('Missing clear call-to-action');
    suggestions.push('Add a clear next step or question at the end');
  }

  // Check for next step language
  if (!STRUCTURE_INDICATORS.hasNextStep.test(body)) {
    score -= 3;
    issues.push('No clear next step mentioned');
  }

  // Check for proper paragraphs (not a wall of text)
  const paragraphs = body.split(/\n\n+/).filter(p => p.trim());
  if (paragraphs.length < 2) {
    score -= 3;
    issues.push('Body lacks paragraph structure');
    suggestions.push('Break content into 2-3 focused paragraphs');
  }

  return Math.max(0, score);
}

/**
 * Get quality grade from score
 */
export function getQualityGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 85) return 'A';
  if (score >= 70) return 'B';
  if (score >= 55) return 'C';
  if (score >= 40) return 'D';
  return 'F';
}

/**
 * Check if draft meets minimum quality threshold
 */
export function meetsQualityThreshold(score: number, threshold = 60): boolean {
  return score >= threshold;
}
