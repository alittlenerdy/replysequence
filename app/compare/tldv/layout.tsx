import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ReplySequence vs tl;dv - AI Meeting Assistant Comparison 2026',
  description: 'Compare ReplySequence and tl;dv for meeting recordings and follow-ups. See how ReplySequence generates AI email drafts in 8 seconds vs tl;dv\'s recording-first approach.',
  keywords: [
    'tldv alternative',
    'tl;dv alternative',
    'replysequence vs tldv',
    'best meeting follow-up tool',
    'meeting recording comparison',
    'AI meeting notes',
    'sales follow-up automation',
    'meeting transcription software',
  ],
  openGraph: {
    title: 'ReplySequence vs tl;dv - Which Meeting Tool is Right for You?',
    description: 'Compare ReplySequence and tl;dv for meeting recordings and AI-powered follow-ups. Discover which tool saves you more time after sales calls.',
    url: 'https://replysequence.vercel.app/compare/tldv',
    type: 'article',
  },
  alternates: {
    canonical: 'https://replysequence.vercel.app/compare/tldv',
  },
};

export default function TldvComparisonLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
