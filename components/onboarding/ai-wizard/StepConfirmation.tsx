'use client';

import { useState } from 'react';
import { Check, Send, Loader2, ArrowRight } from 'lucide-react';
import { TONE_OPTIONS, ROLE_OPTIONS, type ToneValue, type UserRole } from '@/lib/constants/ai-settings';

interface StepConfirmationProps {
  role: UserRole | null;
  tone: ToneValue;
  instructions: string;
  signature: string;
  hourlyRate: number;
  onComplete: () => void;
  onBack: () => void;
  isSaving: boolean;
}

export function StepConfirmation({
  role,
  tone,
  instructions,
  signature,
  hourlyRate,
  onComplete,
  onBack,
  isSaving,
}: StepConfirmationProps) {
  const [sendingTest, setSendingTest] = useState(false);
  const [testSent, setTestSent] = useState(false);

  const toneLabel = TONE_OPTIONS.find(o => o.value === tone)?.label || tone;
  const roleLabel = ROLE_OPTIONS.find(o => o.value === role)?.label || role || 'Not set';

  async function handleSendTest() {
    setSendingTest(true);
    try {
      const res = await fetch('/api/drafts/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tone, customInstructions: instructions, signature }),
      });
      if (res.ok) {
        setTestSent(true);
      }
    } catch {
      // silent
    } finally {
      setSendingTest(false);
    }
  }

  return (
    <div>
      <h3 className="text-2xl font-bold text-white mb-2">You're all set!</h3>
      <p className="text-gray-400 text-sm mb-6">
        Here's a summary of your AI settings. You can change these anytime in Settings.
      </p>

      <div className="max-w-lg space-y-3 mb-8">
        <SummaryRow label="Role" value={roleLabel} />
        <SummaryRow label="Email Tone" value={toneLabel} />
        <SummaryRow
          label="Custom Instructions"
          value={instructions || 'None set'}
          muted={!instructions}
        />
        <SummaryRow
          label="Signature"
          value={signature || 'Using default'}
          muted={!signature}
          mono
        />
        <SummaryRow label="Hourly Rate" value={`$${hourlyRate}/hr`} />
      </div>

      {/* Test email */}
      <div className="max-w-lg mb-8">
        <button
          onClick={handleSendTest}
          disabled={sendingTest || testSent}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-600 disabled:opacity-60"
        >
          {sendingTest ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Sending...
            </>
          ) : testSent ? (
            <>
              <Check className="w-4 h-4 text-green-400" />
              Sent! Check your inbox
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Send me a test follow-up
            </>
          )}
        </button>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="px-5 py-3 text-sm font-medium text-gray-400 hover:text-white transition-colors"
        >
          Back
        </button>
        <button
          onClick={onComplete}
          disabled={isSaving}
          className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-indigo-500 to-indigo-700 text-white font-semibold rounded-xl hover:from-indigo-600 hover:to-indigo-800 transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              Save & Continue
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  muted = false,
  mono = false,
}: {
  label: string;
  value: string;
  muted?: boolean;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 py-2 border-b border-gray-800">
      <span className="text-xs font-medium text-gray-500 w-32 shrink-0 pt-0.5">{label}</span>
      <span
        className={`text-sm ${muted ? 'text-gray-600 italic' : 'text-gray-300'} ${
          mono ? 'font-mono text-xs whitespace-pre-line' : ''
        } break-words min-w-0`}
      >
        {value}
      </span>
    </div>
  );
}
