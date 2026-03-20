'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  CheckCircle2,
  Target,
  Monitor,
  FileText,
  Scale,
  Handshake,
  Trophy,
  XCircle,
  ChevronDown,
  Sparkles,
  Loader2,
} from 'lucide-react';

type DealStage =
  | 'discovery'
  | 'qualification'
  | 'demo'
  | 'proposal'
  | 'negotiation'
  | 'verbal_commit'
  | 'closed_won'
  | 'closed_lost';

const STAGES: { key: DealStage; label: string; icon: typeof Search }[] = [
  { key: 'discovery', label: 'Discovery', icon: Search },
  { key: 'qualification', label: 'Qualification', icon: CheckCircle2 },
  { key: 'demo', label: 'Demo', icon: Monitor },
  { key: 'proposal', label: 'Proposal', icon: FileText },
  { key: 'negotiation', label: 'Negotiation', icon: Scale },
  { key: 'verbal_commit', label: 'Verbal Commit', icon: Handshake },
  { key: 'closed_won', label: 'Won', icon: Trophy },
  { key: 'closed_lost', label: 'Lost', icon: XCircle },
];

function stageIndex(stage: DealStage): number {
  return STAGES.findIndex((s) => s.key === stage);
}

function confidenceColor(confidence: number): string {
  if (confidence >= 0.8) return '#4DFFA3';
  if (confidence >= 0.6) return '#FFD75F';
  return '#FF9F5D';
}

interface PipelineStageIndicatorProps {
  meetingId: string;
  /** Pre-loaded stage from deal context (avoids extra fetch) */
  initialStage?: DealStage | null;
  /** Compact mode for sidebar placement */
  compact?: boolean;
}

export function PipelineStageIndicator({
  meetingId,
  initialStage = null,
  compact = false,
}: PipelineStageIndicatorProps) {
  const [stage, setStage] = useState<DealStage | null>(initialStage);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [signals, setSignals] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showSignals, setShowSignals] = useState(false);
  const [source, setSource] = useState<'ai' | 'manual' | null>(null);

  const runDetection = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/meetings/${meetingId}/pipeline-stage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        const data = await res.json();
        setStage(data.stage);
        setConfidence(data.confidence);
        setSignals(data.signals || []);
        setSource('ai');
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [meetingId]);

  const setManualStage = useCallback(async (newStage: DealStage) => {
    setShowDropdown(false);
    setLoading(true);
    try {
      const res = await fetch(`/api/meetings/${meetingId}/pipeline-stage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ manualStage: newStage }),
      });
      if (res.ok) {
        const data = await res.json();
        setStage(data.stage);
        setConfidence(1.0);
        setSignals(data.signals || []);
        setSource('manual');
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [meetingId]);

  const currentIdx = stage ? stageIndex(stage) : -1;
  // closed_lost is not part of the linear progression — handle separately
  const isLost = stage === 'closed_lost';
  const linearStages = STAGES.filter((s) => s.key !== 'closed_lost');

  return (
    <div className={`rounded-xl border ${compact ? 'p-3' : 'p-4'} bg-gray-900/50 border-gray-700/50 light:bg-white light:border-gray-200`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-[#6366F1]" strokeWidth={1.5} />
          <span className={`font-semibold text-white light:text-gray-900 ${compact ? 'text-xs' : 'text-sm'}`}>
            Pipeline Stage
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {confidence !== null && stage && (
            <span
              className="text-[10px] font-medium px-1.5 py-0.5 rounded-full border"
              style={{
                color: confidenceColor(confidence),
                backgroundColor: `${confidenceColor(confidence)}15`,
                borderColor: `${confidenceColor(confidence)}30`,
              }}
            >
              {Math.round(confidence * 100)}%
            </span>
          )}
          <button
            onClick={runDetection}
            disabled={loading}
            className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium rounded-lg bg-[#6366F1]/10 text-[#818CF8] hover:bg-[#6366F1]/20 transition-colors disabled:opacity-50"
            title="Auto-detect stage from transcript"
          >
            {loading ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Sparkles className="w-3 h-3" />
            )}
            {compact ? '' : 'Detect'}
          </button>
        </div>
      </div>

      {/* Stage progression dots */}
      <div className="relative flex items-center gap-0">
        {linearStages.map((s, idx) => {
          const isActive = s.key === stage;
          const isPast = !isLost && currentIdx >= 0 && idx < currentIdx;
          const isFuture = !isActive && !isPast;
          const Icon = s.icon;

          return (
            <div key={s.key} className="flex items-center flex-1 min-w-0">
              {/* Connector line */}
              {idx > 0 && (
                <div
                  className={`h-0.5 flex-1 min-w-1 transition-colors duration-300 ${
                    isPast || isActive
                      ? isLost ? 'bg-red-500/40' : 'bg-[#6366F1]/60'
                      : 'bg-gray-700/50 light:bg-gray-200'
                  }`}
                />
              )}

              {/* Stage dot */}
              <div className="relative group">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="relative flex items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1]/70 rounded-full"
                  title={s.label}
                >
                  <motion.div
                    className={`flex items-center justify-center rounded-full transition-all duration-300 ${
                      compact ? 'w-6 h-6' : 'w-7 h-7'
                    } ${
                      isActive
                        ? isLost
                          ? 'bg-red-500/20 border-2 border-red-500 text-red-400'
                          : 'bg-[#6366F1]/20 border-2 border-[#6366F1] text-[#6366F1]'
                        : isPast
                        ? 'bg-[#6366F1]/10 border border-[#6366F1]/40 text-[#6366F1]/70'
                        : 'bg-gray-800/50 border border-gray-700/50 text-gray-600 light:bg-gray-100 light:border-gray-200 light:text-gray-400'
                    }`}
                    animate={isActive ? { scale: [1, 1.1, 1] } : {}}
                    transition={{ duration: 0.4 }}
                  >
                    <Icon className={compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} strokeWidth={isActive ? 2 : 1.5} />
                  </motion.div>
                </button>

                {/* Tooltip on hover */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <div className="px-2 py-1 rounded bg-gray-800 light:bg-gray-900 text-[10px] text-white whitespace-nowrap shadow-lg">
                    {s.label}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Current stage label */}
      {stage && (
        <div className="mt-2.5 flex items-center justify-between">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-1.5 text-xs text-gray-300 light:text-gray-600 hover:text-white light:hover:text-gray-900 transition-colors"
          >
            <span className="capitalize font-medium">
              {stage.replace(/_/g, ' ')}
            </span>
            <ChevronDown className={`w-3 h-3 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
          </button>
          {source === 'ai' && (
            <span className="text-[10px] text-gray-600 light:text-gray-400">AI-detected</span>
          )}
          {source === 'manual' && (
            <span className="text-[10px] text-gray-600 light:text-gray-400">Manual</span>
          )}
        </div>
      )}

      {/* Override dropdown */}
      {showDropdown && (
        <motion.div
          className="mt-2 rounded-lg border border-gray-700/50 light:border-gray-200 bg-gray-800/90 light:bg-white overflow-hidden shadow-lg"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
        >
          {STAGES.map((s) => {
            const Icon = s.icon;
            const isActive = s.key === stage;
            return (
              <button
                key={s.key}
                onClick={() => setManualStage(s.key)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors ${
                  isActive
                    ? 'bg-[#6366F1]/15 text-[#818CF8]'
                    : 'text-gray-400 light:text-gray-600 hover:bg-gray-700/50 light:hover:bg-gray-50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="capitalize">{s.label}</span>
                {isActive && <span className="ml-auto text-[10px] text-[#6366F1]">current</span>}
              </button>
            );
          })}
        </motion.div>
      )}

      {/* Signals section */}
      {signals.length > 0 && !showDropdown && (
        <div className="mt-2">
          <button
            onClick={() => setShowSignals(!showSignals)}
            className="text-[10px] text-gray-500 hover:text-gray-400 transition-colors"
          >
            {showSignals ? 'Hide' : 'Show'} {signals.length} signal{signals.length !== 1 ? 's' : ''}
          </button>
          {showSignals && (
            <motion.ul
              className="mt-1.5 space-y-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {signals.map((signal, i) => (
                <li
                  key={i}
                  className="text-[11px] text-gray-400 light:text-gray-500 pl-2 border-l-2 border-[#6366F1]/30"
                >
                  {signal}
                </li>
              ))}
            </motion.ul>
          )}
        </div>
      )}

      {/* Empty state */}
      {!stage && !loading && (
        <p className="mt-2 text-[11px] text-gray-500 light:text-gray-400">
          Click Detect to auto-classify this deal&apos;s pipeline stage from the transcript.
        </p>
      )}
    </div>
  );
}
