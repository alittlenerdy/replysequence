'use client';

import { useEffect } from 'react';
import { OnboardingBanner } from './OnboardingBanner';
import { ProcessingToast } from '@/components/processing/ProcessingToast';

interface DashboardLayoutClientProps {
  children: React.ReactNode;
  onboardingIncomplete?: boolean;
  onboardingStep?: number;
}

export function DashboardLayoutClient({
  children,
  onboardingIncomplete = false,
  onboardingStep = 1,
}: DashboardLayoutClientProps) {
  // Sync theme from localStorage on mount — use rs-theme key
  useEffect(() => {
    const theme = localStorage.getItem('rs-theme');
    const html = document.documentElement;

    if (theme === 'light') {
      html.classList.remove('dark');
      html.classList.add('light');
    } else {
      html.classList.add('dark');
      html.classList.remove('light');
    }

    // Clean up legacy key if it exists
    if (localStorage.getItem('theme')) {
      localStorage.removeItem('theme');
    }
  }, []);

  return (
    <>
      {onboardingIncomplete && <OnboardingBanner currentStep={onboardingStep} />}
      {children}
      <ProcessingToast hideOnDashboard={true} />
    </>
  );
}
