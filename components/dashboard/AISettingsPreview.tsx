'use client';

import { useState } from 'react';
import { Mail, Send, Loader2, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TONE_OPTIONS, type ToneValue } from '@/lib/constants/ai-settings';

interface AISettingsPreviewProps {
  tone: ToneValue;
  customInstructions: string;
  signature: string;
}

const MOCK_MEETING = {
  contact: 'Sarah Chen',
  company: 'Acme Corp',
  topic: 'Product Demo',
  date: 'Today',
};

function getPreviewBody(tone: ToneValue, customInstructions: string): string {
  const toneOption = TONE_OPTIONS.find(o => o.value === tone);
  const base = toneOption?.preview || TONE_OPTIONS[0].preview;

  // Add instruction-driven content hints
  const hints: string[] = [];
  const lower = customInstructions.toLowerCase();
  if (lower.includes('trial') || lower.includes('free')) {
    hints.push("I'd love to offer you a free trial so you can experience it firsthand.");
  }
  if (lower.includes('next step') || lower.includes('date')) {
    hints.push('Would Thursday at 2pm work for a follow-up call?');
  }
  if (lower.includes('bullet') || lower.includes('action item')) {
    hints.push('\n- Review proposal document\n- Schedule follow-up call\n- Share feedback with team');
  }

  if (hints.length > 0) {
    return `${base}\n\n${hints.join('\n\n')}`;
  }
  return base;
}

function getSubjectLine(tone: ToneValue): string {
  const toneOption = TONE_OPTIONS.find(o => o.value === tone);
  return toneOption?.subjectExample || 'Re: Follow-up from our meeting';
}

function getToneLabel(tone: ToneValue): string {
  const toneOption = TONE_OPTIONS.find(o => o.value === tone);
  return toneOption?.label || 'Professional';
}

export function AISettingsPreview({ tone, customInstructions, signature }: AISettingsPreviewProps) {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const subject = getSubjectLine(tone);
  const body = getPreviewBody(tone, customInstructions);

  async function handleSendTest() {
    setSending(true);
    setSendError(null);
    setSent(false);
    try {
      const res = await fetch('/api/drafts/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tone, customInstructions, signature }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to send test email');
      }
      setSent(true);
      setTimeout(() => setSent(false), 4000);
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'Failed to send');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="bg-gray-900/50 light:bg-white border border-gray-700 light:border-gray-200 rounded-2xl overflow-hidden light:shadow-sm">
      {/* Email header */}
      <div className="px-5 py-3 border-b border-gray-700/50 light:border-gray-200 bg-gray-800/30 light:bg-gray-50">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-medium text-gray-400 light:text-gray-500">Live Preview</span>
          </div>
          <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-indigo-500/15 text-indigo-400 light:bg-indigo-100 light:text-indigo-700">
            {getToneLabel(tone)} tone
          </span>
        </div>
        <div className="space-y-1 text-xs">
          <div className="flex gap-2">
            <span className="text-gray-500 w-10 shrink-0">To:</span>
            <span className="text-white light:text-gray-900">{MOCK_MEETING.contact} &lt;sarah@acme.com&gt;</span>
          </div>
          <div className="flex gap-2">
            <span className="text-gray-500 w-10 shrink-0">Subj:</span>
            <span className="text-white light:text-gray-900 font-medium">{subject}</span>
          </div>
        </div>
      </div>

      {/* Email body with fade transition */}
      <div className="px-5 py-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${tone}-${customInstructions.length > 0 ? 'has-instructions' : 'no-instructions'}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="text-sm text-gray-300 light:text-gray-600 leading-relaxed whitespace-pre-line"
          >
            {body}
          </motion.div>
        </AnimatePresence>

        {/* Signature */}
        {signature && (
          <div className="mt-4 pt-3 border-t border-gray-700/30 light:border-gray-200">
            <div className="text-sm text-gray-400 light:text-gray-500 whitespace-pre-line font-mono text-xs">
              {signature}
            </div>
          </div>
        )}
      </div>

      {/* Send test email button */}
      <div className="px-5 py-3 border-t border-gray-700/50 light:border-gray-200 bg-gray-800/20 light:bg-gray-50">
        {sendError && (
          <p className="text-xs text-red-400 mb-2">{sendError}</p>
        )}
        <button
          onClick={handleSendTest}
          disabled={sending || sent}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all disabled:opacity-60 bg-gray-800 light:bg-gray-100 hover:bg-gray-700 light:hover:bg-gray-200 text-gray-300 light:text-gray-700 border border-gray-600 light:border-gray-300"
        >
          {sending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Sending...
            </>
          ) : sent ? (
            <>
              <Check className="w-4 h-4 text-green-400" />
              Sent! Check your inbox
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Send me a test email
            </>
          )}
        </button>
      </div>
    </div>
  );
}
