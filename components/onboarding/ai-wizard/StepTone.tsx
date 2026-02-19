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
        This sets the default voice for all your follow-up emails.
      </p>

      <div className="grid grid-cols-2 gap-3 max-w-lg">
        {TONE_OPTIONS.map((option) => {
          const isSelected = value === option.value;
          return (
            <button
              key={option.value}
              onClick={() => onChange(option.value)}
              className={`relative p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                isSelected
                  ? 'border-indigo-500 bg-indigo-500/10'
                  : 'border-gray-700 bg-gray-900/50 hover:border-gray-600'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-sm font-semibold ${isSelected ? 'text-indigo-400' : 'text-white'}`}>
                  {option.label}
                </span>
                {option.recommended && (
                  <span className="text-[10px] font-medium text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded-full">
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
                  className="absolute top-2 right-2 w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center"
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
          className="px-5 py-3 text-sm font-medium text-gray-400 hover:text-white transition-colors"
        >
          Back
        </button>
        <button
          onClick={onNext}
          className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-indigo-700 text-white font-semibold rounded-xl hover:from-indigo-600 hover:to-indigo-800 transition-all shadow-lg shadow-indigo-500/25"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
