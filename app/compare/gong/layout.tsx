import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ReplySequence vs Gong - AI Meeting Follow-Up Comparison',
  description: 'Compare ReplySequence and Gong for meeting intelligence and follow-up. See how ReplySequence generates AI email drafts in 8 seconds vs Gong\'s revenue intelligence approach.',
  keywords: [
    'gong alternative',
    'gong vs replysequence',
    'best meeting follow-up tool',
    'revenue intelligence comparison',
    'AI meeting follow-up',
    'sales follow-up automation',
    'gong alternative for small teams',
  ],
  openGraph: {
    title: 'ReplySequence vs Gong - Which is Right for You?',
    description: 'Compare ReplySequence and Gong for meeting intelligence and follow-up. Discover which tool is better for your team size and budget.',
    url: 'https://www.replysequence.com/compare/gong',
    type: 'article',
  },
  alternates: {
    canonical: 'https://www.replysequence.com/compare/gong',
  },
};

export default function GongComparisonLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
