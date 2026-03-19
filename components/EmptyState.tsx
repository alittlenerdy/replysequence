'use client';

import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';

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
      {/* Animated Icon */}
      <div className="relative mx-auto w-20 h-20 mb-6">
        {/* Pulse rings */}
        <div className="pulse-ring absolute inset-0 text-[#6366F1] light:text-[#6366F1]" />
        <div className="pulse-ring absolute inset-0 text-[#6366F1] light:text-[#6366F1]" style={{ animationDelay: '0.5s' }} />
        <div className="pulse-ring absolute inset-0 text-[#6366F1] light:text-[#6366F1]" style={{ animationDelay: '1s' }} />

        {/* Main icon container */}
        <div className="empty-state-icon relative w-20 h-20 bg-gradient-to-br from-[#6366F1] to-[#3A4BDD] rounded-full flex items-center justify-center">
          <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>
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
          <p className="text-gray-400 light:text-gray-500 mb-6 max-w-md mx-auto">
            {hasConnectedPlatforms
              ? 'Your platforms are connected. Record a meeting with transcription enabled and ReplySequence will automatically generate a follow-up email draft.'
              : 'Record a meeting with transcription enabled on Zoom, Google Meet, or Teams. ReplySequence will automatically generate a follow-up email draft when the transcript is ready.'}
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
            {!hasConnectedPlatforms && (
              <a
                href="/dashboard/settings"
                className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-300 light:text-gray-700 bg-gray-700 light:bg-white border border-gray-600 light:border-gray-300 rounded-lg hover:bg-gray-600 light:hover:bg-gray-50 transition-[color,background-color,transform,box-shadow] duration-300 hover:scale-105 outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060B18]"
              >
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M4.5 4.5h15c1.1 0 2 .9 2 2v11c0 1.1-.9 2-2 2h-15c-1.1 0-2-.9-2-2v-11c0-1.1.9-2 2-2zm.5 3v8h8v-8h-8zm10 0v4l3-2v4l-3-2v4h4v-8h-4z"/>
                </svg>
                Connect a Platform
              </a>
            )}
          </div>
          {sampleError && (
            <p className="mt-3 text-sm text-red-400">{sampleError}</p>
          )}
        </>
      )}

      {/* How it works */}
      {!hasFilters && (
        <div className="mt-10 pt-8 border-t border-white/[0.06] light:border-gray-200">
          <h4 className="text-sm font-medium text-white light:text-gray-900 mb-6">How it works</h4>
          <div className="flex flex-col md:flex-row gap-8 justify-center">
            {[
              {
                step: 1,
                title: 'Record a meeting',
                desc: 'Enable transcription in Zoom, Meet, or Teams',
                delay: '0.1s',
              },
              {
                step: 2,
                title: 'AI analyzes transcript',
                desc: 'Claude extracts key points and action items',
                delay: '0.2s',
              },
              {
                step: 3,
                title: 'Review and send',
                desc: 'Edit the draft if needed, then send with one click',
                delay: '0.3s',
              },
            ].map((item) => (
              <div
                key={item.step}
                className="flex items-start gap-3 text-left max-w-xs opacity-0"
                style={{
                  animation: 'statCardFadeIn 0.4s ease-out forwards',
                  animationDelay: item.delay,
                }}
              >
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-[#6366F1] to-[#3A4BDD] rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-[#6366F1]/20">
                  {item.step}
                </div>
                <div>
                  <p className="text-sm font-medium text-white light:text-gray-900">{item.title}</p>
                  <p className="text-xs text-gray-400 light:text-gray-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
