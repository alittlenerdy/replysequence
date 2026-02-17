'use client';

import { useState, useEffect } from 'react';
import { Sparkles, Loader2, Check } from 'lucide-react';

interface AIPreferences {
  aiTone: string;
  aiCustomInstructions: string;
  aiSignature: string;
}

const TONE_OPTIONS = [
  { value: 'professional', label: 'Professional', description: 'Polished and business-appropriate' },
  { value: 'casual', label: 'Casual', description: 'Relaxed and conversational' },
  { value: 'friendly', label: 'Friendly', description: 'Warm and personable' },
  { value: 'concise', label: 'Concise', description: 'Brief and to the point' },
];

export function AICustomization() {
  const [preferences, setPreferences] = useState<AIPreferences>({
    aiTone: 'professional',
    aiCustomInstructions: '',
    aiSignature: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch('/api/user/preferences');
        if (response.ok) {
          const data = await response.json();
          setPreferences({
            aiTone: data.aiTone || 'professional',
            aiCustomInstructions: data.aiCustomInstructions || '',
            aiSignature: data.aiSignature || '',
          });
        }
      } catch {
        // Use defaults
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleSave() {
    setIsSaving(true);
    setSaved(false);
    setSaveError(null);
    try {
      const response = await fetch('/api/user/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences),
      });
      if (response.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } else {
        setSaveError('Failed to save preferences. Please try again.');
      }
    } catch {
      setSaveError('Failed to save preferences. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto mt-8">
        <div className="bg-gray-900/50 light:bg-white border border-gray-700 light:border-gray-200 rounded-xl p-6 animate-pulse light:shadow-sm">
          <div className="h-6 w-40 bg-gray-700 light:bg-gray-200 rounded mb-4" />
          <div className="h-4 w-64 bg-gray-700 light:bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto mt-8 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-purple-400" />
        </div>
        <h3 className="text-lg font-semibold text-white light:text-gray-900">Customize AI Drafts</h3>
      </div>

      {/* Tone Selection */}
      <div className="bg-gray-900/50 light:bg-white border border-gray-700 light:border-gray-200 rounded-xl p-5 light:shadow-sm">
        <h4 className="text-sm font-medium text-white light:text-gray-900 mb-3">Email Tone</h4>
        <div className="grid grid-cols-2 gap-3">
          {TONE_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => setPreferences(p => ({ ...p, aiTone: option.value }))}
              className={`p-3 rounded-lg border text-left transition-all ${
                preferences.aiTone === option.value
                  ? 'border-purple-500 bg-purple-500/10'
                  : 'border-gray-700 light:border-gray-200 hover:border-gray-500 light:hover:border-gray-400'
              }`}
            >
              <div className={`text-sm font-medium ${
                preferences.aiTone === option.value ? 'text-purple-400' : 'text-white light:text-gray-900'
              }`}>
                {option.label}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">{option.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Instructions */}
      <div className="bg-gray-900/50 light:bg-white border border-gray-700 light:border-gray-200 rounded-xl p-5 light:shadow-sm">
        <h4 className="text-sm font-medium text-white light:text-gray-900 mb-1">Custom Instructions</h4>
        <p className="text-xs text-gray-500 mb-3">
          Added to every draft. E.g., &quot;Always mention our 30-day trial&quot; or &quot;Keep emails under 150 words.&quot;
        </p>
        <textarea
          value={preferences.aiCustomInstructions}
          onChange={(e) => setPreferences(p => ({ ...p, aiCustomInstructions: e.target.value }))}
          placeholder="E.g., Always include a specific next step with a date. Use my first name in the sign-off."
          rows={3}
          maxLength={500}
          className="w-full px-3 py-2 text-sm bg-gray-800 light:bg-gray-50 border border-gray-700 light:border-gray-300 rounded-lg text-white light:text-gray-900 placeholder-gray-600 light:placeholder-gray-400 resize-none focus:outline-none focus:ring-1 focus:ring-purple-500"
        />
        <div className="text-xs text-gray-600 mt-1 text-right">
          {preferences.aiCustomInstructions.length}/500
        </div>
      </div>

      {/* Email Signature */}
      <div className="bg-gray-900/50 light:bg-white border border-gray-700 light:border-gray-200 rounded-xl p-5 light:shadow-sm">
        <h4 className="text-sm font-medium text-white light:text-gray-900 mb-1">Email Signature</h4>
        <p className="text-xs text-gray-500 mb-3">
          Appended to every draft. Leave blank to use your platform&apos;s default signature.
        </p>
        <textarea
          value={preferences.aiSignature}
          onChange={(e) => setPreferences(p => ({ ...p, aiSignature: e.target.value }))}
          placeholder={"Best regards,\nJohn Smith\nAccount Executive, Acme Corp\n(555) 123-4567"}
          rows={4}
          maxLength={500}
          className="w-full px-3 py-2 text-sm bg-gray-800 light:bg-gray-50 border border-gray-700 light:border-gray-300 rounded-lg text-white light:text-gray-900 placeholder-gray-600 light:placeholder-gray-400 resize-none focus:outline-none focus:ring-1 focus:ring-purple-500 font-mono"
        />
      </div>

      {/* Error Message */}
      {saveError && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          {saveError}
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-5 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : saved ? (
            <>
              <Check className="w-4 h-4" />
              Saved
            </>
          ) : (
            'Save Preferences'
          )}
        </button>
      </div>
    </div>
  );
}
