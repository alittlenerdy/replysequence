/**
 * Meeting Note Templates
 *
 * Preset templates that customize AI draft generation based on meeting type.
 * Maps to detected meeting types and provides focused instructions
 * for the Claude prompt.
 */

import type { MeetingType } from './meeting-type-detector';

export interface MeetingTemplate {
  id: string;
  name: string;
  description: string;
  /** Meeting types this template is recommended for */
  meetingTypes: MeetingType[];
  /** Custom focus instructions injected into the AI prompt */
  focusInstructions: string;
  /** Custom output fields the template expects */
  customFields?: Array<{
    name: string;
    description: string;
  }>;
  /** Icon identifier for UI display */
  icon: 'sales' | 'team' | 'client' | 'technical' | 'general' | 'onboarding' | 'strategy';
}

/**
 * Built-in meeting note templates
 */
export const MEETING_TEMPLATES: MeetingTemplate[] = [
  {
    id: 'discovery-bant',
    name: 'Discovery Call (BANT)',
    description: 'Qualify prospects using Budget, Authority, Need, Timeline framework',
    meetingTypes: ['sales_call'],
    icon: 'sales',
    focusInstructions: `Use the BANT framework to structure the follow-up:
- **Budget**: What budget was discussed? Any pricing concerns?
- **Authority**: Who is the decision maker? Who else needs to be involved?
- **Need**: What specific pain points were identified? How urgent?
- **Timeline**: When do they need a solution? What's their buying timeline?

In the email body, reference their specific pain points and propose a concrete next step (demo, proposal, trial).
In the meeting summary, explicitly note what BANT criteria were covered and what gaps remain.`,
  },
  {
    id: 'sales-followup',
    name: 'Sales Follow-up',
    description: 'Post-demo or post-proposal follow-up with objection handling',
    meetingTypes: ['sales_call'],
    icon: 'sales',
    focusInstructions: `Focus on moving the deal forward:
- Reference specific features or solutions discussed that address their needs
- Address any objections or concerns raised during the meeting
- Propose a clear next step with a specific date/time
- If pricing was discussed, reference the value proposition, not just the price
- Note any competitive mentions and how your solution compared

In the meeting summary, capture: deal stage, key objections, competitive landscape, and proposed next steps.`,
  },
  {
    id: 'internal-standup',
    name: 'Team Standup / Sync',
    description: 'Daily standup or weekly sync with blockers and commitments',
    meetingTypes: ['internal_sync'],
    icon: 'team',
    focusInstructions: `Structure around team progress and blockers:
- What each person accomplished since last sync
- What each person plans to work on next
- Blockers that need resolution and who can unblock them
- Decisions made that affect the team

The email should be brief and scannable with bullet points.
Action items should be very specific with clear owners and deadlines.
In the meeting summary, prioritize blockers and decisions over status updates.`,
  },
  {
    id: 'one-on-one',
    name: '1:1 Meeting',
    description: 'Manager-report 1:1 with goals, feedback, and development',
    meetingTypes: ['internal_sync'],
    icon: 'team',
    focusInstructions: `Focus on the personal and professional development discussion:
- Goals discussed and progress toward them
- Feedback given (both directions)
- Career development topics
- Concerns or challenges raised
- Support needed from manager/report

The email tone should be warm and supportive.
Action items should reflect commitments made by both parties.
In the meeting summary, capture the main themes discussed without overly personal details.`,
  },
  {
    id: 'client-status',
    name: 'Client Status Update',
    description: 'Project milestone review with deliverables and timeline',
    meetingTypes: ['client_review'],
    icon: 'client',
    focusInstructions: `Structure around project progress and client satisfaction:
- Milestone progress and what was delivered
- Feedback received and how it will be addressed
- Timeline updates (ahead, on track, or behind)
- Scope changes discussed
- Next deliverables and their dates
- Any risks or dependencies flagged

The email should reassure the client of progress while being transparent about challenges.
Action items should clearly distinguish client-side vs. your-side responsibilities.`,
  },
  {
    id: 'client-kickoff',
    name: 'Client Kickoff',
    description: 'New project or engagement kickoff with scope and expectations',
    meetingTypes: ['client_review', 'general'],
    icon: 'client',
    focusInstructions: `Focus on establishing the engagement foundation:
- Project scope and objectives confirmed
- Key stakeholders and their roles
- Communication preferences and frequency
- Timeline and major milestones
- Success criteria and KPIs
- Potential risks discussed

The email should express enthusiasm while confirming mutual understanding of scope.
Action items should cover immediate next steps for both sides.`,
  },
  {
    id: 'technical-review',
    name: 'Technical Architecture Review',
    description: 'Architecture decisions, trade-offs, and technical debt',
    meetingTypes: ['technical_discussion'],
    icon: 'technical',
    focusInstructions: `Focus on technical decisions and their rationale:
- Architecture decisions made and their trade-offs
- Technical debt identified and prioritization
- Performance or scalability concerns
- Security considerations
- Integration points and dependencies
- Documentation or diagrams needed

The email should be concise and reference specific technical decisions.
Action items should include research tasks, POCs, and documentation.
In the meeting summary, capture the "why" behind decisions, not just the "what".`,
  },
  {
    id: 'incident-review',
    name: 'Incident / Postmortem',
    description: 'Post-incident review with root cause and preventive actions',
    meetingTypes: ['technical_discussion', 'internal_sync'],
    icon: 'technical',
    focusInstructions: `Structure as a blameless postmortem:
- What happened (timeline of events)
- Root cause analysis
- Impact (users affected, duration, severity)
- What went well in the response
- What could be improved
- Preventive measures agreed upon

The email should be factual and forward-looking, not blame-assigning.
Action items should focus on preventive measures with owners and deadlines.
In the meeting summary, clearly state root cause and key preventive actions.`,
  },
  {
    id: 'strategy-planning',
    name: 'Strategy / Planning',
    description: 'Quarterly planning, roadmap review, or strategic discussion',
    meetingTypes: ['internal_sync', 'general'],
    icon: 'strategy',
    focusInstructions: `Focus on strategic alignment and planning outcomes:
- Goals and OKRs discussed
- Priorities agreed upon and their ranking
- Resource allocation decisions
- Risks and mitigation strategies
- Metrics to track progress
- Review cadence agreed upon

The email should capture the strategic direction concisely.
Action items should reflect planning commitments with clear deadlines.
In the meeting summary, lead with the strategic decisions made.`,
  },
  {
    id: 'general-notes',
    name: 'General Meeting Notes',
    description: 'Default template for any meeting type',
    meetingTypes: ['general', 'sales_call', 'internal_sync', 'client_review', 'technical_discussion'],
    icon: 'general',
    focusInstructions: `Capture the meeting comprehensively:
- Main topics discussed and key takeaways
- Decisions made (if any)
- Action items with owners
- Open questions or items for follow-up
- Next meeting date if scheduled

The email should be a well-structured summary that anyone who missed the meeting could read to catch up.`,
  },
];

/**
 * Get templates recommended for a specific meeting type
 */
export function getTemplatesForMeetingType(meetingType: MeetingType): MeetingTemplate[] {
  return MEETING_TEMPLATES.filter((t) => t.meetingTypes.includes(meetingType));
}

/**
 * Get a template by ID
 */
export function getTemplateById(templateId: string): MeetingTemplate | undefined {
  return MEETING_TEMPLATES.find((t) => t.id === templateId);
}

/**
 * Get the default template for a meeting type
 * Returns the first matching template (most specific)
 */
export function getDefaultTemplate(meetingType: MeetingType): MeetingTemplate {
  const matching = getTemplatesForMeetingType(meetingType);
  return matching[0] || MEETING_TEMPLATES[MEETING_TEMPLATES.length - 1]; // fallback to general
}
