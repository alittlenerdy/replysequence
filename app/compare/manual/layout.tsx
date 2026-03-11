import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ReplySequence vs Manual Follow-Up - Why Automation Wins',
  description: 'Compare ReplySequence to manual meeting follow-ups. See how AI-generated emails in 8 seconds beat the 23-minute average manual process that 44% of reps skip entirely.',
  keywords: [
    'meeting follow-up automation',
    'automated follow-up emails',
    'manual follow-up vs automated',
    'sales follow-up time savings',
    'AI meeting follow-up',
    'stop writing follow-up emails',
    'follow-up email automation tool',
    'meeting follow-up software',
  ],
  openGraph: {
    title: 'ReplySequence vs Manual Follow-Up - Stop Losing Deals to Slow Replies',
    description: 'The average sales rep spends 23 minutes writing a follow-up email. ReplySequence does it in 8 seconds. See the full comparison.',
    url: 'https://www.replysequence.com/compare/manual',
    type: 'article',
    images: [{ url: 'https://www.replysequence.com/opengraph-image', width: 1200, height: 630 }],
  },
  alternates: {
    canonical: 'https://www.replysequence.com/compare/manual',
  },
};

export default function ManualComparisonLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
