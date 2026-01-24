/**
 * Prompt template for generating follow-up emails after discovery calls.
 *
 * This prompt analyzes meeting transcripts and generates personalized
 * follow-up emails that reference specific discussion points.
 */

export interface DiscoveryCallContext {
  // Meeting metadata
  meetingTopic: string;
  meetingDate: string;
  hostName: string;

  // Transcript content
  transcript: string;

  // Optional customization
  senderName?: string;
  companyName?: string;
  recipientName?: string;
  additionalContext?: string;
}

/**
 * System prompt for the discovery call follow-up generator.
 * Establishes the AI's role and output format expectations.
 */
export const DISCOVERY_CALL_SYSTEM_PROMPT = `You are an expert sales follow-up email writer. Your task is to analyze meeting transcripts and generate personalized, professional follow-up emails.

Your emails should:
1. Reference specific points discussed in the meeting
2. Be concise but warm (under 200 words)
3. Include clear next steps or a call to action
4. Sound natural and human, not templated
5. Acknowledge any pain points or challenges mentioned

Output format:
- Subject line on the first line (prefixed with "Subject: ")
- Blank line
- Email body
- Professional signature placeholder at the end

Do NOT include:
- Generic filler phrases like "It was great meeting you"
- Overly salesy language
- Multiple CTAs (stick to one clear next step)`;

/**
 * Build the user prompt with meeting context.
 * This is the dynamic part that includes the transcript and metadata.
 */
export function buildDiscoveryCallPrompt(context: DiscoveryCallContext): string {
  const {
    meetingTopic,
    meetingDate,
    hostName,
    transcript,
    senderName = 'the host',
    companyName,
    recipientName,
    additionalContext,
  } = context;

  let prompt = `Generate a follow-up email for a discovery call.

Meeting Details:
- Topic: ${meetingTopic}
- Date: ${meetingDate}
- Host: ${hostName}`;

  if (recipientName) {
    prompt += `\n- Recipient: ${recipientName}`;
  }

  if (companyName) {
    prompt += `\n- Company: ${companyName}`;
  }

  if (additionalContext) {
    prompt += `\n\nAdditional Context:\n${additionalContext}`;
  }

  prompt += `\n\nMeeting Transcript:
---
${transcript}
---

Based on this transcript, write a follow-up email from ${senderName} that:
1. Thanks them for their time
2. References 2-3 specific points from the discussion
3. Proposes a clear next step
4. Keeps a professional but friendly tone`;

  return prompt;
}

/**
 * Estimate token count for a prompt (rough approximation).
 * Used for cost estimation before API call.
 * Rule of thumb: ~4 characters per token for English text.
 */
export function estimateTokenCount(text: string): number {
  return Math.ceil(text.length / 4);
}
