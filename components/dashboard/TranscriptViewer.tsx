'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, Copy, RefreshCw, Layers, FileText } from 'lucide-react';

interface TranscriptLine {
  speaker: string;
  timestamp: string;
  text: string;
}

interface TranscriptViewerProps {
  meetingName?: string;
  lines?: TranscriptLine[];
  onCopyTranscript?: () => void;
  onRegenerateSummary?: () => void;
  onGenerateSequence?: () => void;
}

const speakerColors: Record<string, string> = {
  'Jimmy': '#5B6CFF',
  'Sarah Chen': '#38E8FF',
  'Mike Rodriguez': '#7A5CFF',
  'You': '#5B6CFF',
};

function getSpeakerColor(speaker: string): string {
  return speakerColors[speaker] || '#FFD75F';
}

const defaultLines: TranscriptLine[] = [
  { speaker: 'Jimmy', timestamp: '00:01', text: 'Thanks for joining, Sarah. I know your team has been evaluating some tools for automating post-meeting follow-ups.' },
  { speaker: 'Sarah Chen', timestamp: '00:18', text: 'Yeah, it has been a real pain point for us. Our SDRs are spending about 45 minutes after each call just writing recap emails.' },
  { speaker: 'Jimmy', timestamp: '00:32', text: 'Forty-five minutes per meeting? How many calls is your team handling daily?' },
  { speaker: 'Sarah Chen', timestamp: '00:38', text: 'Each SDR does about 8 to 10 calls a day. We have 12 SDRs, so you can imagine the scale of the problem.' },
  { speaker: 'Jimmy', timestamp: '00:50', text: 'That is roughly 90 hours a week just on follow-up emails across your team. What happens when someone misses a follow-up?' },
  { speaker: 'Sarah Chen', timestamp: '01:05', text: 'We lose deals. It is that simple. Last quarter we traced at least three lost opportunities back to delayed or missing follow-ups.' },
  { speaker: 'Jimmy', timestamp: '01:18', text: 'And the messaging consistency across the team - how do you handle that currently?' },
  { speaker: 'Sarah Chen', timestamp: '01:26', text: 'Honestly, we don\'t. Everyone has their own style. Mike has been trying to create templates but they go stale fast.' },
  { speaker: 'Mike Rodriguez', timestamp: '01:40', text: 'Yeah, the templates help but they can\'t capture the specific context of each conversation. We need something smarter.' },
  { speaker: 'Jimmy', timestamp: '01:52', text: 'That is exactly the problem ReplySequence solves. Let me show you how it works with your existing HubSpot setup.' },
];

export function TranscriptViewer({
  meetingName = 'Acme Corp - Sales Discovery Call',
  lines = defaultLines,
  onCopyTranscript,
  onRegenerateSummary,
  onGenerateSequence,
}: TranscriptViewerProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLines = useMemo(() => {
    if (!searchQuery.trim()) return lines;
    const q = searchQuery.toLowerCase();
    return lines.filter(
      (line) =>
        line.text.toLowerCase().includes(q) || line.speaker.toLowerCase().includes(q)
    );
  }, [lines, searchQuery]);

  function highlightText(text: string, query: string): React.ReactNode {
    if (!query.trim()) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-[#FFD75F]/30 text-white light:text-gray-900 rounded px-0.5">
          {part}
        </mark>
      ) : (
        part
      )
    );
  }

  return (
    <motion.div
      className="rounded-2xl bg-gray-900/60 border border-gray-700/50 light:bg-white light:border-gray-200 p-5"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.25 }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#38E8FF]/10 flex items-center justify-center">
            <FileText className="w-4 h-4 text-[#38E8FF]" strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white light:text-gray-900">Transcript</h3>
            <p className="text-[11px] text-gray-500 light:text-gray-400 truncate max-w-[200px]">{meetingName}</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search transcript..."
          className="w-full pl-8 pr-3 py-2 text-xs bg-gray-800/60 light:bg-gray-50 border border-gray-700/30 light:border-gray-200 rounded-lg text-white light:text-gray-900 placeholder:text-gray-500 focus:outline-none focus:border-[#5B6CFF]/40 transition-colors"
        />
      </div>

      {/* Transcript */}
      <div className="space-y-0.5 max-h-[320px] overflow-y-auto pr-1 scrollbar-thin">
        {filteredLines.map((line, i) => {
          const color = getSpeakerColor(line.speaker);
          return (
            <motion.div
              key={i}
              className="flex gap-3 py-2 group"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.03 }}
            >
              <span className="text-[10px] text-gray-600 light:text-gray-400 tabular-nums mt-0.5 shrink-0 w-10 text-right">
                {line.timestamp}
              </span>
              <div className="flex-1 min-w-0">
                <span
                  className="text-[11px] font-semibold mr-1.5"
                  style={{ color }}
                >
                  {line.speaker}
                </span>
                <span className="text-xs text-gray-300 light:text-gray-600 leading-relaxed">
                  {highlightText(line.text, searchQuery)}
                </span>
              </div>
            </motion.div>
          );
        })}
        {filteredLines.length === 0 && searchQuery && (
          <div className="text-center py-6">
            <p className="text-xs text-gray-500">No matches found</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-800/50 light:border-gray-100">
        <button
          onClick={onCopyTranscript}
          className="text-[11px] text-gray-400 hover:text-white light:hover:text-gray-900 transition-colors flex items-center gap-1 px-2 py-1.5 rounded-md hover:bg-white/5 light:hover:bg-gray-100"
        >
          <Copy className="w-3 h-3" /> Copy
        </button>
        <button
          onClick={onRegenerateSummary}
          className="text-[11px] text-gray-400 hover:text-white light:hover:text-gray-900 transition-colors flex items-center gap-1 px-2 py-1.5 rounded-md hover:bg-white/5 light:hover:bg-gray-100"
        >
          <RefreshCw className="w-3 h-3" /> Regenerate Summary
        </button>
        <button
          onClick={onGenerateSequence}
          className="text-[11px] text-[#7A5CFF] hover:text-[#9B7FFF] transition-colors flex items-center gap-1 px-2 py-1.5 rounded-md hover:bg-[#7A5CFF]/10 ml-auto"
        >
          <Layers className="w-3 h-3" /> Generate Sequence
        </button>
      </div>
    </motion.div>
  );
}
