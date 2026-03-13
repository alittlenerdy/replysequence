'use client';

import { useState, useEffect, useCallback } from 'react';
import { Contact, Search, Video, Mail, Layers, RefreshCw, ArrowUpDown, ChevronRight, X } from 'lucide-react';

interface ContactData {
  email: string;
  name: string;
  meetingCount: number;
  lastMeetingDate: string | null;
  lastMeetingTopic: string | null;
  emailsSent: number;
  activeSequences: number;
  completedSequences: number;
}

type SortKey = 'name' | 'meetingCount' | 'lastMeetingDate' | 'emailsSent';

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
      }
      return sortAsc ? cmp : -cmp;
    });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 bg-gray-700/50 light:bg-gray-200 rounded animate-pulse" />
          <div className="h-9 w-64 bg-gray-700/50 light:bg-gray-200 rounded-lg animate-pulse" />
        </div>
        <div className="rounded-2xl bg-gray-900/60 border border-gray-700/50 light:bg-white light:border-gray-200 overflow-hidden">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-gray-700/30 light:border-gray-100 animate-pulse">
              <div className="w-9 h-9 rounded-full bg-gray-700/50 light:bg-gray-200" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-gray-700/50 light:bg-gray-200 rounded" />
                <div className="h-3 w-48 bg-gray-700/50 light:bg-gray-200 rounded" />
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
            <div className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-[#5B6CFF]/15">
              <Contact className="w-5 h-5 text-[#5B6CFF]" strokeWidth={1.5} />
            </div>
            Contacts
          </h1>
          <p className="text-sm text-gray-400 light:text-gray-500 mt-1">
            {contacts.length} contact{contacts.length !== 1 ? 's' : ''} from your meetings
          </p>
        </div>
        <button
          onClick={fetchContacts}
          className="p-2 text-gray-400 light:text-gray-500 hover:text-white light:hover:text-gray-900 hover:bg-gray-800 light:hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Refresh contacts"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl bg-gray-800/50 light:bg-white border border-gray-700/50 light:border-gray-200 text-white light:text-gray-900 placeholder:text-gray-500 focus:outline-none focus:border-[#5B6CFF]/50"
        />
      </div>

      {error && (
        <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-4 text-center">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Contacts table */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#5B6CFF]/10 mb-6">
            <Contact className="w-8 h-8 text-[#5B6CFF]" strokeWidth={1.5} />
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
        <div className="rounded-2xl bg-gray-900/60 border border-gray-700/50 light:bg-white light:border-gray-200 overflow-hidden">
          {/* Table header */}
          <div className="hidden md:grid grid-cols-[1fr_100px_120px_80px_120px] gap-4 px-5 py-3 border-b border-gray-700/50 light:border-gray-200 text-xs font-medium text-gray-500 light:text-gray-400 uppercase tracking-wider">
            <button onClick={() => handleSort('name')} className="flex items-center gap-1 text-left hover:text-gray-300 light:hover:text-gray-600">
              Contact <ArrowUpDown className="w-3 h-3" />
            </button>
            <button onClick={() => handleSort('meetingCount')} className="flex items-center gap-1 hover:text-gray-300 light:hover:text-gray-600">
              Meetings <ArrowUpDown className="w-3 h-3" />
            </button>
            <button onClick={() => handleSort('lastMeetingDate')} className="flex items-center gap-1 hover:text-gray-300 light:hover:text-gray-600">
              Last Meeting <ArrowUpDown className="w-3 h-3" />
            </button>
            <button onClick={() => handleSort('emailsSent')} className="flex items-center gap-1 hover:text-gray-300 light:hover:text-gray-600">
              Emails <ArrowUpDown className="w-3 h-3" />
            </button>
            <span>Sequences</span>
          </div>

          {/* Table rows */}
          {filtered.map(contact => (
            <button
              key={contact.email}
              onClick={() => setSelectedContact(contact)}
              className="w-full text-left grid grid-cols-1 md:grid-cols-[1fr_100px_120px_80px_120px] gap-2 md:gap-4 px-5 py-4 border-b border-gray-700/30 light:border-gray-100 hover:bg-white/[0.03] light:hover:bg-gray-50 transition-colors group"
            >
              {/* Contact info */}
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                  style={{ background: 'linear-gradient(135deg, #5B6CFF, #7A5CFF)' }}
                >
                  {getInitials(contact.name)}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-white light:text-gray-900 truncate">
                    {contact.name}
                  </div>
                  <div className="text-xs text-gray-500 truncate">{contact.email}</div>
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
                <Mail className="w-3.5 h-3.5 text-[#5B6CFF] md:hidden" />
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
                  <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-full bg-[#5B6CFF]/15 text-[#5B6CFF] border border-[#5B6CFF]/20">
                    {contact.completedSequences} done
                  </span>
                )}
                {contact.activeSequences === 0 && contact.completedSequences === 0 && (
                  <span className="text-xs text-gray-600 light:text-gray-400">--</span>
                )}
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
        />
      )}
    </div>
  );
}

function ContactDetail({ contact, onClose }: { contact: ContactData; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-md bg-gray-950 light:bg-white border-l border-gray-700/50 light:border-gray-200 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gray-950/90 light:bg-white/90 backdrop-blur-sm border-b border-gray-700/50 light:border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #5B6CFF, #7A5CFF)' }}
              >
                {getInitials(contact.name)}
              </div>
              <div>
                <h2 className="text-lg font-bold text-white light:text-gray-900">{contact.name}</h2>
                <p className="text-xs text-gray-500">{contact.email}</p>
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

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 px-6 py-5 border-b border-gray-700/30 light:border-gray-100">
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
                <div className="w-8 h-8 rounded-lg bg-[#5B6CFF]/15 flex items-center justify-center shrink-0 mt-0.5">
                  <Mail className="w-4 h-4 text-[#5B6CFF]" />
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
