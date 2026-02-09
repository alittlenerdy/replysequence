import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'How It Works',
  description:
    'Learn how ReplySequence transforms your Zoom, Teams, and Google Meet calls into perfect follow-up emails in just 8 seconds. Connect, record, and send - it is that simple.',
  keywords: [
    'meeting follow-up automation',
    'AI email drafts',
    'Zoom transcription',
    'Teams meeting notes',
    'Google Meet follow-up',
    'sales automation',
    'CRM integration',
  ],
  openGraph: {
    title: 'How ReplySequence Works - From Meeting to Follow-up in 8 Seconds',
    description:
      'Connect your meeting platform, record with transcription, and get AI-drafted follow-up emails instantly. No more manual note-taking.',
    type: 'website',
    url: 'https://replysequence.com/how-it-works',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'How ReplySequence Works',
    description: 'From meeting to perfect follow-up email in 8 seconds. See how it works.',
  },
  alternates: {
    canonical: 'https://replysequence.com/how-it-works',
  },
};

export default function HowItWorksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
