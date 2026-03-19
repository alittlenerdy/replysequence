import type { Metadata } from 'next';
import { PipelineAutomationContent } from '@/components/product/pages/PipelineAutomationContent';

export const metadata: Metadata = {
  title: 'Pipeline Automation | ReplySequence',
  description: 'Automatic CRM updates, deal health scoring, and pre-meeting intelligence briefings generated from every sales call.',
  openGraph: {
    title: 'Pipeline Automation | ReplySequence',
    description: 'CRM updates, deal health scores, and pre-meeting briefings — generated from every call, automatically.',
    images: ['/og-image.png'],
  },
};

export default function PipelineAutomationPage() {
  return <PipelineAutomationContent />;
}
