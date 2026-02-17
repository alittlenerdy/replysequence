'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import type { DraftWithMeeting } from '@/lib/dashboard-queries';
import { StatusBadge } from './ui/StatusBadge';
import { DraftQualityBadge } from './ui/DraftQualityBadge';
import { ConversationalRefine } from './ConversationalRefine';
import { MeetingSummaryPanel } from './MeetingSummaryPanel';
import { TemplatePicker } from './TemplatePicker';

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

export function DraftPreviewModal({ draft, onClose, onDraftUpdated }: DraftPreviewModalProps) {
  const isMounted = useHydrationSafe();
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
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState(draft.meetingHostEmail || '');
  const [suggestedRecipients, setSuggestedRecipients] = useState<SuggestedRecipient[]>([]);
  const [loadingRecipients, setLoadingRecipients] = useState(false);

  // Edit state
  const [editSubject, setEditSubject] = useState(draft.subject);
  const [editBody, setEditBody] = useState(draft.body);

  // Handle AI refinement completion
  const handleRefineComplete = useCallback((newSubject: string, newBody: string) => {
    setEditSubject(newSubject);
    setEditBody(newBody);
    setIsRefining(false);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onDraftUpdated();
    }, 1500);
  }, [onDraftUpdated]);

  // Reset edit state when entering edit mode
  useEffect(() => {
    if (isEditing) {
      setEditSubject(draft.subject);
      setEditBody(draft.body);
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
          onClose();
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
  }, [showSendConfirm, showDeleteConfirm, isEditing, isRefining, showTemplatePicker, onClose, recipientEmail, draft.status]);

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

      setShowTemplatePicker(false);
      onDraftUpdated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to regenerate draft');
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop with blur - hidden on mobile since modal is full screen */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity hidden md:block"
        onClick={onClose}
      />

      {/* Modal - Full screen on mobile, centered dialog on desktop */}
      <div className="min-h-full md:flex md:items-center md:justify-center md:p-4">
        <div className="relative w-full min-h-screen md:min-h-0 md:max-w-3xl bg-gray-900 md:border md:border-gray-700 md:rounded-2xl shadow-2xl transform transition-all animate-modal-in">
          {/* Header - sticky on mobile for easy close access */}
          <div className="sticky top-0 z-10 px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-700 bg-gray-800/95 backdrop-blur-sm md:rounded-t-2xl">
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
                  onClick={onClose}
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
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <svg className="w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Send this email?</h3>
                <div className="space-y-2 mb-6">
                  <p className="text-gray-400">This will send the email to:</p>
                  <p className="text-white font-medium">{recipientEmail}</p>
                  <p className="text-sm text-gray-500">Subject: {editSubject || draft.subject}</p>
                  {senderEmail ? (
                    <p className="text-xs text-gray-500">
                      From: <span className="text-gray-300">{senderEmail}</span>
                      <span className="ml-1 text-gray-600">via {senderProvider === 'gmail' ? 'Gmail' : senderProvider === 'outlook' ? 'Outlook' : senderProvider}</span>
                    </p>
                  ) : (
                    <p className="text-xs text-gray-500">
                      From: <span className="text-gray-300">noreply@replysequence.com</span>
                      <span className="ml-1 text-gray-600">via ReplySequence</span>
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
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
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
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder:text-gray-500"
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
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
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
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
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
                            <kbd className="ml-1 px-1.5 py-0.5 text-[10px] font-mono bg-blue-700/50 rounded border border-blue-500/30">
                              {typeof navigator !== 'undefined' && /Mac/.test(navigator.userAgent) ? '\u2318' : 'Ctrl'}+S
                            </kbd>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Meeting Info */}
                    <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                      <h3 className="text-sm font-medium text-gray-400 mb-2">Meeting</h3>
                      <p className="text-white font-medium">{draft.meetingTopic || 'Untitled Meeting'}</p>
                      <p className="text-sm text-gray-400 mt-1">{formatDate(draft.meetingStartTime)}</p>
                    </div>

                    {/* Meeting Summary */}
                    <MeetingSummaryPanel meetingId={draft.meetingId} />

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
                      <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 whitespace-pre-wrap text-gray-200 font-mono text-sm leading-relaxed">
                        {draft.body}
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-700">
                      <div>
                        <p className="text-xs text-gray-500">Model</p>
                        <p className="text-sm font-medium text-gray-300">{draft.model}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Tokens</p>
                        <p className="text-sm font-medium text-gray-300">
                          {draft.inputTokens ?? 0} in / {draft.outputTokens ?? 0} out
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Cost</p>
                        <p className="text-sm font-medium text-gray-300">
                          {draft.costUsd ? `$${parseFloat(draft.costUsd).toFixed(4)}` : '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Latency</p>
                        <p className="text-sm font-medium text-gray-300">
                          {formatDuration(draft.generationDurationMs)}
                        </p>
                      </div>
                    </div>

                    {/* Quality Scores Detail */}
                    {draft.qualityScore !== null && (
                      <div className="pt-4 border-t border-gray-700">
                        <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
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
                        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                          <h4 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            Email Engagement
                          </h4>
                          <div className="grid grid-cols-3 gap-4">
                            {/* Opens */}
                            <div className="text-center">
                              <div className={`text-2xl font-bold ${(draft.openCount ?? 0) > 0 ? 'text-purple-400' : 'text-gray-500'}`}>
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
                              <div className={`text-2xl font-bold ${draft.repliedAt ? 'text-emerald-400' : 'text-gray-500'}`}>
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
                            <div className="mt-3 pt-3 border-t border-gray-700 text-xs text-gray-500 text-center">
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
                            <div className="mt-3 pt-3 border-t border-gray-700 text-xs text-gray-500 text-center">
                              No engagement tracked yet. Opens are recorded when recipients view the email.
                            </div>
                          )}
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>

              {/* Footer */}
              {!isEditing && !isRefining && !showTemplatePicker ? (
                <div className="px-6 py-4 border-t border-gray-700 bg-gray-800/50 rounded-b-2xl">
                  {sendSuccess ? (
                    <div className="flex items-center justify-center gap-2 text-green-400 py-2">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="font-medium">Email sent successfully!</span>
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
                                    ? 'bg-blue-500/30 text-blue-300 border border-blue-500/50'
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

                      {/* Sender account indicator */}
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        {senderEmail ? (
                          <span>Sending from <span className="text-gray-300">{senderEmail}</span></span>
                        ) : (
                          <span>Sending from <span className="text-gray-300">noreply@replysequence.com</span></span>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-1">
                          <label htmlFor="recipient" className="sr-only">Recipient Email</label>
                          <input
                            id="recipient"
                            type="email"
                            placeholder="Recipient email address"
                            value={recipientEmail}
                            onChange={(e) => setRecipientEmail(e.target.value)}
                            className="w-full px-3 py-2 text-sm text-white bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-500"
                          />
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <button
                            onClick={() => setShowTemplatePicker(true)}
                            className="px-4 py-2 text-sm font-medium text-orange-400 bg-orange-500/10 border border-orange-500/30 rounded-lg hover:bg-orange-500/20 transition-colors flex items-center gap-2"
                            title="Regenerate with a different template"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            <span className="hidden sm:inline">Regenerate</span>
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
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
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
                                <kbd className="hidden sm:inline-block ml-1 px-1.5 py-0.5 text-[10px] font-mono bg-blue-700/50 rounded border border-blue-500/30">
                                  {typeof navigator !== 'undefined' && /Mac/.test(navigator.userAgent) ? '\u2318' : 'Ctrl'}+\u21B5
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
