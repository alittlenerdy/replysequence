import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ReplySequence vs Otter.ai - Best Meeting Follow-Up Tool Comparison',
  description: 'Compare ReplySequence and Otter.ai for meeting transcription and follow-up. See how ReplySequence generates AI email drafts in 8 seconds vs Otter\'s approach.',
  keywords: [
    'otter.ai alternative',
    'otter vs replysequence',
    'best meeting follow-up tool',
    'meeting transcription comparison',
    'AI meeting notes',
    'sales follow-up automation',
  ],
  openGraph: {
    title: 'ReplySequence vs Otter.ai - Which is Right for You?',
    description: 'Compare ReplySequence and Otter.ai for meeting transcription and follow-up. Discover which tool saves you more time.',
    url: 'https://replysequence.vercel.app/compare/otter',
    type: 'article',
  },
  alternates: {
    canonical: 'https://replysequence.vercel.app/compare/otter',
  },
};

export default function OtterComparisonLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
