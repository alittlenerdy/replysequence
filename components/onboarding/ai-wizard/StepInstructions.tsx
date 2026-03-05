'use client';

import { INSTRUCTION_CHIPS } from '@/lib/constants/ai-settings';

interface StepInstructionsProps {
  instructions: string;
  signature: string;
  onInstructionsChange: (v: string) => void;
  onSignatureChange: (v: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export function StepInstructions({
  instructions,
  signature,
  onInstructionsChange,
  onSignatureChange,
  onNext,
  onBack,
}: StepInstructionsProps) {
  return (
    <div>
      <h3 className="text-2xl font-bold text-white mb-2">Custom instructions & signature</h3>
      <p className="text-gray-400 text-sm mb-6">
        Optional but powerful. These are added to every AI-generated email.
      </p>

      <div className="max-w-lg space-y-5">
        {/* Instructions */}
        <div>
          <label htmlFor="custom-instructions-wizard" className="block text-sm font-medium text-gray-300 mb-1.5">
            Custom Instructions <span className="text-gray-600 font-normal">(optional)</span>
          </label>
          <textarea
            id="custom-instructions-wizard"
            value={instructions}
            onChange={(e) => onInstructionsChange(e.target.value)}
            placeholder="E.g., Always include a specific next step with a date."
            rows={3}
            maxLength={500}
            className="w-full px-3 py-2 text-sm bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-600 resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500"
          />
          <div className="flex flex-wrap gap-2 mt-2">
            {INSTRUCTION_CHIPS.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => {
                  onInstructionsChange(
                    instructions ? `${instructions}\n${chip}` : chip
                  );
                }}
                className="px-3 py-1.5 text-xs font-medium text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 rounded-full hover:bg-indigo-500/20 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
              >
                + {chip}
              </button>
            ))}
          </div>
        </div>

        {/* Signature */}
        <div>
          <label htmlFor="email-signature-wizard" className="block text-sm font-medium text-gray-300 mb-1.5">
            Email Signature <span className="text-gray-600 font-normal">(optional)</span>
          </label>
          <textarea
            id="email-signature-wizard"
            value={signature}
            onChange={(e) => onSignatureChange(e.target.value)}
            placeholder={"Best regards,\nJohn Smith\nAccount Executive, Acme Corp"}
            rows={4}
            maxLength={500}
            className="w-full px-3 py-2 text-sm bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-600 resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 font-mono"
          />
        </div>
      </div>

      <div className="mt-8 flex items-center gap-3">
        <button
          onClick={onBack}
          className="px-5 py-3 text-sm font-medium text-gray-400 hover:text-white transition-colors rounded outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
        >
          Back
        </button>
        <button
          onClick={onNext}
          className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-indigo-700 text-white font-semibold rounded-xl hover:from-indigo-600 hover:to-indigo-800 transition-[color,background-color,box-shadow] shadow-lg shadow-indigo-500/25 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
