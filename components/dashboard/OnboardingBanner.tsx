'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { X, ArrowRight, Sparkles } from 'lucide-react';

interface OnboardingBannerProps {
  currentStep: number;
}

const BANNER_DISMISSED_KEY = 'onboarding_banner_dismissed';

export function OnboardingBanner({ currentStep }: OnboardingBannerProps) {
  const [isDismissed, setIsDismissed] = useState(true); // Start hidden to avoid flash

  useEffect(() => {
    // Check sessionStorage on mount
    const dismissed = sessionStorage.getItem(BANNER_DISMISSED_KEY);
    setIsDismissed(dismissed === 'true');
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem(BANNER_DISMISSED_KEY, 'true');
  };

  if (isDismissed) {
    return null;
  }

  // Determine step message based on current progress
  const getStepMessage = () => {
    switch (currentStep) {
      case 1:
        return 'Connect your meeting platform';
      case 2:
        return 'See how drafts are generated';
      case 3:
        return 'Set your email preferences';
      case 4:
        return 'Finish your setup';
      default:
        return 'Complete your setup';
    }
  };

  return (
    <div className="relative bg-gradient-to-r from-indigo-600/90 to-indigo-800/90 dark:from-indigo-600/80 dark:to-indigo-800/80">
      <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center flex-1 min-w-0">
            <span className="flex p-2 rounded-lg bg-white/20">
              <Sparkles className="h-5 w-5 text-white" />
            </span>
            <p className="ml-3 font-medium text-white truncate">
              <span className="hidden sm:inline">
                Complete your setup to unlock all features.{' '}
                <span className="text-white/80">Next: {getStepMessage()}</span>
              </span>
              <span className="sm:hidden">
                Complete setup to unlock features
              </span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/onboarding"
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-white font-medium text-sm transition-colors"
            >
              Continue Setup
              <ArrowRight className="h-4 w-4" />
            </Link>
            <button
              onClick={handleDismiss}
              className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
              aria-label="Dismiss banner"
            >
              <X className="h-5 w-5 text-white/80 hover:text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
