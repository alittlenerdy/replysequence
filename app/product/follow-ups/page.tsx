import type { Metadata } from 'next';
import { FileText, Sparkles, Mail, Users } from 'lucide-react';
import { ProductPageTemplate } from '@/components/product/ProductPageTemplate';
import { FollowUpDemo } from '@/components/product/FollowUpDemo';

export const metadata: Metadata = {
  title: 'Follow-Ups | ReplySequence',
  description:
    'ReplySequence generates personalized follow-up emails from your meeting transcript — referencing real topics, action items, and next steps.',
  openGraph: {
    title: 'Follow-Ups | ReplySequence',
    description:
      'ReplySequence generates personalized follow-up emails from your meeting transcript — referencing real topics, action items, and next steps.',
    images: ['/og-image.png'],
  },
};

const features = [
  {
    icon: FileText,
    title: 'Transcript-Aware Drafts',
    description:
      'Every email references what was actually said in your meeting — specific topics, questions, and commitments.',
  },
  {
    icon: Sparkles,
    title: 'Tone Matching',
    description:
      'AI learns your writing style and mirrors it in every draft so recipients can never tell the difference.',
  },
  {
    icon: Mail,
    title: 'One-Click Send',
    description:
      'Review the draft, make any tweaks, and send directly from ReplySequence. No copy-pasting required.',
  },
  {
    icon: Users,
    title: 'Multi-Recipient Support',
    description:
      'Meetings with multiple stakeholders? Generate personalized follow-ups for each attendee automatically.',
  },
];

const useCases = [
  {
    title: 'Sales Discovery Calls',
    description:
      'Send a follow-up that references the prospect\'s exact pain points and next steps discussed on the call.',
    audience: 'For sales reps',
  },
  {
    title: 'Client Check-Ins',
    description:
      'Summarize project updates, action items, and deadlines in a polished email your clients actually read.',
    audience: 'For account managers',
  },
  {
    title: 'Internal Syncs',
    description:
      'Turn standup notes and planning sessions into clear recap emails with owners and due dates assigned.',
    audience: 'For team leads',
  },
];

export default function FollowUpsPage() {
  return (
    <ProductPageTemplate
      accent="#5B6CFF"
      icon={FileText}
      title="Every Meeting Deserves a Follow-Up That Sounds Like You Wrote It"
      subtitle="ReplySequence generates personalized follow-up emails from your meeting transcript — referencing real topics, action items, and next steps."
      bullets={[
        'References specific conversation topics',
        'Matches your writing tone',
        'Ready to send in seconds',
      ]}
      demo={<FollowUpDemo />}
      features={features}
      useCases={useCases}
    />
  );
}
