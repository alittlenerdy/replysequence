'use client';

import { useState, useEffect, useCallback } from 'react';
import { Sparkles, Check, FileText, Plus, Trash2, ChevronDown, ChevronUp, Loader2, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';
import { TONE_OPTIONS, INSTRUCTION_CHIPS, HOURLY_RATE_CHIPS, type ToneValue } from '@/lib/constants/ai-settings';
import { useAutoSave, type AutoSaveStatus } from '@/lib/hooks/use-auto-save';
import { AISettingsPreview } from './AISettingsPreview';
import { Toast } from '@/components/ui/Toast';

interface AIPreferences {
  aiTone: ToneValue;
  aiCustomInstructions: string;
  aiSignature: string;
  hourlyRate: number;
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

function SaveStatusIndicator({ status, lastSavedAt }: { status: AutoSaveStatus; lastSavedAt: Date | null }) {
  function formatTime(date: Date): string {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }

  return (
    <div className="flex items-center gap-2 text-xs">
      {status === 'saving' && (
        <span className="text-gray-400 light:text-gray-500 flex items-center gap-1">
          <Loader2 className="w-3 h-3 animate-spin" />
          Saving...
        </span>
      )}
      {status === 'saved' && (
        <span className="text-green-400 light:text-green-600 flex items-center gap-1">
          <Check className="w-3 h-3" />
          Saved
        </span>
      )}
      {status === 'error' && (
        <span className="text-red-400 light:text-red-500">Failed to save</span>
      )}
      {status === 'idle' && lastSavedAt && (
        <span className="text-gray-500">Last saved {formatTime(lastSavedAt)}</span>
      )}
    </div>
  );
}

function StepIndicator({ preferences }: { preferences: AIPreferences }) {
  const steps = [
    { label: 'Tone', complete: !!preferences.aiTone },
    { label: 'Instructions', complete: preferences.aiCustomInstructions.length > 0 },
    { label: 'Rate', complete: preferences.hourlyRate !== 100 },
  ];
  const completedCount = steps.filter(s => s.complete).length;

  return (
    <div className="flex items-center gap-3">
      {steps.map((step, i) => (
        <div key={step.label} className="flex items-center gap-1.5">
          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium ${
            step.complete
              ? 'bg-indigo-500 text-white'
              : 'bg-gray-700 light:bg-gray-200 text-gray-400 light:text-gray-500'
          }`}>
            {step.complete ? <Check className="w-3 h-3" /> : i + 1}
          </div>
          <span className={`text-xs ${
            step.complete ? 'text-gray-300 light:text-gray-700' : 'text-gray-500'
          }`}>
            {step.label}
          </span>
          {i < steps.length - 1 && (
            <div className="w-6 h-px bg-gray-700 light:bg-gray-200 ml-1" />
          )}
        </div>
      ))}
      <span className="text-xs text-gray-500 ml-auto">{completedCount}/3</span>
    </div>
  );
}

export function AICustomization() {
  const [preferences, setPreferences] = useState<AIPreferences>({
    aiTone: 'professional',
    aiCustomInstructions: '',
    aiSignature: '',
    hourlyRate: 100,
  });
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);

  // Load preferences
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
            hourlyRate: data.hourlyRate ?? 100,
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

  // Auto-save logic
  const handleSave = useCallback(async (data: AIPreferences) => {
    const response = await fetch('/api/user/preferences', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Save failed');

    // Show first-time setup toast
    const hasSeenToast = localStorage.getItem('rs-ai-setup-toast');
    if (!hasSeenToast && data.aiCustomInstructions.length > 0) {
      localStorage.setItem('rs-ai-setup-toast', '1');
      setShowToast(true);
    }
  }, []);

  const { status, lastSavedAt } = useAutoSave({
    data: preferences,
    onSave: handleSave,
    delay: 1500,
    enabled: !loading,
  });

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto mt-8">
        <div className="bg-gray-900/50 light:bg-white border border-gray-700 light:border-gray-200 rounded-xl p-6 animate-pulse light:shadow-sm">
          <div className="h-6 w-40 bg-gray-700 light:bg-gray-200 rounded mb-4" />
          <div className="h-4 w-64 bg-gray-700 light:bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto mt-8">
      {/* Hero Banner with save status */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600/20 via-indigo-600/15 to-indigo-600/10 light:from-indigo-100 light:via-indigo-50 light:to-indigo-50 p-6 border border-indigo-500/20 light:border-indigo-200 mb-6">
        <div className="absolute -right-8 -top-8 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl" />
        <div className="absolute -left-4 -bottom-4 w-24 h-24 bg-indigo-500/15 rounded-full blur-2xl" />
        <div className="relative flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white light:text-gray-900">Your AI Writing Assistant</h3>
              <p className="text-sm text-indigo-200/80 light:text-gray-500 mt-0.5">Customize how your follow-up emails sound</p>
            </div>
          </div>
          <SaveStatusIndicator status={status} lastSavedAt={lastSavedAt} />
        </div>
        <div className="relative mt-4">
          <StepIndicator preferences={preferences} />
        </div>
      </div>

      {/* Two-column layout */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left column: Settings form */}
        <div className="flex-1 min-w-0 space-y-6">
          {/* Step 1: Tone Selection */}
          <div className="bg-gray-900/50 light:bg-white border border-gray-700 light:border-gray-200 rounded-xl p-5 light:shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-bold flex items-center justify-center">1</span>
              <h4 className="text-sm font-medium text-white light:text-gray-900">Email Tone</h4>
            </div>
            <div className="space-y-2.5">
              {TONE_OPTIONS.map((option) => {
                const isSelected = preferences.aiTone === option.value;
                return (
                  <motion.button
                    key={option.value}
                    layout
                    onClick={() => setPreferences(p => ({ ...p, aiTone: option.value }))}
                    className={`w-full p-3.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/10'
                        : 'border-gray-700 light:border-gray-200 hover:border-gray-500 light:hover:border-gray-400 bg-gray-900/30 light:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className={`text-sm font-semibold ${isSelected ? 'text-indigo-400 light:text-indigo-600' : 'text-white light:text-gray-900'}`}>
                          {option.label}
                          {option.recommended && (
                            <span className="ml-2 text-xs font-normal text-gray-500">(recommended)</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">{option.description}</div>
                        <div className="text-xs text-gray-600 light:text-gray-400 mt-1 italic">
                          Subject: {option.subjectExample}
                        </div>
                      </div>
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center shrink-0 ml-2"
                        >
                          <Check className="w-3.5 h-3.5 text-white" />
                        </motion.div>
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Custom Instructions + Signature */}
          <div className="bg-gray-900/50 light:bg-white border border-gray-700 light:border-gray-200 rounded-xl p-5 light:shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-bold flex items-center justify-center">2</span>
              <h4 className="text-sm font-medium text-white light:text-gray-900">Custom Instructions & Signature</h4>
            </div>

            {/* Instructions */}
            <label className="block text-xs text-gray-400 light:text-gray-500 mb-1.5">
              Added to every draft. E.g., &quot;Always mention our 30-day trial&quot;
            </label>
            <textarea
              value={preferences.aiCustomInstructions}
              onChange={(e) => setPreferences(p => ({ ...p, aiCustomInstructions: e.target.value }))}
              placeholder="E.g., Always include a specific next step with a date. Use my first name in the sign-off."
              rows={3}
              maxLength={500}
              className="w-full px-3 py-2 text-sm bg-gray-800 light:bg-gray-50 border border-gray-700 light:border-gray-300 rounded-lg text-white light:text-gray-900 placeholder-gray-600 light:placeholder-gray-400 resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <div className="text-xs text-gray-600 mt-1 text-right">
              {preferences.aiCustomInstructions.length}/500
            </div>
            <div className="flex flex-wrap gap-2 mt-2 mb-5">
              {INSTRUCTION_CHIPS.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => {
                    setPreferences(p => ({
                      ...p,
                      aiCustomInstructions: p.aiCustomInstructions
                        ? `${p.aiCustomInstructions}\n${chip}`
                        : chip,
                    }));
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-indigo-300 light:text-indigo-600 bg-indigo-500/10 light:bg-indigo-50 border border-indigo-500/20 light:border-indigo-200 rounded-full hover:bg-indigo-500/20 light:hover:bg-indigo-100 transition-colors"
                >
                  + {chip}
                </button>
              ))}
            </div>

            {/* Signature */}
            <label className="block text-xs text-gray-400 light:text-gray-500 mb-1.5">
              Email signature (appended to every draft)
            </label>
            <textarea
              value={preferences.aiSignature}
              onChange={(e) => setPreferences(p => ({ ...p, aiSignature: e.target.value }))}
              placeholder={"Best regards,\nJohn Smith\nAccount Executive, Acme Corp\n(555) 123-4567"}
              rows={4}
              maxLength={500}
              className="w-full px-3 py-2 text-sm bg-gray-800 light:bg-gray-50 border border-gray-700 light:border-gray-300 rounded-lg text-white light:text-gray-900 placeholder-gray-600 light:placeholder-gray-400 resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
            />
          </div>

          {/* Step 3: Hourly Rate */}
          <div className="bg-gray-900/50 light:bg-white border border-gray-700 light:border-gray-200 rounded-xl p-5 light:shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-bold flex items-center justify-center">3</span>
              <DollarSign className="w-4 h-4 text-amber-400" />
              <h4 className="text-sm font-medium text-white light:text-gray-900">Your Hourly Rate</h4>
            </div>
            <p className="text-xs text-gray-500 mb-3 ml-7">
              Used to calculate ROI on your analytics dashboard. Never shared.
            </p>
            <div className="flex items-center gap-3 ml-7">
              <div className="flex items-center gap-1">
                <span className="text-sm text-gray-400">$</span>
                <input
                  type="number"
                  min={1}
                  max={9999}
                  value={preferences.hourlyRate}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (!isNaN(val) && val >= 1 && val <= 9999) {
                      setPreferences(p => ({ ...p, hourlyRate: val }));
                    }
                  }}
                  className="w-24 px-3 py-2 text-sm bg-gray-800 light:bg-gray-50 border border-gray-700 light:border-gray-300 rounded-lg text-white light:text-gray-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 tabular-nums"
                />
                <span className="text-sm text-gray-500">/ hr</span>
              </div>
              <div className="flex gap-1.5">
                {HOURLY_RATE_CHIPS.map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => setPreferences(p => ({ ...p, hourlyRate: rate }))}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                      preferences.hourlyRate === rate
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-gray-800 light:bg-gray-100 text-gray-400 light:text-gray-500 border border-gray-700 light:border-gray-200 hover:border-gray-500'
                    }`}
                  >
                    ${rate}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Template Manager (collapsible) */}
          <TemplateManager />
        </div>

        {/* Right column: Sticky preview */}
        <div className="w-full lg:w-[380px] shrink-0">
          <div className="lg:sticky lg:top-6">
            <AISettingsPreview
              tone={preferences.aiTone}
              customInstructions={preferences.aiCustomInstructions}
              signature={preferences.aiSignature}
            />
          </div>
        </div>
      </div>

      {/* Toast */}
      {showToast && (
        <Toast
          message="AI settings configured! Your drafts will now reflect these preferences."
          type="success"
          onClose={() => setShowToast(false)}
        />
      )}
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
    <div className="pt-6 border-t border-gray-700/50 light:border-gray-200">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between group"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
            <FileText className="w-4 h-4 text-indigo-400" />
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
                  className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-indigo-400 border border-dashed border-gray-600 light:border-gray-300 rounded-xl hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-colors"
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
      className="bg-gray-900/50 light:bg-white border border-indigo-500/30 rounded-xl p-4 space-y-3 light:shadow-sm"
    >
      <h4 className="text-sm font-medium text-white light:text-gray-900">New Template</h4>

      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Template name"
        maxLength={100}
        className="w-full px-3 py-2 text-sm bg-gray-800 light:bg-gray-50 border border-gray-700 light:border-gray-300 rounded-lg text-white light:text-gray-900 placeholder-gray-600 light:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      />

      <select
        value={meetingType}
        onChange={(e) => setMeetingType(e.target.value)}
        className="w-full px-3 py-2 text-sm bg-gray-800 light:bg-gray-50 border border-gray-700 light:border-gray-300 rounded-lg text-white light:text-gray-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
        className="w-full px-3 py-2 text-sm bg-gray-800 light:bg-gray-50 border border-gray-700 light:border-gray-300 rounded-lg text-white light:text-gray-900 placeholder-gray-600 light:placeholder-gray-400 resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
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
