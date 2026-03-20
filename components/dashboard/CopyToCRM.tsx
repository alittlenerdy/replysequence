'use client';

import { useState, useRef, useEffect } from 'react';
import type { MeetingDetail } from '@/lib/dashboard-queries';

type CopyFormat = 'compact' | 'detailed';

function formatDateForCRM(date: Date | string | null): string {
  if (!date) return 'Unknown';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTimeForCRM(date: Date | string | null): string {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function formatDurationForCRM(minutes: number | null): string {
  if (!minutes) return '';
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function buildCompactText(meeting: MeetingDetail): string {
  const lines: string[] = [];

  // Header
  lines.push(`${meeting.topic || 'Untitled Meeting'}`);
  const dateParts: string[] = [];
  if (meeting.startTime) {
    dateParts.push(formatDateForCRM(meeting.startTime));
    dateParts.push(formatTimeForCRM(meeting.startTime));
  }
  if (meeting.duration) dateParts.push(formatDurationForCRM(meeting.duration));
  if (dateParts.length > 0) lines.push(dateParts.join(' | '));

  // Attendees
  if (meeting.participants.length > 0) {
    const names = meeting.participants
      .map((p) => (p.email ? `${p.user_name} (${p.email})` : p.user_name))
      .join(', ');
    lines.push(`Attendees: ${names}`);
  }

  lines.push('');

  // Summary
  if (meeting.summary) {
    lines.push('SUMMARY');
    lines.push(meeting.summary);
    lines.push('');
  }

  // Key Decisions
  if (meeting.keyDecisions && meeting.keyDecisions.length > 0) {
    lines.push('KEY DECISIONS');
    for (const d of meeting.keyDecisions) {
      lines.push(`- ${d.decision}`);
    }
    lines.push('');
  }

  // Action Items
  if (meeting.actionItems && meeting.actionItems.length > 0) {
    lines.push('ACTION ITEMS');
    for (const item of meeting.actionItems) {
      const parts = [`- [${item.owner}] ${item.task}`];
      if (item.deadline) parts.push(`(due: ${item.deadline})`);
      lines.push(parts.join(' '));
    }
    lines.push('');
  }

  // Sentiment
  if (meeting.sentimentAnalysis) {
    const s = meeting.sentimentAnalysis.overall;
    lines.push(`Sentiment: ${s.label} (${s.score.toFixed(2)}) | Trend: ${s.trend}`);
  }

  return lines.join('\n').trim();
}

function buildDetailedText(meeting: MeetingDetail): string {
  const lines: string[] = [];
  const divider = '----------------------------------------';

  // Header
  lines.push(divider);
  lines.push(`MEETING NOTES: ${meeting.topic || 'Untitled Meeting'}`);
  lines.push(divider);
  lines.push('');

  // Meta
  if (meeting.startTime) {
    lines.push(`Date: ${formatDateForCRM(meeting.startTime)} at ${formatTimeForCRM(meeting.startTime)}`);
  }
  if (meeting.duration) lines.push(`Duration: ${formatDurationForCRM(meeting.duration)}`);
  lines.push(`Platform: ${meeting.platform.replace('_', ' ')}`);

  // Attendees
  if (meeting.participants.length > 0) {
    lines.push('');
    lines.push('ATTENDEES:');
    for (const p of meeting.participants) {
      lines.push(p.email ? `  - ${p.user_name} (${p.email})` : `  - ${p.user_name}`);
    }
  }

  lines.push('');

  // Summary
  if (meeting.summary) {
    lines.push(divider);
    lines.push('MEETING SUMMARY');
    lines.push(divider);
    lines.push('');
    lines.push(meeting.summary);
    lines.push('');
  }

  // Key Topics
  if (meeting.keyTopics && meeting.keyTopics.length > 0) {
    lines.push('TOPICS DISCUSSED:');
    for (const t of meeting.keyTopics) {
      const suffix = t.duration ? ` (${t.duration})` : '';
      lines.push(`  - ${t.topic}${suffix}`);
    }
    lines.push('');
  }

  // Key Decisions
  if (meeting.keyDecisions && meeting.keyDecisions.length > 0) {
    lines.push(divider);
    lines.push('KEY DECISIONS');
    lines.push(divider);
    lines.push('');
    for (const d of meeting.keyDecisions) {
      lines.push(`  * ${d.decision}`);
      if (d.context) lines.push(`    Context: ${d.context}`);
    }
    lines.push('');
  }

  // Action Items
  if (meeting.actionItems && meeting.actionItems.length > 0) {
    lines.push(divider);
    lines.push('ACTION ITEMS');
    lines.push(divider);
    lines.push('');
    for (const item of meeting.actionItems) {
      lines.push(`  [ ] ${item.task}`);
      lines.push(`      Owner: ${item.owner}`);
      if (item.deadline) lines.push(`      Due: ${item.deadline}`);
      lines.push('');
    }
  }

  // Sentiment
  if (meeting.sentimentAnalysis) {
    const s = meeting.sentimentAnalysis.overall;
    lines.push(divider);
    lines.push('MEETING SENTIMENT');
    lines.push(divider);
    lines.push('');
    lines.push(`Overall: ${s.label} (score: ${s.score.toFixed(2)}) | Trend: ${s.trend}`);
    if (s.tones.length > 0) lines.push(`Tones: ${s.tones.join(', ')}`);
    if (meeting.sentimentAnalysis.speakers.length > 0) {
      lines.push('');
      lines.push('By Speaker:');
      for (const sp of meeting.sentimentAnalysis.speakers) {
        lines.push(`  - ${sp.name}: ${sp.label} (${sp.score.toFixed(2)})`);
      }
    }
    lines.push('');
  }

  lines.push(divider);
  lines.push('Exported from ReplySequence');

  return lines.join('\n').trim();
}

interface CopyToCRMProps {
  meeting: MeetingDetail;
}

export function CopyToCRM({ meeting }: CopyToCRMProps) {
  const [copied, setCopied] = useState(false);
  const [format, setFormat] = useState<CopyFormat>('compact');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [dropdownOpen]);

  const handleCopy = async () => {
    const text = format === 'compact' ? buildCompactText(meeting) : buildDetailedText(meeting);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="relative inline-flex" ref={dropdownRef}>
      {/* Copy button */}
      <button
        onClick={handleCopy}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-l-lg border transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060B18] ${
          copied
            ? 'bg-green-500/15 text-green-400 border-green-500/20'
            : 'bg-[#6366F1]/15 text-[#6366F1] border-[#6366F1]/20 hover:bg-[#4F46E5]/25'
        }`}
      >
        {copied ? (
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        )}
        {copied ? 'Copied!' : 'Copy to CRM'}
      </button>

      {/* Format dropdown toggle */}
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="inline-flex items-center px-1.5 py-1.5 text-xs font-medium rounded-r-lg border border-l-0 bg-[#6366F1]/15 text-[#6366F1] border-[#6366F1]/20 hover:bg-[#4F46E5]/25 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060B18]"
        aria-label="Select copy format"
      >
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown menu */}
      {dropdownOpen && (
        <div className="absolute right-0 top-full mt-1 w-40 rounded-lg border border-[#1E2A4A] bg-gray-900 shadow-xl z-50">
          {([
            { value: 'compact' as const, label: 'Compact', desc: 'Bullet points' },
            { value: 'detailed' as const, label: 'Detailed', desc: 'Full paragraphs' },
          ]).map((option) => (
            <button
              key={option.value}
              onClick={() => {
                setFormat(option.value);
                setDropdownOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-xs transition-colors first:rounded-t-lg last:rounded-b-lg ${
                format === option.value
                  ? 'bg-[#6366F1]/15 text-[#6366F1]'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <span className="font-medium">{option.label}</span>
              <span className="block text-[10px] text-gray-500 mt-0.5">{option.desc}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Simple copy-summary button for meeting list rows.
 * Copies just the summary text to clipboard.
 */
interface CopySummaryButtonProps {
  summary: string;
  meetingTopic?: string | null;
}

export function CopySummaryButton({ summary, meetingTopic }: CopySummaryButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent link navigation
    e.stopPropagation();
    const text = meetingTopic
      ? `${meetingTopic}\n\n${summary}`
      : summary;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      title={copied ? 'Copied!' : 'Copy summary'}
      className={`shrink-0 p-1.5 rounded-md transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1]/70 ${
        copied
          ? 'text-green-400 bg-green-500/10'
          : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800 light:hover:text-gray-600 light:hover:bg-gray-100'
      }`}
      aria-label={copied ? 'Summary copied' : 'Copy meeting summary'}
    >
      {copied ? (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )}
    </button>
  );
}
