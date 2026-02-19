'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Loader2 } from 'lucide-react';
import type { ToneValue, UserRole } from '@/lib/constants/ai-settings';
import { StepRole } from './StepRole';
import { StepTone } from './StepTone';
import { StepInstructions } from './StepInstructions';
import { StepHourlyRate } from './StepHourlyRate';
import { StepConfirmation } from './StepConfirmation';

interface AIWizardProps {
  onSaved: () => void;
}

interface WizardState {
  role: UserRole | null;
  tone: ToneValue;
  instructions: string;
  signature: string;
  hourlyRate: number;
}

const WIZARD_STEPS = ['role', 'tone', 'instructions', 'rate', 'confirm'] as const;
type WizardStep = (typeof WIZARD_STEPS)[number];

export function AIWizard({ onSaved }: AIWizardProps) {
  const [step, setStep] = useState<WizardStep>('role');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [state, setState] = useState<WizardState>({
    role: null,
    tone: 'professional',
    instructions: '',
    signature: '',
    hourlyRate: 100,
  });

  // Load existing preferences if any
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/user/preferences');
        if (res.ok) {
          const data = await res.json();
          setState(prev => ({
            ...prev,
            tone: data.aiTone || 'professional',
            instructions: data.aiCustomInstructions || '',
            signature: data.aiSignature || '',
            hourlyRate: data.hourlyRate ?? 100,
            role: data.userRole || null,
          }));
        }
      } catch {
        // Use defaults
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const currentIndex = WIZARD_STEPS.indexOf(step);

  function next() {
    const nextIndex = currentIndex + 1;
    if (nextIndex < WIZARD_STEPS.length) {
      setStep(WIZARD_STEPS[nextIndex]);
    }
  }

  function back() {
    const prevIndex = currentIndex - 1;
    if (prevIndex >= 0) {
      setStep(WIZARD_STEPS[prevIndex]);
    }
  }

  async function handleComplete() {
    setIsSaving(true);
    try {
      const res = await fetch('/api/user/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aiTone: state.tone,
          aiCustomInstructions: state.instructions,
          aiSignature: state.signature,
          hourlyRate: state.hourlyRate,
          userRole: state.role,
          aiOnboardingComplete: true,
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
  }

  if (isLoading) {
    return (
      <div className="py-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="py-8">
      {/* Header */}
      <div className="text-center mb-8">
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
          Takes about a minute. You can always fine-tune later in settings.
        </motion.p>
      </div>

      {/* Progress dots */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {WIZARD_STEPS.map((s, i) => (
          <div
            key={s}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i <= currentIndex
                ? 'w-8 bg-indigo-500'
                : 'w-4 bg-gray-700'
            }`}
          />
        ))}
      </div>

      {/* Steps */}
      <div className="max-w-2xl mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {step === 'role' && (
              <StepRole
                value={state.role}
                onChange={(role) => setState(prev => ({ ...prev, role }))}
                onNext={next}
              />
            )}
            {step === 'tone' && (
              <StepTone
                value={state.tone}
                onChange={(tone) => setState(prev => ({ ...prev, tone }))}
                onNext={next}
                onBack={back}
              />
            )}
            {step === 'instructions' && (
              <StepInstructions
                instructions={state.instructions}
                signature={state.signature}
                onInstructionsChange={(v) => setState(prev => ({ ...prev, instructions: v }))}
                onSignatureChange={(v) => setState(prev => ({ ...prev, signature: v }))}
                onNext={next}
                onBack={back}
              />
            )}
            {step === 'rate' && (
              <StepHourlyRate
                value={state.hourlyRate}
                onChange={(hourlyRate) => setState(prev => ({ ...prev, hourlyRate }))}
                onNext={next}
                onBack={back}
              />
            )}
            {step === 'confirm' && (
              <StepConfirmation
                role={state.role}
                tone={state.tone}
                instructions={state.instructions}
                signature={state.signature}
                hourlyRate={state.hourlyRate}
                onComplete={handleComplete}
                onBack={back}
                isSaving={isSaving}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
