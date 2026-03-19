import type { Metadata } from 'next';
import { MeetingIntelligenceContent } from '@/components/product/pages/MeetingIntelligenceContent';

export const metadata: Metadata = {
  title: 'Meeting Intelligence | ReplySequence',
  description: 'AI extracts next steps, assigns owners, sets due dates, and flags deal risks from every sales meeting transcript.',
  openGraph: {
    title: 'Meeting Intelligence | ReplySequence',
    description: 'AI extracts next steps, assigns owners, sets due dates, and flags deal risks from every sales meeting transcript.',
    images: ['/og-image.png'],
  },
};

export default function MeetingIntelligencePage() {
  return <MeetingIntelligenceContent />;
}
