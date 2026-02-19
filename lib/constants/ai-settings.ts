/** Shared AI settings constants — single source of truth for
 *  AICustomization, StepAIVoice / AIWizard, and any preview panels. */

export const TONE_OPTIONS = [
  {
    value: 'professional' as const,
    label: 'Professional',
    description: 'Polished and business-appropriate',
    preview:
      'Thank you for taking the time to meet today. I wanted to follow up on the key points we discussed and outline the next steps we agreed upon.',
    subjectExample: 'Re: Follow-up from our meeting',
    recommended: true,
  },
  {
    value: 'casual' as const,
    label: 'Casual',
    description: 'Relaxed and conversational',
    preview:
      "Great chatting with you today! Here's a quick recap of what we talked about and what we're each tackling next.",
    subjectExample: 'Quick recap from today',
    recommended: false,
  },
  {
    value: 'friendly' as const,
    label: 'Friendly',
    description: 'Warm and personable',
    preview:
      "It was really wonderful connecting with you today! I'm excited about what we discussed and wanted to make sure we're aligned on next steps.",
    subjectExample: 'Great connecting today!',
    recommended: false,
  },
  {
    value: 'concise' as const,
    label: 'Concise',
    description: 'Brief and to the point',
    preview:
      "Following up on today's meeting. Key decisions: [items]. Next steps: [actions]. Let me know if anything needs adjusting.",
    subjectExample: 'Meeting recap + next steps',
    recommended: false,
  },
] as const;

export type ToneValue = (typeof TONE_OPTIONS)[number]['value'];

export const INSTRUCTION_CHIPS = [
  'Always mention our free trial',
  'Keep emails under 150 words',
  'Include a specific next step',
  'Use bullet points for action items',
] as const;

export const HOURLY_RATE_CHIPS = [75, 100, 150] as const;

export const ROLE_OPTIONS = [
  { value: 'founder' as const, label: 'Founder / CEO', description: 'Running the company, wearing many hats' },
  { value: 'ae' as const, label: 'Account Executive', description: 'Closing deals and managing pipelines' },
  { value: 'csm' as const, label: 'Customer Success', description: 'Keeping clients happy and growing accounts' },
  { value: 'consultant' as const, label: 'Consultant', description: 'Advising clients on strategy and execution' },
  { value: 'other' as const, label: 'Other', description: 'Something else entirely' },
] as const;

export type UserRole = (typeof ROLE_OPTIONS)[number]['value'];
