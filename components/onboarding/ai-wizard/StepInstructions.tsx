'use client';

import { motion } from 'framer-motion';
import { INSTRUCTION_CHIPS } from '@/lib/constants/ai-settings';
import { MessageSquare, PenLine, Check } from 'lucide-react';

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
      <p className="text-gray-400 text-sm mb-8">
        Optional but powerful. These are added to every AI-generated email.
      </p>

      <div className="space-y-6">
        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border border-gray-700/50 bg-gray-900/50 p-5"
        >
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare className="w-4 h-4 text-[#5B6CFF]" />
            <label htmlFor="custom-instructions-wizard" className="text-sm font-semibold text-white">
              Custom Instructions
            </label>
            <span className="text-xs text-gray-600">(optional)</span>
          </div>
          <textarea
            id="custom-instructions-wizard"
            value={instructions}
            onChange={(e) => onInstructionsChange(e.target.value)}
            placeholder="E.g., Always include a specific next step with a date."
            rows={4}
            maxLength={500}
            className="w-full px-4 py-3 text-sm bg-gray-800/80 border border-gray-700 rounded-lg text-white placeholder-gray-600 resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#5B6CFF]"
          />
          <p className="text-xs text-gray-600 mt-2 mb-3">Quick add — click to append:</p>
          <div className="flex flex-wrap gap-2">
            {INSTRUCTION_CHIPS.map((chip) => {
              const isAdded = instructions.includes(chip);
              return (
                <button
                  key={chip}
                  type="button"
                  onClick={() => {
                    if (!isAdded) {
                      onInstructionsChange(
                        instructions ? `${instructions}\n${chip}` : chip
                      );
                    }
                  }}
                  disabled={isAdded}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#5B6CFF]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060B18] ${
                    isAdded
                      ? 'text-[#5B6CFF]/60 bg-[#5B6CFF]/5 border border-[#5B6CFF]/10 cursor-default'
                      : 'text-[#7A8BFF] bg-[#5B6CFF]/10 border border-[#5B6CFF]/20 hover:bg-[#4A5BEE]/20'
                  }`}
                >
                  {isAdded ? (
                    <span className="flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      {chip}
                    </span>
                  ) : (
                    `+ ${chip}`
                  )}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Signature */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl border border-gray-700/50 bg-gray-900/50 p-5"
        >
          <div className="flex items-center gap-2 mb-3">
            <PenLine className="w-4 h-4 text-[#5B6CFF]" />
            <label htmlFor="email-signature-wizard" className="text-sm font-semibold text-white">
              Email Signature
            </label>
            <span className="text-xs text-gray-600">(optional)</span>
          </div>
          <textarea
            id="email-signature-wizard"
            value={signature}
            onChange={(e) => onSignatureChange(e.target.value)}
            placeholder={"Best regards,\nJohn Smith\nAccount Executive, Acme Corp"}
            rows={4}
            maxLength={500}
            className="w-full px-4 py-3 text-sm bg-gray-800/80 border border-gray-700 rounded-lg text-white placeholder-gray-600 resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#5B6CFF] font-mono"
          />
        </motion.div>
      </div>

      <div className="mt-8 flex items-center gap-3">
        <button
          onClick={onBack}
          className="px-5 py-3 text-sm font-medium text-gray-400 hover:text-white transition-colors rounded outline-none focus-visible:ring-2 focus-visible:ring-[#5B6CFF]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060B18]"
        >
          Back
        </button>
        <button
          onClick={onNext}
          className="px-6 py-3 bg-gradient-to-r from-[#5B6CFF] to-[#3A4BDD] text-white font-semibold rounded-xl hover:from-[#4A5BEE] hover:to-[#2A3ACC] transition-[color,background-color,box-shadow] shadow-lg shadow-[#5B6CFF]/25 outline-none focus-visible:ring-2 focus-visible:ring-[#5B6CFF]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060B18]"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
