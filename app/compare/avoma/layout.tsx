import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ReplySequence vs Avoma - AI Meeting Follow-Up Comparison',
  description: 'Compare ReplySequence and Avoma for meeting intelligence and follow-up. See how ReplySequence generates AI email drafts in 8 seconds vs Avoma\'s meeting lifecycle approach.',
  keywords: [
    'avoma alternative',
    'avoma vs replysequence',
    'best meeting follow-up tool',
    'meeting intelligence comparison',
    'AI meeting assistant',
    'sales follow-up automation',
  ],
  openGraph: {
    title: 'ReplySequence vs Avoma - Which is Right for You?',
    description: 'Compare ReplySequence and Avoma for meeting intelligence and follow-up emails.',
    url: 'https://www.replysequence.com/compare/avoma',
    type: 'article',
  },
  alternates: {
    canonical: 'https://www.replysequence.com/compare/avoma',
  },
};

export default function AvomaComparisonLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
