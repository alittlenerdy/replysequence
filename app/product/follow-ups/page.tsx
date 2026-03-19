import type { Metadata } from 'next';
import { FollowUpsContent } from '@/components/product/pages/FollowUpsContent';

export const metadata: Metadata = {
  title: 'Follow-Ups | ReplySequence',
  description: 'ReplySequence generates personalized follow-up emails from your meeting transcript — referencing real topics, action items, and next steps.',
  openGraph: {
    title: 'Follow-Ups | ReplySequence',
    description: 'ReplySequence generates personalized follow-up emails from your meeting transcript — referencing real topics, action items, and next steps.',
    images: ['/og-image.png'],
  },
};

export default function FollowUpsPage() {
  return <FollowUpsContent />;
}
