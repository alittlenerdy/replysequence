'use client';

import { DollarSign } from 'lucide-react';
import { HOURLY_RATE_CHIPS } from '@/lib/constants/ai-settings';

interface StepHourlyRateProps {
  value: number;
  onChange: (rate: number) => void;
  onNext: () => void;
  onBack: () => void;
}

export function StepHourlyRate({ value, onChange, onNext, onBack }: StepHourlyRateProps) {
  return (
    <div>
      <h3 className="text-2xl font-bold text-white mb-2">What's your time worth?</h3>
      <p className="text-gray-400 text-sm mb-6">
        We use this to show you how much time and money ReplySequence saves. Never shared.
      </p>

      <div className="max-w-sm">
        <div className="flex items-center gap-3 mb-4">
          <DollarSign className="w-5 h-5 text-amber-400" />
          <div className="flex items-center gap-1">
            <span className="text-lg text-gray-400">$</span>
            <input
              type="number"
              min={1}
              max={9999}
              value={value}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val) && val >= 1 && val <= 9999) {
                  onChange(val);
                }
              }}
              aria-label="Hourly rate"
              autoComplete="off"
              className="w-28 px-3 py-2.5 text-lg bg-gray-800 border border-gray-700 rounded-lg text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#6366F1] tabular-nums"
            />
            <span className="text-sm text-gray-500">/ hour</span>
          </div>
        </div>

        <div className="flex gap-2 mb-2">
          {HOURLY_RATE_CHIPS.map((rate) => (
            <button
              key={rate}
              type="button"
              onClick={() => onChange(rate)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060B18] ${
                value === rate
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-gray-800 text-gray-400 border border-gray-700 hover:border-gray-500'
              }`}
            >
              ${rate}
            </button>
          ))}
        </div>
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
        <button
          onClick={onNext}
          className="px-4 py-3 text-xs text-gray-500 hover:text-gray-400 transition-colors rounded outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060B18]"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}
