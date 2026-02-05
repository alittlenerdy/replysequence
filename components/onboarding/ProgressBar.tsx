'use client';

import { Check } from 'lucide-react';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

export function ProgressBar({ currentStep, totalSteps }: ProgressBarProps) {
  const steps = [
    { number: 1, label: 'Welcome' },
    { number: 2, label: 'Platform' },
    { number: 3, label: 'Calendar' },
    { number: 4, label: 'Test Draft' },
    { number: 5, label: 'Preferences' },
  ];

  return (
    <div className="w-full">
      {/* Desktop progress bar */}
      <div className="hidden sm:flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-medium transition-all duration-300 ${
                  step.number < currentStep
                    ? 'bg-emerald-500 text-white'
                    : step.number === currentStep
                    ? 'bg-blue-500 text-white ring-4 ring-blue-500/20'
                    : 'bg-gray-800 text-gray-500'
                }`}
              >
                {step.number < currentStep ? (
                  <Check className="w-5 h-5" />
                ) : (
                  step.number
                )}
              </div>
              <span
                className={`mt-2 text-xs font-medium ${
                  step.number <= currentStep ? 'text-gray-300' : 'text-gray-600'
                }`}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-2 transition-all duration-300 ${
                  step.number < currentStep ? 'bg-emerald-500' : 'bg-gray-800'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Mobile progress bar */}
      <div className="sm:hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-400">
            Step {currentStep} of {totalSteps}
          </span>
          <span className="text-sm font-medium text-white">
            {steps[currentStep - 1]?.label}
          </span>
        </div>
        <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
