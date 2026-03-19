import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'How It Works | ReplySequence',
  description:
    'From meeting to pipeline automation in three steps. See how ReplySequence turns every call into follow-ups, sequences, intelligence, and CRM updates.',
  keywords: [
    'meeting follow-up automation',
    'AI email drafts',
    'sales pipeline automation',
    'meeting intelligence',
    'CRM integration',
    'follow-up sequences',
  ],
  openGraph: {
    title: 'How It Works | ReplySequence',
    description:
      'From meeting to pipeline automation in three steps. See how ReplySequence turns every call into follow-ups, sequences, intelligence, and CRM updates.',
    type: 'website',
    url: 'https://www.replysequence.com/how-it-works',
    images: [{ url: 'https://www.replysequence.com/opengraph-image', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'How It Works | ReplySequence',
    description: 'From meeting to pipeline automation in three steps.',
  },
  alternates: {
    canonical: 'https://www.replysequence.com/how-it-works',
  },
};

export default function HowItWorksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
