'use client';

import { useState, useEffect, useRef } from 'react';
import { Mail, Send, Loader2, Check, Sparkles } from 'lucide-react';
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

/** Generate a visibly different full email preview for each tone + instruction combo */
function getPreviewBody(tone: ToneValue, customInstructions: string): string {
  const lower = customInstructions.toLowerCase();

  // Full email bodies per tone — dramatically different
  const bodies: Record<ToneValue, string> = {
    professional: `Dear Sarah,

Thank you for taking the time to meet today. I wanted to follow up on the key points we discussed and outline the next steps we agreed upon.

I'd love to offer you a free trial so you can experience it firsthand.

Would Thursday at 2pm work for a follow-up call?

Best regards`,
    casual: `Hey Sarah!

Great chatting today — lots of good stuff came out of that call. Here's where we landed:

We talked about the demo, your team's workflow, and how this could save a bunch of time. I think the next move is getting you set up with a trial.

Let me know what works for a quick follow-up — maybe Thursday?

Cheers`,
    friendly: `Hi Sarah!

It was so great connecting with you today! I'm really excited about what we discussed and I think there's a great fit here.

I'd love to get you started with a trial so you can see the magic firsthand. I think your team would really enjoy it.

How does Thursday at 2pm sound for our next chat? Looking forward to it!

Warmly`,
    concise: `Sarah,

Following up on today's call.

Next steps:
- Send proposal by Thursday
- Schedule technical review
- Start trial setup

Let me know if anything needs adjusting.`,
  };

  let body = bodies[tone];

  // Instruction-driven modifications — visibly change the output
  if (lower.includes('trial') || lower.includes('free')) {
    if (!body.includes('trial')) {
      body = body.replace(/\n\n([A-Z])/m, '\n\nI\'d love to offer you a free trial so you can experience it firsthand.\n\n$1');
    }
  }

  if (lower.includes('bullet') || lower.includes('action item')) {
    if (!body.includes('- ')) {
      body += '\n\nAction items:\n- Review proposal document\n- Schedule follow-up call\n- Share feedback with team';
    }
  }

  if (lower.includes('150 words') || lower.includes('short') || lower.includes('brief')) {
    // Truncate to first 3 sentences + closing
    const sentences = body.split(/(?<=[.!?])\s+/);
    if (sentences.length > 4) {
      body = sentences.slice(0, 3).join(' ') + '\n\n' + sentences[sentences.length - 1];
    }
  }

  if (lower.includes('next step') || lower.includes('specific')) {
    if (!body.includes('Thursday')) {
      body += '\n\nSpecific next step: Let\'s reconnect Thursday at 2pm to review the proposal.';
    }
  }

  return body;
}

function getSubjectLine(tone: ToneValue): string {
  const subjects: Record<ToneValue, string> = {
    professional: 'Re: Follow-up from our meeting',
    casual: 'Quick recap from today',
    friendly: 'Great connecting today!',
    concise: 'Meeting recap + next steps',
  };
  return subjects[tone];
}

function getToneLabel(tone: ToneValue): string {
  const toneOption = TONE_OPTIONS.find(o => o.value === tone);
  return toneOption?.label || 'Professional';
}

const BASELINE_SUBJECT = 'Following up from our meeting';
const BASELINE_BODY = `Hi Sarah,

Thanks for your time today. I wanted to follow up on what we discussed.

Let me know if you have any questions.

Thanks`;

export function AISettingsPreview({ tone, customInstructions, signature }: AISettingsPreviewProps) {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [displayBody, setDisplayBody] = useState('');
  const [displaySubject, setDisplaySubject] = useState('');
  const [showBefore, setShowBefore] = useState(false);
  const prevInputRef = useRef('');

  const hasCustomization = tone !== 'professional' || customInstructions.length > 0;

  const subject = getSubjectLine(tone);
  const body = getPreviewBody(tone, customInstructions);

  // Reactive update: debounce instructions, instant for tone
  useEffect(() => {
    const inputKey = `${tone}|${customInstructions}`;
    if (inputKey === prevInputRef.current) return;

    setIsUpdating(true);
    const delay = prevInputRef.current.split('|')[0] !== tone ? 150 : 400;
    const timer = setTimeout(() => {
      setDisplaySubject(subject);
      setDisplayBody(body);
      setIsUpdating(false);
      prevInputRef.current = inputKey;
    }, delay);

    return () => clearTimeout(timer);
  }, [tone, customInstructions, subject, body]);

  // Initialize
  useEffect(() => {
    setDisplaySubject(subject);
    setDisplayBody(body);
    prevInputRef.current = `${tone}|${customInstructions}`;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
    <div className={`glass-card rounded-2xl overflow-hidden light:shadow-sm transition-[border-color,box-shadow] duration-300 ${
      isUpdating
        ? 'border border-[#06B6D4]/30 shadow-lg shadow-[#06B6D4]/5'
        : 'border border-white/[0.06] light:border-gray-200'
    }`}>
      {/* Email header */}
      <div className="px-5 py-3 border-b border-gray-700/50 light:border-gray-200 bg-gray-800/30 light:bg-gray-50">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-[#6366F1]" />
            <span className="text-xs font-medium text-gray-400 light:text-gray-500">Live Preview</span>
            {isUpdating && (
              <span className="flex items-center gap-1 text-[10px] text-[#06B6D4]">
                <Sparkles className="w-3 h-3 animate-pulse" />
                Updating...
              </span>
            )}
          </div>
          <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-[#6366F1]/15 text-[#6366F1] light:bg-[#DDE1FF] light:text-[#3A4BDD]">
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
            <span className="text-white light:text-gray-900 font-medium">{displaySubject}</span>
          </div>
        </div>
      </div>

      {/* Before / After toggle */}
      {hasCustomization && (
        <div className="px-5 pt-3 pb-0">
          <button
            onClick={() => setShowBefore(!showBefore)}
            className="text-[10px] font-medium text-[#8892B0] hover:text-white light:hover:text-gray-900 transition-colors flex items-center gap-1"
          >
            {showBefore ? 'Hide' : 'Show'} before vs after
            <svg className={`w-3 h-3 transition-transform ${showBefore ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </button>
        </div>
      )}

      {/* Before (baseline) — collapsed by default */}
      {showBefore && (
        <div className="mx-5 mt-2 mb-0 rounded-lg bg-gray-800/40 light:bg-gray-100 border border-[#1E2A4A] light:border-gray-200 p-3 opacity-50">
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-[9px] font-bold text-[#8892B0] uppercase tracking-wider">Before (default)</span>
          </div>
          <p className="text-[10px] text-[#8892B0]/80 light:text-gray-400 mb-1 font-medium">Subj: {BASELINE_SUBJECT}</p>
          <p className="text-[10px] text-[#8892B0]/60 light:text-gray-400 leading-relaxed whitespace-pre-line line-clamp-4">{BASELINE_BODY}</p>
        </div>
      )}

      {/* After label */}
      {showBefore && (
        <div className="px-5 pt-2">
          <span className="text-[9px] font-bold text-[#06B6D4] uppercase tracking-wider">After (your settings)</span>
        </div>
      )}

      {/* Email body — live reactive */}
      <div className="px-5 py-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${tone}-${displayBody.length}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: isUpdating ? 0.3 : 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className="text-sm text-gray-300 light:text-gray-600 leading-relaxed whitespace-pre-line"
          >
            {displayBody}
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
          className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all disabled:opacity-60 bg-gradient-to-r from-[#6366F1] to-[#4F46E5] hover:from-[#818CF8] hover:to-[#6366F1] text-white shadow-md shadow-[#6366F1]/25 outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060B18]"
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
