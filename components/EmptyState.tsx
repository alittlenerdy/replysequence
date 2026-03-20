'use client';

import { useState } from 'react';
import { Sparkles, Loader2, Mail } from 'lucide-react';

interface EmptyStateProps {
  hasFilters?: boolean;
  hasConnectedPlatforms?: boolean;
  onClearFilters?: () => void;
  onDraftGenerated?: () => void;
}

export function EmptyState({ hasFilters, hasConnectedPlatforms, onClearFilters, onDraftGenerated }: EmptyStateProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [sampleError, setSampleError] = useState('');

  async function handleTrySample() {
    setIsGenerating(true);
    setSampleError('');
    try {
      const res = await fetch('/api/onboarding/sample-meeting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) {
        setSampleError(data.error || 'Failed to generate sample');
        return;
      }
      // Refresh the drafts list to show the new sample draft
      onDraftGenerated?.();
    } catch {
      setSampleError('Network error. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  }
  return (
    <div className="dashboard-fade-in glass-card rounded-lg shadow-sm p-12 text-center">
      {/* Icon */}
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#F59E0B]/10 mx-auto mb-4">
        <Mail className="w-6 h-6 text-[#F59E0B]" strokeWidth={1.5} />
      </div>

      {hasFilters ? (
        <>
          <h3 className="text-lg font-semibold text-white light:text-gray-900 mb-2">No drafts found</h3>
          <p className="text-gray-400 light:text-gray-500 mb-4 max-w-sm mx-auto">
            No drafts match your current filters. Try adjusting your search or filters.
          </p>
          <button
            onClick={onClearFilters}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-[#6366F1] light:text-[#4F46E5] bg-[#1C2545]/30 light:bg-[#EEF0FF] rounded-lg hover:bg-[#1C2545]/50 light:hover:bg-[#EEF0FF] transition-[color,background-color,transform,box-shadow] duration-300 hover:scale-105 outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060B18]"
          >
            Clear Filters
          </button>
        </>
      ) : (
        <>
          <h3 className="text-lg font-semibold text-white light:text-gray-900 mb-2">No drafts yet</h3>
          <p className="text-zinc-500 dark:text-zinc-400 mb-6 max-w-md mx-auto">
            Your AI-drafted follow-ups will appear here after each meeting. Review, edit, and send — or let auto-send handle it.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={handleTrySample}
              disabled={isGenerating}
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-[#4F46E5] to-[#2A3ACC] rounded-lg hover:from-[#3A4BDD] hover:to-[#1C2545] disabled:opacity-60 disabled:cursor-not-allowed transition-[color,background-color,transform,box-shadow] duration-300 hover:scale-105 hover:shadow-lg hover:shadow-[#6366F1]/25 outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060B18]"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating Draft{'\u2026'}
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Try a Sample Meeting
                </>
              )}
            </button>
          </div>
          {sampleError && (
            <p className="mt-3 text-sm text-red-400">{sampleError}</p>
          )}
        </>
      )}
    </div>
  );
}
