'use client';

import { useState, useEffect, useCallback } from 'react';
import { Hash, MessageSquareQuote, Loader2 } from 'lucide-react';

interface MentionRecord {
  id: string;
  keyword: string;
  category: string;
  meetingTopic: string | null;
  meetingDate: string | null;
  context: string;
  speakerName: string | null;
  createdAt: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  competitor: 'text-red-400 bg-red-400/10 border-red-400/20',
  product: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  objection: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  custom: 'text-gray-400 bg-gray-400/10 border-gray-400/20',
};

export function KeywordMentions() {
  const [mentions, setMentions] = useState<MentionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMentions = useCallback(async () => {
    try {
      const res = await fetch('/api/keywords/mentions');
      if (!res.ok) return;
      const data = await res.json();
      setMentions(data.mentions);
    } catch {
      // Silently fail — this is a supplementary widget
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMentions();
  }, [fetchMentions]);

  if (loading) {
    return (
      <div className="rounded-xl border border-white/[0.06] light:border-gray-200 bg-[#0c0e14] light:bg-white p-6">
        <div className="flex items-center gap-2 mb-4">
          <Hash className="w-4 h-4 text-[#6366F1]" />
          <h3 className="text-sm font-semibold text-white light:text-gray-900">Keyword Mentions</h3>
        </div>
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (mentions.length === 0) {
    return (
      <div className="rounded-xl border border-white/[0.06] light:border-gray-200 bg-[#0c0e14] light:bg-white p-6">
        <div className="flex items-center gap-2 mb-4">
          <Hash className="w-4 h-4 text-[#6366F1]" />
          <h3 className="text-sm font-semibold text-white light:text-gray-900">Keyword Mentions</h3>
        </div>
        <p className="text-sm text-gray-500 text-center py-4">
          No keyword mentions found yet. Track keywords in Settings to monitor them across meetings.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/[0.06] light:border-gray-200 bg-[#0c0e14] light:bg-white p-6">
      <div className="flex items-center gap-2 mb-4">
        <Hash className="w-4 h-4 text-[#6366F1]" />
        <h3 className="text-sm font-semibold text-white light:text-gray-900">Keyword Mentions</h3>
        <span className="text-xs text-gray-500 ml-auto">{mentions.length} recent</span>
      </div>
      <div className="space-y-3">
        {mentions.map((mention) => (
          <div
            key={mention.id}
            className="rounded-lg border border-white/[0.04] light:border-gray-100 bg-gray-800/30 light:bg-gray-50 p-3"
          >
            <div className="flex items-center gap-2 mb-1.5">
              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${CATEGORY_COLORS[mention.category] || CATEGORY_COLORS.custom}`}>
                {mention.category}
              </span>
              <span className="text-xs font-medium text-white light:text-gray-900">{mention.keyword}</span>
              {mention.speakerName && (
                <span className="text-[10px] text-gray-500 ml-auto">
                  {mention.speakerName}
                </span>
              )}
            </div>
            <div className="flex items-start gap-1.5 mb-1.5">
              <MessageSquareQuote className="w-3 h-3 text-gray-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-gray-300 light:text-gray-600 line-clamp-2 italic">
                &ldquo;{mention.context}&rdquo;
              </p>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-gray-500">
              {mention.meetingTopic && <span className="truncate max-w-[200px]">{mention.meetingTopic}</span>}
              {mention.meetingDate && (
                <span className="flex-shrink-0">
                  {new Date(mention.meetingDate).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
