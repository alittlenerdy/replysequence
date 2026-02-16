'use client';

import { useEffect } from 'react';
import { OnboardingBanner } from './OnboardingBanner';
// import { ProcessingToast } from '@/components/processing/ProcessingToast';

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
  // Sync theme from localStorage on mount
  useEffect(() => {
    const theme = localStorage.getItem('theme');
    const html = document.documentElement;

    if (theme === 'light') {
      html.classList.remove('dark');
      html.classList.add('light');
    } else {
      // Default to dark
      html.classList.add('dark');
      html.classList.remove('light');
    }
  }, []);

  return (
    <>
      {onboardingIncomplete && <OnboardingBanner currentStep={onboardingStep} />}
      {children}
      {/* <ProcessingToast hideOnDashboard={true} /> */}
    </>
  );
}
