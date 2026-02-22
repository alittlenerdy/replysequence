import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ReplySequence vs Chorus (ZoomInfo) - AI Meeting Follow-Up Comparison',
  description: 'Compare ReplySequence and Chorus by ZoomInfo for meeting intelligence and follow-up. See how ReplySequence generates AI email drafts in 8 seconds vs Chorus\'s conversation intelligence.',
  keywords: [
    'chorus alternative',
    'chorus vs replysequence',
    'zoominfo chorus alternative',
    'best meeting follow-up tool',
    'conversation intelligence comparison',
    'AI meeting follow-up',
    'sales follow-up automation',
  ],
  openGraph: {
    title: 'ReplySequence vs Chorus (ZoomInfo) - Which is Right for You?',
    description: 'Compare ReplySequence and Chorus by ZoomInfo for meeting intelligence and follow-up emails.',
    url: 'https://www.replysequence.com/compare/chorus',
    type: 'article',
  },
  alternates: {
    canonical: 'https://www.replysequence.com/compare/chorus',
  },
};

export default function ChorusComparisonLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
