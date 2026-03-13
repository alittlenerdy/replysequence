'use client';

import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';

export default function NPSSurveyPage() {
  const [score, setScore] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const getFollowUpQuestion = () => {
    if (score === null) return null;
    if (score >= 9) return 'What do you love about ReplySequence?';
    if (score >= 7) return "What would make you rate us higher?";
    return "What would change your mind about ReplySequence?";
  };

  const handleSubmit = async () => {
    if (score === null) return;

    setSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'nps',
          score,
          comment: comment || null,
          metadata: {
            category: score >= 9 ? 'promoter' : score >= 7 ? 'passive' : 'detractor',
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
      <div className="min-h-screen bg-[#060B18] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 mx-auto mb-6 bg-green-500/10 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-green-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Thank you!</h1>
          <p className="text-gray-400">
            Your feedback helps us build a better product for everyone.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060B18] flex items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full">
        <div className="text-center mb-10">
          <h1 className="text-2xl font-bold text-white mb-2">
            How likely are you to recommend ReplySequence?
          </h1>
          <p className="text-gray-400">On a scale of 0-10</p>
        </div>

        {/* NPS Score Selector */}
        <div className="flex justify-center gap-1.5 mb-2">
          {Array.from({ length: 11 }, (_, i) => (
            <button
              key={i}
              onClick={() => setScore(i)}
              className={`w-10 h-10 rounded-lg font-semibold text-sm transition-[color,background-color,transform] outline-none focus-visible:ring-2 focus-visible:ring-[#5B6CFF]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060B18] ${
                score === i
                  ? i >= 9
                    ? 'bg-green-500 text-white scale-110'
                    : i >= 7
                      ? 'bg-yellow-500 text-white scale-110'
                      : 'bg-red-500 text-white scale-110'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}
            >
              {i}
            </button>
          ))}
        </div>

        {/* Scale labels */}
        <div className="flex justify-between px-1 mb-8">
          <span className="text-xs text-gray-500">Not at all likely</span>
          <span className="text-xs text-gray-500">Extremely likely</span>
        </div>

        {/* Follow-up question */}
        {score !== null && (
          <div className="mb-6">
            <label htmlFor="nps-feedback" className="block text-sm font-medium text-white mb-2">
              {getFollowUpQuestion()}
            </label>
            <textarea
              id="nps-feedback"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-gray-900 border border-gray-700 text-white placeholder-gray-500 focus-visible:outline-none focus-visible:border-[#5B6CFF] resize-none"
              rows={3}
              placeholder="Your thoughts\u2026 (optional)"
            />
          </div>
        )}

        {error && (
          <p className="text-sm text-red-400 mb-4" role="alert" aria-live="polite">{error}</p>
        )}

        <button
          onClick={handleSubmit}
          disabled={score === null || submitting}
          className="w-full px-6 py-3 bg-[#4A5BEE] hover:bg-[#5B6CFF] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#5B6CFF]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060B18]"
        >
          {submitting ? 'Submitting\u2026' : 'Submit'}
        </button>
      </div>
    </div>
  );
}
