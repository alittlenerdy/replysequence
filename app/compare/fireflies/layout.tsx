import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ReplySequence vs Fireflies.ai - Best Meeting Follow-Up Tool Comparison 2026',
  description: 'Compare ReplySequence and Fireflies.ai for meeting transcription and follow-up emails. See how ReplySequence generates AI email drafts in 8 seconds vs Fireflies\' general transcription approach.',
  keywords: [
    'fireflies alternative',
    'fireflies.ai alternative',
    'replysequence vs fireflies',
    'best meeting follow-up tool',
    'meeting transcription comparison',
    'AI meeting notes',
    'sales follow-up automation',
    'meeting email automation',
    'fireflies competitor',
  ],
  openGraph: {
    title: 'ReplySequence vs Fireflies.ai - Which is Right for You?',
    description: 'Compare ReplySequence and Fireflies.ai for meeting transcription and follow-up emails. Discover which tool saves you more time on post-meeting tasks.',
    url: 'https://replysequence.com/compare/fireflies',
    type: 'article',
  },
  alternates: {
    canonical: 'https://replysequence.com/compare/fireflies',
  },
};

export default function FirefliesComparisonLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
