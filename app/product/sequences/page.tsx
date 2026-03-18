// app/product/sequences/page.tsx
import type { Metadata } from 'next';
import { Layers, Clock, MessageSquare, Sparkles } from 'lucide-react';
import { ProductPageTemplate } from '@/components/product/ProductPageTemplate';
import { SequenceDemo } from '@/components/product/SequenceDemo';

export const metadata: Metadata = {
  title: 'Sequences - ReplySequence',
  description:
    'Turn every meeting into a multi-step nurture sequence. Each step references the real conversation — not generic templates.',
  openGraph: {
    title: 'Sequences - ReplySequence',
    description:
      'Turn every meeting into a multi-step nurture sequence. Each step references the real conversation — not generic templates.',
    url: 'https://www.replysequence.com/product/sequences',
    siteName: 'ReplySequence',
    type: 'website',
  },
};

const features = [
  {
    icon: Layers,
    title: 'Auto-Generated Flows',
    description:
      'A full multi-step sequence is created automatically from your meeting transcript. No manual writing required.',
  },
  {
    icon: Clock,
    title: 'Smart Timing',
    description:
      'Steps are spaced intelligently based on deal context — tighter for hot leads, wider for long-cycle opportunities.',
  },
  {
    icon: MessageSquare,
    title: 'Pause on Reply',
    description:
      'When a prospect replies, the sequence pauses automatically so you never send a follow-up to someone who already responded.',
  },
  {
    icon: Sparkles,
    title: 'Conversation-Aware Content',
    description:
      'Every email in the sequence references real discussion points, pain points, and commitments from the meeting.',
  },
];

const useCases = [
  {
    title: 'Post-Demo Nurture',
    audience: 'For sales reps',
    description:
      'After a product demo, automatically generate a sequence that recaps what was shown and nudges toward next steps.',
  },
  {
    title: 'Proposal Follow-Through',
    audience: 'For account executives',
    description:
      'Keep proposals from going cold with a sequence that builds urgency and addresses objections raised in the call.',
  },
  {
    title: 'Re-Engagement',
    audience: 'For SDRs',
    description:
      'Revive stalled conversations with a sequence that references previous discussions to re-establish relevance.',
  },
];

export default function SequencesPage() {
  return (
    <ProductPageTemplate
      accent="#7A5CFF"
      icon={Layers}
      title="One Meeting. A Whole Sequence. Built Automatically."
      subtitle="Turn every conversation into a multi-step nurture flow. Each step references the real discussion — not generic templates."
      bullets={[
        'Auto-generated from transcripts',
        'Smart timing between steps',
        'Pauses when prospect replies',
      ]}
      demo={<SequenceDemo />}
      features={features}
      useCases={useCases}
    />
  );
}
