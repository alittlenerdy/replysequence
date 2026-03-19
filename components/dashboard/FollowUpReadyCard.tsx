'use client';

import Link from 'next/link';
import { Mail, Edit3, Layers, Clock, Sparkles } from 'lucide-react';

interface FollowUpReadyCardProps {
  draft: {
    id: string;
    subject: string;
    body: string;
    meetingTopic: string | null;
    meetingPlatform: string;
    generationMs: number | null;
    createdAt: Date | null;
  } | null;
}

export function FollowUpReadyCard({ draft }: FollowUpReadyCardProps) {
  // Always show — use demo content if no real draft exists
  const subject = draft?.subject || 'Great connecting — proposal and next steps';
  const body = draft?.body || 'Hi Sarah,\n\nGreat speaking with you today. I wanted to follow up on the key points we discussed and outline the next steps we agreed on.\n\nI\'ll send over the revised proposal by Thursday. Looking forward to connecting again next week.';
  const meetingTopic = draft?.meetingTopic || 'Sales Discovery Call';
  const generationMs = draft?.generationMs || 4200;
  const draftId = draft?.id;
  const isDemo = !draft;

  const bodyPreview = body.split('\n').filter(Boolean).slice(0, 4).join('\n');

  return (
    <div className="mb-8">
      {/* Ready indicator */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-2 rounded-full bg-[#06B6D4] animate-pulse" />
        <span className="text-xs font-semibold text-[#06B6D4] uppercase tracking-wider">
          Latest Call → Follow-Up Ready
        </span>
        <span className="text-xs text-[#8892B0] light:text-gray-500 ml-auto flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-[#06B6D4]" />
          Generated in {(generationMs / 1000).toFixed(0)}s from {meetingTopic}
        </span>
      </div>

      {/* Main card */}
      <div className="rounded-2xl bg-[#0F172A] light:bg-white border border-[#06B6D4]/20 light:border-gray-200 p-6 md:p-8 shadow-lg shadow-[#06B6D4]/5 light:shadow-gray-200/50">
        {/* Subject */}
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-[#06B6D4]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Mail className="w-5 h-5 text-[#06B6D4]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-[#8892B0] light:text-gray-500 mb-1">Subject</p>
            <h2 className="text-lg font-bold text-white light:text-gray-900 truncate">{subject}</h2>
          </div>
        </div>

        {/* Body preview */}
        <div className="rounded-xl bg-[#0A1020] light:bg-gray-50 border border-[#1E2A4A] light:border-gray-200 p-5 mb-6">
          <p className="text-sm text-[#C0C8E0] light:text-gray-600 leading-relaxed whitespace-pre-wrap line-clamp-4">
            {bodyPreview}
          </p>
          {isDemo && (
            <p className="text-[10px] text-[#8892B0]/60 light:text-gray-400 mt-3 uppercase tracking-wider">
              Sample — connect a meeting platform to see your real follow-ups here
            </p>
          )}
        </div>

        {/* Microcopy */}
        <div className="flex items-center gap-4 mb-5 text-xs text-[#8892B0] light:text-gray-500">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-[#06B6D4]" />
            Ready to send
          </span>
          <span>No editing required</span>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href={draftId ? `/dashboard/drafts?id=${draftId}` : '/dashboard/drafts'}
            className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-base font-bold text-black transition-all duration-200 hover:-translate-y-0.5 hover:scale-[1.02]"
            style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)', boxShadow: '0 4px 20px rgba(245,158,11,0.3)' }}
          >
            <Mail className="w-4 h-4" />
            Send Follow-Up
          </Link>
          <Link
            href={draftId ? `/dashboard/drafts?id=${draftId}&edit=true` : '/dashboard/drafts'}
            className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-sm font-semibold text-[#C0C8E0] light:text-gray-700 border border-[#1E2A4A] light:border-gray-300 hover:border-[#6366F1]/40 hover:text-white light:hover:text-gray-900 transition-all duration-200"
          >
            <Edit3 className="w-4 h-4" />
            Edit
          </Link>
          <Link
            href="/dashboard/sequences"
            className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-sm font-semibold text-[#C0C8E0] light:text-gray-700 border border-[#1E2A4A] light:border-gray-300 hover:border-[#06B6D4]/40 hover:text-white light:hover:text-gray-900 transition-all duration-200"
          >
            <Layers className="w-4 h-4" />
            Approve & Start Sequence
          </Link>
        </div>
      </div>
    </div>
  );
}
