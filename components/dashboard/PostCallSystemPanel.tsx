'use client';

import Link from 'next/link';
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
   PROCESSING STATE
   ────────────────────────────────────────────── */
const processingSteps = [
  { key: 'uploading', label: 'Recording received' },
  { key: 'transcribing', label: 'Transcript imported' },
  { key: 'analyzing', label: 'Analyzing conversation' },
  { key: 'generating_sequence', label: 'Generating follow-up + sequence + next steps' },
];

function ProcessingPanel({ status, meetingName }: ProcessingState) {
  const currentIndex = processingSteps.findIndex(s => s.key === status);

  return (
    <div className="rounded-2xl bg-[#0F172A] light:bg-white border border-[#06B6D4]/20 light:border-gray-200 p-8 shadow-lg shadow-[#06B6D4]/5 light:shadow-gray-200/50">
      <div className="flex items-center gap-3 mb-6">
        <Loader2 className="w-5 h-5 text-[#06B6D4] animate-spin" />
        <div>
          <h2 className="text-lg font-bold text-white light:text-gray-900">Processing your call...</h2>
          <p className="text-sm text-[#8892B0] light:text-gray-500">{meetingName}</p>
        </div>
      </div>

      <div className="space-y-3">
        {processingSteps.map((step, i) => {
          const isDone = i < currentIndex;
          const isCurrent = i === currentIndex;
          return (
            <div key={step.key} className="flex items-center gap-3">
              {isDone ? (
                <CheckCircle2 className="w-4 h-4 text-[#06B6D4] flex-shrink-0" />
              ) : isCurrent ? (
                <Loader2 className="w-4 h-4 text-[#06B6D4] animate-spin flex-shrink-0" />
              ) : (
                <div className="w-4 h-4 rounded-full border border-[#1E2A4A] light:border-gray-300 flex-shrink-0" />
              )}
              <span className={`text-sm ${isDone ? 'text-[#06B6D4]' : isCurrent ? 'text-white light:text-gray-900 font-medium' : 'text-[#8892B0] light:text-gray-400'}`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-[#8892B0] light:text-gray-500 mt-6">
        We&apos;re turning your meeting into follow-up actions. This usually takes under 30 seconds.
      </p>
    </div>
  );
}

/* ──────────────────────────────────────────────
   OUTPUT STATE — 3 EQUAL CARDS
   ────────────────────────────────────────────── */
function OutputPanel({ draft, sequence, nextSteps, riskFlag }: {
  draft: DraftData | null;
  sequence: SequenceData | null;
  nextSteps: NextStepItem[];
  riskFlag?: string | null;
}) {
  // Fallback demo content
  const subject = draft?.subject || 'Great connecting — proposal and next steps';
  const bodyPreview = (draft?.body || 'Hi Sarah,\nGreat speaking with you today. I wanted to follow up on the key points we discussed...').split('\n').filter(Boolean).slice(0, 3).join('\n');
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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* A: Follow-Up Ready */}
      <div className="rounded-2xl bg-[#0F172A] light:bg-white border border-[#1E2A4A] light:border-gray-200 p-5 flex flex-col">
        <div className="flex items-center gap-2 mb-3">
          <Mail className="w-4 h-4 text-[#06B6D4]" />
          <span className="text-xs font-semibold text-[#06B6D4] uppercase tracking-wider">Follow-Up Ready</span>
        </div>

        <p className="text-sm font-bold text-white light:text-gray-900 mb-2 line-clamp-1">{subject}</p>
        <p className="text-xs text-[#C0C8E0] light:text-gray-600 leading-relaxed line-clamp-3 mb-3 flex-1">{bodyPreview}</p>

        <p className="text-[10px] text-[#8892B0] light:text-gray-500 mb-3 flex items-center gap-1">
          <Clock className="w-3 h-3 text-[#06B6D4]" />
          Ready to send {draft?.generationMs ? `· ${(draft.generationMs / 1000).toFixed(0)}s` : ''}
        </p>

        <div className="flex gap-2">
          <Link
            href={draftId ? `/dashboard/drafts?id=${draftId}` : '/dashboard/drafts'}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-bold text-black"
            style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)' }}
          >
            Send
          </Link>
          <Link
            href={draftId ? `/dashboard/drafts?id=${draftId}&edit=true` : '/dashboard/drafts'}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-semibold text-[#C0C8E0] light:text-gray-600 border border-[#1E2A4A] light:border-gray-200 hover:border-white/20 light:hover:border-gray-300 transition-colors"
          >
            <Edit3 className="w-3 h-3" />
            Edit
          </Link>
        </div>
      </div>

      {/* B: Sequence Started */}
      <div className="rounded-2xl bg-[#0F172A] light:bg-white border border-[#1E2A4A] light:border-gray-200 p-5 flex flex-col">
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
      <div className="rounded-2xl bg-[#0F172A] light:bg-white border border-[#1E2A4A] light:border-gray-200 p-5 flex flex-col">
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
    </div>
  );
}

/* ──────────────────────────────────────────────
   MAIN EXPORT
   ────────────────────────────────────────────── */
export function PostCallSystemPanel({ processing, draft, sequence, nextSteps, riskFlag }: PostCallSystemPanelProps) {
  const isProcessing = processing && ['uploading', 'transcribing', 'analyzing', 'generating_sequence'].includes(processing.status);

  return (
    <div className="mb-6">
      {isProcessing ? (
        <ProcessingPanel status={processing!.status} meetingName={processing!.meetingName} />
      ) : (
        <OutputPanel draft={draft} sequence={sequence} nextSteps={nextSteps} riskFlag={riskFlag} />
      )}
    </div>
  );
}
