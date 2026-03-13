'use client';

import { useState } from 'react';
import { ThumbsUp, ThumbsDown, MessageSquare, X, Check, Loader2 } from 'lucide-react';

interface DraftFeedbackProps {
  draftId: string;
  initialRating?: 'up' | 'down' | null;
  initialFeedback?: string | null;
  onFeedbackSubmitted?: () => void;
}

export function DraftFeedback({
  draftId,
  initialRating = null,
  initialFeedback = null,
  onFeedbackSubmitted,
}: DraftFeedbackProps) {
  const [rating, setRating] = useState<'up' | 'down' | null>(initialRating);
  const [showFeedbackInput, setShowFeedbackInput] = useState(false);
  const [feedbackText, setFeedbackText] = useState(initialFeedback || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function submitFeedback(newRating: 'up' | 'down' | null, feedback?: string) {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/drafts/${draftId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: newRating,
          feedback: feedback || feedbackText || undefined,
        }),
      });

      if (res.ok) {
        setRating(newRating);
        setSubmitted(true);
        setTimeout(() => setSubmitted(false), 2000);
        onFeedbackSubmitted?.();
      }
    } catch {
      // Silently fail — feedback is non-critical
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleThumbClick(thumb: 'up' | 'down') {
    const newRating = rating === thumb ? null : thumb;
    submitFeedback(newRating);
  }

  function handleFeedbackSubmit() {
    submitFeedback(rating, feedbackText);
    setShowFeedbackInput(false);
  }

  return (
    <div className="pt-4 border-t border-gray-700">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-400 flex items-center gap-2">
          <MessageSquare className="w-4 h-4" />
          Was this draft helpful?
        </h3>
        {submitted && (
          <span className="text-xs text-[#5B6CFF] flex items-center gap-1">
            <Check className="w-3 h-3" />
            Saved
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 mt-2">
        <button
          onClick={() => handleThumbClick('up')}
          disabled={isSubmitting}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#5B6CFF]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060B18] ${
            rating === 'up'
              ? 'bg-orange-500/20 border-orange-500/40 text-orange-400'
              : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-orange-500/30 hover:text-orange-400'
          }`}
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <ThumbsUp className="w-4 h-4" />
          )}
          <span>Good</span>
        </button>

        <button
          onClick={() => handleThumbClick('down')}
          disabled={isSubmitting}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#5B6CFF]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060B18] ${
            rating === 'down'
              ? 'bg-red-500/20 border-red-500/40 text-red-400'
              : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-red-500/30 hover:text-red-400'
          }`}
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <ThumbsDown className="w-4 h-4" />
          )}
          <span>Needs work</span>
        </button>

        {!showFeedbackInput && (
          <button
            onClick={() => setShowFeedbackInput(true)}
            className="ml-auto text-xs text-gray-500 hover:text-gray-400 transition-colors rounded outline-none focus-visible:ring-2 focus-visible:ring-[#5B6CFF]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060B18]"
          >
            Add a note
          </button>
        )}
      </div>

      {showFeedbackInput && (
        <div className="mt-3 space-y-2">
          <textarea
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            placeholder="What could be improved? (optional)"
            rows={2}
            aria-label="Feedback"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300 placeholder-gray-500 focus-visible:border-[#5B6CFF] focus-visible:outline-none resize-none"
          />
          <div className="flex items-center gap-2">
            <button
              onClick={handleFeedbackSubmit}
              disabled={isSubmitting}
              className="px-3 py-1.5 text-xs font-medium bg-[#4A5BEE] text-white rounded-lg hover:bg-[#5B6CFF] transition-colors disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-[#5B6CFF]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060B18]"
            >
              {isSubmitting ? 'Saving\u2026' : 'Save feedback'}
            </button>
            <button
              onClick={() => {
                setShowFeedbackInput(false);
                setFeedbackText(initialFeedback || '');
              }}
              className="px-3 py-1.5 text-xs text-gray-400 hover:text-gray-300 transition-colors rounded outline-none focus-visible:ring-2 focus-visible:ring-[#5B6CFF]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060B18]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
