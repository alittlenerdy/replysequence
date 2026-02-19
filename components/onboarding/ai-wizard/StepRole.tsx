'use client';

import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { ROLE_OPTIONS, type UserRole } from '@/lib/constants/ai-settings';

interface StepRoleProps {
  value: UserRole | null;
  onChange: (role: UserRole) => void;
  onNext: () => void;
}

export function StepRole({ value, onChange, onNext }: StepRoleProps) {
  return (
    <div>
      <h3 className="text-2xl font-bold text-white mb-2">What best describes your role?</h3>
      <p className="text-gray-400 text-sm mb-6">
        This helps us tailor your follow-up emails to your workflow.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg">
        {ROLE_OPTIONS.map((option) => {
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
              <span className={`text-sm font-semibold ${isSelected ? 'text-indigo-400' : 'text-white'}`}>
                {option.label}
              </span>
              <p className="text-xs text-gray-500 mt-0.5">{option.description}</p>
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

      <div className="mt-8">
        <button
          onClick={onNext}
          disabled={!value}
          className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-indigo-700 text-white font-semibold rounded-xl hover:from-indigo-600 hover:to-indigo-800 transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
