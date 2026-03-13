import { Layers } from 'lucide-react';

export const metadata = {
  title: 'Sequences',
  description: 'Automated multi-step follow-up sequences',
};

export default function SequencesPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#5B6CFF]/10 mb-6">
        <Layers className="w-8 h-8 text-[#5B6CFF]" strokeWidth={1.5} />
      </div>
      <h1 className="text-2xl font-bold text-white light:text-gray-900 mb-2">
        Sequences
      </h1>
      <p className="text-gray-400 light:text-gray-500 max-w-md mb-6">
        Automated multi-step follow-up sequences are coming soon. Turn a single meeting into a full nurture campaign.
      </p>
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#5B6CFF]/10 border border-[#5B6CFF]/20 text-[#5B6CFF] text-sm font-medium">
        <div className="w-2 h-2 rounded-full bg-[#5B6CFF] animate-pulse" />
        In Development
      </div>
    </div>
  );
}
