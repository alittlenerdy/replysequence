'use client';

import { useState } from 'react';
import type { DraftWithMeeting } from '@/lib/dashboard-queries';
import { StatusBadge } from './ui/StatusBadge';
import { DraftEditor } from './DraftEditor';

interface DraftPreviewModalProps {
  draft: DraftWithMeeting;
  onClose: () => void;
  onDraftUpdated: () => void;
}

export function DraftPreviewModal({ draft, onClose, onDraftUpdated }: DraftPreviewModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState(draft.meetingHostEmail || '');

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

  const handleSend = async () => {
    if (!recipientEmail) {
      setSendError('Please enter a recipient email');
      return;
    }

    setIsSending(true);
    setSendError(null);

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

      setSendSuccess(true);
      setTimeout(() => {
        onDraftUpdated();
      }, 1500);
    } catch (error) {
      setSendError(error instanceof Error ? error.message : 'Failed to send email');
    } finally {
      setIsSending(false);
    }
  };

  const handleEditComplete = () => {
    setIsEditing(false);
    onDraftUpdated();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-3xl bg-white rounded-xl shadow-2xl transform transition-all">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold text-gray-900">
                  {isEditing ? 'Edit Draft' : 'Draft Preview'}
                </h2>
                <StatusBadge status={draft.status} />
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-500 rounded-full hover:bg-gray-100 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
            {isEditing ? (
              <DraftEditor
                draftId={draft.id}
                initialSubject={draft.subject}
                initialBody={draft.body}
                onSave={handleEditComplete}
                onCancel={() => setIsEditing(false)}
              />
            ) : (
              <div className="space-y-6">
                {/* Meeting Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Meeting</h3>
                  <p className="text-gray-900 font-medium">{draft.meetingTopic || 'Untitled Meeting'}</p>
                  <p className="text-sm text-gray-500 mt-1">{formatDate(draft.meetingStartTime)}</p>
                </div>

                {/* Subject */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Subject</h3>
                  <p className="text-gray-900 font-medium text-lg">{draft.subject}</p>
                </div>

                {/* Body */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Email Body</h3>
                  <div className="bg-gray-50 rounded-lg p-4 whitespace-pre-wrap text-gray-800 font-mono text-sm leading-relaxed">
                    {draft.body}
                  </div>
                </div>

                {/* Metadata */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
                  <div>
                    <p className="text-xs text-gray-500">Model</p>
                    <p className="text-sm font-medium text-gray-900">{draft.model}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Tokens</p>
                    <p className="text-sm font-medium text-gray-900">
                      {draft.inputTokens ?? 0} in / {draft.outputTokens ?? 0} out
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Cost</p>
                    <p className="text-sm font-medium text-gray-900">
                      {draft.costUsd ? `$${parseFloat(draft.costUsd).toFixed(4)}` : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Latency</p>
                    <p className="text-sm font-medium text-gray-900">
                      {formatDuration(draft.generationDurationMs)}
                    </p>
                  </div>
                </div>

                {/* Sent Info */}
                {draft.status === 'sent' && draft.sentAt && (
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <div className="flex items-center gap-2 text-green-700">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="font-medium">Sent to {draft.sentTo}</span>
                    </div>
                    <p className="text-sm text-green-600 mt-1">{formatDate(draft.sentAt)}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          {!isEditing && (
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
              {sendSuccess ? (
                <div className="flex items-center justify-center gap-2 text-green-600 py-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="font-medium">Email sent successfully!</span>
                </div>
              ) : draft.status === 'sent' ? (
                <div className="flex justify-end">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {sendError && (
                    <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                      {sendError}
                    </div>
                  )}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1">
                      <label htmlFor="recipient" className="sr-only">Recipient Email</label>
                      <input
                        id="recipient"
                        type="email"
                        placeholder="Recipient email address"
                        value={recipientEmail}
                        onChange={(e) => setRecipientEmail(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setIsEditing(true)}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
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
          )}
        </div>
      </div>
    </div>
  );
}
