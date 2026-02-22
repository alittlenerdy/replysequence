'use client';

import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';

const EXIT_REASONS = [
  { id: 'too_busy', label: 'Too busy to use it' },
  { id: 'no_meetings', label: "Didn't have meetings" },
  { id: 'not_useful', label: 'Not useful enough' },
  { id: 'found_alternative', label: 'Found an alternative' },
  { id: 'technical_issues', label: 'Technical issues' },
  { id: 'other', label: 'Other' },
];

export default function ExitSurveyPage() {
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!selectedReason) return;

    setSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'exit_survey',
          rating: selectedReason,
          comment: comment || null,
          metadata: {
            reason: selectedReason,
            reasonLabel: EXIT_REASONS.find(r => r.id === selectedReason)?.label,
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
          <h1 className="text-2xl font-bold text-white mb-2">Thanks for letting us know</h1>
          <p className="text-gray-400">
            We appreciate your honesty. We'll use this to make ReplySequence better.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">We missed you this week</h1>
          <p className="text-gray-400">
            Quick question -- what kept you away from ReplySequence?
          </p>
        </div>

        <div className="space-y-3 mb-6">
          {EXIT_REASONS.map((reason) => (
            <button
              key={reason.id}
              onClick={() => setSelectedReason(reason.id)}
              className={`w-full text-left px-4 py-3 rounded-xl border transition-colors ${
                selectedReason === reason.id
                  ? 'border-indigo-500 bg-indigo-500/10 text-white'
                  : 'border-gray-700 bg-gray-900 text-gray-300 hover:border-gray-600'
              }`}
            >
              {reason.label}
            </button>
          ))}
        </div>

        {selectedReason && (
          <div className="mb-6">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-gray-900 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 resize-none"
              rows={3}
              placeholder="Anything else you'd like to share? (optional)"
            />
          </div>
        )}

        {error && (
          <p className="text-sm text-red-400 mb-4">{error}</p>
        )}

        <button
          onClick={handleSubmit}
          disabled={!selectedReason || submitting}
          className="w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-colors"
        >
          {submitting ? 'Submitting...' : 'Submit'}
        </button>
      </div>
    </div>
  );
}
