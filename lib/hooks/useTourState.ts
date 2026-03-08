'use client';

import { useState, useCallback, useMemo } from 'react';

const STORAGE_KEY = 'replysequence-draft-tour-completed';

export interface TourStep {
  id: string;
  /** data-tour attribute value to anchor the tooltip */
  target: string;
  title: string;
  message: string;
  placement: 'top' | 'bottom' | 'left' | 'right';
}

export const DRAFT_TOUR_STEPS: TourStep[] = [
  {
    id: 'draft-row',
    target: 'draft-row',
    title: 'Your first draft is ready',
    message:
      'ReplySequence analyzed your meeting transcript and wrote this email draft. Click to expand and see it.',
    placement: 'bottom',
  },
  {
    id: 'edit-draft',
    target: 'edit-draft',
    title: 'Edit directly',
    message:
      'Make manual changes to the subject or body. Use this for quick tweaks — fixing a name, adjusting a detail.',
    placement: 'bottom',
  },
  {
    id: 'refine-draft',
    target: 'refine-draft',
    title: 'Refine with AI',
    message:
      "Ask AI to improve the draft — make it more concise, add urgency, fix grammar, or give custom instructions. You'll see a before/after comparison.",
    placement: 'bottom',
  },
  {
    id: 'regenerate-draft',
    target: 'regenerate-draft',
    title: 'Start fresh with a template',
    message:
      'Generate a completely new draft using a different template. Templates like "Sales Follow-up" or "Discovery Call" change the entire structure and focus.',
    placement: 'bottom',
  },
  {
    id: 'send-section',
    target: 'send-section',
    title: 'Send when ready',
    message:
      'Choose your recipient, review the draft, and send. The email goes from your connected email account.',
    placement: 'top',
  },
];

export function useTourState() {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const totalSteps = DRAFT_TOUR_STEPS.length;

  const markCompleted = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch {
      // localStorage may be unavailable (SSR, private browsing quota, etc.)
    }
  }, []);

  const startTour = useCallback(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY)) {
        return; // Already completed — don't restart
      }
    } catch {
      // If localStorage is unavailable, allow the tour to run
    }
    setCurrentStep(0);
    setIsActive(true);
  }, []);

  const nextStep = useCallback(() => {
    setCurrentStep((prev) => {
      const next = prev + 1;
      if (next >= totalSteps) {
        // Tour finished
        markCompleted();
        setIsActive(false);
        return prev; // Keep step index at last step (won't matter since inactive)
      }
      return next;
    });
  }, [totalSteps, markCompleted]);

  const skipTour = useCallback(() => {
    markCompleted();
    setIsActive(false);
  }, [markCompleted]);

  const resetTour = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // localStorage may be unavailable
    }
    setCurrentStep(0);
    setIsActive(false);
  }, []);

  const step: TourStep | undefined = useMemo(
    () => (isActive ? DRAFT_TOUR_STEPS[currentStep] : undefined),
    [isActive, currentStep]
  );

  return {
    isActive,
    currentStep,
    totalSteps,
    step,
    startTour,
    nextStep,
    skipTour,
    resetTour,
  };
}
