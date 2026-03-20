'use client';

import { useState, useEffect, useCallback } from 'react';
import { Contact, Search, Video, Mail, Layers, RefreshCw, ArrowUpDown, ChevronRight, X, Sparkles, Building2, Linkedin, ExternalLink, Loader2, SearchCheck, ShieldCheck } from 'lucide-react';

interface ContactData {
  email: string;
  name: string;
  company: string | null;
  title: string | null;
  linkedinUrl: string | null;
  avatarUrl: string | null;
  enrichedAt: string | null;
  meetingCount: number;
  lastMeetingDate: string | null;
  lastMeetingTopic: string | null;
  emailsSent: number;
  activeSequences: number;
  completedSequences: number;
}

type EmailVerificationStatus = 'verified' | 'unverified' | 'disposable' | null;

type SortKey = 'name' | 'meetingCount' | 'lastMeetingDate' | 'emailsSent' | 'strength';

function calcStrength(contact: ContactData): number {
  let score = contact.meetingCount * 2 + contact.emailsSent + contact.activeSequences * 3;
  if (contact.lastMeetingDate) {
    const diffDays = Math.floor(
      (Date.now() - new Date(contact.lastMeetingDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diffDays < 7) score += 3;
    else if (diffDays < 30) score += 1;
  }
  return Math.min(score, 10);
}

function StrengthIndicator({ score, size = 'default' }: { score: number; size?: 'default' | 'dot' }) {
  const label = score <= 3 ? 'Cold' : score <= 6 ? 'Warm' : 'Hot';
  const color =
    score <= 3
      ? { bg: 'bg-gray-500/20', fill: 'bg-gray-400', text: 'text-gray-400', border: 'border-gray-500/30' }
      : score <= 6
        ? { bg: 'bg-amber-500/15', fill: 'bg-amber-400', text: 'text-amber-400', border: 'border-amber-500/20' }
        : { bg: 'bg-emerald-500/15', fill: 'bg-emerald-400', text: 'text-emerald-400', border: 'border-emerald-500/20' };

  if (size === 'dot') {
    return (
      <span
        className={`inline-block w-2 h-2 rounded-full ${color.fill} shrink-0`}
        title={`${label} (${score}/10)`}
      />
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className={`w-16 h-1.5 rounded-full ${color.bg} overflow-hidden`}>
        <div
          className={`h-full rounded-full ${color.fill} transition-all`}
          style={{ width: `${(score / 10) * 100}%` }}
        />
      </div>
      <span className={`text-[10px] font-medium ${color.text}`}>{label}</span>
    </div>
  );
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '--';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatRelativeDate(dateStr: string | null): string {
  if (!dateStr) return 'Never';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return formatDate(dateStr);
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<ContactData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('lastMeetingDate');
  const [sortAsc, setSortAsc] = useState(false);
  const [selectedContact, setSelectedContact] = useState<ContactData | null>(null);
  const [enriching, setEnriching] = useState(false);
  const [enrichMessage, setEnrichMessage] = useState<string | null>(null);

  const handleBatchEnrich = async () => {
    setEnriching(true);
    setEnrichMessage(null);
    try {
      const res = await fetch('/api/contacts/enrich');
      const data = await res.json();
      if (!res.ok) {
        setEnrichMessage(data.error || 'Enrichment failed');
      } else {
        setEnrichMessage(data.message);
        fetchContacts();
      }
    } catch {
      setEnrichMessage('Failed to enrich contacts');
    } finally {
      setEnriching(false);
    }
  };

  const fetchContacts = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/contacts');
      if (!res.ok) throw new Error('Failed to load contacts');
      const data = await res.json();
      setContacts(data.contacts || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load contacts');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  const filtered = contacts
    .filter(c => {
      if (!search) return true;
      const q = search.toLowerCase();
      return c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'name':
          cmp = a.name.localeCompare(b.name);
          break;
        case 'meetingCount':
          cmp = a.meetingCount - b.meetingCount;
          break;
        case 'lastMeetingDate':
          cmp = (a.lastMeetingDate || '').localeCompare(b.lastMeetingDate || '');
          break;
        case 'emailsSent':
          cmp = a.emailsSent - b.emailsSent;
          break;
        case 'strength':
          cmp = calcStrength(a) - calcStrength(b);
          break;
      }
      return sortAsc ? cmp : -cmp;
    });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 bg-[#1E2A4A]/60 light:bg-gray-200 rounded animate-pulse" />
          <div className="h-9 w-64 bg-[#1E2A4A]/60 light:bg-gray-200 rounded-lg animate-pulse" />
        </div>
        <div className="rounded-2xl bg-gray-900/60 border border-[#1E2A4A] light:bg-white light:border-gray-200 light:shadow-sm overflow-hidden">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-[#1E2A4A]/60 light:border-gray-100 animate-pulse">
              <div className="w-9 h-9 rounded-full bg-[#1E2A4A]/60 light:bg-gray-200" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-[#1E2A4A]/60 light:bg-gray-200 rounded" />
                <div className="h-3 w-48 bg-[#1E2A4A]/60 light:bg-gray-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white light:text-gray-900 flex items-center gap-3">
            <div className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-[#6366F1]/15">
              <Contact className="w-5 h-5 text-[#6366F1]" strokeWidth={1.5} />
            </div>
            Contacts
          </h1>
          <p className="text-sm text-gray-400 light:text-gray-500 mt-1">
            {contacts.length} contact{contacts.length !== 1 ? 's' : ''} from your meetings
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleBatchEnrich}
            disabled={enriching || contacts.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-[#6366F1] hover:text-white hover:bg-[#6366F1]/20 light:hover:bg-[#6366F1]/10 border border-[#6366F1]/30 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Enrich unenriched contacts with company data via Clearbit"
          >
            {enriching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Enrich
          </button>
          <button
            onClick={fetchContacts}
            className="p-2 text-gray-400 light:text-gray-500 hover:text-white light:hover:text-gray-900 hover:bg-gray-800 light:hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Refresh contacts"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl bg-gray-800/50 light:bg-white border border-[#1E2A4A] light:border-gray-200 text-white light:text-gray-900 placeholder:text-gray-500 light:placeholder:text-gray-400 focus:outline-none focus:border-[#6366F1]/50 focus:ring-1 focus:ring-[#6366F1]/20 transition-colors"
        />
      </div>

      {enrichMessage && (
        <div className="rounded-xl bg-[#6366F1]/10 border border-[#6366F1]/20 px-4 py-2.5 flex items-center justify-between">
          <p className="text-sm text-[#6366F1]">{enrichMessage}</p>
          <button onClick={() => setEnrichMessage(null)} className="text-[#6366F1]/60 hover:text-[#6366F1] p-1">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {error && (
        <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-4 text-center">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Contacts table */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#6366F1]/10 mb-6">
            <Contact className="w-8 h-8 text-[#6366F1]" strokeWidth={1.5} />
          </div>
          <h2 className="text-lg font-semibold text-white light:text-gray-900 mb-2">
            {search ? 'No contacts match your search' : 'No contacts yet'}
          </h2>
          <p className="text-sm text-gray-400 light:text-gray-500 max-w-sm">
            {search
              ? 'Try a different search term.'
              : 'Contacts are automatically created from your meeting participants. Process your first meeting to see contacts here.'}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl bg-gray-900/60 border border-[#1E2A4A] light:bg-white light:border-gray-200 light:shadow-sm overflow-hidden">
          {/* Table header */}
          <div className="hidden md:grid grid-cols-[1fr_100px_120px_80px_120px_110px] gap-4 px-5 py-3 border-b border-[#1E2A4A] light:border-gray-200 text-xs font-medium text-[#64748B] light:text-gray-400 uppercase tracking-wider">
            <button onClick={() => handleSort('name')} className="flex items-center gap-1 text-left hover:text-gray-300 light:hover:text-gray-600 transition-colors">
              Contact <ArrowUpDown className="w-3 h-3" />
            </button>
            <button onClick={() => handleSort('meetingCount')} className="flex items-center gap-1 hover:text-gray-300 light:hover:text-gray-600 transition-colors">
              Meetings <ArrowUpDown className="w-3 h-3" />
            </button>
            <button onClick={() => handleSort('lastMeetingDate')} className="flex items-center gap-1 hover:text-gray-300 light:hover:text-gray-600 transition-colors">
              Last Meeting <ArrowUpDown className="w-3 h-3" />
            </button>
            <button onClick={() => handleSort('emailsSent')} className="flex items-center gap-1 hover:text-gray-300 light:hover:text-gray-600 transition-colors">
              Emails <ArrowUpDown className="w-3 h-3" />
            </button>
            <span>Sequences</span>
            <button onClick={() => handleSort('strength')} className="flex items-center gap-1 hover:text-gray-300 light:hover:text-gray-600 transition-colors">
              Strength <ArrowUpDown className="w-3 h-3" />
            </button>
          </div>

          {/* Table rows */}
          {filtered.map(contact => (
            <button
              key={contact.email}
              onClick={() => setSelectedContact(contact)}
              className="w-full text-left grid grid-cols-1 md:grid-cols-[1fr_100px_120px_80px_120px_110px] gap-2 md:gap-4 px-5 py-4 border-b border-[#1E2A4A]/60 light:border-gray-100 hover:bg-white/[0.03] light:hover:bg-gray-50 transition-colors group"
            >
              {/* Contact info */}
              <div className="flex items-center gap-3 min-w-0">
                {contact.avatarUrl ? (
                  <img
                    src={contact.avatarUrl}
                    alt={contact.name}
                    className="w-9 h-9 rounded-full shrink-0 object-cover"
                  />
                ) : (
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                    style={{ background: 'linear-gradient(135deg, #6366F1, #7A5CFF)' }}
                  >
                    {getInitials(contact.name)}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="text-sm font-medium text-white light:text-gray-900 truncate flex items-center gap-1.5">
                    {contact.name}
                    <span className="md:hidden"><StrengthIndicator score={calcStrength(contact)} size="dot" /></span>
                  </div>
                  <div className="text-xs text-gray-500 truncate flex items-center gap-1">
                    {contact.title && contact.company
                      ? `${contact.title} at ${contact.company}`
                      : contact.title || contact.company || contact.email}
                    {!contact.title && !contact.company && ''}
                  </div>
                  {(contact.title || contact.company) && (
                    <div className="text-[11px] text-gray-600 truncate">{contact.email}</div>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-gray-600 light:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity ml-auto md:hidden" />
              </div>

              {/* Meeting count */}
              <div className="flex items-center gap-1.5 text-sm text-gray-300 light:text-gray-600">
                <Video className="w-3.5 h-3.5 text-[#38E8FF] md:hidden" />
                <span>{contact.meetingCount}</span>
              </div>

              {/* Last meeting */}
              <div className="text-sm text-gray-400 light:text-gray-500" suppressHydrationWarning>
                {formatRelativeDate(contact.lastMeetingDate)}
              </div>

              {/* Emails sent */}
              <div className="flex items-center gap-1.5 text-sm text-gray-300 light:text-gray-600">
                <Mail className="w-3.5 h-3.5 text-[#6366F1] md:hidden" />
                <span>{contact.emailsSent}</span>
              </div>

              {/* Sequences */}
              <div className="flex items-center gap-2">
                {contact.activeSequences > 0 && (
                  <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                    {contact.activeSequences} active
                  </span>
                )}
                {contact.completedSequences > 0 && (
                  <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-full bg-[#6366F1]/15 text-[#6366F1] border border-[#6366F1]/20">
                    {contact.completedSequences} done
                  </span>
                )}
                {contact.activeSequences === 0 && contact.completedSequences === 0 && (
                  <span className="text-xs text-gray-600 light:text-gray-400">--</span>
                )}
              </div>

              {/* Strength */}
              <div className="hidden md:flex items-center">
                <StrengthIndicator score={calcStrength(contact)} />
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Contact detail slide-over */}
      {selectedContact && (
        <ContactDetail
          contact={selectedContact}
          onClose={() => setSelectedContact(null)}
          onRefresh={fetchContacts}
        />
      )}
    </div>
  );
}

function VerificationBadge({ status }: { status: EmailVerificationStatus }) {
  if (!status) return null;

  const config = {
    verified: {
      label: 'Verified',
      bg: 'bg-emerald-500/15',
      text: 'text-emerald-400',
      border: 'border-emerald-500/20',
    },
    unverified: {
      label: 'Unverified',
      bg: 'bg-red-500/15',
      text: 'text-red-400',
      border: 'border-red-500/20',
    },
    disposable: {
      label: 'Disposable',
      bg: 'bg-amber-500/15',
      text: 'text-amber-400',
      border: 'border-amber-500/20',
    },
  }[status];

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full ${config.bg} ${config.text} border ${config.border}`}
    >
      <ShieldCheck className="w-3 h-3" />
      {config.label}
    </span>
  );
}

function ContactDetail({ contact, onClose, onRefresh }: { contact: ContactData; onClose: () => void; onRefresh: () => void }) {
  const [enriching, setEnriching] = useState(false);
  const [enrichError, setEnrichError] = useState<string | null>(null);
  const [findLoading, setFindLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [foundEmail, setFoundEmail] = useState<string | null>(null);
  const [hunterError, setHunterError] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<EmailVerificationStatus>(null);
  const [verifyScore, setVerifyScore] = useState<number | null>(null);

  const hasEmail = !!contact.email && contact.email !== '';
  const hasNameAndCompany = !!contact.name && contact.name.trim().split(' ').length >= 2 && !!contact.company;

  const handleFindEmail = async () => {
    if (!hasNameAndCompany) return;
    setFindLoading(true);
    setHunterError(null);
    setFoundEmail(null);

    try {
      const nameParts = contact.name.trim().split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ');
      const domain = contact.company!.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com';

      const res = await fetch('/api/contacts/find-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, domain }),
      });

      if (!res.ok) {
        const data = await res.json();
        setHunterError(data.error || 'Failed to find email');
        return;
      }

      const data = await res.json();
      if (data.email) {
        setFoundEmail(data.email);
        onRefresh();
      } else {
        setHunterError('No email found for this contact');
      }
    } catch {
      setHunterError('Network error');
    } finally {
      setFindLoading(false);
    }
  };

  const handleVerifyEmail = async () => {
    const emailToVerify = foundEmail || contact.email;
    if (!emailToVerify) return;
    setVerifyLoading(true);
    setHunterError(null);

    try {
      const res = await fetch('/api/contacts/find-email?action=verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailToVerify }),
      });

      if (!res.ok) {
        const data = await res.json();
        setHunterError(data.error || 'Verification failed');
        return;
      }

      const data = await res.json();
      setVerifyScore(data.score);

      if (data.status === 'disposable') {
        setVerificationStatus('disposable');
      } else if (data.result === 'deliverable' || data.status === 'valid') {
        setVerificationStatus('verified');
      } else {
        setVerificationStatus('unverified');
      }
    } catch {
      setHunterError('Network error');
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleEnrich = async () => {
    setEnriching(true);
    setEnrichError(null);
    try {
      const res = await fetch('/api/contacts/enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: contact.email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setEnrichError(data.error || 'Enrichment failed');
      } else if (!data.enriched) {
        setEnrichError(data.message || 'No data found');
      } else {
        onRefresh();
      }
    } catch {
      setEnrichError('Failed to enrich contact');
    } finally {
      setEnriching(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-md bg-gray-950 light:bg-white border-l border-[#1E2A4A] light:border-gray-200 light:shadow-lg overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gray-950/90 light:bg-white/90 backdrop-blur-sm border-b border-[#1E2A4A] light:border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {contact.avatarUrl ? (
                <img
                  src={contact.avatarUrl}
                  alt={contact.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, #6366F1, #7A5CFF)' }}
                >
                  {getInitials(contact.name)}
                </div>
              )}
              <div>
                <h2 className="text-lg font-bold text-white light:text-gray-900">{contact.name}</h2>
                {contact.title && (
                  <p className="text-xs text-gray-400 light:text-gray-600">{contact.title}</p>
                )}
                <div className="flex items-center gap-2">
                  <p className="text-xs text-gray-500">{contact.email || 'No email'}</p>
                  <VerificationBadge status={verificationStatus} />
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white light:hover:text-gray-900 hover:bg-gray-800 light:hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Email Intelligence — Hunter.io */}
        <div className="px-6 py-4 border-b border-[#1E2A4A]/60 light:border-gray-100">
          <h3 className="text-sm font-semibold text-white light:text-gray-900 mb-3">Email Intelligence</h3>

          {foundEmail && (
            <div className="mb-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <p className="text-sm text-emerald-400">
                Found: <span className="font-medium">{foundEmail}</span>
              </p>
              <p className="text-xs text-gray-500 mt-1">Email saved to contact record</p>
            </div>
          )}

          {verifyScore !== null && (
            <div className="mb-3 p-3 rounded-lg bg-[#1E2A4A]/40 light:bg-gray-50 border border-[#1E2A4A] light:border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Deliverability Score</span>
                <span className="text-sm font-bold text-white light:text-gray-900">{verifyScore}/100</span>
              </div>
              <div className="mt-1.5 w-full h-1.5 rounded-full bg-gray-800 light:bg-gray-200 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    verifyScore >= 70 ? 'bg-emerald-400' : verifyScore >= 40 ? 'bg-amber-400' : 'bg-red-400'
                  }`}
                  style={{ width: `${verifyScore}%` }}
                />
              </div>
            </div>
          )}

          {hunterError && (
            <div className="mb-3 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
              <p className="text-xs text-red-400">{hunterError}</p>
            </div>
          )}

          <div className="flex gap-2">
            {!hasEmail && hasNameAndCompany && !foundEmail && (
              <button
                onClick={handleFindEmail}
                disabled={findLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-[#6366F1]/15 text-[#6366F1] border border-[#6366F1]/20 hover:bg-[#6366F1]/25 transition-colors disabled:opacity-50"
              >
                {findLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <SearchCheck className="w-3.5 h-3.5" />
                )}
                Find Email
              </button>
            )}

            {(hasEmail || foundEmail) && !verificationStatus && (
              <button
                onClick={handleVerifyEmail}
                disabled={verifyLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/25 transition-colors disabled:opacity-50"
              >
                {verifyLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <ShieldCheck className="w-3.5 h-3.5" />
                )}
                Verify
              </button>
            )}

            {!hasEmail && !hasNameAndCompany && !foundEmail && (
              <p className="text-xs text-gray-500">
                Add a name and company to find their email address.
              </p>
            )}
          </div>
        </div>

        {/* Company & enrichment info */}
        {(contact.company || contact.linkedinUrl) && (
          <div className="px-6 py-4 border-b border-[#1E2A4A]/60 light:border-gray-100 space-y-2">
            {contact.company && (
              <div className="flex items-center gap-2 text-sm text-gray-300 light:text-gray-700">
                <Building2 className="w-4 h-4 text-gray-500 shrink-0" />
                <span>{contact.company}</span>
              </div>
            )}
            {contact.linkedinUrl && (
              <a
                href={contact.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-[#0A66C2] hover:underline"
                onClick={e => e.stopPropagation()}
              >
                <Linkedin className="w-4 h-4 shrink-0" />
                <span>LinkedIn Profile</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        )}

        {/* Enrich button (if not yet enriched) */}
        {!contact.enrichedAt && (
          <div className="px-6 py-3 border-b border-[#1E2A4A]/60 light:border-gray-100">
            <button
              onClick={handleEnrich}
              disabled={enriching}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-[#6366F1] bg-[#6366F1]/10 hover:bg-[#6366F1]/20 border border-[#6366F1]/20 rounded-lg transition-colors disabled:opacity-50"
            >
              {enriching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {enriching ? 'Enriching...' : 'Enrich with Clearbit'}
            </button>
            {enrichError && (
              <p className="text-xs text-amber-400 light:text-amber-600 mt-2 text-center">{enrichError}</p>
            )}
          </div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 px-6 py-5 border-b border-[#1E2A4A]/60 light:border-gray-100">
          <div className="text-center">
            <div className="text-xl font-bold text-white light:text-gray-900">{contact.meetingCount}</div>
            <div className="text-xs text-gray-500 mt-0.5">Meetings</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-white light:text-gray-900">{contact.emailsSent}</div>
            <div className="text-xs text-gray-500 mt-0.5">Emails Sent</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-white light:text-gray-900">{contact.activeSequences + contact.completedSequences}</div>
            <div className="text-xs text-gray-500 mt-0.5">Sequences</div>
          </div>
        </div>

        {/* Activity timeline */}
        <div className="px-6 py-5">
          <h3 className="text-sm font-semibold text-white light:text-gray-900 mb-4">Activity</h3>
          <div className="space-y-4">
            {contact.lastMeetingTopic && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#38E8FF]/15 flex items-center justify-center shrink-0 mt-0.5">
                  <Video className="w-4 h-4 text-[#38E8FF]" />
                </div>
                <div>
                  <p className="text-sm text-white light:text-gray-900">{contact.lastMeetingTopic}</p>
                  <p className="text-xs text-gray-500 mt-0.5" suppressHydrationWarning>
                    Last meeting {formatRelativeDate(contact.lastMeetingDate)}
                  </p>
                </div>
              </div>
            )}

            {contact.emailsSent > 0 && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#6366F1]/15 flex items-center justify-center shrink-0 mt-0.5">
                  <Mail className="w-4 h-4 text-[#6366F1]" />
                </div>
                <div>
                  <p className="text-sm text-white light:text-gray-900">
                    {contact.emailsSent} follow-up email{contact.emailsSent !== 1 ? 's' : ''} sent
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">Via AI-generated drafts</p>
                </div>
              </div>
            )}

            {(contact.activeSequences > 0 || contact.completedSequences > 0) && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#7A5CFF]/15 flex items-center justify-center shrink-0 mt-0.5">
                  <Layers className="w-4 h-4 text-[#7A5CFF]" />
                </div>
                <div>
                  <p className="text-sm text-white light:text-gray-900">
                    {contact.activeSequences > 0 && `${contact.activeSequences} active sequence${contact.activeSequences !== 1 ? 's' : ''}`}
                    {contact.activeSequences > 0 && contact.completedSequences > 0 && ', '}
                    {contact.completedSequences > 0 && `${contact.completedSequences} completed`}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">Automated follow-up flows</p>
                </div>
              </div>
            )}

            {contact.meetingCount === 0 && contact.emailsSent === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">
                No activity recorded yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
