import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ReplySequence vs Grain - Best Meeting Follow-Up Tool Comparison',
  description: 'Compare ReplySequence and Grain for meeting recording and follow-up. See how ReplySequence generates AI email drafts in 8 seconds vs Grain\'s highlight clips approach.',
  keywords: [
    'grain alternative',
    'grain vs replysequence',
    'replysequence vs grain',
    'best meeting follow-up tool',
    'meeting recording comparison',
    'AI meeting highlights',
    'sales follow-up automation',
    'meeting clip tool alternative',
  ],
  openGraph: {
    title: 'ReplySequence vs Grain - Which is Right for You?',
    description: 'Compare ReplySequence and Grain for meeting recording and follow-up. Discover which tool saves you more time on post-meeting tasks.',
    url: 'https://www.replysequence.com/compare/grain',
    type: 'article',
  },
  alternates: {
    canonical: 'https://www.replysequence.com/compare/grain',
  },
};

export default function GrainComparisonLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
