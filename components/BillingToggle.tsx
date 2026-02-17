'use client';

import { useState } from 'react';

interface BillingToggleProps {
  onIntervalChange: (interval: 'monthly' | 'annual') => void;
  defaultInterval?: 'monthly' | 'annual';
}

export function BillingToggle({ onIntervalChange, defaultInterval = 'monthly' }: BillingToggleProps) {
  const [interval, setInterval] = useState<'monthly' | 'annual'>(defaultInterval);

  const handleToggle = (newInterval: 'monthly' | 'annual') => {
    setInterval(newInterval);
    onIntervalChange(newInterval);
  };

  return (
    <div className="flex items-center justify-center gap-3 mt-8">
      <button
        onClick={() => handleToggle('monthly')}
        className={`text-sm font-medium px-4 py-2 rounded-lg transition-all ${
          interval === 'monthly'
            ? 'bg-gray-800 light:bg-gray-200 text-white light:text-gray-900'
            : 'text-gray-400 light:text-gray-500 hover:text-gray-300 light:hover:text-gray-700'
        }`}
      >
        Monthly
      </button>
      <button
        onClick={() => handleToggle('annual')}
        className={`text-sm font-medium px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
          interval === 'annual'
            ? 'bg-gray-800 light:bg-gray-200 text-white light:text-gray-900'
            : 'text-gray-400 light:text-gray-500 hover:text-gray-300 light:hover:text-gray-700'
        }`}
      >
        Annual
        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold">
          Save 20%
        </span>
      </button>
    </div>
  );
}
