'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Zap, AlertTriangle, Check, ArrowRight } from 'lucide-react';

type EmailPreference = 'review' | 'auto_send';

interface StepEmailPreferencesProps {
  preference: EmailPreference;
  onSave: (preference: EmailPreference) => void;
}

export function StepEmailPreferences({
  preference: initialPreference,
  onSave,
}: StepEmailPreferencesProps) {
  const [selected, setSelected] = useState<EmailPreference>(initialPreference);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await onSave(selected);
  };

  const options = [
    {
      id: 'review' as const,
      title: 'Review all drafts before sending',
      description: 'Drafts appear in your dashboard for review and editing before you send them',
      icon: Mail,
      recommended: true,
      color: 'blue',
    },
    {
      id: 'auto_send' as const,
      title: 'Auto-send after meetings',
      description: 'Emails are sent automatically after meetings end, without review',
      icon: Zap,
      recommended: false,
      warning: 'Only recommended after you trust the AI quality',
      color: 'purple',
    },
  ];

  return (
    <div className="py-8">
      <div className="text-center mb-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-indigo-700/20 flex items-center justify-center mx-auto mb-6"
        >
          <Mail className="w-8 h-8 text-indigo-400" />
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl md:text-4xl font-bold text-white mb-3"
        >
          How should we send your emails?
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-gray-400 text-lg max-w-lg mx-auto"
        >
          Choose your preferred workflow. You can change this anytime in settings.
        </motion.p>
      </div>

      <div className="max-w-2xl mx-auto space-y-4 mb-10">
        {options.map((option, index) => {
          const isSelected = selected === option.id;
          const Icon = option.icon;

          return (
            <motion.button
              key={option.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              onClick={() => setSelected(option.id)}
              className={`w-full text-left p-6 rounded-2xl border-2 transition-all duration-200 ${
                isSelected
                  ? 'border-indigo-500 bg-indigo-500/10'
                  : 'border-gray-700 bg-gray-900/50 hover:border-gray-600'
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    isSelected
                      ? option.color === 'blue'
                        ? 'bg-indigo-500/20'
                        : 'bg-indigo-500/20'
                      : 'bg-gray-800'
                  }`}
                >
                  <Icon
                    className={`w-6 h-6 ${
                      isSelected
                        ? option.color === 'blue'
                          ? 'text-indigo-400'
                          : 'text-indigo-400'
                        : 'text-gray-500'
                    }`}
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-white">{option.title}</h3>
                    {option.recommended && (
                      <span className="text-xs font-medium text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">
                        Recommended
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-400">{option.description}</p>
                  {option.warning && (
                    <div className="flex items-center gap-1.5 mt-2 text-yellow-400">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span className="text-xs">{option.warning}</span>
                    </div>
                  )}
                </div>
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                    isSelected ? 'border-indigo-500 bg-indigo-500' : 'border-gray-600'
                  }`}
                >
                  {isSelected && <Check className="w-4 h-4 text-white" />}
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center"
      >
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-500 to-indigo-700 text-white font-semibold rounded-xl hover:from-indigo-600 hover:to-indigo-800 transition-all duration-200 shadow-lg shadow-indigo-500/25 disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Saving...
            </>
          ) : (
            <>
              Complete Setup
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </motion.div>
    </div>
  );
}
