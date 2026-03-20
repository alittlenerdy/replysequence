'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Info, X } from 'lucide-react';

const DISMISS_KEY = 'rs-demo-banner-dismissed';

export function DemoDataBanner({ hasOnlyDemo }: { hasOnlyDemo: boolean }) {
  const [dismissed, setDismissed] = useState(true); // start hidden to avoid flash

  useEffect(() => {
    setDismissed(localStorage.getItem(DISMISS_KEY) === 'true');
  }, []);

  if (!hasOnlyDemo || dismissed) return null;

  return (
    <div className="mb-5 rounded-xl border border-[#06B6D4]/20 bg-[#06B6D4]/5 light:bg-cyan-50 light:border-cyan-200 px-4 py-3 flex items-center gap-3">
      <Info className="w-4 h-4 text-[#06B6D4] shrink-0" strokeWidth={1.5} />
      <p className="text-sm text-[#8892B0] light:text-gray-600 flex-1">
        You&apos;re viewing sample data. Connect your meeting platform to see real meetings.
      </p>
      <Link
        href="/dashboard/settings"
        className="shrink-0 text-xs font-medium px-3 py-1.5 rounded-lg bg-[#06B6D4]/15 text-[#06B6D4] hover:bg-[#06B6D4]/25 transition-colors"
      >
        Connect Platform
      </Link>
      <button
        onClick={() => {
          localStorage.setItem(DISMISS_KEY, 'true');
          setDismissed(true);
        }}
        className="shrink-0 p-1 rounded-md text-[#8892B0] hover:text-white light:hover:text-gray-900 hover:bg-white/5 light:hover:bg-gray-100 transition-colors"
        aria-label="Dismiss banner"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
