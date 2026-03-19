'use client';

import { useState, useEffect, useCallback } from 'react';
import { Mail, Shield, Zap, Clock, ChevronRight } from 'lucide-react';

type EmailPreference = 'review' | 'auto_send';
type ReviewWindow = '15' | '30' | '60';

export function EmailPreferencesSettings() {
  const [preference, setPreference] = useState<EmailPreference | null>(null);
  const [reviewWindow, setReviewWindow] = useState<ReviewWindow>('30');
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
      <div className="glass-card border border-white/[0.06] light:border-gray-200 rounded-xl p-6 animate-pulse light:shadow-sm">
        <div className="h-5 w-40 bg-gray-700 light:bg-gray-200 rounded mb-4" />
        <div className="space-y-3">
          <div className="h-28 bg-gray-800 light:bg-gray-100 rounded-lg" />
          <div className="h-28 bg-gray-800 light:bg-gray-100 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card border border-white/[0.06] light:border-gray-200 rounded-xl p-6 transition-colors duration-200 hover:border-gray-600 light:hover:border-gray-300 light:shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#6366F1]/10 flex items-center justify-center">
            <Mail className="w-4 h-4 text-[#6366F1]" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white light:text-gray-900">Delivery Mode</h3>
            <p className="text-xs text-[#8892B0] light:text-gray-500 mt-0.5">
              Choose how follow-ups reach your contacts
            </p>
          </div>
        </div>
        {saveSuccess && (
          <span className="flex items-center gap-1.5 text-xs text-green-400 light:text-green-600">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            Saved
          </span>
        )}
        {saveError && (
          <span className="text-xs text-red-400">Failed to save</span>
        )}
      </div>

      <div className="space-y-3">
        {/* Review before sending */}
        <button
          onClick={() => handleSave('review')}
          disabled={saving}
          className={`w-full text-left p-5 rounded-xl border transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1]/70 ${
            preference === 'review'
              ? 'border-[#6366F1] bg-[#6366F1]/10 ring-1 ring-[#6366F1]/30 shadow-lg shadow-[#6366F1]/5'
              : 'border-[#1E2A4A] light:border-gray-200 bg-[#0F172A] light:bg-gray-50 hover:border-white/20 light:hover:border-gray-300'
          } ${saving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <div className="flex items-start gap-3">
            <div className={`shrink-0 mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
              preference === 'review' ? 'border-[#6366F1] bg-[#6366F1]' : 'border-gray-500 light:border-gray-300'
            }`}>
              {preference === 'review' && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white light:text-gray-900">Review before sending</span>
                <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-[#06B6D4]/15 text-[#06B6D4] border border-[#06B6D4]/20 uppercase">Recommended</span>
              </div>
              <p className="text-xs text-[#8892B0] light:text-gray-500 mt-1">
                AI generates drafts for your review. You decide when and to whom each email is sent.
              </p>
              {/* Workflow preview */}
              <div className="flex items-center gap-1.5 mt-3 text-[10px] text-[#8892B0]/70 light:text-gray-400">
                <Shield className="w-3 h-3 text-[#06B6D4]" />
                <span>Meeting ends</span>
                <ChevronRight className="w-3 h-3" />
                <span>AI drafts email</span>
                <ChevronRight className="w-3 h-3" />
                <span className="text-white light:text-gray-900 font-medium">You approve</span>
                <ChevronRight className="w-3 h-3" />
                <span>Email sends</span>
              </div>
            </div>
          </div>
        </button>

        {/* Auto-send */}
        <button
          onClick={() => handleSave('auto_send')}
          disabled={saving}
          className={`w-full text-left p-5 rounded-xl border transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1]/70 ${
            preference === 'auto_send'
              ? 'border-[#6366F1] bg-[#6366F1]/10 ring-1 ring-[#6366F1]/30 shadow-lg shadow-[#6366F1]/5'
              : 'border-[#1E2A4A] light:border-gray-200 bg-[#0F172A] light:bg-gray-50 hover:border-white/20 light:hover:border-gray-300'
          } ${saving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <div className="flex items-start gap-3">
            <div className={`shrink-0 mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
              preference === 'auto_send' ? 'border-[#6366F1] bg-[#6366F1]' : 'border-gray-500 light:border-gray-300'
            }`}>
              {preference === 'auto_send' && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white light:text-gray-900">Auto-send after review period</span>
                <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/20 uppercase">Fastest</span>
              </div>
              <p className="text-xs text-[#8892B0] light:text-gray-500 mt-1">
                Emails send automatically after a review window. Cancel or edit before delivery.
              </p>
              {/* Workflow preview */}
              <div className="flex items-center gap-1.5 mt-3 text-[10px] text-[#8892B0]/70 light:text-gray-400">
                <Zap className="w-3 h-3 text-[#F59E0B]" />
                <span>Meeting ends</span>
                <ChevronRight className="w-3 h-3" />
                <span>AI drafts email</span>
                <ChevronRight className="w-3 h-3" />
                <span className="text-[#F59E0B] font-medium">Review window</span>
                <ChevronRight className="w-3 h-3" />
                <span>Auto-sends</span>
              </div>
            </div>
          </div>
        </button>

        {/* Review window selector — only when auto-send is active */}
        {preference === 'auto_send' && (
          <div className="ml-8 p-4 rounded-lg bg-[#0A1020] light:bg-gray-50 border border-[#1E2A4A] light:border-gray-200">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-3.5 h-3.5 text-[#F59E0B]" />
              <span className="text-xs font-medium text-white light:text-gray-900">Review window</span>
              <span className="text-[10px] text-[#8892B0] light:text-gray-500">— time to cancel before auto-send</span>
            </div>
            <div className="flex gap-2">
              {([
                { value: '15' as ReviewWindow, label: '15 min' },
                { value: '30' as ReviewWindow, label: '30 min' },
                { value: '60' as ReviewWindow, label: '1 hour' },
              ]).map((option) => (
                <button
                  key={option.value}
                  onClick={() => setReviewWindow(option.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200 ${
                    reviewWindow === option.value
                      ? 'bg-[#F59E0B] text-black border-[#F59E0B]'
                      : 'bg-transparent text-[#8892B0] light:text-gray-500 border-[#1E2A4A] light:border-gray-200 hover:border-white/20 light:hover:border-gray-300'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {!preference && (
        <p className="text-xs text-amber-400 mt-3 flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          No preference set. Select an option above.
        </p>
      )}

      {/* Trust microcopy */}
      <p className="text-[10px] text-[#8892B0]/60 light:text-gray-400 mt-4 text-center">
        You stay in control of every message. Auto-send can be canceled before delivery.
      </p>
    </div>
  );
}
