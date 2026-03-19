'use client';

import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Edit3, Layers, Clock, CheckCircle2, AlertTriangle, Loader2, ArrowRight, User, Calendar } from 'lucide-react';

/* ──────────────────────────────────────────────
   TYPES
   ────────────────────────────────────────────── */
interface ProcessingState {
  status: 'uploading' | 'transcribing' | 'analyzing' | 'generating_sequence';
  meetingName: string;
}

interface DraftData {
  id: string;
  subject: string;
  body: string;
  meetingTopic: string | null;
  generationMs: number | null;
  createdAt: Date | null;
}

interface SequenceData {
  meetingName: string;
  emails: Array<{
    step: number;
    subject: string;
    timing: string;
    purpose: 'recap' | 'value' | 'nudge';
  }>;
}

interface NextStepItem {
  task: string;
  owner: string;
  due: string;
  overdue: boolean;
}

interface PostCallSystemPanelProps {
  processing: ProcessingState | null;
  draft: DraftData | null;
  sequence: SequenceData | null;
  nextSteps: NextStepItem[];
  riskFlag?: string | null;
}

/* ──────────────────────────────────────────────
   PROCESSING STATE — animated steps
   ────────────────────────────────────────────── */
const processingSteps = [
  { key: 'uploading', label: 'Recording received' },
  { key: 'transcribing', label: 'Transcript generated' },
  { key: 'analyzing', label: 'Analyzing conversation' },
  { key: 'generating_sequence', label: 'Generating follow-up, sequence, and next steps' },
];

function ProcessingPanel({ status, meetingName }: ProcessingState) {
  const currentIndex = processingSteps.findIndex(s => s.key === status);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="rounded-2xl bg-[#0F172A] light:bg-white border border-[#06B6D4]/20 light:border-gray-200 p-6 md:p-8"
    >
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 rounded-lg bg-[#06B6D4]/10 flex items-center justify-center">
          <Loader2 className="w-4 h-4 text-[#06B6D4] animate-spin" />
        </div>
        <div>
          <h2 className="text-base font-bold text-white light:text-gray-900">Processing your call...</h2>
          <p className="text-xs text-[#8892B0] light:text-gray-500">We&apos;re turning {meetingName} into follow-up actions</p>
        </div>
      </div>

      <div className="space-y-2.5">
        {processingSteps.map((step, i) => {
          const isDone = i < currentIndex;
          const isCurrent = i === currentIndex;
          return (
            <div
              key={step.key}
              className="flex items-center gap-3"
            >
              {isDone ? (
                <CheckCircle2 className="w-4 h-4 text-[#06B6D4] flex-shrink-0" />
              ) : isCurrent ? (
                <div className="w-4 h-4 rounded-full border-2 border-[#06B6D4] border-t-transparent animate-spin flex-shrink-0" />
              ) : (
                <div className="w-4 h-4 rounded-full border border-[#1E2A4A] light:border-gray-300 flex-shrink-0" />
              )}
              <span className={`text-sm ${isDone ? 'text-[#06B6D4]' : isCurrent ? 'text-white light:text-gray-900 font-medium' : 'text-[#8892B0]/60 light:text-gray-400'}`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

/* ──────────────────────────────────────────────
   OUTPUT STATE — 3 CARDS with hierarchy
   ────────────────────────────────────────────── */
function OutputPanel({ draft, sequence, nextSteps, riskFlag }: {
  draft: DraftData | null;
  sequence: SequenceData | null;
  nextSteps: NextStepItem[];
  riskFlag?: string | null;
}) {
  const subject = draft?.subject || 'Great connecting — proposal and next steps';
  const bodyPreview = (draft?.body || 'Hi Sarah,\nGreat speaking with you today. I wanted to follow up on the key points we discussed and outline the next steps.').split('\n').filter(Boolean).slice(0, 3).join('\n');
  const draftId = draft?.id;
  const isDemo = !draft && !sequence;

  const seqSteps = sequence?.emails?.slice(0, 3) || [
    { step: 1, subject: 'Personalized follow-up', timing: 'Sent', purpose: 'recap' as const },
    { step: 2, subject: 'Value-add check-in', timing: '+3 days', purpose: 'value' as const },
    { step: 3, subject: 'Decision nudge', timing: '+7 days', purpose: 'nudge' as const },
  ];

  const steps = nextSteps.length > 0 ? nextSteps : [
    { task: 'Send pricing proposal', owner: 'Sarah', due: 'Mar 22', overdue: false },
    { task: 'Schedule technical review', owner: 'Mike', due: 'Mar 25', overdue: false },
    { task: 'Share case studies', owner: 'You', due: 'Mar 20', overdue: true },
  ];

  const stepColors: Record<string, string> = { recap: '#22C55E', value: '#6366F1', nudge: '#8892B0' };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="grid grid-cols-1 md:grid-cols-3 gap-4"
    >
      {/* A: Follow-Up Ready — slightly elevated */}
      <div className="rounded-2xl bg-[#0F172A] light:bg-white border border-[#06B6D4]/25 light:border-gray-200 p-5 flex flex-col hover:border-[#06B6D4]/40 transition-colors duration-200">
        <div className="flex items-center gap-2 mb-3">
          <Mail className="w-4 h-4 text-[#06B6D4]" />
          <span className="text-xs font-semibold text-[#06B6D4] uppercase tracking-wider">Follow-Up Ready</span>
        </div>

        <p className="text-base font-bold text-white light:text-gray-900 mb-1 line-clamp-2">{subject}</p>
        <div className="border-t border-[#1E2A4A] light:border-gray-100 my-2" />
        <p className="text-xs text-[#C0C8E0] light:text-gray-600 leading-[1.6] line-clamp-3 mb-3 flex-1">{bodyPreview}</p>

        <div className="flex items-center gap-2 mb-3">
          <span className="inline-flex items-center gap-1 text-[10px] text-[#06B6D4] font-medium px-2 py-0.5 rounded-full bg-[#06B6D4]/10 border border-[#06B6D4]/20">
            <Clock className="w-2.5 h-2.5" />
            Ready to send
          </span>
          {draft?.generationMs && (
            <span className="text-[10px] text-[#8892B0]/70 light:text-gray-400">
              {(draft.generationMs / 1000).toFixed(0)}s
            </span>
          )}
        </div>

        <div className="flex gap-2">
          <Link
            href={draftId ? `/dashboard/drafts?id=${draftId}` : '/dashboard/drafts'}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-bold text-black hover:scale-[1.02] transition-transform duration-150"
            style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)', boxShadow: '0 2px 12px rgba(245,158,11,0.25)' }}
          >
            Send
          </Link>
          <Link
            href={draftId ? `/dashboard/drafts?id=${draftId}&edit=true` : '/dashboard/drafts'}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-semibold text-[#C0C8E0] light:text-gray-600 border border-[#1E2A4A] light:border-gray-200 hover:border-white/20 light:hover:border-gray-300 transition-colors duration-150"
          >
            <Edit3 className="w-3 h-3" />
            Edit
          </Link>
        </div>
      </div>

      {/* B: Sequence Started */}
      <div className="rounded-2xl bg-[#0F172A] light:bg-white border border-[#1E2A4A] light:border-gray-200 p-5 flex flex-col hover:border-white/15 light:hover:border-gray-300 transition-colors duration-200">
        <div className="flex items-center gap-2 mb-3">
          <Layers className="w-4 h-4 text-[#6366F1]" />
          <span className="text-xs font-semibold text-[#6366F1] uppercase tracking-wider">Sequence Started</span>
        </div>

        <div className="space-y-2.5 mb-3 flex-1">
          {seqSteps.map((step) => (
            <div key={step.step} className="flex items-center gap-2.5">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold"
                style={{ backgroundColor: `${stepColors[step.purpose] || '#8892B0'}20`, color: stepColors[step.purpose] || '#8892B0' }}
              >
                {step.step}
              </div>
              <span className="text-xs text-[#C0C8E0] light:text-gray-600 flex-1 truncate">{step.subject}</span>
              <span className="text-[10px] font-medium" style={{ color: stepColors[step.purpose] || '#8892B0' }}>{step.timing}</span>
            </div>
          ))}
        </div>

        <Link
          href="/dashboard/sequences"
          className="text-xs font-medium text-[#6366F1] flex items-center gap-1 hover:gap-2 transition-[gap]"
        >
          View sequence <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* C: Next Steps Tracked */}
      <div className="rounded-2xl bg-[#0F172A] light:bg-white border border-[#1E2A4A] light:border-gray-200 p-5 flex flex-col hover:border-white/15 light:hover:border-gray-300 transition-colors duration-200">
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle2 className="w-4 h-4 text-[#06B6D4]" />
          <span className="text-xs font-semibold text-[#06B6D4] uppercase tracking-wider">Next Steps Tracked</span>
        </div>

        <div className="space-y-2 mb-3 flex-1">
          {steps.slice(0, 3).map((item) => (
            <div key={item.task} className="flex items-center gap-2 rounded-lg bg-[#0A1020] light:bg-gray-50 border border-[#1E2A4A] light:border-gray-200 px-3 py-2">
              <CheckCircle2 className={`w-3 h-3 flex-shrink-0 ${item.overdue ? 'text-[#F59E0B]' : 'text-[#06B6D4]'}`} />
              <span className="text-[11px] text-[#E8ECF4] light:text-gray-900 flex-1 truncate">{item.task}</span>
              <span className="text-[10px] text-[#8892B0] light:text-gray-500 flex items-center gap-1">
                <User className="w-2.5 h-2.5" />{item.owner}
              </span>
              <span className={`text-[10px] font-medium flex items-center gap-1 ${item.overdue ? 'text-[#F59E0B]' : 'text-[#8892B0]'}`}>
                <Calendar className="w-2.5 h-2.5" />{item.due}
              </span>
            </div>
          ))}
        </div>

        {riskFlag && (
          <div className="flex items-center gap-1.5 text-[10px] text-[#F59E0B] mb-2">
            <AlertTriangle className="w-3 h-3" />
            {riskFlag}
          </div>
        )}

        <Link
          href="/dashboard/meetings"
          className="text-xs font-medium text-[#06B6D4] flex items-center gap-1 hover:gap-2 transition-[gap]"
        >
          View all next steps <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {isDemo && (
        <p className="md:col-span-3 text-[10px] text-[#8892B0]/60 light:text-gray-400 text-center mt-1">
          Sample data — connect a meeting platform to see your real post-call outputs
        </p>
      )}
    </motion.div>
  );
}

/* ──────────────────────────────────────────────
   IDLE STATE — waiting for next meeting
   ────────────────────────────────────────────── */
const idleSteps = [
  { icon: '01', label: 'Recording received', color: '#06B6D4' },
  { icon: '02', label: 'Transcript generated', color: '#06B6D4' },
  { icon: '03', label: 'Follow-up drafted', color: '#F59E0B' },
  { icon: '04', label: 'Sequence prepared', color: '#6366F1' },
  { icon: '05', label: 'Next steps tracked', color: '#06B6D4' },
];

function IdlePanel() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="rounded-2xl bg-[#0F172A] light:bg-white border border-[#1E2A4A] light:border-gray-200 p-6 md:p-8"
    >
      <div className="flex items-start gap-4">
        {/* Left: copy */}
        <div className="flex-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#06B6D4]/10 border border-[#06B6D4]/20 mb-4">
            <div className="w-1.5 h-1.5 rounded-full bg-[#06B6D4]/60" />
            <span className="text-[10px] font-medium text-[#06B6D4]">Waiting for next meeting</span>
          </div>

          <h2 className="text-base font-bold text-white light:text-gray-900 mb-2">
            When your next meeting is captured, it will appear here.
          </h2>
          <p className="text-sm text-[#8892B0] light:text-gray-500 leading-relaxed max-w-md">
            ReplySequence will process the recording, generate your follow-up, start the sequence, and extract next steps — automatically.
          </p>
        </div>

        {/* Right: flow preview */}
        <div className="hidden md:flex flex-col gap-2 flex-shrink-0">
          {idleSteps.map((step, i) => (
            <div key={step.label} className="flex items-center gap-2.5">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold"
                style={{ backgroundColor: `${step.color}12`, color: `${step.color}80`, border: `1px solid ${step.color}20` }}
              >
                {step.icon}
              </div>
              <span className="text-[11px] text-[#8892B0]/70 light:text-gray-400">{step.label}</span>
              {i < idleSteps.length - 1 && (
                <span className="text-[#1E2A4A] light:text-gray-200 text-[10px] ml-auto">→</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

/* ──────────────────────────────────────────────
   MAIN EXPORT — persistent panel, 3 states
   Priority: Processing > Output > Idle
   ────────────────────────────────────────────── */
export function PostCallSystemPanel({ processing, draft, sequence, nextSteps, riskFlag }: PostCallSystemPanelProps) {
  const isProcessing = processing && ['uploading', 'transcribing', 'analyzing', 'generating_sequence'].includes(processing.status);
  const hasResults = !!draft || !!sequence || nextSteps.length > 0;

  // State priority: Processing > Output > Idle
  const state: 'processing' | 'output' | 'idle' = isProcessing ? 'processing' : hasResults ? 'output' : 'idle';
  const meetingName = processing?.meetingName || draft?.meetingTopic || 'your meeting';

  return (
    <div className="mb-4">
      <AnimatePresence mode="wait">
        {state === 'processing' && (
          <ProcessingPanel
            key="processing"
            status={processing!.status}
            meetingName={meetingName}
          />
        )}
        {state === 'output' && (
          <OutputPanel key="output" draft={draft} sequence={sequence} nextSteps={nextSteps} riskFlag={riskFlag} />
        )}
        {state === 'idle' && (
          <IdlePanel key="idle" />
        )}
      </AnimatePresence>
    </div>
  );
}
