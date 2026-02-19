'use client';

import { useState, useEffect } from 'react';
import { Sparkles, Loader2, Check, FileText, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

interface AIPreferences {
  aiTone: string;
  aiCustomInstructions: string;
  aiSignature: string;
}

interface Template {
  id: string;
  name: string;
  description: string;
  meetingType: string | null;
  promptInstructions: string;
  icon: string;
  isSystem: boolean;
  isDefault: boolean;
}

const TONE_OPTIONS = [
  {
    value: 'professional',
    label: 'Professional',
    description: 'Polished and business-appropriate',
    preview: 'Thank you for taking the time to meet today. I wanted to follow up on the key points we discussed and outline the next steps we agreed upon.',
  },
  {
    value: 'casual',
    label: 'Casual',
    description: 'Relaxed and conversational',
    preview: 'Great chatting with you today! Here\'s a quick recap of what we talked about and what we\'re each tackling next.',
  },
  {
    value: 'friendly',
    label: 'Friendly',
    description: 'Warm and personable',
    preview: 'It was really wonderful connecting with you today! I\'m excited about what we discussed and wanted to make sure we\'re aligned on next steps.',
  },
  {
    value: 'concise',
    label: 'Concise',
    description: 'Brief and to the point',
    preview: 'Following up on today\'s meeting. Key decisions: [items]. Next steps: [actions]. Let me know if anything needs adjusting.',
  },
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
      <div className="max-w-4xl mx-auto mt-8">
        <div className="bg-gray-900/50 light:bg-white border border-gray-700 light:border-gray-200 rounded-xl p-6 animate-pulse light:shadow-sm">
          <div className="h-6 w-40 bg-gray-700 light:bg-gray-200 rounded mb-4" />
          <div className="h-4 w-64 bg-gray-700 light:bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto mt-8 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-purple-400" />
        </div>
        <h3 className="text-lg font-semibold text-white light:text-gray-900">Customize AI Drafts</h3>
      </div>

      {/* Tone Selection with Preview */}
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

        {/* Tone preview */}
        <div className="mt-4 p-3 rounded-lg bg-gray-800/50 light:bg-gray-50 border border-gray-700/50 light:border-gray-200">
          <div className="text-xs font-medium text-gray-500 light:text-gray-400 mb-1.5">Preview</div>
          <p className="text-sm text-gray-300 light:text-gray-600 italic leading-relaxed">
            &ldquo;{TONE_OPTIONS.find(o => o.value === preferences.aiTone)?.preview}&rdquo;
          </p>
        </div>
      </div>

      {/* Custom Instructions - moved up for visibility */}
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

const MEETING_TYPE_LABELS: Record<string, string> = {
  sales_call: 'Sales',
  internal_sync: 'Internal',
  client_review: 'Client',
  technical_discussion: 'Technical',
  general: 'General',
};

function TemplateManager() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    async function loadTemplates() {
      try {
        const res = await fetch('/api/templates');
        if (res.ok) {
          const data = await res.json();
          setTemplates(data.templates);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    loadTemplates();
  }, []);

  async function handleDelete(id: string) {
    setDeleting(id);
    try {
      const res = await fetch(`/api/templates?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setTemplates((prev) => prev.filter((t) => t.id !== id));
      }
    } catch {
      // silent
    } finally {
      setDeleting(null);
    }
  }

  async function handleCreate(data: { name: string; meetingType: string; promptInstructions: string }) {
    try {
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const { template } = await res.json();
        setTemplates((prev) => [...prev, { ...template, isSystem: false, isDefault: false }]);
        setShowCreateForm(false);
      }
    } catch {
      // silent
    }
  }

  const systemTemplates = templates.filter((t) => t.isSystem);
  const customTemplates = templates.filter((t) => !t.isSystem);

  return (
    <div className="mt-8 pt-8 border-t border-gray-700/50 light:border-gray-200">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between group"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <FileText className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-left">
            <h3 className="text-lg font-semibold text-white light:text-gray-900">Email Templates</h3>
            <p className="text-xs text-gray-500">
              {systemTemplates.length} built-in, {customTemplates.length} custom
            </p>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
        )}
      </button>

      {expanded && (
        <div className="mt-4 space-y-3">
          {loading ? (
            <div className="bg-gray-900/50 light:bg-white border border-gray-700 light:border-gray-200 rounded-xl p-6 animate-pulse light:shadow-sm">
              <div className="h-4 w-32 bg-gray-700 light:bg-gray-200 rounded" />
            </div>
          ) : (
            <>
              {/* System Templates */}
              <div className="bg-gray-900/50 light:bg-white border border-gray-700 light:border-gray-200 rounded-xl p-4 light:shadow-sm">
                <h4 className="text-sm font-medium text-gray-400 light:text-gray-500 mb-3">Built-in Templates</h4>
                <div className="space-y-2">
                  {systemTemplates.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-800/50 light:bg-gray-50"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-white light:text-gray-900 truncate">{t.name}</div>
                        <div className="text-xs text-gray-500 truncate">{t.description}</div>
                      </div>
                      {t.meetingType && (
                        <span className="shrink-0 ml-2 px-2 py-0.5 text-xs rounded-full bg-gray-700/50 light:bg-gray-200 text-gray-400 light:text-gray-500">
                          {MEETING_TYPE_LABELS[t.meetingType] || t.meetingType}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Custom Templates */}
              {customTemplates.length > 0 && (
                <div className="bg-gray-900/50 light:bg-white border border-gray-700 light:border-gray-200 rounded-xl p-4 light:shadow-sm">
                  <h4 className="text-sm font-medium text-gray-400 light:text-gray-500 mb-3">Your Templates</h4>
                  <div className="space-y-2">
                    {customTemplates.map((t) => (
                      <div
                        key={t.id}
                        className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-800/50 light:bg-gray-50"
                      >
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-white light:text-gray-900 truncate">{t.name}</div>
                          <div className="text-xs text-gray-500 truncate line-clamp-1">
                            {t.promptInstructions.substring(0, 80)}...
                          </div>
                        </div>
                        <button
                          onClick={() => handleDelete(t.id)}
                          disabled={deleting === t.id}
                          className="shrink-0 ml-2 p-1.5 text-gray-500 hover:text-red-400 transition-colors disabled:opacity-50"
                          title="Delete template"
                        >
                          {deleting === t.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Create Template */}
              {showCreateForm ? (
                <CreateTemplateForm
                  onSubmit={handleCreate}
                  onCancel={() => setShowCreateForm(false)}
                />
              ) : (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-blue-400 border border-dashed border-gray-600 light:border-gray-300 rounded-xl hover:border-blue-500/50 hover:bg-blue-500/5 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Create Custom Template
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function CreateTemplateForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (data: { name: string; meetingType: string; promptInstructions: string }) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState('');
  const [meetingType, setMeetingType] = useState('');
  const [promptInstructions, setPromptInstructions] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !promptInstructions) return;
    setSaving(true);
    await onSubmit({ name, meetingType, promptInstructions });
    setSaving(false);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-gray-900/50 light:bg-white border border-blue-500/30 rounded-xl p-4 space-y-3 light:shadow-sm"
    >
      <h4 className="text-sm font-medium text-white light:text-gray-900">New Template</h4>

      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Template name"
        maxLength={100}
        className="w-full px-3 py-2 text-sm bg-gray-800 light:bg-gray-50 border border-gray-700 light:border-gray-300 rounded-lg text-white light:text-gray-900 placeholder-gray-600 light:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />

      <select
        value={meetingType}
        onChange={(e) => setMeetingType(e.target.value)}
        className="w-full px-3 py-2 text-sm bg-gray-800 light:bg-gray-50 border border-gray-700 light:border-gray-300 rounded-lg text-white light:text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        <option value="">All meeting types</option>
        <option value="sales_call">Sales Calls</option>
        <option value="internal_sync">Internal Syncs</option>
        <option value="client_review">Client Reviews</option>
        <option value="technical_discussion">Technical Discussions</option>
        <option value="general">General</option>
      </select>

      <textarea
        value={promptInstructions}
        onChange={(e) => setPromptInstructions(e.target.value)}
        placeholder="Instructions for the AI. E.g., 'Focus on budget discussions and decision timelines. Include a pricing summary section.'"
        rows={4}
        maxLength={2000}
        className="w-full px-3 py-2 text-sm bg-gray-800 light:bg-gray-50 border border-gray-700 light:border-gray-300 rounded-lg text-white light:text-gray-900 placeholder-gray-600 light:placeholder-gray-400 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
      <div className="text-xs text-gray-600 text-right">{promptInstructions.length}/2000</div>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving || !name || !promptInstructions}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Creating...
            </>
          ) : (
            'Create Template'
          )}
        </button>
      </div>
    </form>
  );
}
