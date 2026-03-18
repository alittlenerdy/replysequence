// app/product/meeting-intelligence/page.tsx
import type { Metadata } from 'next';
import { Brain, ListChecks, AlertTriangle, Bell, FileText } from 'lucide-react';
import { ProductPageTemplate } from '@/components/product/ProductPageTemplate';
import { MeetingIntelligenceDemo } from '@/components/product/MeetingIntelligenceDemo';

export const metadata: Metadata = {
  title: 'Meeting Intelligence | ReplySequence',
  description:
    'AI extracts next steps, assigns owners, sets due dates, and flags deal risks from every sales meeting transcript.',
  openGraph: {
    title: 'Meeting Intelligence | ReplySequence',
    description:
      'AI extracts next steps, assigns owners, sets due dates, and flags deal risks from every sales meeting transcript.',
    url: 'https://www.replysequence.com/product/meeting-intelligence',
    siteName: 'ReplySequence',
    type: 'website',
  },
};

const features = [
  {
    icon: ListChecks,
    title: 'Next Steps Extraction',
    description:
      'Automatically identifies commitments from the transcript — who owns each action, and when it is due.',
  },
  {
    icon: AlertTriangle,
    title: 'Risk Detection',
    description:
      'Flags BANT gaps like missing budget conversations, unclear timelines, or absent decision-makers.',
  },
  {
    icon: Bell,
    title: 'Overdue Reminders',
    description:
      'Sends alerts when action items slip past their due dates so nothing falls through the cracks.',
  },
  {
    icon: FileText,
    title: 'Meeting Summaries',
    description:
      'Generates concise summaries with key takeaways, decisions made, and open questions for quick review.',
  },
];

const useCases = [
  {
    title: 'Pipeline Visibility',
    audience: 'For sales leaders',
    description:
      'See every deal commitment across your team in one view. Know which reps have overdue follow-ups and which deals are stalling.',
  },
  {
    title: 'Coaching Conversations',
    audience: 'For managers',
    description:
      'Review how reps handle discovery calls. Spot missed qualification questions and coach with concrete transcript evidence.',
  },
  {
    title: 'Deal Review Prep',
    audience: 'For account executives',
    description:
      'Walk into deal reviews with every commitment, risk flag, and next step already organized — no manual note-taking needed.',
  },
];

export default function MeetingIntelligencePage() {
  return (
    <ProductPageTemplate
      accent="#06B6D4"
      icon={Brain}
      title="Every Commitment Tracked. Every Risk Flagged."
      subtitle="AI extracts next steps, assigns owners, sets due dates, and flags deal risks — all from the transcript."
      bullets={[
        'Next steps with owners and due dates',
        'BANT gap detection',
        'Overdue action reminders',
      ]}
      demo={<MeetingIntelligenceDemo />}
      features={features}
      useCases={useCases}
    />
  );
}
