'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { X } from 'lucide-react';
import type { TourStep } from '@/lib/hooks/useTourState';

interface TourSpotlightProps {
  step: TourStep;
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onSkip: () => void;
}

interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const PADDING = 8;
const TOOLTIP_GAP = 12;

/**
 * Builds a CSS clip-path polygon that covers the full viewport with a
 * rectangular cutout around the target element.
 */
function buildClipPath(rect: TargetRect): string {
  const top = rect.top - PADDING;
  const left = rect.left - PADDING;
  const right = rect.left + rect.width + PADDING;
  const bottom = rect.top + rect.height + PADDING;

  // Polygon traces the outer viewport border, then cuts inward around the target
  return `polygon(
    0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%,
    ${left}px ${top}px,
    ${left}px ${bottom}px,
    ${right}px ${bottom}px,
    ${right}px ${top}px,
    ${left}px ${top}px
  )`;
}

export default function TourSpotlight({
  step,
  currentStep,
  totalSteps,
  onNext,
  onSkip,
}: TourSpotlightProps) {
  const [rect, setRect] = useState<TargetRect | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const measure = useCallback(() => {
    const el = document.querySelector(`[data-tour="${step.target}"]`);
    if (!el) {
      setRect(null);
      return;
    }
    const r = el.getBoundingClientRect();
    setRect({
      top: r.top,
      left: r.left,
      width: r.width,
      height: r.height,
    });
  }, [step.target]);

  // Scroll target into view, then continuously measure until layout settles.
  // A single delayed measurement is unreliable because the inline panel has a
  // 250ms expand animation and scrollIntoView('smooth') can take 300-500ms,
  // both of which shift button positions after the initial read.
  useEffect(() => {
    const el = document.querySelector(`[data-tour="${step.target}"]`);
    if (!el) {
      setRect(null);
      return;
    }

    el.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Measure every frame for 1 second to catch scroll + animation settling
    let frame: number;
    const start = Date.now();
    const SETTLE_MS = 1000;

    const loop = () => {
      measure();
      if (Date.now() - start < SETTLE_MS) {
        frame = requestAnimationFrame(loop);
      }
    };
    frame = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(frame);
  }, [step.target, measure]);

  // Re-measure on scroll and resize
  useEffect(() => {
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [measure]);

  // If target element not found, render nothing
  if (!rect) return null;

  const isLastStep = currentStep === totalSteps - 1;

  // ------- Tooltip positioning -------
  const tooltipStyle: React.CSSProperties = { position: 'absolute' };

  switch (step.placement) {
    case 'bottom':
      tooltipStyle.top = rect.top + rect.height + PADDING + TOOLTIP_GAP;
      tooltipStyle.left = Math.max(
        16,
        Math.min(
          rect.left + rect.width / 2 - 160, // 160 = half of w-80 (320px)
          window.innerWidth - 320 - 16
        )
      );
      break;

    case 'top':
      tooltipStyle.bottom =
        window.innerHeight - rect.top + PADDING + TOOLTIP_GAP;
      tooltipStyle.left = Math.max(
        16,
        Math.min(
          rect.left + rect.width / 2 - 160,
          window.innerWidth - 320 - 16
        )
      );
      break;

    case 'right':
      tooltipStyle.top = rect.top + rect.height / 2 - 80;
      tooltipStyle.left = rect.left + rect.width + PADDING + TOOLTIP_GAP;
      break;

    case 'left':
      tooltipStyle.top = rect.top + rect.height / 2 - 80;
      tooltipStyle.right =
        window.innerWidth - rect.left + PADDING + TOOLTIP_GAP;
      break;
  }

  return (
    <div className="fixed inset-0 z-[9999]">
      {/* Dark backdrop with cutout */}
      <div
        className="absolute inset-0 bg-black/60 transition-all duration-300"
        style={{ clipPath: buildClipPath(rect) }}
        onClick={onSkip}
      />

      {/* Spotlight border glow around target */}
      <div
        className="absolute rounded-xl border border-indigo-400/40 shadow-[0_0_20px_rgba(99,102,241,0.2)] pointer-events-none transition-all duration-300"
        style={{
          top: rect.top - PADDING,
          left: rect.left - PADDING,
          width: rect.width + PADDING * 2,
          height: rect.height + PADDING * 2,
        }}
      />

      {/* Glassmorphism tooltip */}
      <div
        ref={tooltipRef}
        className="w-80 bg-gray-900/80 light:bg-white/80 backdrop-blur-lg border border-white/[0.15] light:border-gray-300/40 rounded-2xl shadow-2xl p-5 transition-all duration-300"
        style={tooltipStyle}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onSkip}
          className="absolute top-3 right-3 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg p-1 transition-colors"
          aria-label="Close tour"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Title */}
        <h3 className="text-base font-semibold text-white light:text-gray-900 mb-2 pr-6">
          {step.title}
        </h3>

        {/* Message */}
        <p className="text-sm text-gray-300 light:text-gray-600 leading-relaxed mb-4">
          {step.message}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between">
          {/* Step dots */}
          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalSteps }, (_, i) => (
              <span
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  i === currentStep
                    ? 'bg-indigo-400'
                    : i < currentStep
                      ? 'bg-indigo-400/40'
                      : 'bg-gray-600'
                }`}
              />
            ))}
          </div>

          {/* Navigation buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={onSkip}
              className="text-xs text-gray-400 hover:text-gray-200 transition-colors"
            >
              Skip
            </button>
            <button
              onClick={onNext}
              className="px-4 py-1.5 text-sm font-medium rounded-lg bg-indigo-500 text-white hover:bg-indigo-400 transition-colors"
            >
              {isLastStep ? 'Done' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
