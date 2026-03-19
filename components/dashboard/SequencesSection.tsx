'use client';

import { useState, useEffect, useCallback } from 'react';
import { SequenceCard } from './SequenceCard';
import type { SequenceStatus, SequenceStepStatus, SequencePauseReason } from '@/lib/db/schema';

interface SequenceStepData {
  id: string;
  stepNumber: number;
  stepType: string;
  subject: string;
  body: string;
  delayHours: number;
  scheduledAt: string | null;
  status: SequenceStepStatus;
  sentAt: string | null;
  openedAt: string | null;
  clickedAt: string | null;
  repliedAt: string | null;
  errorMessage: string | null;
}

interface SequenceData {
  id: string;
  recipientEmail: string;
  recipientName: string | null;
  status: SequenceStatus;
  pauseReason: SequencePauseReason | null;
  totalSteps: number;
  completedSteps: number;
  meetingTopic: string | null;
  createdAt: string;
  steps: SequenceStepData[];
}

interface CreateSequenceFormProps {
  meetingId: string;
  participants: { user_name: string; email?: string | null }[];
  drafts: { id: string; subject: string; sentTo?: string | null; status: string }[];
  onCreated: () => void;
}

function CreateSequenceForm({ meetingId, participants, drafts, onCreated }: CreateSequenceFormProps) {
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [draftId, setDraftId] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  // Filter to sent drafts for linking
  const sentDrafts = drafts.filter(d => d.status === 'sent');

  const handleParticipantSelect = (email: string) => {
    setRecipientEmail(email);
    const participant = participants.find(p => p.email === email);
    if (participant) {
      setRecipientName(participant.user_name);
    }
  };

  const handleCreate = async () => {
    if (!recipientEmail || !recipientName) {
      setError('Recipient email and name are required');
      return;
    }
    setIsCreating(true);
    setError(null);
    try {
      const res = await fetch('/api/sequences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meetingId,
          recipientEmail,
          recipientName,
          ...(draftId ? { draftId } : {}),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Failed to create sequence');
        return;
      }
      setRecipientEmail('');
      setRecipientName('');
      setDraftId('');
      setIsOpen(false);
      onCreated();
    } catch {
      setError('Failed to create sequence');
    } finally {
      setIsCreating(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-[#6366F1]/15 text-[#6366F1] border border-[#6366F1]/20 hover:bg-[#4F46E5]/25 transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        New Sequence
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-[#6366F1]/20 bg-[#6366F1]/5 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-200 light:text-gray-800">Create Follow-Up Sequence</h4>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-500 hover:text-gray-300 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Participant quick-select */}
      {participants.filter(p => p.email).length > 0 && (
        <div>
          <label className="text-xs text-gray-400 light:text-gray-500 block mb-1">Select participant</label>
          <div className="flex flex-wrap gap-1.5">
            {participants.filter(p => p.email).map((p, i) => (
              <button
                key={i}
                onClick={() => handleParticipantSelect(p.email!)}
                className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                  recipientEmail === p.email
                    ? 'bg-[#6366F1]/20 text-[#818CF8] border-[#6366F1]/30'
                    : 'bg-gray-800/50 text-gray-400 border-gray-700/50 hover:border-gray-600'
                }`}
              >
                {p.user_name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-400 light:text-gray-500 block mb-1">Recipient name</label>
          <input
            type="text"
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
            placeholder="Jane Smith"
            className="w-full px-3 py-1.5 text-sm rounded-lg bg-gray-800/50 light:bg-white border border-gray-700/50 light:border-gray-200 text-gray-200 light:text-gray-800 placeholder-gray-500 focus:outline-none focus:border-[#6366F1]/50"
          />
        </div>
        <div>
          <label className="text-xs text-gray-400 light:text-gray-500 block mb-1">Recipient email</label>
          <input
            type="email"
            value={recipientEmail}
            onChange={(e) => setRecipientEmail(e.target.value)}
            placeholder="jane@example.com"
            className="w-full px-3 py-1.5 text-sm rounded-lg bg-gray-800/50 light:bg-white border border-gray-700/50 light:border-gray-200 text-gray-200 light:text-gray-800 placeholder-gray-500 focus:outline-none focus:border-[#6366F1]/50"
          />
        </div>
      </div>

      {/* Optional draft link */}
      {sentDrafts.length > 0 && (
        <div>
          <label className="text-xs text-gray-400 light:text-gray-500 block mb-1">Link to sent draft (optional)</label>
          <select
            value={draftId}
            onChange={(e) => setDraftId(e.target.value)}
            className="w-full px-3 py-1.5 text-sm rounded-lg bg-gray-800/50 light:bg-white border border-gray-700/50 light:border-gray-200 text-gray-200 light:text-gray-800 focus:outline-none focus:border-[#6366F1]/50"
          >
            <option value="">None</option>
            {sentDrafts.map(d => (
              <option key={d.id} value={d.id}>
                {d.subject} {d.sentTo ? `(to ${d.sentTo})` : ''}
              </option>
            ))}
          </select>
        </div>
      )}

      {error && <p className="text-xs text-red-400">{error}</p>}

      <div className="flex justify-end gap-2">
        <button
          onClick={() => setIsOpen(false)}
          className="px-3 py-1.5 text-xs font-medium rounded-lg text-gray-400 hover:text-gray-200 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleCreate}
          disabled={isCreating || !recipientEmail || !recipientName}
          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[#6366F1] text-white hover:bg-[#4F46E5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isCreating ? 'Creating...' : 'Generate Sequence'}
        </button>
      </div>
    </div>
  );
}

interface SequencesSectionProps {
  meetingId: string;
  participants: { user_name: string; email?: string | null }[];
  drafts: { id: string; subject: string; sentTo?: string | null; status: string }[];
}

export function SequencesSection({ meetingId, participants, drafts }: SequencesSectionProps) {
  const [sequences, setSequences] = useState<SequenceData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSequences = useCallback(async () => {
    try {
      const res = await fetch('/api/sequences');
      if (!res.ok) return;
      const data = await res.json();
      // Filter to sequences for this meeting
      const meetingSequences = (data.sequences || []).filter(
        (s: SequenceData & { meetingId?: string }) => s.meetingId === meetingId
      );
      setSequences(meetingSequences);
    } catch {
      // Silently fail — sequences aren't critical
    } finally {
      setIsLoading(false);
    }
  }, [meetingId]);

  useEffect(() => {
    fetchSequences();
  }, [fetchSequences]);

  if (isLoading) {
    return (
      <div className="bg-gray-900/50 light:bg-white border border-gray-700 light:border-gray-200 rounded-2xl p-6 light:shadow-sm">
        <div className="animate-pulse space-y-3">
          <div className="h-5 w-40 bg-gray-700 light:bg-gray-200 rounded" />
          <div className="h-20 bg-gray-700/50 light:bg-gray-100 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900/50 light:bg-white border border-gray-700 light:border-gray-200 rounded-2xl p-6 light:shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white light:text-gray-900 flex items-center gap-2">
          <svg className="w-5 h-5 text-[#6366F1]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          Follow-Up Sequences {sequences.length > 0 && `(${sequences.length})`}
        </h2>
        <CreateSequenceForm
          meetingId={meetingId}
          participants={participants}
          drafts={drafts}
          onCreated={fetchSequences}
        />
      </div>

      {sequences.length === 0 ? (
        <div className="text-center py-6">
          <svg className="w-10 h-10 text-gray-600 light:text-gray-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <p className="text-sm text-gray-400 light:text-gray-500">No follow-up sequences yet</p>
          <p className="text-xs text-gray-500 mt-1">Create a sequence to auto-send check-ins, nudges, and closing emails</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sequences.map((seq) => (
            <SequenceCard
              key={seq.id}
              sequence={seq}
              onStatusChange={fetchSequences}
            />
          ))}
        </div>
      )}
    </div>
  );
}
