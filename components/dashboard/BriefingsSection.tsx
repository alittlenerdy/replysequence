'use client';

import { useState, useEffect, useCallback } from 'react';
import { BriefingCard } from './BriefingCard';
import type { BriefingContent, BriefingStatus } from '@/lib/db/schema';

interface BriefingData {
  id: string;
  meetingTitle: string;
  meetingStartTime: string;
  meetingPlatform: string | null;
  meetingUrl: string | null;
  content: BriefingContent | null;
  status: BriefingStatus;
  viewedAt: string | null;
  emailSentAt: string | null;
  createdAt: string;
}

export function BriefingsSection() {
  const [briefings, setBriefings] = useState<BriefingData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBriefings = useCallback(async () => {
    try {
      const res = await fetch('/api/briefings');
      if (!res.ok) return;
      const data = await res.json();
      setBriefings(data.briefings || []);
    } catch {
      // Silently fail
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBriefings();
    // Refresh every 2 minutes to pick up new briefings
    const interval = setInterval(fetchBriefings, 120000);
    return () => clearInterval(interval);
  }, [fetchBriefings]);

  if (isLoading) {
    return (
      <div className="bg-gray-900/60 border border-gray-700/50 light:bg-white light:border-gray-200 rounded-2xl p-4 light:shadow-sm">
        <div className="animate-pulse space-y-3">
          <div className="h-5 w-48 bg-gray-700/50 light:bg-gray-200 rounded" />
          <div className="h-20 bg-gray-700/30 light:bg-gray-100 rounded-xl" />
        </div>
      </div>
    );
  }

  // Only show if there are briefings
  if (briefings.length === 0) return null;

  // Split into upcoming (future meetings) and recent (past meetings)
  const now = new Date();
  const upcoming = briefings.filter(b => new Date(b.meetingStartTime) > now);
  const recent = briefings.filter(b => new Date(b.meetingStartTime) <= now);

  return (
    <div className="bg-gray-900/60 border border-gray-700/50 light:bg-white light:border-gray-200 rounded-2xl p-4 light:shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white light:text-gray-900 flex items-center gap-2">
          <svg className="w-5 h-5 text-[#5B6CFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Pre-Meeting Briefings
          {briefings.length > 0 && (
            <span className="text-sm font-normal text-gray-500">({briefings.length})</span>
          )}
        </h2>
      </div>

      <div className="space-y-3">
        {upcoming.length > 0 && (
          <>
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Upcoming</p>
            {upcoming.map(b => (
              <BriefingCard key={b.id} briefing={b} />
            ))}
          </>
        )}
        {recent.length > 0 && (
          <>
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mt-4">Recent</p>
            {recent.slice(0, 5).map(b => (
              <BriefingCard key={b.id} briefing={b} />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
