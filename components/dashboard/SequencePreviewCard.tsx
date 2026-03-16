'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ChevronDown, ChevronUp, Edit3, Copy, Send, Layers } from 'lucide-react';

type EmailPurpose = 'recap' | 'value' | 'nudge';

interface SequenceEmail {
  step: number;
  subject: string;
  preview: string;
  body: string;
  timing: string;
  purpose: EmailPurpose;
}

interface SequencePreviewCardProps {
  meetingName?: string;
  emails?: SequenceEmail[];
  onEdit?: (step: number) => void;
  onCopy?: (step: number) => void;
  onSend?: (step: number) => void;
}

const purposeConfig: Record<EmailPurpose, { label: string; color: string; bg: string }> = {
  recap: { label: 'Recap', color: '#5B6CFF', bg: 'rgba(91, 108, 255, 0.10)' },
  value: { label: 'Value Reinforcement', color: '#7A5CFF', bg: 'rgba(122, 92, 255, 0.10)' },
  nudge: { label: 'Follow-Up Nudge', color: '#FFD75F', bg: 'rgba(255, 215, 95, 0.10)' },
};

const defaultEmails: SequenceEmail[] = [
  {
    step: 1,
    subject: 'Great connecting today - Acme Corp follow-up',
    preview:
      'Hi Sarah, Thanks for taking the time to walk me through your team\'s current follow-up process today. The challenge of managing 96+ daily meeting recaps across your SDR team is exactly what we built ReplySequence to solve.',
    body: 'Hi Sarah,\n\nThanks for taking the time to walk me through your team\'s current follow-up process today. The challenge of managing 96+ daily meeting recaps across your SDR team is exactly what we built ReplySequence to solve.\n\nA few key things I took away from our conversation:\n\n- Your SDRs are spending ~45 minutes per meeting on manual follow-ups\n- Inconsistent messaging is leading to lost opportunities\n- You need something that integrates with HubSpot and Gmail\n\nI\'ve attached the product comparison doc you requested. Happy to walk through the ROI calculator when we connect with Mike next week.\n\nBest,\nJimmy',
    timing: 'Send immediately',
    purpose: 'recap',
  },
  {
    step: 2,
    subject: 'Quick thought on your SDR team\'s follow-up workflow',
    preview:
      'Hi Sarah, I was thinking about the point you raised about inconsistent messaging across your team. Here\'s a quick case study from a similar team that reduced their follow-up time by 73%.',
    body: 'Hi Sarah,\n\nI was thinking about the point you raised about inconsistent messaging across your team. Here\'s a quick case study from a similar team that reduced their follow-up time by 73%.\n\nTheir SDR team of 15 was facing the same challenges:\n- Manual recap emails taking 30-45 min each\n- Key action items getting lost between calls\n- CRM data not being updated consistently\n\nAfter implementing ReplySequence, they saw:\n- Follow-up time dropped from 45 min to 3 min per meeting\n- Response rates improved by 28%\n- CRM accuracy went from ~60% to 98%\n\nWould love to show your team lead Mike how this would work with your specific HubSpot setup.\n\nBest,\nJimmy',
    timing: 'Send in 2 days',
    purpose: 'value',
  },
  {
    step: 3,
    subject: 'Re: Acme Corp follow-up - next steps?',
    preview:
      'Hi Sarah, Just circling back on the demo for Mike and the team. I know Q2 budget conversations are coming up - happy to put together a quick ROI summary for your leadership team.',
    body: 'Hi Sarah,\n\nJust circling back on the demo for Mike and the team. I know Q2 budget conversations are coming up - happy to put together a quick ROI summary for your leadership team.\n\nBased on your 12 SDRs handling 8-10 calls/day, here\'s the rough math:\n- Current: ~90 hours/week on manual follow-ups\n- With ReplySequence: ~6 hours/week\n- That\'s 84 hours/week back for actual selling\n\nShould I send over the ROI calculator, or would it be easier to walk through it on a quick call this week?\n\nBest,\nJimmy',
    timing: 'Send in 5 days',
    purpose: 'nudge',
  },
];

export function SequencePreviewCard({
  meetingName = 'Acme Corp - Sales Discovery Call',
  emails = defaultEmails,
  onEdit,
  onCopy,
  onSend,
}: SequencePreviewCardProps) {
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  return (
    <motion.div
      className="rounded-2xl bg-gray-900/60 border border-gray-700/50 light:bg-white light:border-gray-200 p-5"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
    >
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-8 h-8 rounded-xl bg-[#7A5CFF]/10 flex items-center justify-center">
          <Layers className="w-4 h-4 text-[#7A5CFF]" strokeWidth={1.5} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white light:text-gray-900">Email Sequence</h3>
          <p className="text-[11px] text-gray-500 light:text-gray-400 truncate max-w-[240px]">{meetingName}</p>
        </div>
      </div>

      <div className="space-y-2">
        {emails.map((email) => {
          const config = purposeConfig[email.purpose];
          const isExpanded = expandedStep === email.step;

          return (
            <motion.div
              key={email.step}
              className="rounded-xl border border-gray-700/30 light:border-gray-200 overflow-hidden"
              layout
            >
              <button
                onClick={() => setExpandedStep(isExpanded ? null : email.step)}
                className="w-full flex items-start gap-3 p-3 text-left hover:bg-white/[0.02] light:hover:bg-gray-50 transition-colors"
              >
                <div className="w-6 h-6 rounded-lg bg-gray-800 light:bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[11px] font-bold text-gray-400 light:text-gray-500 tabular-nums">
                    {email.step}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium text-white light:text-gray-900 truncate">
                      {email.subject}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 light:text-gray-400 line-clamp-1">
                    {email.preview}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span
                      className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                      style={{ backgroundColor: config.bg, color: config.color }}
                    >
                      {config.label}
                    </span>
                    <span className="text-[10px] text-gray-500 light:text-gray-400">{email.timing}</span>
                  </div>
                </div>
                <div className="shrink-0 mt-1">
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  )}
                </div>
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-3 pb-3 border-t border-gray-800/30 light:border-gray-100">
                      <pre className="text-xs text-gray-300 light:text-gray-600 whitespace-pre-wrap font-sans leading-relaxed mt-3 mb-3 max-h-48 overflow-y-auto">
                        {email.body}
                      </pre>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onEdit?.(email.step)}
                          className="text-[11px] text-gray-400 hover:text-white light:hover:text-gray-900 transition-colors flex items-center gap-1 px-2 py-1 rounded-md hover:bg-white/5 light:hover:bg-gray-100"
                        >
                          <Edit3 className="w-3 h-3" /> Edit
                        </button>
                        <button
                          onClick={() => onCopy?.(email.step)}
                          className="text-[11px] text-gray-400 hover:text-white light:hover:text-gray-900 transition-colors flex items-center gap-1 px-2 py-1 rounded-md hover:bg-white/5 light:hover:bg-gray-100"
                        >
                          <Copy className="w-3 h-3" /> Copy
                        </button>
                        <button
                          onClick={() => onSend?.(email.step)}
                          className="text-[11px] text-[#4DFFA3] hover:text-[#7AFFBF] transition-colors flex items-center gap-1 px-2 py-1 rounded-md hover:bg-[#4DFFA3]/10"
                        >
                          <Send className="w-3 h-3" /> Send
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
