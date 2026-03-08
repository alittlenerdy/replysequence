'use client';

import { useEffect, useRef, useCallback } from 'react';
import TourSpotlight from './TourSpotlight';
import { useTourState } from '@/lib/hooks/useTourState';

interface DraftTourProps {
  hasDrafts: boolean;
  expandedDraftId: string | null;
  onExpandFirstDraft: () => void;
}

export default function DraftTour({
  hasDrafts,
  expandedDraftId,
  onExpandFirstDraft,
}: DraftTourProps) {
  const {
    isActive,
    currentStep,
    totalSteps,
    step,
    startTour,
    nextStep,
    skipTour,
  } = useTourState();

  // Track whether we've already auto-triggered the tour this session
  const hasTriggered = useRef(false);

  // Auto-trigger: start tour when drafts first appear
  useEffect(() => {
    if (hasDrafts && !hasTriggered.current) {
      hasTriggered.current = true;
      startTour();
    }
  }, [hasDrafts, startTour]);

  // Custom next handler: expand the first draft before advancing past step 0
  const handleNext = useCallback(() => {
    if (currentStep === 0 && !expandedDraftId) {
      // Expand the draft row first, then advance after the animation settles
      onExpandFirstDraft();
      setTimeout(() => {
        nextStep();
      }, 400);
      return;
    }
    nextStep();
  }, [currentStep, expandedDraftId, onExpandFirstDraft, nextStep]);

  if (!isActive || !step) return null;

  return (
    <TourSpotlight
      step={step}
      currentStep={currentStep}
      totalSteps={totalSteps}
      onNext={handleNext}
      onSkip={skipTour}
    />
  );
}
