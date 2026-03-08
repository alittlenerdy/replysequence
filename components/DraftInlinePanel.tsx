'use client';

import { useState, useEffect, useCallback, type JSX } from 'react';
import dynamic from 'next/dynamic';
import type { DraftWithMeeting } from '@/lib/dashboard-queries';
import type { MeetingTemplate } from '@/lib/meeting-templates';
import { ConversationalRefine } from './ConversationalRefine';
import { MeetingSummaryCard } from './dashboard/MeetingSummaryCard';
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

const TEMPLATE_ICON_COLORS: Record<string, string> = {
  sales: 'text-amber-400 bg-amber-500/20 border-amber-500/30',
  team: 'text-indigo-400 bg-indigo-500/20 border-indigo-500/30',
  client: 'text-teal-400 bg-teal-500/20 border-teal-500/30',
  technical: 'text-cyan-400 bg-cyan-500/20 border-cyan-500/30',
  general: 'text-gray-400 bg-gray-500/20 border-gray-500/30',
  onboarding: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30',
  strategy: 'text-rose-400 bg-rose-500/20 border-rose-500/30',
};

function TemplateIcon({ icon, className = 'w-4 h-4' }: { icon: string; className?: string }) {
  const icons: Record<string, JSX.Element> = {
    sales: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
    team: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />,
    client: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />,
    technical: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />,
    general: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
    onboarding: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />,
    strategy: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />,
  };
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      {icons[icon] || icons.general}
    </svg>
  );
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

  // Templates — fetched once, always visible
  const [templates, setTemplates] = useState<MeetingTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  useEffect(() => {
    fetch('/api/templates')
      .then((r) => r.ok ? r.json() : { templates: [] })
      .then((d) => setTemplates(d.templates || []))
      .catch(() => {})
      .finally(() => setTemplatesLoading(false));
  }, []);

  // Sender & recipient state
  const [recipientEmail, setRecipientEmail] = useState(initialDraft.meetingHostEmail || '');
  const [senderEmail, setSenderEmail] = useState<string | null>(null);
  const [suggestedRecipients, setSuggestedRecipients] = useState<Array<{ email: string; name?: string }>>([]);
  const [loadingRecipients, setLoadingRecipients] = useState(false);

  useEffect(() => {
    if (draft.status === 'sent' || !draft.meetingId) return;
    // Fetch sender info
    fetch('/api/email/sender-info')
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d?.email) setSenderEmail(d.email); })
      .catch(() => {});
    // Fetch suggested recipients
    setLoadingRecipients(true);
    fetch(`/api/meetings/${draft.meetingId}/recipients`)
      .then((r) => r.ok ? r.json() : { recipients: [] })
      .then((d) => {
        const recipients = d.recipients || [];
        setSuggestedRecipients(recipients);
        if (!recipientEmail && recipients.length > 0) {
          setRecipientEmail(recipients[0].email);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingRecipients(false));
  }, [draft.meetingId, draft.status]); // eslint-disable-line react-hooks/exhaustive-deps

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
    if (!recipientEmail) {
      setError('Please enter a recipient email address');
      return;
    }
    setIsSending(true);
    setError(null);
    try {
      const res = await fetch('/api/drafts/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draftId: draft.id, recipientEmail }),
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
    <div className="px-6 py-6 bg-gradient-to-b from-gray-800/60 to-gray-800/30 light:from-gray-50 light:to-white border-t-2 border-indigo-500/40 light:border-indigo-400/30">
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
        <div className="mb-4 flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-sm text-emerald-400">
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
          {isRefining ? (
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
                  <div className="p-1.5 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 shadow-sm shadow-indigo-500/30">
                    <svg className="w-4 h-4 text-white shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
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

              {/* Recipient — shown inline when draft is sent */}
              {draft.status === 'sent' && draft.meetingHostEmail && (
                <p className="text-xs text-gray-400 light:text-gray-500 px-1">
                  Sent to: {draft.meetingHostEmail}
                </p>
              )}

              {/* Body — editor or preview */}
              <div onClick={(e) => e.stopPropagation()}>
                {isEditing ? (
                  <RichTextEditor
                    content={editBody}
                    onChange={setEditBody}
                    placeholder="Write your follow-up email..."
                    minHeight="200px"
                    maxHeight="500px"
                  />
                ) : (
                  <div className="bg-gray-900/50 light:bg-white border border-gray-700/50 light:border-gray-200 rounded-lg p-4 max-h-[500px] overflow-y-auto">
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
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg text-white bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-sm shadow-emerald-500/25 disabled:opacity-50 transition-all"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
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
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg text-violet-300 bg-violet-500/15 border border-violet-500/30 hover:bg-violet-500/25 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                      Refine with AI
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg text-sky-300 bg-sky-500/10 border border-sky-500/25 hover:bg-sky-500/20 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      Edit
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setIsRefining(true); }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg text-violet-300 bg-violet-500/15 border border-violet-500/30 hover:bg-violet-500/25 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                      Refine with AI
                    </button>
                    {draft.status !== 'sent' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleRegenerate('default'); }}
                        disabled={isRegenerating}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg text-orange-300 bg-orange-500/10 border border-orange-500/25 hover:bg-orange-500/20 disabled:opacity-50 transition-colors"
                      >
                        <svg className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                        {isRegenerating ? 'Regenerating\u2026' : 'Regenerate'}
                      </button>
                    )}
                  </>
                )}
              </div>

              {/* Send section — recipient selection + sender info */}
              {draft.status !== 'sent' && (
                <div className="pt-3 border-t border-gray-700/30 space-y-3" onClick={(e) => e.stopPropagation()}>
                  {/* Suggested recipients */}
                  {suggestedRecipients.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-xs text-gray-400 flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Meeting attendees
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {suggestedRecipients.map((r) => (
                          <button
                            key={r.email}
                            onClick={() => setRecipientEmail(r.email)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-full transition-colors ${
                              recipientEmail === r.email
                                ? 'bg-indigo-500/30 text-indigo-300 border border-indigo-500/50'
                                : 'bg-gray-700/50 text-gray-300 border border-gray-600 hover:bg-gray-700 hover:text-white'
                            }`}
                            title={r.name ? `${r.name} <${r.email}>` : r.email}
                          >
                            <span className="truncate max-w-[140px]">{r.name || r.email.split('@')[0]}</span>
                            {recipientEmail === r.email && (
                              <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {loadingRecipients && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Loading meeting attendees...
                    </div>
                  )}

                  {/* Sender info */}
                  {senderEmail && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Sending from <span className="text-gray-300">{senderEmail}</span>
                    </div>
                  )}

                  {/* Recipient input + Send button */}
                  <div className="flex gap-2">
                    <input
                      type="email"
                      placeholder="Recipient email address"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      className="flex-1 px-3 py-2 text-sm text-white light:text-gray-900 bg-gray-900/60 light:bg-white border border-gray-600 light:border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none placeholder:text-gray-500"
                      autoComplete="email"
                    />
                    <button
                      onClick={handleSend}
                      disabled={isSending || !recipientEmail}
                      className="inline-flex items-center gap-1.5 px-5 py-2 text-sm font-medium rounded-lg text-white bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 shadow-sm shadow-indigo-500/25 disabled:opacity-50 transition-all"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                      {isSending ? 'Sending\u2026' : 'Send'}
                    </button>
                  </div>
                </div>
              )}

              {/* Feedback */}
              <DraftFeedback
                draftId={draft.id}
                initialRating={draft.userRating}
                initialFeedback={draft.userFeedback}
              />

              {/* Template strip — always visible */}
              {!templatesLoading && templates.length > 0 && (
                <div className="pt-3 border-t border-gray-700/30">
                  <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" /></svg>
                    Regenerate with Template
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {templates.map((t) => {
                      const color = TEMPLATE_ICON_COLORS[t.icon] || TEMPLATE_ICON_COLORS.general;
                      return (
                        <button
                          key={t.id}
                          onClick={(e) => { e.stopPropagation(); handleRegenerate(t.id); }}
                          disabled={isRegenerating}
                          title={t.description}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 ${color}`}
                        >
                          <TemplateIcon icon={t.icon} className="w-3.5 h-3.5" />
                          {t.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
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
              compact
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
