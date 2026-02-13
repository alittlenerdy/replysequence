'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConversationalRefineProps {
  draftId: string;
  currentSubject: string;
  currentBody: string;
  onRefineComplete: (subject: string, body: string) => void;
  onCancel: () => void;
}

interface RefinementSuggestion {
  label: string;
  instruction: string;
  icon: React.ReactNode;
}

const SUGGESTIONS: RefinementSuggestion[] = [
  {
    label: 'More concise',
    instruction: 'Make this email more concise and to-the-point. Remove any unnecessary words or filler.',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h8m-8 6h16" />
      </svg>
    ),
  },
  {
    label: 'Add urgency',
    instruction: 'Add a sense of urgency to encourage a quick response, without being pushy.',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    label: 'More friendly',
    instruction: 'Make the tone warmer and more personable while keeping it professional.',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    label: 'More formal',
    instruction: 'Make the tone more formal and business-like.',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    label: 'Better CTA',
    instruction: 'Improve the call-to-action to make it clearer what the next step should be.',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
      </svg>
    ),
  },
  {
    label: 'Fix grammar',
    instruction: 'Fix any grammar, spelling, or punctuation errors.',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
  },
];

export function ConversationalRefine({
  draftId,
  currentSubject,
  currentBody,
  onRefineComplete,
  onCancel,
}: ConversationalRefineProps) {
  const [instruction, setInstruction] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refinedPreview, setRefinedPreview] = useState<{
    subject: string;
    body: string;
  } | null>(null);

  const handleRefine = useCallback(async (customInstruction?: string) => {
    const finalInstruction = customInstruction || instruction;
    if (!finalInstruction.trim()) return;

    setIsRefining(true);
    setError(null);
    setRefinedPreview(null);

    try {
      const response = await fetch('/api/drafts/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          draftId,
          instruction: finalInstruction,
          field: 'both',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to refine draft');
      }

      // Show preview before applying
      setRefinedPreview({
        subject: data.subject,
        body: data.body,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Refinement failed');
    } finally {
      setIsRefining(false);
    }
  }, [draftId, instruction]);

  const handleApply = useCallback(() => {
    if (refinedPreview) {
      onRefineComplete(refinedPreview.subject, refinedPreview.body);
    }
  }, [refinedPreview, onRefineComplete]);

  const handleSuggestionClick = (suggestion: RefinementSuggestion) => {
    setInstruction(suggestion.instruction);
    handleRefine(suggestion.instruction);
  };

  // Show preview comparison
  if (refinedPreview) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Review Changes
          </h3>
          <button
            onClick={() => setRefinedPreview(null)}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            Try again
          </button>
        </div>

        {/* Subject comparison */}
        {refinedPreview.subject !== currentSubject && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-400">Subject</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-xs text-red-400 mb-1">Before</p>
                <p className="text-sm text-gray-300 line-through">{currentSubject}</p>
              </div>
              <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                <p className="text-xs text-green-400 mb-1">After</p>
                <p className="text-sm text-white">{refinedPreview.subject}</p>
              </div>
            </div>
          </div>
        )}

        {/* Body comparison */}
        {refinedPreview.body !== currentBody && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-400">Body</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg max-h-48 overflow-y-auto">
                <p className="text-xs text-red-400 mb-1">Before</p>
                <p className="text-xs text-gray-400 whitespace-pre-wrap">{currentBody}</p>
              </div>
              <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg max-h-48 overflow-y-auto">
                <p className="text-xs text-green-400 mb-1">After</p>
                <p className="text-xs text-white whitespace-pre-wrap">{refinedPreview.body}</p>
              </div>
            </div>
          </div>
        )}

        {/* No changes */}
        {refinedPreview.subject === currentSubject && refinedPreview.body === currentBody && (
          <div className="p-4 bg-gray-800/50 rounded-lg text-center">
            <p className="text-gray-400">No changes were made. Try a different instruction.</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 border border-gray-600 rounded-lg hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={refinedPreview.subject === currentSubject && refinedPreview.body === currentBody}
            className="px-4 py-2 text-sm font-medium text-white bg-cyan-600 rounded-lg hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Apply Changes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          Refine with AI
        </h3>
        <button
          onClick={onCancel}
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          Cancel
        </button>
      </div>

      <p className="text-sm text-gray-400">
        Tell me how you'd like to improve this draft, or pick a suggestion below.
      </p>

      {error && (
        <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 p-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Quick suggestions */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion.label}
            onClick={() => handleSuggestionClick(suggestion)}
            disabled={isRefining}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 bg-gray-800/50 border border-gray-700 rounded-lg hover:bg-gray-700 hover:text-white disabled:opacity-50 transition-colors"
          >
            {suggestion.icon}
            <span>{suggestion.label}</span>
          </button>
        ))}
      </div>

      {/* Custom instruction input */}
      <div className="relative">
        <input
          type="text"
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !isRefining && handleRefine()}
          placeholder="Or type your own instruction... (e.g., 'add a PS about our upcoming webinar')"
          disabled={isRefining}
          className="w-full px-4 py-3 pr-12 text-sm text-white bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent placeholder:text-gray-500 disabled:opacity-50"
        />
        <button
          onClick={() => handleRefine()}
          disabled={isRefining || !instruction.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-cyan-400 hover:text-cyan-300 disabled:text-gray-600 disabled:cursor-not-allowed transition-colors"
        >
          {isRefining ? (
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          )}
        </button>
      </div>

      {/* Loading state */}
      <AnimatePresence>
        {isRefining && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center justify-center gap-3 py-4"
          >
            <div className="relative flex h-10 w-10">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-10 w-10 bg-cyan-500 items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </span>
            </div>
            <p className="text-sm text-gray-300">AI is refining your draft...</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
