import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ReplySequence vs Fathom - Best AI Meeting Assistant Comparison 2026',
  description: 'Compare ReplySequence and Fathom for AI meeting notes and follow-ups. See how ReplySequence generates email drafts in 8 seconds vs Fathom\'s general note-taking approach.',
  keywords: [
    'fathom alternative',
    'fathom vs replysequence',
    'replysequence vs fathom',
    'best AI meeting assistant',
    'AI meeting notes comparison',
    'sales follow-up automation',
    'free AI meeting assistant alternative',
    'CRM meeting integration',
  ],
  openGraph: {
    title: 'ReplySequence vs Fathom - Which AI Meeting Tool is Right for You?',
    description: 'Compare ReplySequence and Fathom for AI meeting notes and follow-up emails. Discover which tool saves you more time with a detailed feature comparison.',
    url: 'https://replysequence.com/compare/fathom',
    type: 'article',
  },
  alternates: {
    canonical: 'https://replysequence.com/compare/fathom',
  },
};

export default function FathomComparisonLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
