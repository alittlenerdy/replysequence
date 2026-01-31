'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import type { DraftWithMeeting } from '@/lib/dashboard-queries';
import { StatusBadge } from './ui/StatusBadge';

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

export function DraftPreviewModal({ draft, onClose, onDraftUpdated }: DraftPreviewModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState(draft.meetingHostEmail || '');

  // Edit state
  const [editSubject, setEditSubject] = useState(draft.subject);
  const [editBody, setEditBody] = useState(draft.body);

  // Reset edit state when entering edit mode
  useEffect(() => {
    if (isEditing) {
      setEditSubject(draft.subject);
      setEditBody(draft.body);
      console.log('[EDIT-1] Opening draft editor, id:', draft.id);
    }
  }, [isEditing, draft.id, draft.subject, draft.body]);

  const formatDate = (date: Date | null) => {
    if (!date) return '-';
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

  const handleSend = async () => {
    if (!recipientEmail) {
      setError('Please enter a recipient email');
      return;
    }

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

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop with blur */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-3xl bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl transform transition-all animate-modal-in">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-700 bg-gray-800/50 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold text-white">
                  {isEditing ? 'Edit Draft' : 'Draft Preview'}
                </h2>
                <StatusBadge status={draft.status} />
              </div>
              <div className="flex items-center gap-2">
                {/* Delete button */}
                {draft.status !== 'sent' && !isEditing && (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="p-2 text-gray-400 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors"
                    title="Delete draft"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700 transition-colors"
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
          ) : (
            <>
              {/* Content */}
              <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
                {isEditing ? (
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
                          'Save Changes'
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

                    {/* Subject */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-400 mb-2">Subject</h3>
                      <p className="text-white font-medium text-lg">{draft.subject}</p>
                    </div>

                    {/* Body */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-400 mb-2">Email Body</h3>
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

                    {/* Sent Info */}
                    {draft.status === 'sent' && draft.sentAt ? (
                      <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/20">
                        <div className="flex items-center gap-2 text-green-400">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="font-medium">Sent to {draft.sentTo}</span>
                        </div>
                        <p className="text-sm text-green-400/70 mt-1">{formatDate(draft.sentAt)}</p>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>

              {/* Footer */}
              {!isEditing ? (
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
                        <div className="flex gap-2">
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
                                Send Email
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
