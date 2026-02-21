'use client';

import { useState, useEffect, useCallback } from 'react';
import { Users, Send, RefreshCw, Crown, Star, Clock, CheckCircle2, Mail, ExternalLink } from 'lucide-react';

interface WaitlistEntry {
  id: string;
  email: string;
  name: string | null;
  position: number | null;
  status: string;
  tier: string;
  referralCode: string;
  referralCount: number;
  utmSource: string | null;
  invitedAt: string | null;
  acceptedAt: string | null;
  createdAt: string;
}

interface WaitlistData {
  entries: WaitlistEntry[];
  stats: {
    total: number;
    byStatus: Record<string, number>;
    byTier: Record<string, number>;
  };
}

const tierConfig: Record<string, { label: string; icon: typeof Crown; color: string }> = {
  vip: { label: 'VIP', icon: Crown, color: 'text-amber-400 bg-amber-400/10 border-amber-400/30' },
  priority: { label: 'Priority', icon: Star, color: 'text-indigo-400 bg-indigo-400/10 border-indigo-400/30' },
  standard: { label: 'Standard', icon: Users, color: 'text-gray-400 bg-gray-400/10 border-gray-400/30' },
};

const statusConfig: Record<string, { label: string; color: string }> = {
  waiting: { label: 'Waiting', color: 'text-gray-400 bg-gray-400/10' },
  invited: { label: 'Invited', color: 'text-blue-400 bg-blue-400/10' },
  accepted: { label: 'Accepted', color: 'text-green-400 bg-green-400/10' },
  expired: { label: 'Expired', color: 'text-red-400 bg-red-400/10' },
};

export function WaitlistAdmin() {
  const [data, setData] = useState<WaitlistData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [inviteCount, setInviteCount] = useState(5);
  const [inviting, setInviting] = useState(false);
  const [inviteResult, setInviteResult] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/waitlist?list=all');
      if (!res.ok) {
        if (res.status === 401) {
          setError('You do not have admin access to view the waitlist.');
          return;
        }
        throw new Error('Failed to fetch');
      }
      const json = await res.json();
      setData(json);
    } catch {
      setError('Failed to load waitlist data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleInvite() {
    setInviting(true);
    setInviteResult(null);
    try {
      const res = await fetch('/api/waitlist/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: inviteCount }),
      });
      const json = await res.json();
      if (!res.ok) {
        setInviteResult(`Error: ${json.error}`);
        return;
      }
      setInviteResult(`Invited ${json.invited} users, ${json.emailsSent} emails sent.`);
      fetchData();
    } catch {
      setInviteResult('Failed to send invites.');
    } finally {
      setInviting(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-gray-700 light:bg-gray-200 rounded" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 bg-gray-800/50 light:bg-gray-100 rounded-xl border border-gray-700 light:border-gray-200" />
          ))}
        </div>
        <div className="h-64 bg-gray-800/50 light:bg-gray-100 rounded-xl border border-gray-700 light:border-gray-200" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-red-400 text-lg">{error}</p>
      </div>
    );
  }

  if (!data) return null;

  const { entries, stats } = data;
  const filteredEntries = statusFilter
    ? entries.filter(e => e.status === statusFilter)
    : entries;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white light:text-gray-900">Waitlist</h1>
          <p className="text-sm text-gray-400 light:text-gray-600">
            {stats.total} {stats.total === 1 ? 'person' : 'people'} on the list
          </p>
        </div>
        <button
          onClick={fetchData}
          className="p-2 text-gray-400 hover:text-white light:hover:text-gray-900 transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total" value={stats.total} icon={Users} />
        <StatCard label="Waiting" value={stats.byStatus.waiting || 0} icon={Clock} />
        <StatCard label="Invited" value={stats.byStatus.invited || 0} icon={Mail} />
        <StatCard label="Accepted" value={stats.byStatus.accepted || 0} icon={CheckCircle2} />
      </div>

      {/* Invite controls */}
      <div className="rounded-xl bg-gray-800/50 light:bg-white border border-gray-700 light:border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-white light:text-gray-900 mb-3">Send Invites</h2>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm text-gray-400 light:text-gray-600">Invite the next</span>
          <input
            type="number"
            min={1}
            max={100}
            value={inviteCount}
            onChange={(e) => setInviteCount(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-20 px-3 py-1.5 bg-gray-700 light:bg-gray-100 border border-gray-600 light:border-gray-300 rounded-lg text-white light:text-gray-900 text-sm text-center"
          />
          <span className="text-sm text-gray-400 light:text-gray-600">people by position</span>
          <button
            onClick={handleInvite}
            disabled={inviting || (stats.byStatus.waiting || 0) === 0}
            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            {inviting ? 'Sending...' : 'Send Invites'}
          </button>
        </div>
        {inviteResult && (
          <p className={`mt-3 text-sm ${inviteResult.startsWith('Error') ? 'text-red-400' : 'text-green-400'}`}>
            {inviteResult}
          </p>
        )}
      </div>

      {/* Status filter chips */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500 light:text-gray-400 font-medium">Filter:</span>
        <button
          onClick={() => setStatusFilter(null)}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            !statusFilter
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-800 light:bg-gray-100 text-gray-400 light:text-gray-600 hover:bg-gray-700 light:hover:bg-gray-200'
          }`}
        >
          All ({stats.total})
        </button>
        {Object.entries(statusConfig).map(([key, config]) => {
          const count = stats.byStatus[key] || 0;
          if (count === 0) return null;
          return (
            <button
              key={key}
              onClick={() => setStatusFilter(statusFilter === key ? null : key)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                statusFilter === key
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-800 light:bg-gray-100 text-gray-400 light:text-gray-600 hover:bg-gray-700 light:hover:bg-gray-200'
              }`}
            >
              {config.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Entries table */}
      <div className="rounded-xl bg-gray-800/50 light:bg-white border border-gray-700 light:border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700 light:border-gray-200">
                <th className="text-left px-4 py-3 text-gray-400 light:text-gray-500 font-medium">#</th>
                <th className="text-left px-4 py-3 text-gray-400 light:text-gray-500 font-medium">Email</th>
                <th className="text-left px-4 py-3 text-gray-400 light:text-gray-500 font-medium">Name</th>
                <th className="text-left px-4 py-3 text-gray-400 light:text-gray-500 font-medium">Status</th>
                <th className="text-left px-4 py-3 text-gray-400 light:text-gray-500 font-medium">Tier</th>
                <th className="text-left px-4 py-3 text-gray-400 light:text-gray-500 font-medium">Referrals</th>
                <th className="text-left px-4 py-3 text-gray-400 light:text-gray-500 font-medium">Source</th>
                <th className="text-left px-4 py-3 text-gray-400 light:text-gray-500 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                    No entries found.
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry) => {
                  const tier = tierConfig[entry.tier] || tierConfig.standard;
                  const status = statusConfig[entry.status] || statusConfig.waiting;
                  const TierIcon = tier.icon;
                  return (
                    <tr key={entry.id} className="border-b border-gray-700/50 light:border-gray-100 hover:bg-gray-700/20 light:hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-300 light:text-gray-700 font-mono">{entry.position}</td>
                      <td className="px-4 py-3 text-white light:text-gray-900 font-medium">{entry.email}</td>
                      <td className="px-4 py-3 text-gray-300 light:text-gray-700">{entry.name || '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${tier.color}`}>
                          <TierIcon className="w-3 h-3" />
                          {tier.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-300 light:text-gray-700 font-mono">{entry.referralCount}</td>
                      <td className="px-4 py-3 text-gray-400 light:text-gray-500 text-xs">{entry.utmSource || 'direct'}</td>
                      <td className="px-4 py-3 text-gray-400 light:text-gray-500 text-xs whitespace-nowrap">
                        {new Date(entry.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon }: { label: string; value: number; icon: typeof Users }) {
  return (
    <div className="rounded-xl bg-gray-800/50 light:bg-white border border-gray-700 light:border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-gray-400 light:text-gray-500" />
        <span className="text-xs text-gray-400 light:text-gray-500 font-medium">{label}</span>
      </div>
      <p className="text-2xl font-bold text-white light:text-gray-900">{value}</p>
    </div>
  );
}
