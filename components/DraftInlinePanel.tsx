'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import type { DraftWithMeeting } from '@/lib/dashboard-queries';
import { ConversationalRefine } from './ConversationalRefine';
import { MeetingSummaryCard } from './dashboard/MeetingSummaryCard';
import { TemplatePicker } from './TemplatePicker';
import { DraftFeedback } from './DraftFeedback';
import { ensureHtml } from './RichTextEditor';

// Dynamic import TipTap editor to reduce initial bundle size
const RichTextEditor = dynamic(
  () => import('./RichTextEditor').then((mod) => mod.RichTextEditor),
  {
    ssr: false,
    loading: () => (
      <div className="bg-gray-800/50 rounded-lg border border-gray-600 p-4 min-h-[150px] animate-pulse">
        <div className="h-4 bg-gray-700 rounded w-3/4 mb-2" />
        <div className="h-4 bg-gray-700 rounded w-1/2" />
      </div>
    ),
  }
);

interface MeetingIntelligence {
  id: string;
  topic: string | null;
  platform: string;
  startTime: string | null;
  summary: string | null;
  keyTopics: Array<{ topic: string; duration?: string }> | null;
  keyDecisions: Array<{ decision: string; context?: string }> | null;
  actionItems: Array<{ owner: string; task: string; deadline: string }> | null;
}

interface DraftInlinePanelProps {
  draft: DraftWithMeeting;
  meetingIntel: MeetingIntelligence | null;
  meetingIntelLoading: boolean;
  onDraftUpdated: () => void;
  onClose: () => void;
}

export function DraftInlinePanel({
  draft: initialDraft,
  meetingIntel,
  meetingIntelLoading,
  onDraftUpdated,
  onClose,
}: DraftInlinePanelProps) {
  // Local draft state — allows in-place updates after regeneration
  const [draft, setDraft] = useState(initialDraft);

  // Sync when parent provides a different draft
  useEffect(() => {
    setDraft(initialDraft);
  }, [initialDraft.id]);

  // Mode state
  const [isEditing, setIsEditing] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);

  // Action state
  const [isSending, setIsSending] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copied, setCopied] = useState(false);

  // Feedback
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Edit state
  const [editSubject, setEditSubject] = useState(draft.subject);
  const [editBody, setEditBody] = useState(() => ensureHtml(draft.body));

  // Reset edit state when entering edit mode
  useEffect(() => {
    if (isEditing) {
      setEditSubject(draft.subject);
      setEditBody(ensureHtml(draft.body));
    }
  }, [isEditing, draft.id, draft.subject, draft.body]);

  const hasChanges = editSubject !== draft.subject || editBody !== ensureHtml(draft.body);

  // Handle AI refinement completion
  const handleRefineComplete = useCallback((newSubject: string, newBody: string) => {
    setEditSubject(newSubject);
    setEditBody(ensureHtml(newBody));
    setIsRefining(false);
    setIsEditing(true);
    setSuccess('AI refinement applied — review and save');
    setTimeout(() => setSuccess(null), 3000);
  }, []);

  // Save edited draft
  const handleSave = async () => {
    if (!hasChanges) {
      setIsEditing(false);
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/drafts/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draftId: draft.id, subject: editSubject, body: editBody }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to save');
      }
      setDraft({ ...draft, subject: editSubject, body: editBody });
      setIsEditing(false);
      setSuccess('Draft saved');
      setTimeout(() => setSuccess(null), 2000);
      onDraftUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save draft');
    } finally {
      setIsSaving(false);
    }
  };

  // Send email
  const handleSend = async () => {
    if (!draft.meetingHostEmail) return;
    setIsSending(true);
    setError(null);
    try {
      const res = await fetch('/api/drafts/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draftId: draft.id, recipientEmail: draft.meetingHostEmail }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to send');
      }
      setSuccess('Email sent successfully');
      setTimeout(() => { onDraftUpdated(); onClose(); }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send email');
    } finally {
      setIsSending(false);
    }
  };

  // Regenerate draft
  const handleRegenerate = async (templateId: string) => {
    setIsRegenerating(true);
    setError(null);
    try {
      const res = await fetch('/api/drafts/regenerate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meetingId: draft.meetingId, templateId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to regenerate');

      // Fetch the new draft to display in-place
      const draftRes = await fetch(`/api/drafts/${data.draftId}`);
      if (!draftRes.ok) throw new Error('Failed to load regenerated draft');
      const newDraft: DraftWithMeeting = await draftRes.json();

      setDraft(newDraft);
      setEditSubject(newDraft.subject);
      setEditBody(ensureHtml(newDraft.body));
      setShowTemplatePicker(false);
      setSuccess('Draft regenerated');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to regenerate');
    } finally {
      setIsRegenerating(false);
    }
  };

  // Delete draft
  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/drafts/${draft.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      onDraftUpdated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
      setShowDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  };

  // Copy to clipboard
  const handleCopy = async () => {
    const text = `Subject: ${draft.subject}\n\n${draft.body?.replace(/<[^>]*>/g, '') || ''}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Failed to copy');
    }
  };

  // Render the email body as HTML for preview mode
  const renderBody = () => {
    if (!draft.body) return <p className="text-gray-500 italic">No body content</p>;
    return (
      <div
        className="prose prose-invert prose-sm max-w-none text-gray-300 light:text-gray-600 [&_p]:my-1.5"
        dangerouslySetInnerHTML={{ __html: ensureHtml(draft.body) }}
      />
    );
  };

  return (
    <div className="px-6 py-6 bg-gray-800/40 light:bg-gray-50/80 border-t border-gray-700/30 light:border-gray-200">
      {/* Error/Success feedback */}
      {error && (
        <div className="mb-4 flex items-center gap-2 px-4 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          {error}
          <button onClick={() => setError(null)} className="ml-auto text-red-400/60 hover:text-red-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      )}
      {success && (
        <div className="mb-4 flex items-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-sm text-indigo-400">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {success}
        </div>
      )}

      {/* Delete confirmation */}
      {showDeleteConfirm ? (
        <div className="flex items-center justify-between gap-3 mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <span className="text-sm text-red-300">Delete this draft permanently?</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowDeleteConfirm(false)} disabled={isDeleting} className="px-3 py-1.5 text-xs font-medium text-gray-300 bg-gray-700 border border-gray-600 rounded-lg hover:bg-gray-600 disabled:opacity-50 transition-colors">Cancel</button>
            <button onClick={handleDelete} disabled={isDeleting} className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors">
              {isDeleting ? 'Deleting\u2026' : 'Confirm Delete'}
            </button>
          </div>
        </div>
      ) : null}

      {/* Split panel layout — Editor left (7/12), Meeting context right (5/12) */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left: Email editing panel */}
        <div className="col-span-7 space-y-4">
          {/* Template picker overlay */}
          {showTemplatePicker ? (
            <TemplatePicker
              onSelect={handleRegenerate}
              onCancel={() => setShowTemplatePicker(false)}
              isRegenerating={isRegenerating}
            />
          ) : isRefining ? (
            <ConversationalRefine
              draftId={draft.id}
              currentSubject={isEditing ? editSubject : draft.subject}
              currentBody={isEditing ? editBody : draft.body}
              onRefineComplete={handleRefineComplete}
              onCancel={() => setIsRefining(false)}
            />
          ) : (
            <>
              {/* Header with actions */}
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-base font-semibold text-white light:text-gray-900 flex items-center gap-2">
                  <svg className="w-5 h-5 text-indigo-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Follow-up Email
                </h3>
                <div className="flex items-center gap-1.5">
                  {/* Copy */}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleCopy(); }}
                    className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700/50 transition-colors"
                    title="Copy to clipboard"
                  >
                    {copied ? (
                      <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                    )}
                  </button>
                  {/* Delete */}
                  {draft.status !== 'sent' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(true); }}
                      className="p-2 text-gray-400 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors"
                      title="Delete draft"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  )}
                </div>
              </div>

              {/* Subject */}
              {isEditing ? (
                <input
                  type="text"
                  value={editSubject}
                  onChange={(e) => setEditSubject(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full px-3 py-2 text-sm font-medium text-white light:text-gray-900 bg-gray-800/80 light:bg-white border border-gray-600 light:border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  placeholder="Subject"
                />
              ) : (
                <div className="text-sm font-medium text-white light:text-gray-900 px-1">
                  {draft.subject || 'Untitled Draft'}
                </div>
              )}

              {/* Recipient */}
              {draft.meetingHostEmail && (
                <p className="text-xs text-gray-400 light:text-gray-500 px-1">
                  To: {draft.meetingHostEmail}
                </p>
              )}

              {/* Body — editor or preview */}
              <div onClick={(e) => e.stopPropagation()}>
                {isEditing ? (
                  <RichTextEditor
                    content={editBody}
                    onChange={setEditBody}
                    placeholder="Write your follow-up email..."
                    minHeight="150px"
                    maxHeight="300px"
                  />
                ) : (
                  <div className="bg-gray-900/50 light:bg-white border border-gray-700/50 light:border-gray-200 rounded-lg p-4 max-h-[300px] overflow-y-auto">
                    {renderBody()}
                  </div>
                )}
              </div>

              {/* Action bar */}
              <div className="flex items-center gap-2 flex-wrap">
                {isEditing ? (
                  <>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleSave(); }}
                      disabled={isSaving || !hasChanges}
                      className="px-4 py-2 text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                    >
                      {isSaving ? 'Saving\u2026' : 'Save'}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setIsEditing(false); }}
                      className="px-4 py-2 text-sm font-medium rounded-lg text-gray-300 bg-gray-700/50 border border-gray-600/50 hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setIsRefining(true); }}
                      className="px-4 py-2 text-sm font-medium rounded-lg text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 transition-colors"
                    >
                      Refine with AI
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
                      className="px-4 py-2 text-sm font-medium rounded-lg text-gray-300 bg-gray-700/50 border border-gray-600/50 hover:bg-gray-700 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setIsRefining(true); }}
                      className="px-4 py-2 text-sm font-medium rounded-lg text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 transition-colors"
                    >
                      Refine with AI
                    </button>
                    {draft.status !== 'sent' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setShowTemplatePicker(true); }}
                        className="px-4 py-2 text-sm font-medium rounded-lg text-gray-300 bg-gray-700/50 border border-gray-600/50 hover:bg-gray-700 transition-colors"
                      >
                        Regenerate
                      </button>
                    )}
                    {draft.status !== 'sent' && draft.meetingHostEmail && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleSend(); }}
                        disabled={isSending}
                        className="px-4 py-2 text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-colors ml-auto"
                      >
                        {isSending ? 'Sending\u2026' : 'Send to Host'}
                      </button>
                    )}
                  </>
                )}
              </div>

              {/* Feedback */}
              <DraftFeedback
                draftId={draft.id}
                initialRating={draft.userRating}
                initialFeedback={draft.userFeedback}
              />
            </>
          )}
        </div>

        {/* Right: Meeting Intelligence context panel */}
        <div className="col-span-5 space-y-4">
          {meetingIntelLoading ? (
            <div className="bg-gradient-to-br from-indigo-500/10 to-indigo-500/10 border border-indigo-500/20 rounded-2xl p-6">
              <div className="space-y-4 animate-pulse">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-5 h-5 bg-indigo-500/30 rounded" />
                  <div className="h-5 w-40 bg-gray-700 rounded" />
                </div>
                <div className="h-4 w-full bg-gray-700 rounded" />
                <div className="h-4 w-5/6 bg-gray-700 rounded" />
                <div className="h-4 w-4/6 bg-gray-700 rounded" />
                <div className="space-y-2 mt-4">
                  <div className="h-3 w-24 bg-gray-700 rounded" />
                  <div className="h-8 bg-gray-700/50 rounded-lg" />
                  <div className="h-8 bg-gray-700/50 rounded-lg" />
                </div>
              </div>
            </div>
          ) : meetingIntel?.summary ? (
            <MeetingSummaryCard
              summary={meetingIntel.summary}
              keyTopics={meetingIntel.keyTopics}
              keyDecisions={meetingIntel.keyDecisions}
              actionItems={meetingIntel.actionItems}
            />
          ) : (
            <div className="flex items-center justify-center py-12 text-sm text-gray-500 bg-gray-800/30 rounded-xl border border-gray-700/30">
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              No meeting summary available
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
