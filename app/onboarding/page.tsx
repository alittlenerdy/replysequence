'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { StepWelcome } from '@/components/onboarding/StepWelcome';
import { StepConnectPlatform } from '@/components/onboarding/StepConnectPlatform';
import { StepConnectCalendar } from '@/components/onboarding/StepConnectCalendar';
import { StepTestDraft } from '@/components/onboarding/StepTestDraft';
import { StepEmailPreferences } from '@/components/onboarding/StepEmailPreferences';
import { OnboardingComplete } from '@/components/onboarding/OnboardingComplete';
import { ProgressBar } from '@/components/onboarding/ProgressBar';
import { X, Loader2 } from 'lucide-react';

export type OnboardingStep = 1 | 2 | 3 | 4 | 5 | 'complete';
export type ConnectedPlatform = 'zoom' | 'teams' | 'meet' | null;
export type EmailPreference = 'review' | 'auto_send';

export interface OnboardingState {
  currentStep: OnboardingStep;
  platformConnected: ConnectedPlatform;
  calendarConnected: boolean;
  draftGenerated: boolean;
  emailPreference: EmailPreference;
  isLoading: boolean;
  isReturningUser: boolean;
}

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [state, setState] = useState<OnboardingState>({
    currentStep: 1,
    platformConnected: null,
    calendarConnected: false,
    draftGenerated: false,
    emailPreference: 'review',
    isLoading: true,
    isReturningUser: false,
  });

  const [showExitModal, setShowExitModal] = useState(false);

  // Load existing progress
  const loadProgress = useCallback(async () => {
    try {
      const res = await fetch('/api/onboarding/progress');
      if (res.ok) {
        const data = await res.json();
        if (data.completedAt) {
          // Already completed, redirect to dashboard
          router.push('/dashboard');
          return;
        }
        setState(prev => ({
          ...prev,
          currentStep: data.currentStep || 1,
          platformConnected: data.platformConnected || null,
          calendarConnected: data.calendarConnected || false,
          draftGenerated: data.draftGenerated || false,
          emailPreference: data.emailPreference || 'review',
          isLoading: false,
          isReturningUser: data.currentStep > 1,
        }));
      } else {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      console.error('[ONBOARDING] Error loading progress:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [router]);

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  // Handle OAuth callback params
  useEffect(() => {
    const platform = searchParams.get('platform_connected');
    const calendarConnected = searchParams.get('calendar_connected');
    const step = searchParams.get('step');
    const success = searchParams.get('success');

    if (platform && success === 'true') {
      const connectedPlatform = platform as ConnectedPlatform;
      setState(prev => ({
        ...prev,
        platformConnected: connectedPlatform,
        currentStep: 3,
      }));
      saveProgress({ platformConnected: connectedPlatform, currentStep: 3 });
      // Clean URL
      window.history.replaceState({}, '', '/onboarding');
    }

    // Handle calendar OAuth callback
    if (calendarConnected === 'true') {
      setState(prev => ({
        ...prev,
        calendarConnected: true,
        currentStep: 3, // Stay on calendar step to show connected status
      }));
      saveProgress({ calendarConnected: true, currentStep: 3 });
      // Clean URL
      window.history.replaceState({}, '', '/onboarding');
    }

    if (step) {
      const stepNum = parseInt(step, 10);
      if (stepNum >= 1 && stepNum <= 5) {
        setState(prev => ({ ...prev, currentStep: stepNum as 1 | 2 | 3 | 4 | 5 }));
      }
    }
  }, [searchParams]);

  // Save progress to server
  const saveProgress = async (updates: {
    currentStep?: number;
    platformConnected?: ConnectedPlatform;
    calendarConnected?: boolean;
    draftGenerated?: boolean;
    emailPreference?: EmailPreference;
  }) => {
    try {
      await fetch('/api/onboarding/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
    } catch (error) {
      console.error('[ONBOARDING] Error saving progress:', error);
    }
  };

  // Track analytics event
  const trackEvent = async (eventType: string, stepNumber?: number, metadata?: Record<string, unknown>) => {
    try {
      await fetch('/api/onboarding/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventType, stepNumber, metadata }),
      });
    } catch (error) {
      console.error('[ONBOARDING] Error tracking event:', error);
    }
  };

  // Navigation handlers
  const goToStep = (step: OnboardingStep) => {
    setState(prev => ({ ...prev, currentStep: step }));
    saveProgress({ currentStep: step as number });
    trackEvent('step_viewed', step as number);
  };

  const nextStep = () => {
    const current = state.currentStep as number;
    if (current < 5) {
      goToStep((current + 1) as OnboardingStep);
    } else {
      goToStep('complete');
    }
  };

  const handlePlatformConnected = (platform: ConnectedPlatform) => {
    setState(prev => ({ ...prev, platformConnected: platform }));
    trackEvent('platform_connected', 2, { platform });

    // Meet OAuth already includes calendar.readonly scope, so skip calendar step
    if (platform === 'meet') {
      setState(prev => ({ ...prev, calendarConnected: true }));
      saveProgress({ platformConnected: platform, calendarConnected: true, currentStep: 4 });
      goToStep(4); // Skip to test draft step
    } else {
      saveProgress({ platformConnected: platform, currentStep: 3 });
      goToStep(3); // Go to calendar step for Zoom/Teams
    }
  };

  const handleCalendarConnected = () => {
    setState(prev => ({ ...prev, calendarConnected: true }));
    saveProgress({ calendarConnected: true, currentStep: 4 });
    trackEvent('calendar_connected', 3);
    goToStep(4);
  };

  const handleCalendarSkipped = () => {
    trackEvent('calendar_skipped', 3);
    goToStep(4);
  };

  const handleDraftGenerated = () => {
    setState(prev => ({ ...prev, draftGenerated: true }));
    saveProgress({ draftGenerated: true, currentStep: 5 });
    trackEvent('draft_generated', 4);
    goToStep(5);
  };

  const handlePreferenceSaved = async (preference: EmailPreference) => {
    setState(prev => ({ ...prev, emailPreference: preference }));
    await saveProgress({ emailPreference: preference });
    trackEvent('preferences_saved', 5, { preference });

    // Complete onboarding
    await fetch('/api/onboarding/complete', { method: 'POST' });
    trackEvent('onboarding_completed', 5);
    goToStep('complete');
  };

  const handleSkipPlatform = () => {
    trackEvent('platform_skipped', 2);
    goToStep(3);
  };

  const handleExit = () => {
    if (state.currentStep === 'complete' || state.currentStep >= 4) {
      router.push('/dashboard');
    } else {
      setShowExitModal(true);
    }
  };

  const confirmExit = () => {
    trackEvent('onboarding_abandoned', state.currentStep as number);
    router.push('/dashboard');
  };

  // Loading state
  if (state.isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto" />
          <p className="mt-4 text-gray-400">Loading your progress...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Header with progress and exit */}
      {state.currentStep !== 'complete' && (
        <header className="relative z-10 max-w-4xl mx-auto pt-8 px-4">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                ReplySequence
              </span>
            </div>
            <button
              onClick={handleExit}
              className="p-2 text-gray-500 hover:text-gray-300 transition-colors"
              aria-label="Exit onboarding"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <ProgressBar
            currentStep={state.currentStep as number}
            totalSteps={5}
          />
        </header>
      )}

      {/* Main content */}
      <main className="relative z-10 max-w-4xl mx-auto px-4 py-8">
        {state.isReturningUser && state.currentStep !== 'complete' && state.currentStep > 1 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg"
          >
            <p className="text-blue-400 text-sm">
              Welcome back! Let&apos;s continue where you left off.
            </p>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {state.currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <StepWelcome onNext={nextStep} />
            </motion.div>
          )}

          {state.currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <StepConnectPlatform
                connectedPlatform={state.platformConnected}
                onPlatformConnected={handlePlatformConnected}
                onSkip={handleSkipPlatform}
              />
            </motion.div>
          )}

          {state.currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <StepConnectCalendar
                calendarConnected={state.calendarConnected}
                onCalendarConnected={handleCalendarConnected}
                onSkip={handleCalendarSkipped}
              />
            </motion.div>
          )}

          {state.currentStep === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <StepTestDraft
                draftGenerated={state.draftGenerated}
                onDraftGenerated={handleDraftGenerated}
              />
            </motion.div>
          )}

          {state.currentStep === 5 && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <StepEmailPreferences
                preference={state.emailPreference}
                onSave={handlePreferenceSaved}
              />
            </motion.div>
          )}

          {state.currentStep === 'complete' && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <OnboardingComplete
                platformConnected={state.platformConnected}
                calendarConnected={state.calendarConnected}
                onGoToDashboard={() => router.push('/dashboard')}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Exit confirmation modal */}
      <AnimatePresence>
        {showExitModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowExitModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-md w-full"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-white mb-2">Are you sure?</h3>
              <p className="text-gray-400 mb-6">
                You&apos;re almost done! Your progress will be saved and you can continue later.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowExitModal(false)}
                  className="flex-1 py-2.5 px-4 rounded-lg bg-gray-800 text-white font-medium hover:bg-gray-700 transition-colors"
                >
                  Keep Going
                </button>
                <button
                  onClick={confirmExit}
                  className="flex-1 py-2.5 px-4 rounded-lg border border-gray-600 text-gray-300 font-medium hover:bg-gray-800 transition-colors"
                >
                  Exit Anyway
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function OnboardingLoadingFallback() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto" />
        <p className="mt-4 text-gray-400">Loading...</p>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<OnboardingLoadingFallback />}>
      <OnboardingContent />
    </Suspense>
  );
}
