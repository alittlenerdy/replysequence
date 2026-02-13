'use client';

import { useEffect } from 'react';
// import dynamic from 'next/dynamic';
// import { OnboardingBanner } from './OnboardingBanner';
// import { ProcessingToast } from '@/components/processing/ProcessingToast';

// Temporarily disable all extra components to isolate hydration issue
// const DashboardMarginBubbles = dynamic(() => import('@/components/DashboardMarginBubbles'), { ssr: false });

interface DashboardLayoutClientProps {
  children: React.ReactNode;
  onboardingIncomplete?: boolean;
  onboardingStep?: number;
}

export function DashboardLayoutClient({
  children,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onboardingIncomplete = false,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  // Stripped down to bare minimum to debug hydration
  return (
    <>
      {/* <DashboardMarginBubbles /> */}
      {/* {onboardingIncomplete && <OnboardingBanner currentStep={onboardingStep} />} */}
      {children}
      {/* <ProcessingToast hideOnDashboard={true} /> */}
    </>
  );
}
