'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { StepWelcome } from '@/components/onboarding/StepWelcome';
import { StepConnectPlatform } from '@/components/onboarding/StepConnectPlatform';
import { StepEmailConnect } from '@/components/onboarding/StepEmailConnect';
import { AIWizard } from '@/components/onboarding/ai-wizard/AIWizard';
import { StepCRM } from '@/components/onboarding/StepCRM';
import { StepEmailPreferences } from '@/components/onboarding/StepEmailPreferences';
import { OnboardingComplete } from '@/components/onboarding/OnboardingComplete';
import { ProgressBar } from '@/components/onboarding/ProgressBar';
import { Celebration } from '@/components/onboarding/Celebration';
import Image from 'next/image';
import { X, Loader2 } from 'lucide-react';

export type OnboardingStep = 1 | 2 | 3 | 4 | 5 | 6 | 'complete';
export type ConnectedPlatform = 'zoom' | 'teams' | 'meet' | null;
export type EmailPreference = 'review' | 'auto_send';

export type ConnectedCRM = 'hubspot' | 'salesforce' | 'airtable' | 'sheets' | null;

export interface OnboardingState {
  currentStep: OnboardingStep;
  platformConnected: ConnectedPlatform;
  connectedPlatforms: string[];
  googleCalendarConnected: boolean;
  outlookCalendarConnected: boolean;
  emailConnected: boolean;
  connectedEmail: string | null;
  crmConnected: boolean;
  connectedCRM: ConnectedCRM;
  hubspotConnected: boolean;
  salesforceConnected: boolean;
  airtableConnected: boolean;
  sheetsConnected: boolean;
  emailPreference: EmailPreference;
  isLoading: boolean;
  isReturningUser: boolean;
  showCelebration: boolean;
  celebrationType: 'platform' | 'email' | 'crm' | null;
}

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [state, setState] = useState<OnboardingState>({
    currentStep: 1,
    platformConnected: null,
    connectedPlatforms: [],
    googleCalendarConnected: false,
    outlookCalendarConnected: false,
    emailConnected: false,
    connectedEmail: null,
    crmConnected: false,
    connectedCRM: null,
    hubspotConnected: false,
    salesforceConnected: false,
    airtableConnected: false,
    sheetsConnected: false,
    emailPreference: 'review',
    isLoading: true,
    isReturningUser: false,
    showCelebration: false,
    celebrationType: null,
  });

  const [showExitModal, setShowExitModal] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  // Load existing progress
  const loadProgress = useCallback(async () => {
    try {
      const res = await fetch('/api/onboarding/progress');
      if (res.ok) {
        const data = await res.json();
        const resetParam = searchParams.get('reset');
        if (data.completedAt && resetParam !== 'true') {
          // Already completed, redirect to dashboard
          router.push('/dashboard');
          return;
        }
        if (data.completedAt && resetParam === 'true') {
          // Reset onboarding - clear completion and restart
          await fetch('/api/onboarding/reset', { method: 'POST' });
          window.history.replaceState({}, '', '/onboarding');
        }
        setState(prev => ({
          ...prev,
          currentStep: data.currentStep || 1,
          platformConnected: data.platformConnected || null,
          connectedPlatforms: data.connectedPlatforms || [],
          googleCalendarConnected: data.googleCalendarConnected || false,
          outlookCalendarConnected: data.outlookCalendarConnected || false,
          emailConnected: data.emailConnected || false,
          connectedEmail: data.connectedEmail || null,
          crmConnected: data.crmConnected || false,
          hubspotConnected: data.hubspotConnected || false,
          salesforceConnected: data.salesforceConnected || false,
          airtableConnected: data.airtableConnected || false,
          sheetsConnected: data.sheetsConnected || false,
          connectedCRM: data.hubspotConnected ? 'hubspot' : data.salesforceConnected ? 'salesforce' : data.airtableConnected ? 'airtable' : data.sheetsConnected ? 'sheets' : null,
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
    const emailConnectedParam = searchParams.get('email_connected');
    const crmConnectedParam = searchParams.get('crm_connected');
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

    // Handle email OAuth callback
    if (emailConnectedParam === 'true') {
      setState(prev => ({
        ...prev,
        emailConnected: true,
        currentStep: 3, // Stay on email step to show connected status
      }));
      saveProgress({ emailConnected: true, currentStep: 3 });
      window.history.replaceState({}, '', '/onboarding');
    }

    // Handle email OAuth error
    const emailErrorParam = searchParams.get('email_error');
    if (emailErrorParam) {
      const errorMessages: Record<string, string> = {
        auth_failed: 'Authorization was denied or cancelled. Please try again.',
        token_exchange: 'Could not complete the connection. Please try again.',
        already_connected: 'This email is already connected to another account.',
        missing_scope: 'Required permissions were not granted. Please approve all requested access.',
      };
      setEmailError(errorMessages[emailErrorParam] || 'Connection failed. Please try again.');
      setState(prev => ({ ...prev, currentStep: 3 }));
      window.history.replaceState({}, '', '/onboarding');
    }

    // Handle CRM OAuth callback
    if (crmConnectedParam === 'true') {
      const crmType = (sessionStorage.getItem('onboarding_crm') || 'hubspot') as ConnectedCRM;
      setState(prev => ({
        ...prev,
        crmConnected: true,
        connectedCRM: crmType,
        hubspotConnected: crmType === 'hubspot' ? true : prev.hubspotConnected,
        salesforceConnected: crmType === 'salesforce' ? true : prev.salesforceConnected,
        airtableConnected: crmType === 'airtable' ? true : prev.airtableConnected,
        sheetsConnected: crmType === 'sheets' ? true : prev.sheetsConnected,
        currentStep: 5, // Stay on CRM step to show connected status
      }));
      saveProgress({ crmConnected: true, currentStep: 5 });
      window.history.replaceState({}, '', '/onboarding');
    }

    if (step) {
      const stepNum = parseInt(step, 10);
      if (stepNum >= 1 && stepNum <= 6) {
        setState(prev => ({ ...prev, currentStep: stepNum as 1 | 2 | 3 | 4 | 5 | 6 }));
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
    emailConnected?: boolean;
    crmConnected?: boolean;
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
    if (current < 6) {
      goToStep((current + 1) as OnboardingStep);
    } else {
      goToStep('complete');
    }
  };

  const handlePlatformConnected = (platform: ConnectedPlatform) => {
    setState(prev => ({
      ...prev,
      platformConnected: platform,
      connectedPlatforms: platform && !prev.connectedPlatforms.includes(platform)
        ? [...prev.connectedPlatforms, platform]
        : prev.connectedPlatforms,
    }));
    trackEvent('platform_connected', 2, { platform });

    // Show celebration
    setState(prev => ({ ...prev, showCelebration: true, celebrationType: 'platform' }));

    saveProgress({ platformConnected: platform, currentStep: 3 });
    // Delay transition to allow celebration to play
    setTimeout(() => goToStep(3), 1200);
  };

  const handleEmailConnected = () => {
    setState(prev => ({ ...prev, emailConnected: true }));
    saveProgress({ emailConnected: true, currentStep: 4 });
    trackEvent('email_connected', 3);

    setState(prev => ({ ...prev, showCelebration: true, celebrationType: 'email' }));
    setTimeout(() => goToStep(4), 1200);
  };

  const handleEmailSkipped = () => {
    trackEvent('email_skipped', 3);
    goToStep(4);
  };

  const handleAIVoiceSaved = () => {
    trackEvent('ai_voice_saved', 4);
    goToStep(5);
  };

  const handleCRMConnected = (crmType?: ConnectedCRM) => {
    const connectedType = crmType || (sessionStorage.getItem('onboarding_crm') as ConnectedCRM) || null;
    setState(prev => ({
      ...prev,
      crmConnected: true,
      connectedCRM: connectedType,
      hubspotConnected: connectedType === 'hubspot' ? true : prev.hubspotConnected,
      salesforceConnected: connectedType === 'salesforce' ? true : prev.salesforceConnected,
      airtableConnected: connectedType === 'airtable' ? true : prev.airtableConnected,
      sheetsConnected: connectedType === 'sheets' ? true : prev.sheetsConnected,
    }));
    saveProgress({ crmConnected: true, currentStep: 6 });
    trackEvent('crm_connected', 5, { crm: connectedType });

    setState(prev => ({ ...prev, showCelebration: true, celebrationType: 'crm' }));
    setTimeout(() => goToStep(6), 1200);
  };

  const handleCRMSkipped = () => {
    trackEvent('crm_skipped', 5);
    goToStep(6);
  };

  const handlePreferenceSaved = async (preference: EmailPreference) => {
    setState(prev => ({ ...prev, emailPreference: preference }));
    await saveProgress({ emailPreference: preference });
    trackEvent('preferences_saved', 6, { preference });

    // Complete onboarding
    await fetch('/api/onboarding/complete', { method: 'POST' });
    trackEvent('onboarding_completed', 6);
    goToStep('complete');
  };

  const handleSkipPlatform = () => {
    trackEvent('platform_skipped', 2);
    goToStep(3);
  };

  const handleExit = () => {
    if (state.currentStep === 'complete' || state.currentStep >= 5) {
      router.push('/dashboard');
    } else {
      setShowExitModal(true);
    }
  };

  const confirmExit = () => {
    trackEvent('onboarding_abandoned', state.currentStep as number);
    router.push('/dashboard');
  };

  const handleCelebrationComplete = () => {
    setState(prev => ({ ...prev, showCelebration: false, celebrationType: null }));
  };

  // Loading state
  if (state.isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mx-auto" />
          <p className="mt-4 text-gray-400">Loading your progress\u2026</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] relative overflow-hidden">
      {/* Celebration overlay */}
      <Celebration
        show={state.showCelebration}
        onComplete={handleCelebrationComplete}
        duration={1200}
        variant={state.celebrationType === 'email' ? 'full' : 'sparkle'}
      />

      {/* Header with progress and exit */}
      {state.currentStep !== 'complete' && (
        <header className="relative z-10 max-w-4xl mx-auto pt-8 px-4">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <Image src="/logo-new.png" alt="" width={28} height={28} className="rounded-sm" />
              <span className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-indigo-600 bg-clip-text text-transparent">
                ReplySequence
              </span>
            </div>
            <button
              onClick={handleExit}
              className="p-2 text-gray-500 hover:text-gray-300 transition-colors rounded outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
              aria-label="Exit onboarding"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <ProgressBar
            currentStep={state.currentStep as number}
            totalSteps={6}
          />
        </header>
      )}

      {/* Main content */}
      <main className="relative z-10 max-w-4xl mx-auto px-4 py-8">
        {state.isReturningUser && state.currentStep !== 'complete' && state.currentStep > 1 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-lg"
          >
            <p className="text-indigo-400 text-sm">
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
                connectedPlatforms={state.connectedPlatforms}
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
              <StepEmailConnect
                emailConnected={state.emailConnected}
                connectedEmail={state.connectedEmail}
                onEmailConnected={handleEmailConnected}
                onSkip={handleEmailSkipped}
                error={emailError}
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
              <AIWizard onSaved={handleAIVoiceSaved} />
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
              <StepCRM
                crmConnected={state.crmConnected}
                hubspotConnected={state.hubspotConnected}
                salesforceConnected={state.salesforceConnected}
                airtableConnected={state.airtableConnected}
                sheetsConnected={state.sheetsConnected}
                onCRMConnected={handleCRMConnected}
                onSkip={handleCRMSkipped}
              />
            </motion.div>
          )}

          {state.currentStep === 6 && (
            <motion.div
              key="step6"
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
                calendarConnected={state.googleCalendarConnected || state.outlookCalendarConnected}
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
              className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-md w-full overscroll-contain"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-white mb-2">Are you sure?</h3>
              <p className="text-gray-400 mb-6">
                You&apos;re almost done! Your progress will be saved and you can continue later.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowExitModal(false)}
                  className="flex-1 py-2.5 px-4 rounded-lg bg-gray-800 text-white font-medium hover:bg-gray-700 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
                >
                  Keep Going
                </button>
                <button
                  onClick={confirmExit}
                  className="flex-1 py-2.5 px-4 rounded-lg border border-gray-600 text-gray-300 font-medium hover:bg-gray-800 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
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
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mx-auto" />
        <p className="mt-4 text-gray-400">Loading\u2026</p>
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
