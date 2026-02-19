'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Check, ArrowRight, Loader2 } from 'lucide-react';
import { TONE_OPTIONS, INSTRUCTION_CHIPS } from '@/lib/constants/ai-settings';

interface StepAIVoiceProps {
  onSaved: () => void;
}

export function StepAIVoice({ onSaved }: StepAIVoiceProps) {
  const [tone, setTone] = useState('professional');
  const [customInstructions, setCustomInstructions] = useState('');
  const [signature, setSignature] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [displayedPreview, setDisplayedPreview] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Load existing preferences
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/user/preferences');
        if (res.ok) {
          const data = await res.json();
          if (data.aiTone) setTone(data.aiTone);
          if (data.aiCustomInstructions) setCustomInstructions(data.aiCustomInstructions);
          if (data.aiSignature) setSignature(data.aiSignature);
        }
      } catch {
        // Use defaults
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  // Typewriter preview effect
  useEffect(() => {
    const preview = TONE_OPTIONS.find(o => o.value === tone)?.preview || '';
    setDisplayedPreview('');
    setIsTyping(true);
    let i = 0;
    const interval = setInterval(() => {
      if (i < preview.length) {
        setDisplayedPreview(preview.slice(0, i + 1));
        i++;
      } else {
        setIsTyping(false);
        clearInterval(interval);
      }
    }, 20);
    return () => clearInterval(interval);
  }, [tone]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/user/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aiTone: tone,
          aiCustomInstructions: customInstructions,
          aiSignature: signature,
        }),
      });
      if (res.ok) {
        onSaved();
      }
    } catch {
      // Allow retry
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="text-center mb-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-indigo-700/20 flex items-center justify-center mx-auto mb-6"
        >
          <Sparkles className="w-8 h-8 text-indigo-400" />
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl md:text-4xl font-bold text-white mb-3"
        >
          Set up your AI voice
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-gray-400 text-lg max-w-lg mx-auto"
        >
          Customize how your follow-up emails sound. You can always change this in settings.
        </motion.p>
      </div>

      {/* Section A: Email Tone (required) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="max-w-2xl mx-auto mb-8"
      >
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-3">Email Tone</h3>
        <div className="grid grid-cols-2 gap-3">
          {TONE_OPTIONS.map((option) => {
            const isSelected = tone === option.value;
            return (
              <button
                key={option.value}
                onClick={() => setTone(option.value)}
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
                      Recommended
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500">{option.description}</p>
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

        {/* Typewriter Preview */}
        <div className="mt-4 p-4 rounded-xl bg-gray-800/50 border border-gray-700/50">
          <div className="text-xs font-medium text-gray-500 mb-2">Preview</div>
          <p className="text-sm text-gray-300 italic leading-relaxed min-h-[3rem]">
            &ldquo;{displayedPreview}{isTyping && <span className="inline-block w-0.5 h-4 bg-indigo-400 ml-0.5 animate-pulse align-middle" />}&rdquo;
          </p>
        </div>
      </motion.div>

      {/* Section B: Custom Instructions (optional) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="max-w-2xl mx-auto mb-8"
      >
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-1">
          Custom Instructions <span className="text-gray-600 font-normal normal-case">(optional)</span>
        </h3>
        <p className="text-xs text-gray-500 mb-3">
          Any specific instructions for your AI? These are added to every draft.
        </p>
        <textarea
          value={customInstructions}
          onChange={(e) => setCustomInstructions(e.target.value)}
          placeholder="E.g., Always include a specific next step with a date. Use my first name in the sign-off."
          rows={3}
          maxLength={500}
          className="w-full px-3 py-2 text-sm bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-600 resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <div className="flex flex-wrap gap-2 mt-2">
          {INSTRUCTION_CHIPS.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => {
                setCustomInstructions(prev =>
                  prev ? `${prev}\n${chip}` : chip
                );
              }}
              className="px-3 py-1.5 text-xs font-medium text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 rounded-full hover:bg-indigo-500/20 transition-colors"
            >
              + {chip}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Section C: Email Signature (optional) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="max-w-2xl mx-auto mb-10"
      >
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-1">
          Email Signature <span className="text-gray-600 font-normal normal-case">(optional)</span>
        </h3>
        <p className="text-xs text-gray-500 mb-3">
          This will be appended to every AI-generated email.
        </p>
        <textarea
          value={signature}
          onChange={(e) => setSignature(e.target.value)}
          placeholder={"Best regards,\nJohn Smith\nAccount Executive, Acme Corp\n(555) 123-4567"}
          rows={4}
          maxLength={500}
          className="w-full px-3 py-2 text-sm bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-600 resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
        />
      </motion.div>

      {/* Save & Continue */}
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
              <Loader2 className="w-5 h-5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              Save & Continue
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </motion.div>
    </div>
  );
}
