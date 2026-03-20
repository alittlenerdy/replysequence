'use client';

import { Sparkles, Pencil, Database, Mic } from 'lucide-react';

export type SourceType = 'ai' | 'manual' | 'crm' | 'transcript';

interface SourceBadgeProps {
  source: SourceType;
  compact?: boolean;
}

const sourceConfig: Record<SourceType, { label: string; icon: typeof Sparkles; className: string }> = {
  ai: {
    label: 'AI',
    icon: Sparkles,
    className:
      'bg-cyan-500/10 text-cyan-400 border-cyan-500/25 light:bg-cyan-50 light:text-cyan-700 light:border-cyan-200',
  },
  manual: {
    label: 'Manual',
    icon: Pencil,
    className:
      'bg-amber-500/10 text-amber-400 border-amber-500/25 light:bg-amber-50 light:text-amber-700 light:border-amber-200',
  },
  crm: {
    label: 'CRM',
    icon: Database,
    className:
      'bg-emerald-500/10 text-emerald-400 border-emerald-500/25 light:bg-emerald-50 light:text-emerald-700 light:border-emerald-200',
  },
  transcript: {
    label: 'Transcript',
    icon: Mic,
    className:
      'bg-purple-500/10 text-purple-400 border-purple-500/25 light:bg-purple-50 light:text-purple-700 light:border-purple-200',
  },
};

/**
 * Maps known data source values to SourceBadge source types.
 *
 * NextStepSource ('explicit' | 'predicted') and MapStepSource
 * ('commitment' | 'next_step' | 'risk_mitigation' | 'recommended')
 * are converted to the badge's visual categories.
 */
export function mapToSourceType(raw: string | null | undefined): SourceType {
  if (!raw) return 'ai';
  switch (raw) {
    case 'predicted':
    case 'recommended':
      return 'ai';
    case 'explicit':
    case 'commitment':
    case 'next_step':
    case 'risk_mitigation':
      return 'transcript';
    case 'manual':
      return 'manual';
    case 'crm':
      return 'crm';
    default:
      return 'ai';
  }
}

export function SourceBadge({ source, compact = false }: SourceBadgeProps) {
  const config = sourceConfig[source];
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border font-medium ${config.className} ${
        compact ? 'px-1.5 py-0 text-[10px]' : 'px-2 py-0.5 text-[10px]'
      }`}
      title={`Source: ${config.label}`}
    >
      <Icon className={compact ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
      {!compact && config.label}
    </span>
  );
}
