'use client';

import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { TONE_OPTIONS, type ToneValue } from '@/lib/constants/ai-settings';

interface StepToneProps {
  value: ToneValue;
  onChange: (tone: ToneValue) => void;
  onNext: () => void;
  onBack: () => void;
}

export function StepTone({ value, onChange, onNext, onBack }: StepToneProps) {
  return (
    <div>
      <h3 className="text-2xl font-bold text-white mb-2">Pick your email tone</h3>
      <p className="text-gray-400 text-sm mb-6">
        This sets the default voice for follow-ups, sequences, and meeting summaries.
      </p>

      <div className="grid grid-cols-2 gap-3 max-w-lg">
        {TONE_OPTIONS.map((option) => {
          const isSelected = value === option.value;
          return (
            <button
              key={option.value}
              onClick={() => onChange(option.value)}
              className={`relative p-4 rounded-xl border-2 text-left transition-[border-color,background-color] duration-200 outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060B18] ${
                isSelected
                  ? 'border-[#6366F1] bg-[#6366F1]/10'
                  : 'border-gray-700 bg-gray-900/50 hover:border-gray-600'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-sm font-semibold ${isSelected ? 'text-[#6366F1]' : 'text-white'}`}>
                  {option.label}
                </span>
                {option.recommended && (
                  <span className="text-[10px] font-medium text-[#6366F1] bg-[#6366F1]/10 px-1.5 py-0.5 rounded-full">
                    Rec
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500">{option.description}</p>
              <p className="text-xs text-gray-600 mt-1.5 italic truncate">
                {option.subjectExample}
              </p>
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#6366F1] flex items-center justify-center"
                >
                  <Check className="w-3 h-3 text-white" />
                </motion.div>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-8 flex items-center gap-3">
        <button
          onClick={onBack}
          className="px-5 py-3 text-sm font-medium text-gray-400 hover:text-white transition-colors rounded outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060B18]"
        >
          Back
        </button>
        <button
          onClick={onNext}
          className="px-6 py-3 bg-gradient-to-r from-[#6366F1] to-[#3A4BDD] text-white font-semibold rounded-xl hover:from-[#4F46E5] hover:to-[#2A3ACC] transition-[color,background-color,box-shadow] shadow-lg shadow-[#6366F1]/25 outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060B18]"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
