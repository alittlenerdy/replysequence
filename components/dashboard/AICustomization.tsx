'use client';

import { useState, useEffect, useCallback } from 'react';
import { Sparkles, Check, FileText, Plus, Trash2, ChevronDown, ChevronUp, Loader2, DollarSign, CheckCircle2, X, AlertTriangle, Pause, Bell, Mail, BarChart3 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TONE_OPTIONS, INSTRUCTION_CHIPS, HOURLY_RATE_CHIPS, type ToneValue } from '@/lib/constants/ai-settings';
import { useAutoSave, type AutoSaveStatus } from '@/lib/hooks/use-auto-save';
import { AISettingsPreview } from './AISettingsPreview';
import { Toast } from '@/components/ui/Toast';

interface NotificationPrefs {
  draftReady: boolean;
  sequenceStepSent: boolean;
  weeklySummary: boolean;
}

const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  draftReady: true,
  sequenceStepSent: false,
  weeklySummary: true,
};

interface AIPreferences {
  aiTone: ToneValue;
  aiCustomInstructions: string;
  aiSignature: string;
  hourlyRate: number;
  aiPaused: boolean;
  notificationPrefs: NotificationPrefs;
}

interface Template {
  id: string;
  name: string;
  description: string;
  meetingType: string | null;
  promptInstructions: string;
  icon: string;
  isSystem: boolean;
  isDefault: boolean;
}

function SaveStatusIndicator({ status, lastSavedAt }: { status: AutoSaveStatus; lastSavedAt: Date | null }) {
  function formatTime(date: Date): string {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }

  return (
    <div className="flex items-center gap-2 text-xs">
      {status === 'saving' && (
        <span className="text-gray-400 light:text-gray-500 flex items-center gap-1">
          <Loader2 className="w-3 h-3 animate-spin" />
          Saving...
        </span>
      )}
      {status === 'saved' && (
        <span className="text-green-400 light:text-green-600 flex items-center gap-1">
          <Check className="w-3 h-3" />
          Saved
        </span>
      )}
      {status === 'error' && (
        <span className="text-red-400 light:text-red-500">Failed to save</span>
      )}
      {status === 'idle' && lastSavedAt && (
        <span className="text-gray-500">Last saved {formatTime(lastSavedAt)}</span>
      )}
    </div>
  );
}

interface StepIndicatorProps {
  preferences: AIPreferences;
}

function StepIndicator({ preferences }: StepIndicatorProps) {
  const steps = [
    { label: 'Tone', complete: !!preferences.aiTone },
    { label: 'Instructions', complete: preferences.aiCustomInstructions.length > 0 },
    { label: 'Rate', complete: preferences.hourlyRate > 0 },
  ];
  const completedCount = steps.filter(s => s.complete).length;
  const progressPercent = (completedCount / steps.length) * 100;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        {steps.map((step, i) => (
          <div key={step.label} className="flex items-center gap-1.5">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium ${
              step.complete
                ? 'bg-[#6366F1] text-white'
                : 'bg-gray-700 light:bg-gray-200 text-gray-400 light:text-gray-500'
            }`}>
              {step.complete ? <Check className="w-3 h-3" /> : i + 1}
            </div>
            <span className={`text-xs ${
              step.complete ? 'text-gray-300 light:text-gray-700' : 'text-gray-500'
            }`}>
              {step.label}
            </span>
            {i < steps.length - 1 && (
              <div className="w-6 h-px bg-gray-700 light:bg-gray-200 ml-1" />
            )}
          </div>
        ))}
        <span className="text-xs text-gray-500 ml-auto">{completedCount}/{steps.length}</span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-gray-700/50 light:bg-gray-200 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-[#6366F1] to-[#4F46E5] rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

export function AICustomization() {
  const [preferences, setPreferences] = useState<AIPreferences>({
    aiTone: 'professional',
    aiCustomInstructions: '',
    aiSignature: '',
    hourlyRate: 100,
    aiPaused: false,
    notificationPrefs: { ...DEFAULT_NOTIFICATION_PREFS },
  });
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [completionDismissed, setCompletionDismissed] = useState(true);

  // Compute completion state — all 3 steps done
  const isComplete =
    !!preferences.aiTone &&
    preferences.aiCustomInstructions.length > 0 &&
    preferences.hourlyRate > 0;

  // Load preferences
  useEffect(() => {
    async function load() {
      try {
        const response = await fetch('/api/user/preferences');
        if (response.ok) {
          const data = await response.json();
          setPreferences({
            aiTone: data.aiTone || 'professional',
            aiCustomInstructions: data.aiCustomInstructions || '',
            aiSignature: data.aiSignature || '',
            hourlyRate: data.hourlyRate ?? 100,
            aiPaused: data.aiPaused ?? false,
            notificationPrefs: data.notificationPrefs
              ? { ...DEFAULT_NOTIFICATION_PREFS, ...data.notificationPrefs }
              : { ...DEFAULT_NOTIFICATION_PREFS },
          });
        }
      } catch {
        // Use defaults
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Persist completion to backend when all steps done
  useEffect(() => {
    if (isComplete && !loading) {
      fetch('/api/user/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...preferences, aiOnboardingComplete: true }),
      }).catch(() => {});
    }
  }, [isComplete, loading, preferences]);

  // Auto-save logic
  const handleSave = useCallback(async (data: AIPreferences) => {
    const response = await fetch('/api/user/preferences', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Save failed');

    // Show first-time setup toast and dismiss dashboard nudge
    if (data.aiTone && data.aiCustomInstructions.length > 0) {
      localStorage.setItem('rs-nudge-ai-settings-dismissed', '1');
      const hasSeenToast = localStorage.getItem('rs-ai-setup-toast');
      if (!hasSeenToast) {
        localStorage.setItem('rs-ai-setup-toast', '1');
        setShowToast(true);
      }
    }
  }, []);

  const { status, lastSavedAt } = useAutoSave({
    data: preferences,
    onSave: handleSave,
    delay: 1500,
    enabled: !loading,
  });

  function handleDismissCompletion() {
    setCompletionDismissed(true);
    localStorage.setItem('rs-ai-setup-complete-dismissed', '1');
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto mt-8">
        <div className="glass-card border border-white/[0.06] light:border-gray-200 rounded-xl p-6 animate-pulse light:shadow-sm">
          <div className="h-6 w-40 bg-gray-700 light:bg-gray-200 rounded mb-4" />
          <div className="h-4 w-64 bg-gray-700 light:bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto mt-8">
      {/* AI Setup Complete Banner */}
      <AnimatePresence>
        {isComplete && !completionDismissed && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="mb-6 p-4 rounded-xl border border-green-500/30 light:border-green-300 bg-green-500/10 light:bg-green-50 flex items-center gap-3"
          >
            <CheckCircle2 className="w-5 h-5 text-green-400 light:text-green-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-green-300 light:text-green-800">
                Your AI assistant is fully configured.
              </p>
              <p className="text-xs text-green-400/70 light:text-green-600 mt-0.5">
                You can tweak these settings anytime.
              </p>
            </div>
            <button
              onClick={handleDismissCompletion}
              className="text-green-400/60 hover:text-green-300 light:text-green-500 light:hover:text-green-700 transition-colors shrink-0 rounded outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060B18]"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Banner with save status — hidden once all 3 steps are complete */}
      {!(preferences.aiTone && preferences.aiCustomInstructions.length > 0 && preferences.hourlyRate > 0) && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#4F46E5]/20 via-[#4F46E5]/15 to-[#4F46E5]/10 light:from-[#DDE1FF] light:via-[#F5F6FF] light:to-[#EEF0FF] p-6 border border-[#6366F1]/20 light:border-[#4F46E5]/30 mb-6">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-[#6366F1]/20 rounded-full blur-3xl" />
          <div className="absolute -left-4 -bottom-4 w-24 h-24 bg-[#6366F1]/15 rounded-full blur-2xl" />
          <div className="relative flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#6366F1] to-[#3A4BDD] flex items-center justify-center shadow-lg shadow-[#6366F1]/25">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white light:text-gray-900">Your AI Writing Assistant</h3>
                <p className="text-sm text-[#B3BFFF]/80 light:text-gray-500 mt-0.5">Shape how ReplySequence writes for you</p>
              </div>
            </div>
            <div aria-live="polite">
              <SaveStatusIndicator status={status} lastSavedAt={lastSavedAt} />
            </div>
          </div>
          <div className="relative mt-4">
            <StepIndicator preferences={preferences} />
          </div>
        </div>
      )}

      {/* Two-column layout */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left column: Settings form */}
        <div className="flex-1 min-w-0 space-y-6 lg:pr-6 lg:border-r lg:border-white/[0.08] light:lg:border-gray-200">
          {/* Pause All AI — emergency toggle */}
          <div className={`rounded-xl border p-5 transition-colors duration-200 ${
            preferences.aiPaused
              ? 'border-amber-500/40 bg-amber-500/10 light:border-amber-300 light:bg-amber-50'
              : 'glass-card border-white/[0.06] light:border-gray-200 hover:border-gray-600 light:hover:border-gray-300 light:shadow-sm'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  preferences.aiPaused
                    ? 'bg-amber-500/20'
                    : 'bg-gray-700/50 light:bg-gray-100'
                }`}>
                  <Pause className={`w-4 h-4 ${preferences.aiPaused ? 'text-amber-400' : 'text-gray-400 light:text-gray-500'}`} />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-white light:text-gray-900">Pause All AI</h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Stop all draft generation, auto-send, and sequences
                  </p>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={preferences.aiPaused}
                aria-label="Pause all AI processing"
                onClick={() => setPreferences(p => ({ ...p, aiPaused: !p.aiPaused }))}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060B18] ${
                  preferences.aiPaused ? 'bg-amber-500' : 'bg-gray-600 light:bg-gray-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition-transform duration-200 ${
                    preferences.aiPaused ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
            {preferences.aiPaused && (
              <div className="mt-3 flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 light:bg-amber-50 light:border-amber-200">
                <AlertTriangle className="w-4 h-4 text-amber-400 light:text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-300 light:text-amber-700">
                  AI processing is paused. No drafts will be generated and no sequences will send.
                </p>
              </div>
            )}
          </div>

          {/* Step 1: Tone Selection */}
          <div className="glass-card border border-white/[0.06] light:border-gray-200 rounded-xl p-5 transition-[border-color] duration-200 hover:border-gray-600 light:hover:border-gray-300 light:shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-5 h-5 rounded-full bg-[#6366F1]/20 text-[#6366F1] text-xs font-bold flex items-center justify-center">1</span>
              <h4 className="text-sm font-medium text-white light:text-gray-900">Email Tone</h4>
              <p className="text-[10px] text-[#8892B0] light:text-gray-400 ml-auto">Applies to all future follow-ups</p>
            </div>
            <div className="space-y-2.5">
              {TONE_OPTIONS.map((option) => {
                const isSelected = preferences.aiTone === option.value;
                return (
                  <motion.button
                    key={option.value}
                    layout
                    animate={isSelected ? { scale: 1.02 } : { scale: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    onClick={() => setPreferences(p => ({ ...p, aiTone: option.value }))}
                    className={`w-full p-3.5 rounded-xl border text-left transition-[box-shadow,border-color,background-color] duration-200 hover:shadow-md outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060B18] ${
                      isSelected
                        ? 'border-[#6366F1] bg-[#6366F1]/10 shadow-lg shadow-[#6366F1]/20'
                        : 'border-white/[0.06] light:border-gray-200 hover:border-gray-500 light:hover:border-gray-400 bg-gray-900/30 light:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className={`text-sm font-semibold ${isSelected ? 'text-[#6366F1] light:text-[#4F46E5]' : 'text-white light:text-gray-900'}`}>
                          {option.label}
                          {option.recommended && (
                            <span className="ml-2 text-xs font-normal text-gray-500">(recommended)</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">{option.description}</div>
                        <div className="text-xs text-gray-600 light:text-gray-400 mt-1 italic">
                          Subject: {option.subjectExample}
                        </div>
                      </div>
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-6 h-6 rounded-full bg-[#6366F1] flex items-center justify-center shrink-0 ml-2"
                        >
                          <Check className="w-3.5 h-3.5 text-white" />
                        </motion.div>
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Custom Instructions + Signature */}
          <div className="glass-card border border-white/[0.06] light:border-gray-200 rounded-xl p-5 transition-[border-color] duration-200 hover:border-gray-600 light:hover:border-gray-300 light:shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-5 h-5 rounded-full bg-[#6366F1]/20 text-[#6366F1] text-xs font-bold flex items-center justify-center">2</span>
              <h4 className="text-sm font-medium text-white light:text-gray-900">Your AI Instructions</h4>
              <p className="text-[10px] text-[#8892B0] light:text-gray-400 ml-auto">Active across all sequences</p>
            </div>

            {/* Instructions */}
            <label htmlFor="custom-instructions" className="block text-xs text-gray-400 light:text-gray-500 mb-1.5">
              Added to every draft. E.g., &quot;Always mention our 30-day trial&quot;
            </label>
            <textarea
              id="custom-instructions"
              value={preferences.aiCustomInstructions}
              onChange={(e) => setPreferences(p => ({ ...p, aiCustomInstructions: e.target.value }))}
              placeholder="E.g., Always include a specific next step with a date. Use my first name in the sign-off\u2026"
              rows={3}
              maxLength={500}
              className="w-full px-3 py-2 text-sm bg-gray-800 light:bg-gray-50 border border-gray-700 light:border-gray-300 rounded-lg text-white light:text-gray-900 placeholder-gray-600 light:placeholder-gray-400 resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1] focus-visible:ring-offset-2 focus-visible:ring-offset-[#060B18] light:focus-visible:ring-offset-white"
            />
            <div className="text-xs text-gray-600 mt-1 text-right">
              {preferences.aiCustomInstructions.length}/500
            </div>
            <div className="flex flex-wrap gap-2 mt-2 mb-5">
              {INSTRUCTION_CHIPS.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => {
                    setPreferences(p => ({
                      ...p,
                      aiCustomInstructions: p.aiCustomInstructions
                        ? `${p.aiCustomInstructions}\n${chip}`
                        : chip,
                    }));
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-[#818CF8] light:text-[#4F46E5] bg-[#6366F1]/15 light:bg-[#EEF0FF] border border-[#6366F1]/40 light:border-[#4F46E5]/50 rounded-full hover:bg-[#4F46E5]/25 light:hover:bg-[#DDE1FF] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060B18]"
                >
                  + {chip}
                </button>
              ))}
            </div>

            {/* Signature */}
            <label htmlFor="email-signature" className="block text-xs text-gray-400 light:text-gray-500 mb-1.5">
              Email signature (appended to every draft)
            </label>
            <textarea
              id="email-signature"
              value={preferences.aiSignature}
              onChange={(e) => setPreferences(p => ({ ...p, aiSignature: e.target.value }))}
              placeholder={"Best regards,\nJohn Smith\nAccount Executive, Acme Corp\n(555) 123-4567"}
              rows={4}
              maxLength={500}
              className="w-full px-3 py-2 text-sm bg-gray-800 light:bg-gray-50 border border-gray-700 light:border-gray-300 rounded-lg text-white light:text-gray-900 placeholder-gray-600 light:placeholder-gray-400 resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1] focus-visible:ring-offset-2 focus-visible:ring-offset-[#060B18] light:focus-visible:ring-offset-white font-mono"
            />
          </div>

          {/* Step 3: Hourly Rate */}
          <div className="glass-card border border-white/[0.06] light:border-gray-200 rounded-xl p-5 transition-[border-color] duration-200 hover:border-gray-600 light:hover:border-gray-300 light:shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-5 h-5 rounded-full bg-[#6366F1]/20 text-[#6366F1] text-xs font-bold flex items-center justify-center">3</span>
              <DollarSign className="w-4 h-4 text-amber-400" />
              <h4 className="text-sm font-medium text-white light:text-gray-900">Your Hourly Rate</h4>
            </div>
            <p className="text-xs text-gray-500 mb-3 ml-7">
              Used to calculate ROI on your analytics dashboard. Never shared.
            </p>
            <div className="flex items-center gap-3 ml-7">
              <div className="flex items-center gap-1">
                <span className="text-sm text-gray-400">$</span>
                <input
                  type="number"
                  min={1}
                  max={9999}
                  value={preferences.hourlyRate}
                  autoComplete="off"
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (!isNaN(val) && val >= 1 && val <= 9999) {
                      setPreferences(p => ({ ...p, hourlyRate: val }));
                    }
                  }}
                  aria-label="Hourly rate"
                  className="w-24 px-3 py-2 text-sm bg-gray-800 light:bg-gray-50 border border-gray-700 light:border-gray-300 rounded-lg text-white light:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1] focus-visible:ring-offset-2 focus-visible:ring-offset-[#060B18] light:focus-visible:ring-offset-white tabular-nums"
                />
                <span className="text-sm text-gray-500">/ hr</span>
              </div>
              <div className="flex gap-1.5">
                {HOURLY_RATE_CHIPS.map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => setPreferences(p => ({ ...p, hourlyRate: rate }))}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060B18] ${
                      preferences.hourlyRate === rate
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-gray-800 light:bg-gray-100 text-gray-400 light:text-gray-500 border border-white/[0.06] light:border-gray-200 hover:border-gray-500'
                    }`}
                  >
                    ${rate}
                  </button>
                ))}
              </div>
            </div>
            {/* ROI hint */}
            <AnimatePresence mode="wait">
              <motion.p
                key={preferences.hourlyRate}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
                className="text-xs text-amber-400/80 light:text-amber-600 mt-2 ml-7"
              >
                At this rate, saving 3 hours/month = ${preferences.hourlyRate * 3} of value
              </motion.p>
            </AnimatePresence>
          </div>

          {/* Step 4: Email Templates */}
          <TemplateManager />

          {/* Notification Preferences */}
          <div className="glass-card border border-white/[0.06] light:border-gray-200 rounded-xl p-5 transition-[border-color] duration-200 hover:border-gray-600 light:hover:border-gray-300 light:shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Bell className="w-4 h-4 text-[#6366F1]" />
              <h4 className="text-sm font-medium text-white light:text-gray-900">Notifications</h4>
            </div>
            <div className="space-y-3">
              {/* Draft ready */}
              <label className="flex items-center justify-between cursor-pointer group">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-gray-400 light:text-gray-500" />
                  <div>
                    <span className="text-sm text-white light:text-gray-900">Email me when a draft is ready</span>
                    <p className="text-[10px] text-gray-500 mt-0.5">Get notified when AI finishes writing a follow-up</p>
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={preferences.notificationPrefs.draftReady}
                  onClick={() => setPreferences(p => ({
                    ...p,
                    notificationPrefs: { ...p.notificationPrefs, draftReady: !p.notificationPrefs.draftReady },
                  }))}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060B18] ${
                    preferences.notificationPrefs.draftReady ? 'bg-[#6366F1]' : 'bg-gray-600 light:bg-gray-300'
                  }`}
                >
                  <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition-transform duration-200 ${
                    preferences.notificationPrefs.draftReady ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </button>
              </label>

              <div className="h-px bg-white/[0.06] light:bg-gray-100" />

              {/* Sequence step sent */}
              <label className="flex items-center justify-between cursor-pointer group">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-4 h-4 text-gray-400 light:text-gray-500" />
                  <div>
                    <span className="text-sm text-white light:text-gray-900">Email me when a sequence step sends</span>
                    <p className="text-[10px] text-gray-500 mt-0.5">Real-time alerts for automated follow-ups</p>
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={preferences.notificationPrefs.sequenceStepSent}
                  onClick={() => setPreferences(p => ({
                    ...p,
                    notificationPrefs: { ...p.notificationPrefs, sequenceStepSent: !p.notificationPrefs.sequenceStepSent },
                  }))}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060B18] ${
                    preferences.notificationPrefs.sequenceStepSent ? 'bg-[#6366F1]' : 'bg-gray-600 light:bg-gray-300'
                  }`}
                >
                  <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition-transform duration-200 ${
                    preferences.notificationPrefs.sequenceStepSent ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </button>
              </label>

              <div className="h-px bg-white/[0.06] light:bg-gray-100" />

              {/* Weekly summary */}
              <label className="flex items-center justify-between cursor-pointer group">
                <div className="flex items-center gap-3">
                  <BarChart3 className="w-4 h-4 text-gray-400 light:text-gray-500" />
                  <div>
                    <span className="text-sm text-white light:text-gray-900">Weekly summary email</span>
                    <p className="text-[10px] text-gray-500 mt-0.5">Digest of meetings processed, drafts sent, and ROI</p>
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={preferences.notificationPrefs.weeklySummary}
                  onClick={() => setPreferences(p => ({
                    ...p,
                    notificationPrefs: { ...p.notificationPrefs, weeklySummary: !p.notificationPrefs.weeklySummary },
                  }))}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060B18] ${
                    preferences.notificationPrefs.weeklySummary ? 'bg-[#6366F1]' : 'bg-gray-600 light:bg-gray-300'
                  }`}
                >
                  <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition-transform duration-200 ${
                    preferences.notificationPrefs.weeklySummary ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </button>
              </label>
            </div>

            {/* Cross-reference to Email tab */}
            <p className="text-[10px] text-gray-500 mt-4">
              Delivery mode (review vs. auto-send) is managed in the Email tab.
            </p>
          </div>
        </div>

        {/* Right column: Sticky preview — shows the result of your choices */}
        <div className="w-full lg:w-[380px] shrink-0">
          <div className="lg:sticky lg:top-36">
            <p className="text-[10px] text-[#06B6D4] light:text-teal-600 font-medium uppercase tracking-wider mb-2">
              This is how your emails will sound
            </p>
            <AISettingsPreview
              tone={preferences.aiTone}
              customInstructions={preferences.aiCustomInstructions}
              signature={preferences.aiSignature}
            />
          </div>
        </div>
      </div>

      {/* Toast */}
      {showToast && (
        <Toast
          message="AI settings configured! Your drafts will now reflect these preferences."
          type="success"
          onClose={() => setShowToast(false)}
        />
      )}
    </div>
  );
}

const MEETING_TYPE_LABELS: Record<string, string> = {
  sales_call: 'Sales',
  internal_sync: 'Internal',
  client_review: 'Client',
  technical_discussion: 'Technical',
  general: 'General',
};

export function TemplateManager() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    async function loadTemplates() {
      try {
        const res = await fetch('/api/templates');
        if (res.ok) {
          const data = await res.json();
          setTemplates(data.templates);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    loadTemplates();
  }, []);

  function handleExpand() {
    setExpanded(!expanded);
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    try {
      const res = await fetch(`/api/templates?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setTemplates((prev) => prev.filter((t) => t.id !== id));
      }
    } catch {
      // silent
    } finally {
      setDeleting(null);
    }
  }

  async function handleCreate(data: { name: string; meetingType: string; promptInstructions: string }) {
    try {
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const { template } = await res.json();
        setTemplates((prev) => [...prev, { ...template, isSystem: false, isDefault: false }]);
        setShowCreateForm(false);
      }
    } catch {
      // silent
    }
  }

  const systemTemplates = templates.filter((t) => t.isSystem);
  const customTemplates = templates.filter((t) => !t.isSystem);

  return (
    <div className="glass-card border border-white/[0.06] light:border-gray-200 rounded-xl p-5 transition-[border-color] duration-200 hover:border-gray-600 light:hover:border-gray-300 light:shadow-sm">
      <button
        onClick={handleExpand}
        className="w-full flex items-center justify-between group outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060B18] rounded-lg"
      >
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-[#6366F1]" />
          <div className="text-left">
            <h4 className="text-sm font-medium text-white light:text-gray-900">Email Templates</h4>
            <p className="text-xs text-gray-500 mt-0.5">
              {systemTemplates.length} built-in{customTemplates.length > 0 ? `, ${customTemplates.length} custom` : ''} — customize how drafts are generated per meeting type
            </p>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-gray-400 group-hover:text-white light:group-hover:text-gray-900 transition-colors" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400 group-hover:text-white light:group-hover:text-gray-900 transition-colors" />
        )}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-4 space-y-3">
              {loading ? (
                <div className="bg-gray-800/50 light:bg-gray-50 rounded-xl p-6 animate-pulse">
                  <div className="h-4 w-32 bg-gray-700 light:bg-gray-200 rounded" />
                </div>
              ) : (
                <>
                  {/* System Templates */}
                  <div className="bg-gray-800/30 light:bg-gray-50 rounded-xl p-4">
                    <h4 className="text-sm font-medium text-gray-400 light:text-gray-500 mb-3">Built-in Templates</h4>
                    <div className="space-y-2">
                      {systemTemplates.map((t) => (
                        <div
                          key={t.id}
                          className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-800/50 light:bg-white light:border light:border-gray-100"
                        >
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-white light:text-gray-900 truncate">{t.name}</div>
                            <div className="text-xs text-gray-500 truncate">{t.description}</div>
                          </div>
                          {t.meetingType && (
                            <span className="shrink-0 ml-2 px-2 py-0.5 text-xs rounded-full bg-gray-700/50 light:bg-gray-200 text-gray-400 light:text-gray-500">
                              {MEETING_TYPE_LABELS[t.meetingType] || t.meetingType}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Custom Templates */}
                  {customTemplates.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">No custom templates yet</p>
                  )}
                  {customTemplates.length > 0 && (
                    <div className="bg-gray-800/30 light:bg-gray-50 rounded-xl p-4">
                      <h4 className="text-sm font-medium text-gray-400 light:text-gray-500 mb-3">Your Templates</h4>
                      <div className="space-y-2">
                        {customTemplates.map((t) => (
                          <div
                            key={t.id}
                            className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-800/50 light:bg-white light:border light:border-gray-100"
                          >
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-white light:text-gray-900 truncate">{t.name}</div>
                              <div className="text-xs text-gray-500 truncate line-clamp-1">
                                {t.promptInstructions.substring(0, 80)}\u2026
                              </div>
                            </div>
                            <button
                              onClick={() => { if (window.confirm('Delete this template?')) handleDelete(t.id); }}
                              disabled={deleting === t.id}
                              className="shrink-0 ml-2 p-1.5 text-gray-500 hover:text-red-400 transition-colors disabled:opacity-50 rounded outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060B18]"
                              title="Delete template"
                              aria-label="Delete template"
                            >
                              {deleting === t.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Create Template */}
                  {showCreateForm ? (
                    <CreateTemplateForm
                      onSubmit={handleCreate}
                      onCancel={() => setShowCreateForm(false)}
                    />
                  ) : (
                    <button
                      onClick={() => setShowCreateForm(true)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-[#6366F1] border border-dashed border-gray-600 light:border-gray-300 rounded-xl hover:border-[#6366F1]/50 hover:bg-[#4F46E5]/5 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060B18]"
                    >
                      <Plus className="w-4 h-4" />
                      Create Custom Template
                    </button>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CreateTemplateForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (data: { name: string; meetingType: string; promptInstructions: string }) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState('');
  const [meetingType, setMeetingType] = useState('');
  const [promptInstructions, setPromptInstructions] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !promptInstructions) return;
    setSaving(true);
    await onSubmit({ name, meetingType, promptInstructions });
    setSaving(false);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-gray-800/30 light:bg-gray-50 border border-[#6366F1]/30 rounded-xl p-4 space-y-3"
    >
      <h4 className="text-sm font-medium text-white light:text-gray-900">New Template</h4>

      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Template name"
        maxLength={100}
        aria-label="Template name"
        autoComplete="off"
        className="w-full px-3 py-2 text-sm bg-gray-800 light:bg-white border border-gray-700 light:border-gray-300 rounded-lg text-white light:text-gray-900 placeholder-gray-600 light:placeholder-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1] focus-visible:ring-offset-2 focus-visible:ring-offset-[#060B18] light:focus-visible:ring-offset-white"
      />

      <select
        value={meetingType}
        onChange={(e) => setMeetingType(e.target.value)}
        aria-label="Meeting type"
        className="w-full px-3 py-2 text-sm bg-gray-800 light:bg-white border border-gray-700 light:border-gray-300 rounded-lg text-white light:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1] focus-visible:ring-offset-2 focus-visible:ring-offset-[#060B18] light:focus-visible:ring-offset-white"
      >
        <option value="">All meeting types</option>
        <option value="sales_call">Sales Calls</option>
        <option value="internal_sync">Internal Syncs</option>
        <option value="client_review">Client Reviews</option>
        <option value="technical_discussion">Technical Discussions</option>
        <option value="general">General</option>
      </select>

      <textarea
        value={promptInstructions}
        onChange={(e) => setPromptInstructions(e.target.value)}
        placeholder="Instructions for the AI. E.g., 'Focus on budget discussions and decision timelines. Include a pricing summary section.'"
        rows={4}
        maxLength={2000}
        aria-label="Prompt instructions"
        className="w-full px-3 py-2 text-sm bg-gray-800 light:bg-white border border-gray-700 light:border-gray-300 rounded-lg text-white light:text-gray-900 placeholder-gray-600 light:placeholder-gray-400 resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1] focus-visible:ring-offset-2 focus-visible:ring-offset-[#060B18] light:focus-visible:ring-offset-white"
      />
      <div className="text-xs text-gray-600 text-right">{promptInstructions.length}/2000</div>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors rounded outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060B18]"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving || !name || !promptInstructions}
          className="px-4 py-2 text-sm font-medium text-white bg-[#4F46E5] hover:bg-[#3A4BDD] rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060B18]"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Creating...
            </>
          ) : (
            'Create Template'
          )}
        </button>
      </div>
    </form>
  );
}
