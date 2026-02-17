/**
 * Optimized prompt templates for high-quality follow-up email generation.
 *
 * Key improvements over v1:
 * - Meeting type detection (sales, internal, client, technical)
 * - Structured output with action items
 * - Hook-driven subject lines under 60 chars
 * - Greeting → Context → Value → CTA structure
 * - Tone adaptation based on meeting content
 * - Quality scoring criteria
 */

import type { MeetingType } from '../meeting-type-detector';

export interface FollowUpContext {
  // Meeting metadata
  meetingTopic: string;
  meetingDate: string;
  hostName: string;
  hostEmail: string;

  // Transcript content
  transcript: string;

  // Detected context (populated by meeting-type-detector)
  meetingType?: MeetingType;
  detectedTone?: 'formal' | 'casual' | 'neutral';
  keyParticipants?: string[];

  // Optional customization
  senderName?: string;
  companyName?: string;
  recipientName?: string;
  additionalContext?: string;

  // Template customization
  templateId?: string;
  templateInstructions?: string;
}

/**
 * Meeting-type specific instructions
 */
const MEETING_TYPE_INSTRUCTIONS: Record<MeetingType, string> = {
  sales_call: `Focus on:
- Value proposition discussed and how it solves their pain points
- Next steps toward a proposal or demo
- Timeline and decision process
- Budget or pricing discussions if mentioned`,

  internal_sync: `Focus on:
- Key decisions made during the meeting
- Action items assigned to specific people
- Blockers identified and owners for resolution
- Follow-up meeting if scheduled`,

  client_review: `Focus on:
- Feedback received and how you'll address it
- Timeline updates and milestone progress
- Any scope changes discussed
- Next deliverables and due dates`,

  technical_discussion: `Focus on:
- Technical decisions made
- Blockers identified and proposed solutions
- Architecture or implementation approach agreed upon
- Documentation or follow-up research needed`,

  general: `Focus on:
- Main topics discussed and key takeaways
- Any action items mentioned
- Next steps if any were proposed
- Appreciation for their time and insights`,
};

/**
 * Examples of good vs bad drafts for in-context learning
 */
const QUALITY_EXAMPLES = `
## GOOD SUBJECT LINE EXAMPLES:
- "Redis debugging session - next steps" (specific, actionable)
- "Your Q1 pipeline concerns - proposed solution" (references pain point)
- "Demo follow-up: 3 integration options discussed" (concrete details)

## BAD SUBJECT LINE EXAMPLES (avoid these patterns):
- "Follow-up from our meeting" (generic, says nothing)
- "Great talking with you!" (no information value)
- "Quick follow-up" (lazy, unspecific)

## GOOD EMAIL BODY STRUCTURE:
1. Personalized greeting with their name
2. Specific callback to something THEY said (not you)
3. Value statement addressing their concern
4. One clear next step with proposed timing
5. Warm close

## GOOD ACTION ITEMS FORMAT:
[ ] Jimmy: Send proposal with pricing tiers (by Friday)
[ ] Sarah: Review technical requirements doc (before Monday standup)
[ ] Team: Schedule follow-up demo (next week)

## BAD ACTION ITEMS (avoid):
- "Follow up on discussed items" (vague, no owner)
- "Think about next steps" (not actionable)
- "Continue conversation" (meaningless)
`;

/**
 * Main system prompt for optimized follow-up generation
 */
export const OPTIMIZED_SYSTEM_PROMPT = `You are an expert at writing follow-up emails that feel personal, specific, and actionable. Your emails consistently get responses because they reference real details from conversations and propose clear next steps.

## YOUR APPROACH:
1. Read the transcript carefully for specific details, pain points, and commitments
2. Identify the meeting type and adjust tone accordingly
3. Extract concrete action items with owners and deadlines
4. Write a subject line that hooks attention with specificity
5. Structure the body: Greeting → Context → Value → CTA

## OUTPUT FORMAT (STRICT):
You must respond in this exact JSON format:

{
  "meetingSummary": "A concise 2-4 sentence summary of the meeting covering what was discussed, key outcomes, and overall purpose. Written in third person past tense.",
  "keyTopics": [
    {
      "topic": "Topic name or theme",
      "duration": "main focus | discussed at length | discussed briefly | mentioned"
    }
  ],
  "keyDecisions": [
    {
      "decision": "What was decided",
      "context": "Brief context for why this decision was made"
    }
  ],
  "subject": "Subject line here (max 60 characters, specific and hook-driven)",
  "body": "Full email body here with proper formatting",
  "actionItems": [
    {
      "owner": "Person name",
      "task": "Specific task description",
      "deadline": "When it should be done (e.g., 'by Friday', 'before next call')"
    }
  ],
  "meetingTypeDetected": "sales_call | internal_sync | client_review | technical_discussion | general",
  "toneUsed": "formal | casual | neutral",
  "keyPointsReferenced": ["Point 1 from transcript", "Point 2 from transcript"]
}

## RULES:
1. Meeting summary MUST be 2-4 sentences, factual, third person past tense - no fluff
2. Key topics MUST list 2-5 topics actually discussed, with relative duration
3. Key decisions: include only if actual decisions were made (can be empty array)
4. Subject line MUST be under 60 characters and reference something specific from the meeting
5. Body MUST be under 200 words, warm but professional
6. Action items MUST have an owner and deadline - if unclear from transcript, suggest reasonable defaults
7. Maximum 5 action items - prioritize the most important ones
8. Reference 2-3 SPECIFIC things the other person said (not generic summaries)
9. One clear CTA at the end - make it easy to say yes
10. Match the tone of the meeting - if they were casual, be casual

${QUALITY_EXAMPLES}

## WHAT TO AVOID:
- Generic openers like "It was great meeting you"
- Summarizing everything discussed (pick the key points)
- Multiple CTAs (one is enough)
- Salesy language or pushy tone
- Action items without owners
- Subject lines that could apply to any meeting`;

/**
 * Build the user prompt with full context
 */
export function buildOptimizedPrompt(context: FollowUpContext): string {
  const {
    meetingTopic,
    meetingDate,
    hostName,
    transcript,
    meetingType,
    detectedTone,
    senderName = hostName,
    companyName,
    recipientName,
    additionalContext,
    templateInstructions,
  } = context;

  // Use template instructions if provided, otherwise fall back to meeting-type defaults
  const typeInstructions = templateInstructions
    ? templateInstructions
    : meetingType
      ? MEETING_TYPE_INSTRUCTIONS[meetingType]
      : MEETING_TYPE_INSTRUCTIONS.general;

  let prompt = `Generate a follow-up email based on this meeting.

## MEETING DETAILS:
- Topic: ${meetingTopic}
- Date: ${meetingDate}
- From: ${senderName}${companyName ? ` (${companyName})` : ''}`;

  if (recipientName) {
    prompt += `\n- To: ${recipientName}`;
  }

  if (meetingType) {
    prompt += `\n- Detected Type: ${meetingType.replace('_', ' ')}`;
  }

  if (detectedTone) {
    prompt += `\n- Tone to use: ${detectedTone}`;
  }

  prompt += `

## MEETING-SPECIFIC FOCUS:
${typeInstructions}`;

  if (additionalContext) {
    prompt += `\n\n## ADDITIONAL CONTEXT:\n${additionalContext}`;
  }

  prompt += `

## TRANSCRIPT:
---
${transcript}
---

Now generate the follow-up email in the exact JSON format specified. Make it specific, actionable, and reference real details from this conversation.`;

  return prompt;
}

/**
 * Parse the JSON response from Claude
 */
export interface ParsedDraftResponse {
  meetingSummary: string;
  keyTopics: Array<{
    topic: string;
    duration?: string;
  }>;
  keyDecisions: Array<{
    decision: string;
    context?: string;
  }>;
  subject: string;
  body: string;
  actionItems: Array<{
    owner: string;
    task: string;
    deadline: string;
  }>;
  meetingTypeDetected: MeetingType;
  toneUsed: 'formal' | 'casual' | 'neutral';
  keyPointsReferenced: string[];
}

export function parseOptimizedResponse(content: string): ParsedDraftResponse {
  // Try to extract JSON from the response
  let jsonStr = content.trim();

  // Handle markdown code blocks
  if (jsonStr.startsWith('```json')) {
    jsonStr = jsonStr.slice(7);
  } else if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.slice(3);
  }
  if (jsonStr.endsWith('```')) {
    jsonStr = jsonStr.slice(0, -3);
  }
  jsonStr = jsonStr.trim();

  try {
    const parsed = JSON.parse(jsonStr);

    // Validate required fields
    if (!parsed.subject || !parsed.body) {
      throw new Error('Missing required fields: subject and body');
    }

    return {
      meetingSummary: parsed.meetingSummary || '',
      keyTopics: parsed.keyTopics || [],
      keyDecisions: parsed.keyDecisions || [],
      subject: parsed.subject,
      body: parsed.body,
      actionItems: parsed.actionItems || [],
      meetingTypeDetected: parsed.meetingTypeDetected || 'general',
      toneUsed: parsed.toneUsed || 'neutral',
      keyPointsReferenced: parsed.keyPointsReferenced || [],
    };
  } catch (parseError) {
    // Fallback: try to extract subject and body manually
    console.error('Failed to parse JSON response, using fallback parser');

    const lines = content.trim().split('\n');
    let subject = '';
    let bodyStartIndex = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.toLowerCase().startsWith('subject:')) {
        subject = line.substring('subject:'.length).trim();
        bodyStartIndex = i + 1;
        break;
      }
    }

    while (bodyStartIndex < lines.length && lines[bodyStartIndex].trim() === '') {
      bodyStartIndex++;
    }

    const body = lines.slice(bodyStartIndex).join('\n').trim();

    return {
      meetingSummary: '',
      keyTopics: [],
      keyDecisions: [],
      subject: subject || 'Follow-up from our meeting',
      body: body || content,
      actionItems: [],
      meetingTypeDetected: 'general',
      toneUsed: 'neutral',
      keyPointsReferenced: [],
    };
  }
}

/**
 * Format action items for display in email body
 */
export function formatActionItemsForEmail(actionItems: ParsedDraftResponse['actionItems']): string {
  if (!actionItems || actionItems.length === 0) {
    return '';
  }

  const formatted = actionItems
    .map(item => `[ ] ${item.owner}: ${item.task}${item.deadline ? ` (${item.deadline})` : ''}`)
    .join('\n');

  return `\n\nAction Items:\n${formatted}`;
}

/**
 * Estimate token count (rough approximation)
 */
export function estimateTokenCount(text: string): number {
  return Math.ceil(text.length / 4);
}
