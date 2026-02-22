'use client';

import { useState } from 'react';
import { Send, CheckCircle2 } from 'lucide-react';

export default function WeeklyFeedbackPage() {
  const [worked, setWorked] = useState('');
  const [frustrated, setFrustrated] = useState('');
  const [missing, setMissing] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!worked && !frustrated && !missing) return;

    setSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'weekly_survey',
          comment: [worked, frustrated, missing].filter(Boolean).join('\n---\n'),
          metadata: {
            whatWorked: worked,
            whatFrustrated: frustrated,
            whatsMissing: missing,
          },
        }),
      });

      if (response.ok) {
        setSubmitted(true);
      } else {
        setError('Failed to submit. Please try again.');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 mx-auto mb-6 bg-green-500/10 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-green-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Thanks for your feedback!</h1>
          <p className="text-gray-400">
            Your input helps us build a better ReplySequence. Have a great weekend!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">Weekly Check-in</h1>
          <p className="text-gray-400">
            Quick 3-question survey to help us improve ReplySequence.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              What worked well this week?
            </label>
            <textarea
              value={worked}
              onChange={(e) => setWorked(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-gray-900 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 resize-none"
              rows={3}
              placeholder="Draft quality, speed, integrations..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              What frustrated you?
            </label>
            <textarea
              value={frustrated}
              onChange={(e) => setFrustrated(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-gray-900 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 resize-none"
              rows={3}
              placeholder="Bugs, missing features, confusing UI..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              What's missing?
            </label>
            <textarea
              value={missing}
              onChange={(e) => setMissing(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-gray-900 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 resize-none"
              rows={3}
              placeholder="Features you wish existed..."
            />
          </div>

          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting || (!worked && !frustrated && !missing)}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-colors"
          >
            {submitting ? 'Submitting...' : 'Submit Feedback'}
            {!submitting && <Send className="w-4 h-4" />}
          </button>
        </form>
      </div>
    </div>
  );
}
