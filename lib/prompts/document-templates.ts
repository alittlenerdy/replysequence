/**
 * Document Generation Prompt Templates
 *
 * Provides system prompts and instructions for generating different document types
 * from meeting transcripts: proposals, recaps, CRM notes, internal summaries.
 */

import type { DraftType } from '@/lib/db/schema';

export interface DocumentContext {
  meetingTopic: string;
  meetingDate: string;
  hostName: string;
  transcript: string;
  participants?: string[];
  companyName?: string;
  recipientName?: string;
  additionalContext?: string;
}

interface DocumentTemplate {
  systemPrompt: string;
  buildUserPrompt: (ctx: DocumentContext) => string;
  subjectPrefix: string;
}

const PROPOSAL_TEMPLATE: DocumentTemplate = {
  systemPrompt: `You are a sales proposal specialist. Generate a professional proposal outline from a meeting transcript.

Output a JSON object with these fields:
- "subject": A clear proposal title (e.g., "Proposal: [Solution] for [Company]")
- "body": The full proposal in markdown format
- "actionItems": Array of {owner, task, deadline} for follow-up actions

The proposal body MUST follow this structure:
1. **Executive Summary** — 2-3 sentences on the problem discussed and proposed solution
2. **Understanding Your Needs** — Key pain points and requirements mentioned in the meeting
3. **Proposed Solution** — What you're offering, mapped to their specific needs
4. **Scope & Deliverables** — Bullet list of what's included
5. **Timeline** — Estimated phases and milestones (use reasonable defaults if not discussed)
6. **Investment** — If pricing was discussed, include it. Otherwise note "To be discussed"
7. **Next Steps** — Concrete actions with owners

Keep it concise. Use specific details from the transcript, not generic filler. Write in a professional but approachable tone.`,
  buildUserPrompt: (ctx) => {
    const parts = [`Meeting: ${ctx.meetingTopic}`, `Date: ${ctx.meetingDate}`, `Host: ${ctx.hostName}`];
    if (ctx.companyName) parts.push(`Company: ${ctx.companyName}`);
    if (ctx.participants?.length) parts.push(`Participants: ${ctx.participants.join(', ')}`);
    if (ctx.additionalContext) parts.push(`Additional context: ${ctx.additionalContext}`);
    parts.push('', 'Transcript:', ctx.transcript);
    return parts.join('\n');
  },
  subjectPrefix: 'Proposal',
};

const RECAP_TEMPLATE: DocumentTemplate = {
  systemPrompt: `You are a customer communication specialist. Generate a polished customer recap email from a meeting transcript.

Output a JSON object with these fields:
- "subject": A clear recap subject line (e.g., "Recap: [Topic] — [Date]")
- "body": The full recap in markdown format
- "actionItems": Array of {owner, task, deadline} for follow-up actions

The recap body MUST follow this structure:
1. **Opening** — Brief thank-you and meeting reference (1-2 sentences)
2. **Key Discussion Points** — Numbered list of the main topics covered, with specifics
3. **Decisions Made** — Bullet list of any agreements or decisions reached
4. **Action Items** — Table or list with owner, task, and deadline for each item
5. **Next Meeting** — If discussed, note the next meeting date/topic. If not, suggest one.

Write from the host's perspective. Be specific — reference actual names, numbers, and details from the transcript. Keep it scannable and professional.`,
  buildUserPrompt: (ctx) => {
    const parts = [`Meeting: ${ctx.meetingTopic}`, `Date: ${ctx.meetingDate}`, `Host: ${ctx.hostName}`];
    if (ctx.recipientName) parts.push(`Recipient: ${ctx.recipientName}`);
    if (ctx.companyName) parts.push(`Company: ${ctx.companyName}`);
    if (ctx.participants?.length) parts.push(`Participants: ${ctx.participants.join(', ')}`);
    if (ctx.additionalContext) parts.push(`Additional context: ${ctx.additionalContext}`);
    parts.push('', 'Transcript:', ctx.transcript);
    return parts.join('\n');
  },
  subjectPrefix: 'Recap',
};

const CRM_NOTES_TEMPLATE: DocumentTemplate = {
  systemPrompt: `You are a CRM data specialist. Generate structured deal notes from a meeting transcript, formatted for easy pasting into a CRM activity log.

Output a JSON object with these fields:
- "subject": A CRM-style activity subject (e.g., "Meeting Notes: [Company] — [Topic]")
- "body": The structured notes in markdown format
- "actionItems": Array of {owner, task, deadline} for follow-up actions

The notes body MUST follow this structure:
1. **Meeting Summary** — 2-3 sentence overview of the meeting
2. **Attendees** — List of who was on the call
3. **Deal Status** — Current stage, budget signals, timeline, decision-maker involvement
4. **Pain Points Identified** — Bullet list of problems the prospect mentioned
5. **Objections / Concerns** — Any pushback or hesitations raised
6. **Competitive Mentions** — If competitors were discussed, note them
7. **Next Steps** — Concrete actions with owners and dates
8. **Deal Risk Assessment** — Low/Medium/High with brief reasoning

Be concise and factual. CRM notes should be scannable in under 30 seconds. Use bullet points heavily. Include specific quotes or numbers when they indicate buying signals or risk.`,
  buildUserPrompt: (ctx) => {
    const parts = [`Meeting: ${ctx.meetingTopic}`, `Date: ${ctx.meetingDate}`, `Host: ${ctx.hostName}`];
    if (ctx.companyName) parts.push(`Company: ${ctx.companyName}`);
    if (ctx.participants?.length) parts.push(`Participants: ${ctx.participants.join(', ')}`);
    if (ctx.additionalContext) parts.push(`Additional context: ${ctx.additionalContext}`);
    parts.push('', 'Transcript:', ctx.transcript);
    return parts.join('\n');
  },
  subjectPrefix: 'CRM Notes',
};

const INTERNAL_SUMMARY_TEMPLATE: DocumentTemplate = {
  systemPrompt: `You are an internal communications specialist. Generate a concise internal summary of a meeting for team members who weren't present.

Output a JSON object with these fields:
- "subject": An internal summary title (e.g., "Internal Summary: [Topic] — [Date]")
- "body": The summary in markdown format
- "actionItems": Array of {owner, task, deadline} for follow-up actions

The summary body MUST follow this structure:
1. **TL;DR** — 1-2 sentence bottom-line summary
2. **Context** — Why this meeting happened and who was there
3. **Key Takeaways** — Numbered list of the most important points (max 5)
4. **Decisions** — What was decided and by whom
5. **Action Items** — Who needs to do what, by when
6. **FYI / Heads Up** — Anything the team should be aware of (risks, timeline changes, etc.)

Write in a direct, informal tone appropriate for internal Slack or team updates. Be honest about sentiment and risks — this is internal, not customer-facing.`,
  buildUserPrompt: (ctx) => {
    const parts = [`Meeting: ${ctx.meetingTopic}`, `Date: ${ctx.meetingDate}`, `Host: ${ctx.hostName}`];
    if (ctx.participants?.length) parts.push(`Participants: ${ctx.participants.join(', ')}`);
    if (ctx.additionalContext) parts.push(`Additional context: ${ctx.additionalContext}`);
    parts.push('', 'Transcript:', ctx.transcript);
    return parts.join('\n');
  },
  subjectPrefix: 'Internal Summary',
};

const TEMPLATES: Record<Exclude<DraftType, 'email'>, DocumentTemplate> = {
  proposal: PROPOSAL_TEMPLATE,
  recap: RECAP_TEMPLATE,
  crm_notes: CRM_NOTES_TEMPLATE,
  internal_summary: INTERNAL_SUMMARY_TEMPLATE,
};

export function getDocumentTemplate(type: Exclude<DraftType, 'email'>): DocumentTemplate {
  return TEMPLATES[type];
}

export const DOCUMENT_TYPE_LABELS: Record<DraftType, string> = {
  email: 'Follow-Up Email',
  proposal: 'Proposal Outline',
  recap: 'Customer Recap',
  crm_notes: 'CRM Deal Notes',
  internal_summary: 'Internal Summary',
};
