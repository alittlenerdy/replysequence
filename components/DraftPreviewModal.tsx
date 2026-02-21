'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import type { DraftWithMeeting } from '@/lib/dashboard-queries';
import { StatusBadge } from './ui/StatusBadge';
import { DraftQualityBadge } from './ui/DraftQualityBadge';
import { ConversationalRefine } from './ConversationalRefine';
import { MeetingSummaryPanel } from './MeetingSummaryPanel';
import { TemplatePicker } from './TemplatePicker';
import { DraftFeedback } from './DraftFeedback';
import { getTemplatesForMeetingType, MEETING_TEMPLATES } from '@/lib/meeting-templates';
import type { MeetingType } from '@/lib/meeting-type-detector';

// Hydration-safe date formatting
function useHydrationSafe() {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);
  return isMounted;
}

function formatDateSafe(date: Date | string | null, isMounted: boolean, options?: Intl.DateTimeFormatOptions): string {
  if (!date) return '-';
  if (!isMounted) return '...';
  return new Date(date).toLocaleDateString('en-US', options || { month: 'short', day: 'numeric' });
}

// Import ensureHtml to normalize plain text to HTML for the editor and preview
import { ensureHtml } from './RichTextEditor';

interface EmailEventTimelineEvent {
  id: string;
  type: string;
  url: string | null;
  occurredAt: string;
  location: string | null;
}

interface EmailEventsData {
  summary: { sent: number; opened: number; clicked: number; replied: number };
  clickedUrls: Array<{ url: string; count: number }>;
  events: EmailEventTimelineEvent[];
}

function EmailEventTimeline({ draftId, isMounted }: { draftId: string; isMounted: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<EmailEventsData | null>(null);
  const [loading, setLoading] = useState(false);

  const loadEvents = useCallback(async () => {
    if (data || loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/drafts/${draftId}/events`);
      if (res.ok) {
        setData(await res.json());
      }
    } catch {
      // Silently fail — aggregates are still visible
    } finally {
      setLoading(false);
    }
  }, [draftId, data, loading]);

  const handleToggle = () => {
    const opening = !isOpen;
    setIsOpen(opening);
    if (opening) loadEvents();
  };

  const eventConfig: Record<string, { label: string; color: string; icon: string }> = {
    sent: { label: 'Sent', color: 'text-green-400', icon: 'M5 13l4 4L19 7' },
    opened: { label: 'Opened', color: 'text-indigo-400', icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
    clicked: { label: 'Clicked', color: 'text-amber-400', icon: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1' },
    replied: { label: 'Replied', color: 'text-indigo-400', icon: 'M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6' },
    bounced: { label: 'Bounced', color: 'text-red-400', icon: 'M12 9v2m0 4h.01' },
  };

  return (
    <div className="mt-3 pt-3 border-t border-white/[0.06]">
      <button
        onClick={handleToggle}
        className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-400 transition-colors w-full"
      >
        <svg className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        Activity Timeline
        {loading && <span className="ml-1 animate-pulse">...</span>}
      </button>

      {isOpen && data && (
        <div className="mt-3 space-y-1.5">
          {/* Clicked URLs summary */}
          {data.clickedUrls.length > 0 && (
            <div className="mb-3 p-2 rounded-lg bg-amber-500/5 border border-amber-500/10">
              <div className="text-xs font-medium text-amber-400/80 mb-1">Links Clicked</div>
              {data.clickedUrls.map((link, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="text-amber-400 font-medium">{link.count}x</span>
                  <span className="truncate">{link.url}</span>
                </div>
              ))}
            </div>
          )}

          {/* Event timeline */}
          {data.events.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-2">No events recorded</p>
          ) : (
            data.events.slice(0, 20).map((event) => {
              const cfg = eventConfig[event.type] || { label: event.type, color: 'text-gray-400', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' };
              return (
                <div key={event.id} className="flex items-center gap-2 text-xs">
                  <svg className={`w-3 h-3 shrink-0 ${cfg.color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={cfg.icon} />
                  </svg>
                  <span className={cfg.color}>{cfg.label}</span>
                  {event.type === 'clicked' && event.url && (
                    <span className="text-slate-500 truncate max-w-[150px]" title={event.url}>{event.url}</span>
                  )}
                  <span className="ml-auto text-slate-600 shrink-0">
                    {isMounted ? new Date(event.occurredAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '...'}
                  </span>
                </div>
              );
            })
          )}
          {data.events.length > 20 && (
            <p className="text-xs text-slate-500 text-center">+ {data.events.length - 20} more events</p>
          )}
        </div>
      )}
    </div>
  );
}

// Dynamic import TipTap editor to reduce initial bundle size
const RichTextEditor = dynamic(
  () => import('./RichTextEditor').then((mod) => mod.RichTextEditor),
  {
    ssr: false,
    loading: () => (
      <div className="bg-gray-800/50 rounded-lg border border-gray-600 p-4 min-h-[300px] animate-pulse">
        <div className="h-4 bg-gray-700 rounded w-3/4 mb-2" />
        <div className="h-4 bg-gray-700 rounded w-1/2" />
      </div>
    ),
  }
);

interface DraftPreviewModalProps {
  draft: DraftWithMeeting;
  onClose: () => void;
  onDraftUpdated: () => void;
}

interface SuggestedRecipient {
  email: string;
  name?: string;
}

export function DraftPreviewModal({ draft: initialDraft, onClose, onDraftUpdated }: DraftPreviewModalProps) {
  const isMounted = useHydrationSafe();

  // Local draft state — allows in-place updates after regeneration
  const [draft, setDraft] = useState<DraftWithMeeting>(initialDraft);
  const [wasRegenerated, setWasRegenerated] = useState(false);

  // Sync when parent provides a genuinely different draft
  useEffect(() => {
    setDraft(initialDraft);
    setWasRegenerated(false);
  }, [initialDraft.id]);

  // Close handler — refreshes parent data if a regeneration occurred
  const handleModalClose = useCallback(() => {
    if (wasRegenerated) {
      onDraftUpdated(); // Refresh parent list + close
    } else {
      onClose();
    }
  }, [wasRegenerated, onDraftUpdated, onClose]);

  const [isEditing, setIsEditing] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSendConfirm, setShowSendConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [regenerateSuccess, setRegenerateSuccess] = useState(false);
  const [hubspotDetails, setHubspotDetails] = useState<{
    synced: boolean;
    contactFound: boolean;
    contactName?: string;
    error?: string;
  } | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [suggestedRecipients, setSuggestedRecipients] = useState<SuggestedRecipient[]>([]);
  const [loadingRecipients, setLoadingRecipients] = useState(false);

  // Edit state - normalize body to HTML for the rich text editor
  const [editSubject, setEditSubject] = useState(draft.subject);
  const [editBody, setEditBody] = useState(() => ensureHtml(draft.body));

  // Handle AI refinement completion - normalize body to HTML
  const handleRefineComplete = useCallback((newSubject: string, newBody: string) => {
    setEditSubject(newSubject);
    setEditBody(ensureHtml(newBody));
    setIsRefining(false);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onDraftUpdated();
    }, 1500);
  }, [onDraftUpdated]);

  // Reset edit state when entering edit mode - normalize body to HTML
  useEffect(() => {
    if (isEditing) {
      setEditSubject(draft.subject);
      setEditBody(ensureHtml(draft.body));
      console.log('[EDIT-1] Opening draft editor, id:', draft.id);
    }
  }, [isEditing, draft.id, draft.subject, draft.body]);

  // Sender info - which email account will be used
  const [senderEmail, setSenderEmail] = useState<string | null>(null);
  const [senderProvider, setSenderProvider] = useState<string | null>(null);

  useEffect(() => {
    if (draft.status === 'sent' || !draft.meetingId) return;
    fetch('/api/email/sender-info')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.email) {
          setSenderEmail(data.email);
          setSenderProvider(data.provider);
        }
      })
      .catch(() => {});
  }, [draft.meetingId, draft.status]);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (showSendConfirm) {
          setShowSendConfirm(false);
        } else if (showDeleteConfirm) {
          setShowDeleteConfirm(false);
        } else if (isEditing) {
          setIsEditing(false);
        } else if (isRefining) {
          setIsRefining(false);
        } else if (showTemplatePicker) {
          setShowTemplatePicker(false);
        } else {
          handleModalClose();
        }
      }

      // Cmd/Ctrl+Enter to send (when not editing, refining, or in confirmation)
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        if (showSendConfirm) {
          e.preventDefault();
          confirmSend();
        } else if (!isEditing && !isRefining && !showTemplatePicker && !showDeleteConfirm && draft.status !== 'sent' && recipientEmail) {
          e.preventDefault();
          handleSend();
        }
      }

      // Cmd/Ctrl+S to save (when editing)
      if ((e.metaKey || e.ctrlKey) && e.key === 's' && isEditing) {
        e.preventDefault();
        handleSave();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSendConfirm, showDeleteConfirm, isEditing, isRefining, showTemplatePicker, handleModalClose, recipientEmail, draft.status]);

  // Fetch suggested recipients from meeting attendees
  useEffect(() => {
    async function fetchSuggestedRecipients() {
      if (draft.status === 'sent' || !draft.meetingId) return;

      setLoadingRecipients(true);
      try {
        const response = await fetch(`/api/meetings/${draft.meetingId}/recipients`);
        if (response.ok) {
          const data = await response.json();
          setSuggestedRecipients(data.recipients || []);
        }
      } catch (err) {
        console.error('[DRAFT-MODAL] Error fetching recipients:', err);
      } finally {
        setLoadingRecipients(false);
      }
    }

    fetchSuggestedRecipients();
  }, [draft.meetingId, draft.status]);

  // Auto-fill recipient from suggested recipients (first non-host attendee)
  useEffect(() => {
    if (!recipientEmail && suggestedRecipients.length > 0) {
      setRecipientEmail(suggestedRecipients[0].email);
    }
  }, [suggestedRecipients, recipientEmail]);

  const formatDate = (date: Date | null) => {
    if (!date) return '-';
    if (!isMounted) return '...';
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (ms: number | null) => {
    if (!ms) return '-';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const hasChanges = editSubject !== draft.subject || editBody !== draft.body;

  const handleSave = async () => {
    if (!hasChanges) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    setError(null);
    console.log('[EDIT-2] Saving changes, subject:', editSubject.substring(0, 50));

    try {
      const response = await fetch('/api/drafts/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          draftId: draft.id,
          subject: editSubject,
          body: editBody,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save draft');
      }

      console.log('[EDIT-3] Changes saved successfully');
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setIsEditing(false);
        onDraftUpdated();
      }, 1000);
    } catch (err) {
      console.error('[EDIT-ERROR] Save failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to save draft');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSend = () => {
    if (!recipientEmail) {
      setError('Please enter a recipient email');
      return;
    }
    setShowSendConfirm(true);
  };

  const confirmSend = async () => {
    setShowSendConfirm(false);
    setIsSending(true);
    setError(null);
    console.log('[SEND-1] Sending email, to:', recipientEmail);

    try {
      const response = await fetch('/api/drafts/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draftId: draft.id, recipientEmail }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send email');
      }

      console.log('[SEND-2] Email sent successfully, messageId:', data.messageId);
      if (data.hubspotDetails) {
        setHubspotDetails(data.hubspotDetails);
      }
      setSendSuccess(true);
      setTimeout(() => {
        onDraftUpdated();
      }, 1500);
    } catch (err) {
      console.error('[SEND-ERROR] Send failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to send email');
    } finally {
      setIsSending(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);
    console.log('[DELETE-1] Deleting draft, id:', draft.id);

    try {
      const response = await fetch(`/api/drafts/${draft.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete draft');
      }

      console.log('[DELETE-2] Draft deleted successfully');
      onDraftUpdated();
      onClose();
    } catch (err) {
      console.error('[DELETE-ERROR] Delete failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete draft');
      setShowDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRegenerate = async (templateId: string) => {
    setIsRegenerating(true);
    setError(null);
    setRegenerateSuccess(false);

    try {
      const response = await fetch('/api/drafts/regenerate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meetingId: draft.meetingId, templateId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to regenerate draft');
      }

      // Fetch the full new draft to display in-place
      const draftRes = await fetch(`/api/drafts/${data.draftId}`);
      if (!draftRes.ok) {
        throw new Error('Failed to load regenerated draft');
      }
      const newDraft: DraftWithMeeting = await draftRes.json();

      // Update local state to show the new draft without closing the modal
      setDraft(newDraft);
      setEditSubject(newDraft.subject);
      setEditBody(ensureHtml(newDraft.body));
      setShowTemplatePicker(false);
      setWasRegenerated(true);
      setRegenerateSuccess(true);
      setTimeout(() => setRegenerateSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to regenerate draft');
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop with blur - hidden on mobile since modal is full screen */}
      {/* Uses onMouseDown instead of onClick to prevent stealing focus from inputs */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-md backdrop-saturate-150 transition-opacity hidden md:block"
        onMouseDown={(e) => {
          // Only close if the backdrop itself was clicked (not a child element)
          if (e.target === e.currentTarget) {
            handleModalClose();
          }
        }}
        aria-hidden="true"
      />

      {/* Modal - Full screen on mobile, centered dialog on desktop */}
      <div
        className="min-h-full md:flex md:items-center md:justify-center md:p-4"
        onMouseDown={(e) => {
          // Close only when clicking the wrapper area itself (outside the modal dialog),
          // not when clicking inside the modal dialog.
          if (e.target === e.currentTarget) {
            handleModalClose();
          }
        }}
      >
        <div
          className="relative w-full min-h-screen md:min-h-0 md:max-w-5xl bg-[#0C0C18] md:border md:border-white/[0.06] md:rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5),0_0_80px_rgba(59,130,246,0.05)] transform transition-all animate-modal-in overflow-hidden"
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* Ambient gradient orbs for depth */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden md:rounded-2xl">
            <div className="absolute -top-[200px] -right-[200px] w-[500px] h-[500px] rounded-full bg-indigo-500/[0.04] blur-[100px]" />
            <div className="absolute -bottom-[150px] -left-[150px] w-[400px] h-[400px] rounded-full bg-indigo-500/[0.03] blur-[80px]" />
          </div>
          {/* Header - sticky on mobile for easy close access */}
          <div className="sticky top-0 z-10 px-4 sm:px-6 py-3 sm:py-4 border-b border-white/[0.06] bg-[#16162A]/95 backdrop-blur-sm md:rounded-t-2xl">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <h2 className="text-lg sm:text-xl font-semibold text-white truncate">
                  {showTemplatePicker ? 'Regenerate Draft' : isRefining ? 'AI Refine' : isEditing ? 'Edit Draft' : 'Draft Preview'}
                </h2>
                <StatusBadge status={draft.status} />
                {draft.qualityScore !== null && (
                  <DraftQualityBadge
                    qualityScore={draft.qualityScore}
                    toneScore={draft.toneScore}
                    completenessScore={draft.completenessScore}
                    personalizationScore={draft.personalizationScore}
                    accuracyScore={draft.accuracyScore}
                    gradingNotes={draft.gradingNotes}
                  />
                )}
              </div>
              <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                {/* Delete button */}
                {draft.status !== 'sent' && !isEditing && (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="p-2.5 sm:p-2 text-gray-400 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                    title="Delete draft"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
                <button
                  onClick={handleModalClose}
                  className="p-2.5 sm:p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Delete Confirmation */}
          {showDeleteConfirm ? (
            <div className="px-6 py-8">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                  <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Delete this draft?</h3>
                <p className="text-gray-400 mb-6">This action cannot be undone. The draft will be permanently removed.</p>

                {error ? (
                  <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 p-3 rounded-lg mb-4">
                    {error}
                  </div>
                ) : null}

                <div className="flex justify-center gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={isDeleting}
                    className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 border border-gray-600 rounded-lg hover:bg-gray-600 disabled:opacity-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                  >
                    {isDeleting ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Deleting...
                      </>
                    ) : (
                      'Delete Draft'
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : showSendConfirm ? (
            <div className="px-6 py-8">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-indigo-500/20 flex items-center justify-center">
                  <svg className="w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Send this email?</h3>
                <div className="space-y-2 mb-6">
                  <p className="text-gray-400">This will send the email to:</p>
                  <p className="text-white font-medium">{recipientEmail}</p>
                  <p className="text-sm text-gray-500">Subject: {editSubject || draft.subject}</p>
                  {senderEmail && (
                    <p className="text-xs text-gray-500">
                      From: <span className="text-gray-300">{senderEmail}</span>
                      <span className="ml-1 text-gray-600">via {senderProvider === 'gmail' ? 'Gmail' : senderProvider === 'outlook' ? 'Outlook' : senderProvider}</span>
                    </p>
                  )}
                </div>

                <div className="flex justify-center gap-3">
                  <button
                    onClick={() => setShowSendConfirm(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 border border-gray-600 rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmSend}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    Send Email
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Content */}
              <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
                {showTemplatePicker ? (
                  <div className="space-y-4">
                    {error && (
                      <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 p-3 rounded-lg">
                        {error}
                      </div>
                    )}
                    <TemplatePicker
                      onSelect={handleRegenerate}
                      onCancel={() => { setShowTemplatePicker(false); setError(null); }}
                      isRegenerating={isRegenerating}
                    />
                  </div>
                ) : isRefining ? (
                  <ConversationalRefine
                    draftId={draft.id}
                    currentSubject={draft.subject}
                    currentBody={draft.body}
                    onRefineComplete={handleRefineComplete}
                    onCancel={() => setIsRefining(false)}
                  />
                ) : isEditing ? (
                  <div className="space-y-4">
                    {error ? (
                      <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 p-3 rounded-lg">
                        {error}
                      </div>
                    ) : null}

                    {saveSuccess ? (
                      <div className="flex items-center gap-2 text-green-400 bg-green-500/10 border border-green-500/20 p-3 rounded-lg">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="font-medium">Changes saved!</span>
                      </div>
                    ) : null}

                    {/* Subject Field */}
                    <div>
                      <label htmlFor="subject" className="block text-sm font-medium text-gray-400 mb-1">
                        Subject
                      </label>
                      <input
                        id="subject"
                        type="text"
                        value={editSubject}
                        onChange={(e) => setEditSubject(e.target.value)}
                        className="w-full px-3 py-2 bg-[#12121F] border border-white/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white placeholder:text-slate-500"
                        placeholder="Email subject"
                      />
                    </div>

                    {/* Rich Text Editor */}
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">
                        Email Body
                      </label>
                      <RichTextEditor
                        content={editBody}
                        onChange={setEditBody}
                        placeholder="Write your email..."
                      />
                    </div>

                    {/* Edit Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-white/[0.06]">
                      <button
                        onClick={() => setIsEditing(false)}
                        disabled={isSaving}
                        className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 border border-gray-600 rounded-lg hover:bg-gray-600 disabled:opacity-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={isSaving || !hasChanges}
                        className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                      >
                        {isSaving ? (
                          <>
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Saving...
                          </>
                        ) : (
                          <>
                            Save
                            <kbd className="ml-1 px-1.5 py-0.5 text-[10px] font-mono bg-indigo-700/50 rounded border border-indigo-500/30">
                              {typeof navigator !== 'undefined' && /Mac/.test(navigator.userAgent) ? 'Cmd' : 'Ctrl'}+S
                            </kbd>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Regeneration success banner */}
                    {regenerateSuccess && (
                      <div className="flex items-center gap-2 text-green-400 bg-green-500/10 border border-green-500/20 p-3 rounded-lg animate-fade-in">
                        <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="font-medium">Draft regenerated with new template!</span>
                      </div>
                    )}

                    {/* Subject */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-400 mb-2">Subject</h3>
                      <p className="text-white font-medium text-lg">{draft.subject}</p>
                    </div>

                    {/* Body */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-gray-400">Email Body</h3>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(`Subject: ${draft.subject}\n\n${draft.body}`);
                            setCopied(true);
                            setTimeout(() => setCopied(false), 2000);
                          }}
                          className="flex items-center gap-1 px-2 py-1 text-xs text-gray-400 hover:text-white bg-gray-700/50 hover:bg-gray-700 rounded-md transition-colors"
                          title="Copy email to clipboard"
                        >
                          {copied ? (
                            <>
                              <svg className="w-3.5 h-3.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              <span className="text-green-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                              Copy
                            </>
                          )}
                        </button>
                      </div>
                      <div
                        className="bg-[#16162A]/60 rounded-lg p-4 border border-white/[0.06] text-gray-100 prose prose-invert max-w-none prose-p:my-2 prose-ul:list-disc prose-ul:pl-5 prose-ol:list-decimal prose-ol:pl-5 prose-blockquote:border-l-4 prose-blockquote:border-slate-500 prose-blockquote:pl-4 prose-blockquote:italic prose-code:bg-slate-700 prose-code:px-1 prose-code:rounded prose-code:font-mono prose-code:text-sm"
                        dangerouslySetInnerHTML={{ __html: ensureHtml(draft.body) }}
                      />
                    </div>

                    {/* Template Strip - inline template recommendations */}
                    {draft.status !== 'sent' && !isRegenerating && (() => {
                      const meetingType = (draft.meetingType as MeetingType) || 'general';
                      const relevantTemplates = getTemplatesForMeetingType(meetingType);
                      // Show up to 4 most relevant templates
                      const displayTemplates = relevantTemplates.slice(0, 4);

                      if (displayTemplates.length === 0) return null;

                      const iconColors: Record<string, string> = {
                        sales: 'text-amber-400',
                        team: 'text-indigo-400',
                        client: 'text-indigo-400',
                        technical: 'text-indigo-400',
                        general: 'text-gray-400',
                        onboarding: 'text-cyan-400',
                        strategy: 'text-indigo-400',
                      };

                      return (
                        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                          <span className="text-xs text-slate-500 whitespace-nowrap shrink-0">Try as:</span>
                          {displayTemplates.map((template) => (
                            <button
                              key={template.id}
                              onClick={() => handleRegenerate(template.id)}
                              disabled={isRegenerating}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-white/[0.04] border border-white/[0.08] rounded-full hover:bg-white/[0.08] hover:border-white/[0.12] hover:text-white transition-all duration-200 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed group"
                              title={template.description}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${iconColors[template.icon] || 'text-gray-400'} bg-current shrink-0 group-hover:scale-125 transition-transform`} />
                              {template.name}
                            </button>
                          ))}
                        </div>
                      );
                    })()}

                    {/* Meeting Info */}
                    <div className="bg-[#16162A]/60 rounded-lg p-4 border border-white/[0.06]">
                      <h3 className="text-sm font-medium text-slate-400 mb-2">Meeting</h3>
                      <p className="text-white font-medium">{draft.meetingTopic || 'Untitled Meeting'}</p>
                      <p className="text-sm text-gray-400 mt-1">{formatDate(draft.meetingStartTime)}</p>
                    </div>

                    {/* Meeting Summary (collapsed by default) */}
                    <MeetingSummaryPanel meetingId={draft.meetingId} />

                    {/* Metadata */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-white/[0.06]">
                      <div>
                        <p className="text-xs text-slate-500">Model</p>
                        <p className="text-sm font-medium text-slate-300">{draft.model}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Tokens</p>
                        <p className="text-sm font-medium text-slate-300">
                          {draft.inputTokens ?? 0} in / {draft.outputTokens ?? 0} out
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Cost</p>
                        <p className="text-sm font-medium text-slate-300">
                          {draft.costUsd ? `$${parseFloat(draft.costUsd).toFixed(4)}` : '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Latency</p>
                        <p className="text-sm font-medium text-slate-300">
                          {formatDuration(draft.generationDurationMs)}
                        </p>
                      </div>
                    </div>

                    {/* Quality Scores Detail */}
                    {draft.qualityScore !== null && (
                      <div className="pt-4 border-t border-white/[0.06]">
                        <h3 className="text-sm font-medium text-slate-400 mb-3 flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          AI Quality Analysis
                        </h3>
                        <DraftQualityBadge
                          qualityScore={draft.qualityScore}
                          toneScore={draft.toneScore}
                          completenessScore={draft.completenessScore}
                          personalizationScore={draft.personalizationScore}
                          accuracyScore={draft.accuracyScore}
                          gradingNotes={draft.gradingNotes}
                          showDetails={true}
                        />
                      </div>
                    )}

                    {/* User Feedback */}
                    <DraftFeedback
                      draftId={draft.id}
                      initialRating={draft.userRating}
                      initialFeedback={draft.userFeedback}
                      onFeedbackSubmitted={onDraftUpdated}
                    />

                    {/* Sent Info with Engagement Tracking */}
                    {draft.status === 'sent' && draft.sentAt ? (
                      <div className="space-y-4">
                        <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/20">
                          <div className="flex items-center gap-2 text-green-400">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="font-medium">Sent to {draft.sentTo}</span>
                          </div>
                          <p className="text-sm text-green-400/70 mt-1">{formatDate(draft.sentAt)}</p>
                        </div>

                        {/* Email Engagement Stats */}
                        <div className="bg-[#16162A]/60 rounded-lg p-4 border border-white/[0.06]">
                          <h4 className="text-sm font-medium text-slate-400 mb-3 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            Email Engagement
                          </h4>
                          <div className="grid grid-cols-3 gap-4">
                            {/* Opens */}
                            <div className="text-center">
                              <div className={`text-2xl font-bold ${(draft.openCount ?? 0) > 0 ? 'text-indigo-400' : 'text-gray-500'}`}>
                                {draft.openCount ?? 0}
                              </div>
                              <div className="text-xs text-gray-500">Opens</div>
                              {draft.openedAt && isMounted && (
                                <div className="text-xs text-gray-600 mt-1">
                                  First: {formatDateSafe(draft.openedAt, isMounted)}
                                </div>
                              )}
                            </div>
                            {/* Clicks */}
                            <div className="text-center">
                              <div className={`text-2xl font-bold ${(draft.clickCount ?? 0) > 0 ? 'text-amber-400' : 'text-gray-500'}`}>
                                {draft.clickCount ?? 0}
                              </div>
                              <div className="text-xs text-gray-500">Clicks</div>
                              {draft.clickedAt && isMounted && (
                                <div className="text-xs text-gray-600 mt-1">
                                  First: {formatDateSafe(draft.clickedAt, isMounted)}
                                </div>
                              )}
                            </div>
                            {/* Reply Status */}
                            <div className="text-center">
                              <div className={`text-2xl font-bold ${draft.repliedAt ? 'text-indigo-400' : 'text-gray-500'}`}>
                                {draft.repliedAt ? (
                                  <svg className="w-6 h-6 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                ) : '-'}
                              </div>
                              <div className="text-xs text-gray-500">Replied</div>
                              {draft.repliedAt && isMounted && (
                                <div className="text-xs text-gray-600 mt-1">
                                  {formatDateSafe(draft.repliedAt, isMounted)}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Last Activity */}
                          {draft.lastOpenedAt && isMounted && (
                            <div className="mt-3 pt-3 border-t border-white/[0.06] text-xs text-slate-500 text-center">
                              Last opened: {formatDateSafe(draft.lastOpenedAt, isMounted, {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          )}

                          {/* No activity message */}
                          {!draft.openedAt && !draft.clickedAt && (
                            <div className="mt-3 pt-3 border-t border-white/[0.06] text-xs text-slate-500 text-center">
                              No engagement tracked yet. Opens are recorded when recipients view the email.
                            </div>
                          )}

                          {/* Detailed Activity Timeline */}
                          {(draft.openCount ?? 0) > 0 || (draft.clickCount ?? 0) > 0 ? (
                            <EmailEventTimeline draftId={draft.id} isMounted={isMounted} />
                          ) : null}
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>

              {/* Footer */}
              {!isEditing && !isRefining && !showTemplatePicker ? (
                <div className="px-6 py-4 border-t border-white/[0.06] bg-[#16162A]/60 rounded-b-2xl">
                  {sendSuccess ? (
                    <div className="space-y-1 py-2">
                      <div className="flex items-center justify-center gap-2 text-green-400">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="font-medium">Email sent successfully!</span>
                      </div>
                      {hubspotDetails && (
                        <div className={`flex items-center justify-center gap-1.5 text-xs ${
                          hubspotDetails.synced ? 'text-gray-400' : 'text-yellow-400'
                        }`}>
                          {hubspotDetails.synced ? (
                            <>
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              <span>
                                {hubspotDetails.contactFound
                                  ? `Synced to HubSpot${hubspotDetails.contactName ? ` (${hubspotDetails.contactName})` : ''}`
                                  : 'Logged to HubSpot (contact not found)'}
                              </span>
                            </>
                          ) : (
                            <>
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                              <span>HubSpot sync failed</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  ) : draft.status === 'sent' ? (
                    <div className="flex justify-end">
                      <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 border border-gray-600 rounded-lg hover:bg-gray-600 transition-colors"
                      >
                        Close
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {error ? (
                        <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 p-3 rounded-lg">
                          {error}
                        </div>
                      ) : null}

                      {/* Suggested Recipients from Meeting Attendees */}
                      {suggestedRecipients.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs text-gray-400 flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            Meeting attendees
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {suggestedRecipients.map((recipient) => (
                              <button
                                key={recipient.email}
                                onClick={() => setRecipientEmail(recipient.email)}
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full transition-colors ${
                                  recipientEmail === recipient.email
                                    ? 'bg-indigo-500/30 text-indigo-300 border border-indigo-500/50'
                                    : 'bg-gray-700/50 text-gray-300 border border-gray-600 hover:bg-gray-700 hover:text-white'
                                }`}
                                title={recipient.name ? `${recipient.name} <${recipient.email}>` : recipient.email}
                              >
                                <span className="truncate max-w-[150px]">
                                  {recipient.name || recipient.email.split('@')[0]}
                                </span>
                                {recipientEmail === recipient.email && (
                                  <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {loadingRecipients && (
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Loading meeting attendees...
                        </div>
                      )}

                      {/* Sender account indicator - only show when user has a connected email */}
                      {senderEmail && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          <span>Sending from <span className="text-gray-300">{senderEmail}</span></span>
                        </div>
                      )}

                      {/* Contextual AI settings link */}
                      <a
                        href="/dashboard/settings?tab=ai"
                        className="inline-flex items-center gap-1.5 text-xs text-indigo-400/70 hover:text-indigo-400 transition-colors"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                        </svg>
                        Want all drafts to sound like this? Customize AI
                      </a>

                      <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-1">
                          <label htmlFor="recipient" className="sr-only">Recipient Email</label>
                          <input
                            id="recipient"
                            type="email"
                            placeholder="Recipient email address"
                            value={recipientEmail}
                            onChange={(e) => setRecipientEmail(e.target.value)}
                            className="w-full px-3 py-2 text-sm text-white bg-[#12121F] border border-white/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-slate-500"
                          />
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <button
                            onClick={() => setShowTemplatePicker(true)}
                            className="px-4 py-2 text-sm font-medium text-amber-300 bg-amber-500/15 border border-amber-500/30 rounded-lg hover:bg-amber-500/25 hover:border-amber-500/50 hover:shadow-[0_0_15px_rgba(245,158,11,0.3)] transition-all duration-300 flex items-center gap-2 group"
                            title="Choose a template and regenerate this draft"
                          >
                            <svg className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Regenerate
                          </button>
                          <button
                            onClick={() => setIsRefining(true)}
                            className="px-4 py-2 text-sm font-medium text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 rounded-lg hover:bg-cyan-500/20 transition-colors flex items-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            Refine
                          </button>
                          <button
                            onClick={() => setIsEditing(true)}
                            className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 border border-gray-600 rounded-lg hover:bg-gray-600 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={handleSend}
                            disabled={isSending || !recipientEmail}
                            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                            title="Send email (Cmd+Enter)"
                          >
                            {isSending ? (
                              <>
                                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Sending...
                              </>
                            ) : (
                              <>
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                                Send
                                <kbd className="hidden sm:inline-block ml-1 px-1.5 py-0.5 text-[10px] font-mono bg-indigo-700/50 rounded border border-indigo-500/30">
                                  {typeof navigator !== 'undefined' && /Mac/.test(navigator.userAgent) ? 'Cmd' : 'Ctrl'}+Enter
                                </kbd>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>

      {/* Modal animation styles */}
      <style jsx>{`
        @keyframes modal-in {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        .animate-modal-in {
          animation: modal-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}
