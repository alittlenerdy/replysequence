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
    <div className="flex items-center justify-center mt-8">
      <div className="inline-flex items-center rounded-full bg-gray-900 light:bg-gray-100 border border-gray-800 light:border-gray-200 p-1">
        <button
          onClick={() => handleToggle('monthly')}
          className={`relative text-sm font-medium px-5 py-2 rounded-full transition-[color,background-color,box-shadow] duration-200 outline-none focus-visible:ring-2 focus-visible:ring-[#5B6CFF]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060B18] ${
            interval === 'monthly'
              ? 'bg-[#4A5BEE] text-white shadow-md shadow-[#5B6CFF]/25'
              : 'text-gray-400 light:text-gray-500 hover:text-gray-200 light:hover:text-gray-700'
          }`}
        >
          Monthly
        </button>
        <button
          onClick={() => handleToggle('annual')}
          className={`relative text-sm font-medium px-5 py-2 rounded-full transition-[color,background-color,box-shadow] duration-200 flex items-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-amber-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060B18] ${
            interval === 'annual'
              ? 'bg-amber-500 text-gray-900 shadow-md shadow-amber-500/25 font-semibold'
              : 'text-gray-400 light:text-gray-500 hover:text-gray-200 light:hover:text-gray-700'
          }`}
        >
          Annual
          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 light:bg-emerald-100 light:text-emerald-700 font-semibold whitespace-nowrap">
            Save 20%
          </span>
        </button>
      </div>
    </div>
  );
}
