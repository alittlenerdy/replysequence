'use client';

import { useState, useEffect, useCallback } from 'react';
import { Hash, Plus, X, Loader2, AlertCircle } from 'lucide-react';

interface TrackedKeyword {
  id: string;
  keyword: string;
  category: 'competitor' | 'product' | 'objection' | 'custom';
  createdAt: string;
  mentionCount: number;
}

const CATEGORY_OPTIONS = [
  { value: 'competitor', label: 'Competitor', color: 'text-red-400 bg-red-400/10 border-red-400/20' },
  { value: 'product', label: 'Product', color: 'text-blue-400 bg-blue-400/10 border-blue-400/20' },
  { value: 'objection', label: 'Objection', color: 'text-amber-400 bg-amber-400/10 border-amber-400/20' },
  { value: 'custom', label: 'Custom', color: 'text-gray-400 bg-gray-400/10 border-gray-400/20' },
] as const;

function getCategoryStyle(category: string) {
  return CATEGORY_OPTIONS.find(c => c.value === category)?.color || CATEGORY_OPTIONS[3].color;
}

function getCategoryLabel(category: string) {
  return CATEGORY_OPTIONS.find(c => c.value === category)?.label || 'Custom';
}

export function TopicTracker() {
  const [keywords, setKeywords] = useState<TrackedKeyword[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newKeyword, setNewKeyword] = useState('');
  const [newCategory, setNewCategory] = useState<string>('custom');
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchKeywords = useCallback(async () => {
    try {
      const res = await fetch('/api/keywords');
      if (!res.ok) throw new Error('Failed to fetch keywords');
      const data = await res.json();
      setKeywords(data.keywords);
      setError(null);
    } catch {
      setError('Failed to load tracked keywords');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKeywords();
  }, [fetchKeywords]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newKeyword.trim() || adding) return;

    setAdding(true);
    setError(null);

    try {
      const res = await fetch('/api/keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: newKeyword.trim(), category: newCategory }),
      });

      if (res.status === 409) {
        setError('You are already tracking this keyword');
        return;
      }
      if (!res.ok) throw new Error('Failed to add keyword');

      setNewKeyword('');
      await fetchKeywords();
    } catch {
      setError('Failed to add keyword');
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/keywords?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete keyword');
      setKeywords(prev => prev.filter(k => k.id !== id));
    } catch {
      setError('Failed to remove keyword');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="max-w-4xl mx-auto mt-8 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-[#6366F1]/10 flex items-center justify-center">
          <Hash className="w-4 h-4 text-[#6366F1]" />
        </div>
        <h3 className="text-lg font-semibold text-white light:text-gray-900">Topic Tracker</h3>
      </div>
      <p className="text-sm text-gray-400 light:text-gray-500">
        Define keywords and topics to monitor across your meetings. Get notified when competitors, product features, or objections come up.
      </p>

      {/* Add keyword form */}
      <form onSubmit={handleAdd} className="flex gap-2 items-end">
        <div className="flex-1">
          <label className="block text-xs text-gray-400 light:text-gray-500 mb-1">Keyword or phrase</label>
          <input
            type="text"
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            placeholder="e.g. Salesforce, pricing concern, feature request..."
            className="w-full px-3 py-2 rounded-lg bg-gray-800/50 light:bg-gray-100 border border-white/[0.06] light:border-gray-200 text-white light:text-gray-900 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#6366F1]/50"
            maxLength={200}
          />
        </div>
        <div className="w-36">
          <label className="block text-xs text-gray-400 light:text-gray-500 mb-1">Category</label>
          <select
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-gray-800/50 light:bg-gray-100 border border-white/[0.06] light:border-gray-200 text-white light:text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#6366F1]/50"
          >
            {CATEGORY_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          disabled={adding || !newKeyword.trim()}
          className="px-4 py-2 rounded-lg bg-[#6366F1] hover:bg-[#5558E6] text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 transition-colors"
        >
          {adding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
          Add
        </button>
      </form>

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-400 bg-red-400/10 px-3 py-2 rounded-lg">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Keywords list */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
        </div>
      ) : keywords.length === 0 ? (
        <div className="text-center py-8 text-gray-500 text-sm">
          No tracked keywords yet. Add one above to start monitoring your meetings.
        </div>
      ) : (
        <div className="divide-y divide-white/[0.06] light:divide-gray-200 rounded-xl border border-white/[0.06] light:border-gray-200 bg-gray-800/30 light:bg-white overflow-hidden">
          {keywords.map((kw) => (
            <div
              key={kw.id}
              className="flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] light:hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getCategoryStyle(kw.category)}`}>
                  {getCategoryLabel(kw.category)}
                </span>
                <span className="text-sm text-white light:text-gray-900 truncate">{kw.keyword}</span>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-xs text-gray-400 light:text-gray-500 tabular-nums">
                  {kw.mentionCount} {kw.mentionCount === 1 ? 'mention' : 'mentions'}
                </span>
                <button
                  onClick={() => handleDelete(kw.id)}
                  disabled={deletingId === kw.id}
                  className="p-1 rounded hover:bg-red-400/10 text-gray-500 hover:text-red-400 transition-colors disabled:opacity-50"
                  title="Remove keyword"
                >
                  {deletingId === kw.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <X className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
