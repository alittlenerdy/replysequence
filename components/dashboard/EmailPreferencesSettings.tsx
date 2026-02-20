'use client';

import { useState, useEffect, useCallback } from 'react';
import { Mail } from 'lucide-react';

type EmailPreference = 'review' | 'auto_send';

export function EmailPreferencesSettings() {
  const [preference, setPreference] = useState<EmailPreference | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState(false);

  const fetchPreference = useCallback(async () => {
    try {
      const response = await fetch('/api/onboarding/progress');
      if (response.ok) {
        const data = await response.json();
        setPreference(data.emailPreference || null);
      }
    } catch (err) {
      console.error('[EMAIL-PREFS] Error fetching:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPreference();
  }, [fetchPreference]);

  const handleSave = async (newPreference: EmailPreference) => {
    setSaving(true);
    setSaveError(false);
    try {
      const response = await fetch('/api/onboarding/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailPreference: newPreference }),
      });

      if (response.ok) {
        setPreference(newPreference);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
      } else {
        setSaveError(true);
        setTimeout(() => setSaveError(false), 3000);
      }
    } catch (err) {
      console.error('[EMAIL-PREFS] Error saving:', err);
      setSaveError(true);
      setTimeout(() => setSaveError(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-900/50 light:bg-white border border-gray-700 light:border-gray-200 rounded-xl p-6 animate-pulse light:shadow-sm">
        <div className="h-5 w-40 bg-gray-700 light:bg-gray-200 rounded mb-4" />
        <div className="space-y-3">
          <div className="h-20 bg-gray-800 light:bg-gray-100 rounded-lg" />
          <div className="h-20 bg-gray-800 light:bg-gray-100 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900/50 light:bg-white border border-gray-700 light:border-gray-200 rounded-xl p-6 transition-all duration-200 hover:border-gray-600 light:hover:border-gray-300 light:shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
            <Mail className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white light:text-gray-900">Email Preferences</h3>
            <p className="text-sm text-gray-400 light:text-gray-500 mt-0.5">
              Choose how AI-generated drafts are handled after meetings
            </p>
          </div>
        </div>
        {saveSuccess && (
          <span className="flex items-center gap-1.5 text-sm text-indigo-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Saved
          </span>
        )}
        {saveError && (
          <span className="flex items-center gap-1.5 text-sm text-red-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Failed to save
          </span>
        )}
      </div>

      <div className="space-y-3">
        {/* Review option */}
        <button
          onClick={() => handleSave('review')}
          disabled={saving}
          className={`
            w-full text-left p-4 rounded-lg border transition-all duration-200
            ${preference === 'review'
              ? 'border-indigo-500 bg-indigo-500/10 ring-1 ring-indigo-500/50'
              : 'border-gray-700 light:border-gray-200 bg-gray-800/50 light:bg-gray-50 hover:border-gray-600 light:hover:border-gray-300 hover:bg-gray-800 light:hover:bg-gray-100'
            }
            ${saving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          <div className="flex items-start gap-3">
            <div className={`shrink-0 mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
              preference === 'review' ? 'border-indigo-500 bg-indigo-500' : 'border-gray-500 light:border-gray-300'
            }`}>
              {preference === 'review' && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <div>
              <span className="text-sm font-medium text-white light:text-gray-900">Review before sending</span>
              <p className="text-xs text-gray-400 light:text-gray-500 mt-1">
                AI generates drafts for your review. You decide when and to whom each email is sent.
              </p>
            </div>
          </div>
        </button>

        {/* Auto-send option */}
        <button
          onClick={() => handleSave('auto_send')}
          disabled={saving}
          className={`
            w-full text-left p-4 rounded-lg border transition-all duration-200
            ${preference === 'auto_send'
              ? 'border-indigo-500 bg-indigo-500/10 ring-1 ring-indigo-500/50'
              : 'border-gray-700 light:border-gray-200 bg-gray-800/50 light:bg-gray-50 hover:border-gray-600 light:hover:border-gray-300 hover:bg-gray-800 light:hover:bg-gray-100'
            }
            ${saving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          <div className="flex items-start gap-3">
            <div className={`shrink-0 mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
              preference === 'auto_send' ? 'border-indigo-500 bg-indigo-500' : 'border-gray-500 light:border-gray-300'
            }`}>
              {preference === 'auto_send' && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <div>
              <span className="text-sm font-medium text-white light:text-gray-900">Auto-send after review period</span>
              <p className="text-xs text-gray-400 light:text-gray-500 mt-1">
                AI-generated emails are automatically sent to meeting attendees after a review window. You can still cancel or edit before sending.
              </p>
            </div>
          </div>
        </button>
      </div>

      {!preference && (
        <p className="text-xs text-amber-400 mt-3 flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          No preference set. Select an option above.
        </p>
      )}
    </div>
  );
}
