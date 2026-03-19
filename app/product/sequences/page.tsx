import type { Metadata } from 'next';
import { SequencesContent } from '@/components/product/pages/SequencesContent';

export const metadata: Metadata = {
  title: 'Sequences | ReplySequence',
  description: 'Turn every meeting into a multi-step nurture sequence. Each step references the real conversation — not generic templates.',
  openGraph: {
    title: 'Sequences | ReplySequence',
    description: 'Turn every meeting into a multi-step nurture sequence. Each step references the real conversation — not generic templates.',
    images: ['/og-image.png'],
  },
};

export default function SequencesPage() {
  return <SequencesContent />;
}
