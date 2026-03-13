import { Metadata } from 'next';
import { NON_NEGOTIABLES } from '@/components/NonNegotiablesCarousel';
import { NonNegotiablesCards } from './NonNegotiablesCards';

export const metadata: Metadata = {
  title: 'Our 9 Non-Negotiables | ReplySequence',
  description:
    'The 9 promises baked into every feature we ship. No exceptions.',
};

export default function NonNegotiablesPage() {
  return (
    <main className="min-h-screen bg-[#060B18] py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-white text-center mb-2">
          Social Media Cards
        </h1>
        <p className="text-gray-400 text-center mb-10 text-sm">
          Right-click any card below and save as image, or screenshot at 1080x1080.
        </p>

        <NonNegotiablesCards items={NON_NEGOTIABLES} />
      </div>
    </main>
  );
}
