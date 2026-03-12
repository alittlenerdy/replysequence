import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'How It Works',
  description:
    'From meeting to follow-up in three steps. Connect your meeting platform, have a call, and let ReplySequence handle the rest — personalized emails, CRM updates, and follow-up sequences.',
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
    title: 'How ReplySequence Works - From Meeting to Follow-Up in Three Steps',
    description:
      'Connect your meeting platform, have a call, and let ReplySequence handle the rest — personalized emails, CRM updates, and follow-up sequences.',
    type: 'website',
    url: 'https://www.replysequence.com/how-it-works',
    images: [{ url: 'https://www.replysequence.com/opengraph-image', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'How ReplySequence Works',
    description: 'From meeting to follow-up in three steps. See how it works.',
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
