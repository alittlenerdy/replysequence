/**
 * Meeting Type Detection
 *
 * Analyzes transcript content and meeting metadata to determine
 * the type of meeting and appropriate tone for follow-up.
 */

export type MeetingType =
  | 'sales_call'
  | 'internal_sync'
  | 'client_review'
  | 'technical_discussion'
  | 'general';

export type ToneType = 'formal' | 'casual' | 'neutral';

export interface MeetingTypeResult {
  meetingType: MeetingType;
  confidence: number; // 0-100
  tone: ToneType;
  signals: string[]; // What triggered the detection
}

/**
 * Keyword patterns for meeting type detection
 */
const MEETING_TYPE_PATTERNS: Record<MeetingType, { keywords: string[]; weight: number }[]> = {
  sales_call: [
    { keywords: ['pricing', 'proposal', 'quote', 'budget', 'cost'], weight: 3 },
    { keywords: ['demo', 'presentation', 'pitch', 'prospect'], weight: 3 },
    { keywords: ['competitor', 'alternative', 'comparison'], weight: 2 },
    { keywords: ['decision maker', 'stakeholder', 'buying'], weight: 3 },
    { keywords: ['trial', 'pilot', 'proof of concept', 'poc'], weight: 2 },
    { keywords: ['contract', 'terms', 'agreement', 'deal'], weight: 3 },
    { keywords: ['timeline to purchase', 'when would you', 'next steps'], weight: 2 },
    { keywords: ['pain point', 'challenge', 'problem you\'re facing'], weight: 2 },
    { keywords: ['roi', 'return on investment', 'value'], weight: 2 },
  ],
  internal_sync: [
    { keywords: ['standup', 'sync', 'check-in', 'status update'], weight: 3 },
    { keywords: ['sprint', 'backlog', 'velocity', 'story points'], weight: 3 },
    { keywords: ['team meeting', 'all hands', 'weekly'], weight: 2 },
    { keywords: ['blocker', 'blocked', 'stuck on'], weight: 2 },
    { keywords: ['hire', 'hiring', 'interview', 'candidate'], weight: 2 },
    { keywords: ['performance review', '1:1', 'one on one'], weight: 3 },
    { keywords: ['roadmap', 'planning', 'quarterly'], weight: 2 },
    { keywords: ['our team', 'internally', 'between us'], weight: 2 },
  ],
  client_review: [
    { keywords: ['feedback', 'review', 'thoughts on'], weight: 3 },
    { keywords: ['deliverable', 'milestone', 'deadline'], weight: 2 },
    { keywords: ['revision', 'change request', 'update'], weight: 2 },
    { keywords: ['scope', 'scope creep', 'out of scope'], weight: 2 },
    { keywords: ['sign off', 'approval', 'approved'], weight: 3 },
    { keywords: ['invoice', 'payment', 'billing'], weight: 2 },
    { keywords: ['project status', 'progress update'], weight: 2 },
    { keywords: ['client', 'account', 'engagement'], weight: 2 },
  ],
  technical_discussion: [
    { keywords: ['architecture', 'design', 'infrastructure'], weight: 3 },
    { keywords: ['api', 'endpoint', 'integration'], weight: 2 },
    { keywords: ['database', 'schema', 'migration'], weight: 2 },
    { keywords: ['bug', 'issue', 'error', 'exception'], weight: 2 },
    { keywords: ['deploy', 'deployment', 'release', 'ci/cd'], weight: 2 },
    { keywords: ['code review', 'pull request', 'pr'], weight: 3 },
    { keywords: ['performance', 'latency', 'optimization'], weight: 2 },
    { keywords: ['security', 'authentication', 'authorization'], weight: 2 },
    { keywords: ['debugging', 'troubleshooting', 'investigating'], weight: 2 },
    { keywords: ['redis', 'postgres', 'mongodb', 'aws', 'vercel'], weight: 2 },
  ],
  general: [
    { keywords: ['meeting', 'discussion', 'conversation'], weight: 1 },
  ],
};

/**
 * Tone detection patterns
 */
const TONE_PATTERNS = {
  formal: [
    'regarding', 'pursuant', 'hereby', 'kindly', 'please be advised',
    'we would like to', 'it has come to our attention', 'at your earliest convenience',
    'dear sir', 'dear madam', 'respectfully',
  ],
  casual: [
    'hey', 'hi there', 'cool', 'awesome', 'sounds good', 'no worries',
    'gonna', 'wanna', 'yeah', 'yep', 'nope', 'lol', 'haha',
    'btw', 'fyi', 'asap', 'super', 'totally', 'absolutely',
    'quick question', 'just checking', 'catch up',
  ],
};

/**
 * Detect meeting type from transcript and metadata
 */
export function detectMeetingType(
  transcript: string,
  meetingTopic?: string
): MeetingTypeResult {
  const lowerTranscript = transcript.toLowerCase();
  const lowerTopic = (meetingTopic || '').toLowerCase();
  const combinedText = `${lowerTopic} ${lowerTranscript}`;

  const scores: Record<MeetingType, { score: number; signals: string[] }> = {
    sales_call: { score: 0, signals: [] },
    internal_sync: { score: 0, signals: [] },
    client_review: { score: 0, signals: [] },
    technical_discussion: { score: 0, signals: [] },
    general: { score: 1, signals: ['default fallback'] }, // Base score for general
  };

  // Score each meeting type
  for (const [type, patterns] of Object.entries(MEETING_TYPE_PATTERNS)) {
    const meetingType = type as MeetingType;

    for (const pattern of patterns) {
      for (const keyword of pattern.keywords) {
        // Count occurrences (cap at 3 to avoid over-weighting)
        const regex = new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        const matches = combinedText.match(regex);
        const occurrences = Math.min(matches?.length || 0, 3);

        if (occurrences > 0) {
          const addedScore = occurrences * pattern.weight;
          scores[meetingType].score += addedScore;
          if (!scores[meetingType].signals.includes(keyword)) {
            scores[meetingType].signals.push(keyword);
          }
        }
      }
    }
  }

  // Find the highest scoring type
  let bestType: MeetingType = 'general';
  let bestScore = 0;

  for (const [type, data] of Object.entries(scores)) {
    if (data.score > bestScore) {
      bestScore = data.score;
      bestType = type as MeetingType;
    }
  }

  // Calculate confidence (normalize score to 0-100)
  // A score of 15+ is high confidence
  const confidence = Math.min(100, Math.round((bestScore / 15) * 100));

  // Detect tone
  const tone = detectTone(combinedText);

  const result: MeetingTypeResult = {
    meetingType: bestType,
    confidence,
    tone,
    signals: scores[bestType].signals.slice(0, 5), // Top 5 signals
  };

  // Log for debugging
  console.log(JSON.stringify({
    level: 'info',
    message: 'Meeting type detected',
    meetingType: result.meetingType,
    confidence: result.confidence,
    tone: result.tone,
    signals: result.signals,
    allScores: Object.fromEntries(
      Object.entries(scores).map(([k, v]) => [k, v.score])
    ),
  }));

  return result;
}

/**
 * Detect tone from text
 */
function detectTone(text: string): ToneType {
  let formalScore = 0;
  let casualScore = 0;

  for (const pattern of TONE_PATTERNS.formal) {
    if (text.includes(pattern)) {
      formalScore++;
    }
  }

  for (const pattern of TONE_PATTERNS.casual) {
    if (text.includes(pattern)) {
      casualScore++;
    }
  }

  if (casualScore > formalScore + 2) {
    return 'casual';
  } else if (formalScore > casualScore + 2) {
    return 'formal';
  }

  return 'neutral';
}

/**
 * Extract key participants from transcript
 * Looks for speaker labels like "John: Hello everyone"
 */
export function extractParticipants(transcript: string): string[] {
  const speakerPattern = /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s*:/gm;
  const speakers = new Set<string>();

  let match;
  while ((match = speakerPattern.exec(transcript)) !== null) {
    const speaker = match[1].trim();
    if (speaker.length > 1 && speaker.length < 50) {
      speakers.add(speaker);
    }
  }

  return Array.from(speakers);
}
