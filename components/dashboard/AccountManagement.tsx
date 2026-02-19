'use client';

import { useState } from 'react';
import { Download, Trash2, AlertTriangle, Loader2, X, Check } from 'lucide-react';

export function AccountManagement() {
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleExport() {
    setIsExporting(true);
    setError(null);
    try {
      const response = await fetch('/api/user/export');
      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `replysequence-export-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch {
      setError('Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  }

  async function handleDelete() {
    if (deleteConfirmText !== 'DELETE') return;
    setIsDeleting(true);
    setError(null);
    try {
      const response = await fetch('/api/user/delete', { method: 'DELETE' });
      if (!response.ok) throw new Error('Delete failed');
      window.location.href = '/';
    } catch {
      setError('Failed to delete account. Please try again.');
      setIsDeleting(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto mt-8 space-y-6">
      <h3 className="text-lg font-semibold text-white light:text-gray-900">Account & Privacy</h3>

      {error && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20">
          <div className="flex items-center gap-2 text-sm text-red-400">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {error}
          </div>
          <button onClick={() => setError(null)} className="text-red-400/60 hover:text-red-400">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Export Data */}
      <div className="bg-gray-900/50 light:bg-white border border-gray-700 light:border-gray-200 rounded-xl p-5 light:shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0">
            <Download className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-white light:text-gray-900">Export Your Data</h4>
            <p className="text-sm text-gray-400 light:text-gray-500 mt-1">
              Download all your data including meetings, transcripts, drafts, and usage history in JSON format.
            </p>
          </div>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="shrink-0 px-4 py-2 text-sm font-medium text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 rounded-lg transition-colors disabled:opacity-50"
          >
            {isExporting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Exporting...
              </span>
            ) : exportSuccess ? (
              <span className="flex items-center gap-2 text-emerald-400">
                <Check className="w-4 h-4" />
                Downloaded
              </span>
            ) : (
              'Export Data'
            )}
          </button>
        </div>
      </div>

      {/* Delete Account */}
      <div className="bg-gray-900/50 light:bg-white border border-red-500/20 light:border-red-200 rounded-xl p-5 light:shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
            <Trash2 className="w-5 h-5 text-red-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-white light:text-gray-900">Delete Account</h4>
            <p className="text-sm text-gray-400 light:text-gray-500 mt-1">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="mt-3 px-4 py-2 text-sm font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors"
              >
                Delete Account
              </button>
            ) : (
              <div className="mt-3 p-4 bg-red-500/5 border border-red-500/20 rounded-lg">
                <div className="flex items-center gap-2 text-red-400 text-sm font-medium mb-2">
                  <AlertTriangle className="w-4 h-4" />
                  This will permanently delete:
                </div>
                <ul className="text-sm text-gray-400 light:text-gray-500 space-y-1 ml-6 list-disc mb-3">
                  <li>All meetings and transcripts</li>
                  <li>All drafts and email history</li>
                  <li>All connected integrations</li>
                  <li>Your account and preferences</li>
                </ul>
                <p className="text-sm text-gray-400 light:text-gray-500 mb-2">
                  Type <span className="font-mono text-red-400">DELETE</span> to confirm:
                </p>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="DELETE"
                    className="px-3 py-1.5 text-sm bg-gray-800 light:bg-gray-100 border border-gray-700 light:border-gray-300 rounded-lg text-white light:text-gray-900 placeholder-gray-600 light:placeholder-gray-400 w-32"
                  />
                  <button
                    onClick={handleDelete}
                    disabled={deleteConfirmText !== 'DELETE' || isDeleting}
                    className="px-4 py-1.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isDeleting ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Deleting...
                      </span>
                    ) : (
                      'Confirm Delete'
                    )}
                  </button>
                  <button
                    onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(''); }}
                    className="px-4 py-1.5 text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
