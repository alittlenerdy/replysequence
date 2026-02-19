'use client';

import { useState, useEffect } from 'react';
import { X, Sparkles, DollarSign } from 'lucide-react';
import Link from 'next/link';

type NudgeVariant = 'ai-settings' | 'hourly-rate';

interface NudgeBannerProps {
  variant: NudgeVariant;
}

const NUDGE_CONFIG = {
  'ai-settings': {
    icon: Sparkles,
    title: "Your AI isn't fully tuned yet",
    description: 'Set up your tone, custom instructions, and signature for better follow-ups.',
    cta: 'Go to AI Settings',
    href: '/dashboard/settings?tab=ai',
    storageKey: 'rs-nudge-ai-settings-dismissed',
    accentClass: 'text-indigo-400',
    bgClass: 'bg-indigo-500/5 border-indigo-500/20',
    iconBg: 'bg-indigo-500/10',
  },
  'hourly-rate': {
    icon: DollarSign,
    title: 'Set your hourly rate to see ROI',
    description: 'We use this to calculate how much time and money ReplySequence saves you.',
    cta: 'Set Rate',
    href: '/dashboard/settings?tab=ai',
    storageKey: 'rs-nudge-hourly-rate-dismissed',
    accentClass: 'text-amber-400',
    bgClass: 'bg-amber-500/5 border-amber-500/20',
    iconBg: 'bg-amber-500/10',
  },
} as const;

export function NudgeBanner({ variant }: NudgeBannerProps) {
  const config = NUDGE_CONFIG[variant];
  const [dismissed, setDismissed] = useState(true); // Start hidden to avoid flash

  useEffect(() => {
    const isDismissed = localStorage.getItem(config.storageKey) === '1';
    setDismissed(isDismissed);
  }, [config.storageKey]);

  function handleDismiss() {
    localStorage.setItem(config.storageKey, '1');
    setDismissed(true);
  }

  if (dismissed) return null;

  const Icon = config.icon;

  return (
    <div className={`relative flex items-center gap-3 px-4 py-3 rounded-xl border ${config.bgClass} mb-4`}>
      <div className={`w-8 h-8 rounded-lg ${config.iconBg} flex items-center justify-center shrink-0`}>
        <Icon className={`w-4 h-4 ${config.accentClass}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white light:text-gray-900">{config.title}</p>
        <p className="text-xs text-gray-400 light:text-gray-500">{config.description}</p>
      </div>
      <Link
        href={config.href}
        className={`shrink-0 px-3 py-1.5 text-xs font-medium ${config.accentClass} border border-current/20 rounded-lg hover:bg-white/5 transition-colors`}
      >
        {config.cta}
      </Link>
      <button
        onClick={handleDismiss}
        className="shrink-0 p-1 text-gray-500 hover:text-gray-300 transition-colors"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
