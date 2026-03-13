'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Toast } from '@/components/ui/Toast';
import { Loader2 } from 'lucide-react';

interface OnboardingGateProps {
  children: React.ReactNode;
}

interface OnboardingStatus {
  completedAt: string | null;
  currentStep: number;
}

export function OnboardingGate({ children }: OnboardingGateProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState('Connected! Your dashboard is ready');
  const hasCheckedUrlParams = useRef(false);

  const checkOnboarding = useCallback(async () => {
    try {
      const res = await fetch('/api/onboarding/progress');
      if (res.ok) {
        const data: OnboardingStatus = await res.json();

        if (!data.completedAt) {
          // Onboarding not complete, redirect to onboarding
          router.push('/onboarding');
          return;
        }

        setOnboardingComplete(true);
      } else {
        // No record exists, redirect to onboarding
        router.push('/onboarding');
        return;
      }

      // Check for OAuth success params (only once after initial load)
      if (!hasCheckedUrlParams.current) {
        const zoomConnectedParam = searchParams.get('zoom_connected');
        const teamsConnectedParam = searchParams.get('teams_connected');
        const meetConnectedParam = searchParams.get('meet_connected');

        if (zoomConnectedParam === 'true') {
          setSuccessMessage('Zoom connected! You\'re ready to go.');
          setShowSuccessToast(true);
          window.history.replaceState({}, '', '/dashboard');
        } else if (teamsConnectedParam === 'true') {
          setSuccessMessage('Microsoft Teams connected! You\'re ready to go.');
          setShowSuccessToast(true);
          window.history.replaceState({}, '', '/dashboard');
        } else if (meetConnectedParam === 'true') {
          setSuccessMessage('Google Meet connected! You\'re ready to go.');
          setShowSuccessToast(true);
          window.history.replaceState({}, '', '/dashboard');
        }
        hasCheckedUrlParams.current = true;
      }
    } catch (error) {
      console.error('Failed to check onboarding status:', error);
      // On error, allow access to avoid blocking users
      setOnboardingComplete(true);
    } finally {
      setChecking(false);
    }
  }, [router, searchParams]);

  useEffect(() => {
    checkOnboarding();
  }, [checkOnboarding]);

  // Show loading state
  if (checking || onboardingComplete === null) {
    return (
      <div className="min-h-screen bg-[#060B18] flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-500/20 rounded-full" />
            <div className="absolute top-0 left-0 w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="mt-4 text-gray-400 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Onboarding complete: show the dashboard
  return (
    <>
      {children}
      {showSuccessToast && (
        <Toast
          message={successMessage}
          type="success"
          onClose={() => setShowSuccessToast(false)}
        />
      )}
    </>
  );
}
