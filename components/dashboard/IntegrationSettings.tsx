'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2, Check, ExternalLink, Unplug, Lightbulb, AlertTriangle, Clock, X, ChevronDown, Star, Plus, Settings2 } from 'lucide-react';
import { checkPlatformConnections, type PlatformConnectionDetails, type MeetConnectionInfo } from '@/app/actions/checkPlatformConnections';

interface PlatformConfig {
  id: 'zoom' | 'teams' | 'meet' | 'calendar' | 'outlookCalendar' | 'hubspot' | 'airtable' | 'gmail' | 'outlook';
  name: string;
  description: string;
  color: string;
  bgColor: string;
  icon: React.ReactNode;
  connectUrl: string;
  disconnectUrl: string;
  category: 'meeting' | 'calendar' | 'crm' | 'email';
}

const platforms: PlatformConfig[] = [
  // Meeting platforms
  {
    id: 'zoom',
    name: 'Zoom',
    description: 'Capture transcripts from Zoom cloud recordings',
    color: '#2D8CFF',
    bgColor: 'bg-[#2D8CFF]/10',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#2D8CFF">
        <path d="M4.585 6.836C3.71 6.836 3 7.547 3 8.42v7.16c0 .872.71 1.584 1.585 1.584h9.83c.875 0 1.585-.712 1.585-1.585V8.42c0-.872-.71-1.585-1.585-1.585H4.585zm12.415 2.11l3.96-2.376c.666-.4 1.04-.266 1.04.56v9.74c0 .826-.374.96-1.04.56L17 15.054V8.946z"/>
      </svg>
    ),
    connectUrl: '/api/auth/zoom',
    disconnectUrl: '/api/integrations/zoom/disconnect',
    category: 'meeting',
  },
  {
    id: 'teams',
    name: 'Microsoft Teams',
    description: 'Sync meeting transcripts from Teams calls',
    color: '#5B5FC7',
    bgColor: 'bg-[#5B5FC7]/10',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#5B5FC7">
        <path d="M20.625 8.5h-6.25a.625.625 0 00-.625.625v6.25c0 .345.28.625.625.625h6.25c.345 0 .625-.28.625-.625v-6.25a.625.625 0 00-.625-.625zM17.5 6.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM12.5 8a3 3 0 100-6 3 3 0 000 6zm0 1c-2.21 0-4 1.567-4 3.5V15h8v-2.5c0-1.933-1.79-3.5-4-3.5z"/>
      </svg>
    ),
    connectUrl: '/api/auth/teams',
    disconnectUrl: '/api/integrations/teams/disconnect',
    category: 'meeting',
  },
  {
    id: 'meet',
    name: 'Google Meet',
    description: 'Import transcripts from Google Meet sessions',
    color: '#00897B',
    bgColor: 'bg-[#00897B]/10',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#00897B">
        <path d="M12 11.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"/>
        <path d="M15.29 15.71L18 18.41V5.59l-2.71 2.7A5.977 5.977 0 0112 7c-1.38 0-2.65.47-3.66 1.26L14.59 2H5a2 2 0 00-2 2v16a2 2 0 002 2h14a2 2 0 002-2V9.41l-5.71 6.3zM6 10a6 6 0 1112 0 6 6 0 01-12 0z"/>
      </svg>
    ),
    connectUrl: '/api/auth/meet',
    disconnectUrl: '/api/integrations/meet/disconnect',
    category: 'meeting',
  },
  // Calendar platforms
  {
    id: 'calendar',
    name: 'Google Calendar',
    description: 'Sync upcoming meetings from your Google Calendar',
    color: '#4285F4',
    bgColor: 'bg-[#4285F4]/10',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#4285F4">
        <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11zM9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm-8 4H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z"/>
      </svg>
    ),
    connectUrl: '/api/auth/calendar',
    disconnectUrl: '/api/integrations/calendar/disconnect',
    category: 'calendar',
  },
  {
    id: 'outlookCalendar',
    name: 'Outlook Calendar',
    description: 'Sync upcoming meetings from your Outlook Calendar',
    color: '#0078D4',
    bgColor: 'bg-[#0078D4]/10',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#0078D4">
        <path d="M7 3C4.239 3 2 5.239 2 8v8c0 2.761 2.239 5 5 5h10c2.761 0 5-2.239 5-5V8c0-2.761-2.239-5-5-5H7zm0 2h10c1.654 0 3 1.346 3 3v8c0 1.654-1.346 3-3 3H7c-1.654 0-3-1.346-3-3V8c0-1.654 1.346-3 3-3zm1 3v2h2V8H8zm3 0v2h2V8h-2zm3 0v2h2V8h-2zm-6 3v2h2v-2H8zm3 0v2h2v-2h-2zm3 0v2h2v-2h-2zm-6 3v2h2v-2H8zm3 0v2h2v-2h-2z"/>
      </svg>
    ),
    connectUrl: '/api/auth/outlook-calendar',
    disconnectUrl: '/api/integrations/outlook-calendar/disconnect',
    category: 'calendar',
  },
  // Email accounts
  {
    id: 'gmail',
    name: 'Gmail',
    description: 'Send follow-up emails from your Gmail address',
    color: '#EA4335',
    bgColor: 'bg-[#EA4335]/10',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#EA4335">
        <path d="M20 18h-2V9.25L12 13 6 9.25V18H4V6h1.2l6.8 4.25L18.8 6H20m0-2H4c-1.11 0-2 .89-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2z"/>
      </svg>
    ),
    connectUrl: '/api/auth/gmail',
    disconnectUrl: '/api/integrations/gmail/disconnect',
    category: 'email',
  },
  {
    id: 'outlook',
    name: 'Outlook / Microsoft 365',
    description: 'Send follow-up emails from your Outlook address',
    color: '#0078D4',
    bgColor: 'bg-[#0078D4]/10',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#0078D4">
        <path d="M7 12l5 3 5-3v7H7v-7zm0-2l5 3 5-3V5H7v5zm-2 9V3h14v16H5z"/>
      </svg>
    ),
    connectUrl: '/api/auth/outlook',
    disconnectUrl: '/api/integrations/outlook/disconnect',
    category: 'email',
  },
  // CRM platforms
  {
    id: 'hubspot',
    name: 'HubSpot',
    description: 'Sync sent emails and meeting notes to HubSpot CRM',
    color: '#FF7A59',
    bgColor: 'bg-[#FF7A59]/10',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#FF7A59">
        <path d="M18.164 7.93V5.084a2.198 2.198 0 001.267-1.984 2.21 2.21 0 00-2.212-2.212 2.21 2.21 0 00-2.212 2.212c0 .874.517 1.627 1.267 1.984v2.847a5.395 5.395 0 00-2.627 1.2L7.258 4.744a2.036 2.036 0 00.069-.493 2.035 2.035 0 00-2.035-2.035A2.035 2.035 0 003.257 4.25a2.035 2.035 0 002.035 2.035c.27 0 .527-.054.763-.15l6.324 4.324a5.418 5.418 0 00-.843 2.903c0 1.074.313 2.076.852 2.92l-2.038 2.04a1.95 1.95 0 00-.595-.094 1.97 1.97 0 00-1.968 1.968 1.97 1.97 0 001.968 1.968 1.97 1.97 0 001.968-1.968c0-.211-.034-.414-.095-.603l2.018-2.018a5.42 5.42 0 003.571 1.334 5.432 5.432 0 005.432-5.432 5.42 5.42 0 00-4.485-5.347zm-1.047 8.537a3.16 3.16 0 01-3.163-3.163 3.16 3.16 0 013.163-3.163 3.16 3.16 0 013.163 3.163 3.16 3.16 0 01-3.163 3.163z"/>
      </svg>
    ),
    connectUrl: '/api/auth/hubspot',
    disconnectUrl: '/api/integrations/hubspot/disconnect',
    category: 'crm',
  },
  {
    id: 'airtable',
    name: 'Airtable',
    description: 'Sync meeting data and sent emails to your Airtable base',
    color: '#18BFFF',
    bgColor: 'bg-[#18BFFF]/10',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#18BFFF">
        <path d="M11.52 2.386l-7.297 2.67a1.074 1.074 0 000 2.013l7.297 2.67a1.607 1.607 0 001.106 0l7.297-2.67a1.074 1.074 0 000-2.013l-7.297-2.67a1.607 1.607 0 00-1.106 0z"/>
        <path d="M3.413 10.22l7.89 3.09a1.361 1.361 0 001.002 0l7.89-3.09.608 1.55-8.497 3.33a1.361 1.361 0 01-1.003 0l-8.497-3.33.608-1.55z"/>
        <path d="M3.413 14.72l7.89 3.09a1.361 1.361 0 001.002 0l7.89-3.09.608 1.55-8.497 3.33a1.361 1.361 0 01-1.003 0l-8.497-3.33.608-1.55z"/>
      </svg>
    ),
    connectUrl: '', // Form-based, not OAuth redirect
    disconnectUrl: '/api/integrations/airtable/disconnect',
    category: 'crm',
  },
];

// Format relative time for "connected X ago" - requires nowMs to avoid hydration mismatch
function formatRelativeTime(date: Date | undefined, nowMs: number): string {
  if (!date || nowMs === 0) return '';
  const diffMs = nowMs - new Date(date).getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffDays > 30) return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) !== 1 ? 's' : ''} ago`;
  if (diffDays > 0) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  if (diffHours > 0) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  if (diffMinutes > 0) return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
  return 'just now';
}

export function IntegrationSettings() {
  const searchParams = useSearchParams();
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<Record<string, boolean>>({
    zoom: false,
    teams: false,
    meet: false,
    calendar: false,
    outlookCalendar: false,
    hubspot: false,
    airtable: false,
    gmail: false,
    outlook: false,
  });
  // Track "now" in state to avoid hydration mismatch with relative times
  const [nowMs, setNowMs] = useState(0);

  // Show success/error from URL params (e.g., OAuth callback results)
  useEffect(() => {
    const error = searchParams.get('error');
    const message = searchParams.get('message');
    const success = searchParams.get('success');

    if (error) {
      const errorMessages: Record<string, string> = {
        hubspot_connection_failed: 'HubSpot connection failed. Please try again.',
        hubspot_missing_code: 'HubSpot authorization was cancelled.',
        hubspot_missing_scope_meetings_write: 'HubSpot connected but missing meetings permission. Please reconnect.',
        hubspot_invalid_state: 'HubSpot connection expired. Please try again.',
      };
      setErrorBanner(message || errorMessages[error] || `Connection error: ${error}`);
    }

    if (success === 'hubspot_connected') {
      setSuccessBanner('HubSpot connected successfully.');
      setTimeout(() => setSuccessBanner(null), 3000);
    }
  }, [searchParams]);

  // Initialize nowMs on client only
  useEffect(() => {
    setNowMs(Date.now());
    const interval = setInterval(() => setNowMs(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);
  const [connectionDetails, setConnectionDetails] = useState<Record<string, PlatformConnectionDetails>>({
    zoom: { connected: false },
    teams: { connected: false },
    meet: { connected: false },
    calendar: { connected: false },
    outlookCalendar: { connected: false },
    hubspot: { connected: false },
    airtable: { connected: false },
    gmail: { connected: false },
    outlook: { connected: false },
  });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchConnectionStatus = useCallback(async () => {
    try {
      const result = await checkPlatformConnections();
      setConnectionStatus(result.platforms);
      setConnectionDetails(result.details);
    } catch (error) {
      console.error('Failed to check connections:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConnectionStatus();
  }, [fetchConnectionStatus]);

  const handleConnect = (platform: PlatformConfig) => {
    setActionLoading(platform.id);
    // Pass redirect parameter so OAuth returns to Settings after completion
    const returnUrl = '/dashboard/settings?connected=' + platform.id;
    window.location.href = `${platform.connectUrl}?redirect=${encodeURIComponent(returnUrl)}`;
  };

  const [disconnectConfirm, setDisconnectConfirm] = useState<string | null>(null);
  const [meetDisconnectConfirm, setMeetDisconnectConfirm] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['meeting']));

  // Meet multi-connection handlers
  const handleSetPrimary = async (connectionId: string) => {
    try {
      const response = await fetch('/api/integrations/meet/set-primary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionId }),
      });
      if (response.ok) {
        setSuccessBanner('Primary Google account updated');
        setTimeout(() => setSuccessBanner(null), 3000);
        fetchConnectionStatus();
      }
    } catch (error) {
      console.error('Set primary error:', error);
      setErrorBanner('Failed to update primary account');
    }
  };

  const handleDisconnectMeetConnection = async (connectionId: string) => {
    if (meetDisconnectConfirm !== connectionId) {
      setMeetDisconnectConfirm(connectionId);
      return;
    }
    setMeetDisconnectConfirm(null);
    try {
      const response = await fetch(`/api/integrations/meet/disconnect?connectionId=${connectionId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setSuccessBanner('Google account disconnected');
        setTimeout(() => setSuccessBanner(null), 3000);
        fetchConnectionStatus();
      }
    } catch (error) {
      console.error('Disconnect Meet connection error:', error);
      setErrorBanner('Failed to disconnect Google account');
    }
  };

  // Airtable configuration form state
  const [showAirtableForm, setShowAirtableForm] = useState(false);
  const [airtableApiKey, setAirtableApiKey] = useState('');
  const [airtableBaseId, setAirtableBaseId] = useState('');
  const [airtableContactsTable, setAirtableContactsTable] = useState('Contacts');
  const [airtableMeetingsTable, setAirtableMeetingsTable] = useState('Meetings');
  const [airtableError, setAirtableError] = useState<string | null>(null);
  const [airtableConnecting, setAirtableConnecting] = useState(false);

  const handleAirtableConnect = async () => {
    if (!airtableApiKey || !airtableBaseId) {
      setAirtableError('API key and Base ID are required');
      return;
    }
    setAirtableError(null);
    setAirtableConnecting(true);
    try {
      const response = await fetch('/api/integrations/airtable/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: airtableApiKey,
          baseId: airtableBaseId,
          contactsTable: airtableContactsTable,
          meetingsTable: airtableMeetingsTable,
        }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setShowAirtableForm(false);
        setAirtableApiKey('');
        setAirtableBaseId('');
        setSuccessBanner('Airtable connected successfully');
        setTimeout(() => setSuccessBanner(null), 3000);
        fetchConnectionStatus();
      } else {
        setAirtableError(data.error || 'Failed to connect');
      }
    } catch (error) {
      setAirtableError('Connection failed. Please check your credentials.');
    } finally {
      setAirtableConnecting(false);
    }
  };

  const toggleSection = (sectionKey: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(sectionKey)) {
        next.delete(sectionKey);
      } else {
        next.add(sectionKey);
      }
      return next;
    });
  };

  const getSectionCounts = (category: PlatformConfig['category']) => {
    const sectionPlatforms = platforms.filter(p => p.category === category);
    const connected = sectionPlatforms.filter(p => connectionStatus[p.id]).length;
    return { connected, total: sectionPlatforms.length };
  };

  const handleDisconnect = async (platform: PlatformConfig) => {
    // If not confirming yet, show confirmation
    if (disconnectConfirm !== platform.id) {
      setDisconnectConfirm(platform.id);
      return;
    }

    setDisconnectConfirm(null);
    setActionLoading(platform.id);
    setErrorBanner(null);
    try {
      const response = await fetch(platform.disconnectUrl, {
        method: 'DELETE',
      });

      if (response.ok) {
        setConnectionStatus(prev => ({ ...prev, [platform.id]: false }));
        setSuccessBanner(`${platform.name} disconnected successfully`);
        setTimeout(() => setSuccessBanner(null), 3000);
      } else {
        setErrorBanner(`Failed to disconnect ${platform.name}. Please try again.`);
      }
    } catch (error) {
      console.error('Disconnect error:', error);
      setErrorBanner(`Failed to disconnect ${platform.name}. Please try again.`);
    } finally {
      setActionLoading(null);
    }
  };

  const connectedCount = Object.values(connectionStatus).filter(Boolean).length;
  const hasNoConnections = connectedCount === 0;

  return (
    <div className="max-w-2xl mx-auto">
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
        </div>
      ) : (
        <div>
      {/* Error Banner */}
      {errorBanner && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-red-300 light:text-red-600">{errorBanner}</p>
          </div>
          <button onClick={() => setErrorBanner(null)} className="text-red-400 hover:text-red-300">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Success Banner */}
      {successBanner && (
        <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-3">
          <Check className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <p className="text-sm text-emerald-300 light:text-emerald-600 flex-1">{successBanner}</p>
          <button onClick={() => setSuccessBanner(null)} className="text-emerald-400 hover:text-emerald-300">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Getting Started Banner - only show when no platforms connected */}
      {hasNoConnections && (
        <div className="mb-6 p-6 bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-transparent border border-blue-500/20 rounded-2xl relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute -right-10 -top-10 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl" />
          <div className="absolute -left-10 -bottom-10 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl" />

          <div className="relative flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex-1">
              <h3 className="text-lg font-bold text-white light:text-gray-900 mb-2 flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
                </span>
                Get Started in 2 Minutes
              </h3>
              <p className="text-gray-300 light:text-gray-600 text-sm">
                Connect your first meeting platform below. Once connected, ReplySequence will automatically
                capture transcripts and generate follow-up emails after each meeting.
              </p>
            </div>
            <div className="flex gap-2">
              <a
                href="/how-it-works"
                className="text-sm text-blue-400 hover:text-blue-300 whitespace-nowrap"
              >
                See how it works
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Meeting Platforms */}
      <div className="mb-4">
        <button
          onClick={() => toggleSection('meeting')}
          className="w-full flex items-center justify-between py-3 px-1 group cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-white light:text-gray-900">Meeting Platforms</h3>
            {(() => {
              const { connected, total } = getSectionCounts('meeting');
              return (
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  connected > 0
                    ? 'bg-emerald-500/20 text-emerald-400 light:bg-emerald-100 light:text-emerald-700'
                    : 'bg-gray-700 text-gray-400 light:bg-gray-200 light:text-gray-500'
                }`}>
                  {connected}/{total} connected
                </span>
              );
            })()}
          </div>
          <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
            expandedSections.has('meeting') ? 'rotate-180' : ''
          }`} />
        </button>
        <div className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
          expandedSections.has('meeting') ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}>
          <div className="overflow-hidden">
      <div className="space-y-4 pb-4">
        {platforms.filter(p => p.category === 'meeting').map((platform) => {
          const isConnected = connectionStatus[platform.id];
          const details = connectionDetails[platform.id];
          const isLoading = actionLoading === platform.id;

          // Determine status color: green (healthy), yellow (expiring soon), red (expired)
          const getStatusColor = () => {
            if (!isConnected) return null;
            if (details?.isExpired) return 'red';
            if (details?.isExpiringSoon) return 'yellow';
            return 'green';
          };
          const statusColor = getStatusColor();

          return (
            <div
              key={platform.id}
              className={`border rounded-xl p-4 transition-colors ${
                isConnected
                  ? statusColor === 'red'
                    ? 'border-red-500/30 bg-red-500/5 light:bg-red-50 light:border-red-200'
                    : statusColor === 'yellow'
                    ? 'border-yellow-500/30 bg-yellow-500/5 light:bg-yellow-50 light:border-yellow-200'
                    : 'border-emerald-500/30 bg-emerald-500/5 light:bg-emerald-50 light:border-emerald-200'
                  : 'border-gray-700 light:border-gray-200 bg-gray-900/50 light:bg-white hover:border-gray-600 light:hover:border-gray-300 light:shadow-sm'
              }`}
            >
              <div className="flex items-center gap-4">
                {/* Platform Icon */}
                <div className={`w-10 h-10 rounded-xl ${platform.bgColor} flex items-center justify-center shrink-0`}>
                  {platform.icon}
                </div>

                {/* Platform Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-semibold text-white light:text-gray-900">{platform.name}</h3>
                    {isConnected && (
                      <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                        statusColor === 'red'
                          ? 'bg-red-500/20 text-red-400'
                          : statusColor === 'yellow'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        {statusColor === 'red' ? (
                          <>
                            <AlertTriangle className="w-3 h-3" />
                            Expired
                          </>
                        ) : statusColor === 'yellow' ? (
                          <>
                            <Clock className="w-3 h-3" />
                            Expiring Soon
                          </>
                        ) : (
                          <>
                            <Check className="w-3 h-3" />
                            Connected
                          </>
                        )}
                      </span>
                    )}
                  </div>
                  {isConnected && details?.email ? (
                    <div className="mt-1">
                      <p className="text-sm text-gray-300 light:text-gray-700 truncate">{details.email}</p>
                      {details.connectedAt && (
                        <p className="text-xs text-gray-500 light:text-gray-400 mt-0.5">
                          Connected {formatRelativeTime(details.connectedAt, nowMs)}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 light:text-gray-500 mt-0.5">{platform.description}</p>
                  )}
                  {/* Warning message for expiring/expired tokens */}
                  {isConnected && (details?.isExpired || details?.isExpiringSoon) && (
                    <p className={`text-xs mt-1 ${
                      details.isExpired ? 'text-red-400' : 'text-yellow-400'
                    }`}>
                      {details.isExpired
                        ? 'Token expired. Reconnect to continue receiving meeting transcripts.'
                        : 'Token expiring soon. Consider reconnecting to avoid interruptions.'}
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons - separate row on mobile */}
              <div className="mt-3 flex justify-end">
                {isConnected ? (
                  <div className="flex items-center gap-2">
                    {(details?.isExpired || details?.isExpiringSoon || details?.needsReconnect) && (
                      <button
                        onClick={() => handleConnect(platform)}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-white rounded-lg transition-colors disabled:opacity-50"
                        style={{ backgroundColor: platform.color }}
                      >
                        {isLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <ExternalLink className="w-4 h-4" />
                        )}
                        Reconnect
                      </button>
                    )}
                    {/* Meet: show Add Account + Disconnect All */}
                    {platform.id === 'meet' ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleConnect(platform)}
                          disabled={isLoading}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700/50 light:text-gray-600 light:hover:text-gray-900 light:hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                        >
                          <Plus className="w-4 h-4" />
                          Add Account
                        </button>
                        {disconnectConfirm === platform.id ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">Disconnect all?</span>
                            <button
                              onClick={() => handleDisconnect(platform)}
                              disabled={isLoading}
                              className="px-3 py-1.5 text-xs font-medium text-red-400 bg-red-500/15 hover:bg-red-500/25 rounded-lg transition-colors disabled:opacity-50"
                            >
                              {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Yes'}
                            </button>
                            <button
                              onClick={() => setDisconnectConfirm(null)}
                              className="px-3 py-1.5 text-xs text-gray-400 hover:text-white transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleDisconnect(platform)}
                            disabled={isLoading}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                          >
                            <Unplug className="w-4 h-4" />
                            Disconnect
                          </button>
                        )}
                      </div>
                    ) : (
                      <>
                        {disconnectConfirm === platform.id ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">Are you sure?</span>
                            <button
                              onClick={() => handleDisconnect(platform)}
                              disabled={isLoading}
                              className="px-3 py-1.5 text-xs font-medium text-red-400 bg-red-500/15 hover:bg-red-500/25 rounded-lg transition-colors disabled:opacity-50"
                            >
                              {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Yes, disconnect'}
                            </button>
                            <button
                              onClick={() => setDisconnectConfirm(null)}
                              className="px-3 py-1.5 text-xs text-gray-400 hover:text-white transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleDisconnect(platform)}
                            disabled={isLoading}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                          >
                            {isLoading ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Unplug className="w-4 h-4" />
                            )}
                            Disconnect
                          </button>
                        )}
                      </>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => handleConnect(platform)}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-white rounded-lg transition-colors disabled:opacity-50"
                    style={{ backgroundColor: platform.color }}
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ExternalLink className="w-4 h-4" />
                    )}
                    Connect
                  </button>
                )}
              </div>

              {/* Meet Multi-Connection List */}
              {platform.id === 'meet' && isConnected && details?.connections && details.connections.length > 1 && (
                <div className="mt-4 pt-4 border-t border-gray-700/50 light:border-gray-200">
                  <p className="text-xs font-medium text-gray-400 light:text-gray-500 mb-3">Connected Google Accounts</p>
                  <div className="space-y-2">
                    {details.connections.map((conn: MeetConnectionInfo) => (
                      <div
                        key={conn.id}
                        className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-800/50 light:bg-gray-50"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {conn.isPrimary && (
                            <Star className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" fill="currentColor" />
                          )}
                          <span className="text-sm text-gray-200 light:text-gray-700 truncate">{conn.email}</span>
                          {conn.isPrimary && (
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400 flex-shrink-0">
                              Primary
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                          {!conn.isPrimary && (
                            <button
                              onClick={() => handleSetPrimary(conn.id)}
                              className="px-2 py-1 text-[11px] text-gray-400 hover:text-yellow-400 transition-colors rounded"
                              title="Set as primary"
                            >
                              Set Primary
                            </button>
                          )}
                          {meetDisconnectConfirm === conn.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleDisconnectMeetConnection(conn.id)}
                                className="px-2 py-1 text-[11px] text-red-400 hover:bg-red-500/15 rounded transition-colors"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => setMeetDisconnectConfirm(null)}
                                className="px-2 py-1 text-[11px] text-gray-500 hover:text-gray-300 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleDisconnectMeetConnection(conn.id)}
                              className="px-2 py-1 text-[11px] text-gray-500 hover:text-red-400 transition-colors rounded"
                              title="Disconnect this account"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
          </div>
        </div>
      </div>

      {/* Calendar Integrations */}
      <div className="mb-4">
        <button
          onClick={() => toggleSection('calendar')}
          className="w-full flex items-center justify-between py-3 px-1 group cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-white light:text-gray-900">Calendar Integrations</h3>
            {(() => {
              const { connected, total } = getSectionCounts('calendar');
              return (
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  connected > 0
                    ? 'bg-emerald-500/20 text-emerald-400 light:bg-emerald-100 light:text-emerald-700'
                    : 'bg-gray-700 text-gray-400 light:bg-gray-200 light:text-gray-500'
                }`}>
                  {connected}/{total} connected
                </span>
              );
            })()}
          </div>
          <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
            expandedSections.has('calendar') ? 'rotate-180' : ''
          }`} />
        </button>
        <div className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
          expandedSections.has('calendar') ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}>
          <div className="overflow-hidden">
      <p className="text-sm text-gray-400 light:text-gray-500 mb-3">
        Connect your calendar to sync upcoming meetings and enable proactive follow-up preparation.
      </p>
      <div className="space-y-4 pb-4">
        {platforms.filter(p => p.category === 'calendar').map((platform) => {
          const isConnected = connectionStatus[platform.id];
          const details = connectionDetails[platform.id];
          const isLoading = actionLoading === platform.id;

          const getStatusColor = () => {
            if (!isConnected) return null;
            if (details?.isExpired) return 'red';
            if (details?.isExpiringSoon) return 'yellow';
            return 'green';
          };
          const statusColor = getStatusColor();

          return (
            <div
              key={platform.id}
              className={`border rounded-xl p-4 transition-colors ${
                isConnected
                  ? statusColor === 'red'
                    ? 'border-red-500/30 bg-red-500/5 light:bg-red-50 light:border-red-200'
                    : statusColor === 'yellow'
                    ? 'border-yellow-500/30 bg-yellow-500/5 light:bg-yellow-50 light:border-yellow-200'
                    : 'border-emerald-500/30 bg-emerald-500/5 light:bg-emerald-50 light:border-emerald-200'
                  : 'border-gray-700 light:border-gray-200 bg-gray-900/50 light:bg-white hover:border-gray-600 light:hover:border-gray-300 light:shadow-sm'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl ${platform.bgColor} flex items-center justify-center shrink-0`}>
                  {platform.icon}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-semibold text-white light:text-gray-900">{platform.name}</h3>
                    {isConnected && (
                      <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                        statusColor === 'red'
                          ? 'bg-red-500/20 text-red-400'
                          : statusColor === 'yellow'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        {statusColor === 'red' ? (
                          <>
                            <AlertTriangle className="w-3 h-3" />
                            Expired
                          </>
                        ) : statusColor === 'yellow' ? (
                          <>
                            <Clock className="w-3 h-3" />
                            Expiring Soon
                          </>
                        ) : (
                          <>
                            <Check className="w-3 h-3" />
                            Connected
                          </>
                        )}
                      </span>
                    )}
                  </div>
                  {isConnected && details?.email ? (
                    <div className="mt-1">
                      <p className="text-sm text-gray-300 light:text-gray-700 truncate">{details.email}</p>
                      {details.connectedAt && (
                        <p className="text-xs text-gray-500 light:text-gray-400 mt-0.5">
                          Connected {formatRelativeTime(details.connectedAt, nowMs)}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 light:text-gray-500 mt-0.5">{platform.description}</p>
                  )}
                  {isConnected && (details?.isExpired || details?.isExpiringSoon) && (
                    <p className={`text-xs mt-1 ${
                      details.isExpired ? 'text-red-400' : 'text-yellow-400'
                    }`}>
                      {details.isExpired
                        ? 'Token expired. Reconnect to continue syncing your calendar.'
                        : 'Token expiring soon. Consider reconnecting to avoid interruptions.'}
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons - separate row on mobile */}
              <div className="mt-3 flex justify-end">
                {isConnected ? (
                  <div className="flex items-center gap-2">
                    {(details?.isExpired || details?.isExpiringSoon || details?.needsReconnect) && (
                      <button
                        onClick={() => handleConnect(platform)}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-white rounded-lg transition-colors disabled:opacity-50"
                        style={{ backgroundColor: platform.color }}
                      >
                        {isLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <ExternalLink className="w-4 h-4" />
                        )}
                        Reconnect
                      </button>
                    )}
                    {disconnectConfirm === platform.id ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">Are you sure?</span>
                        <button
                          onClick={() => handleDisconnect(platform)}
                          disabled={isLoading}
                          className="px-3 py-1.5 text-xs font-medium text-red-400 bg-red-500/15 hover:bg-red-500/25 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Yes, disconnect'}
                        </button>
                        <button
                          onClick={() => setDisconnectConfirm(null)}
                          className="px-3 py-1.5 text-xs text-gray-400 hover:text-white transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleDisconnect(platform)}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {isLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Unplug className="w-4 h-4" />
                        )}
                        Disconnect
                      </button>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => handleConnect(platform)}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-white rounded-lg transition-colors disabled:opacity-50"
                    style={{ backgroundColor: platform.color }}
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ExternalLink className="w-4 h-4" />
                    )}
                    Connect
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
          </div>
        </div>
      </div>

      {/* Email Accounts */}
      <div className="mb-4">
        <button
          onClick={() => toggleSection('email')}
          className="w-full flex items-center justify-between py-3 px-1 group cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-white light:text-gray-900">Email Accounts</h3>
            {(() => {
              const { connected, total } = getSectionCounts('email');
              return (
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  connected > 0
                    ? 'bg-emerald-500/20 text-emerald-400 light:bg-emerald-100 light:text-emerald-700'
                    : 'bg-gray-700 text-gray-400 light:bg-gray-200 light:text-gray-500'
                }`}>
                  {connected}/{total} connected
                </span>
              );
            })()}
          </div>
          <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
            expandedSections.has('email') ? 'rotate-180' : ''
          }`} />
        </button>
        <div className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
          expandedSections.has('email') ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}>
          <div className="overflow-hidden">
      <p className="text-sm text-gray-400 light:text-gray-500 mb-3">
        Connect your email to send follow-ups from your real address instead of noreply@resend.dev.
      </p>
      <div className="space-y-4 pb-4">
        {platforms.filter(p => p.category === 'email').map((platform) => {
          const isConnected = connectionStatus[platform.id];
          const details = connectionDetails[platform.id];
          const isLoading = actionLoading === platform.id;

          const getStatusColor = () => {
            if (!isConnected) return null;
            if (details?.isExpired) return 'red';
            if (details?.isExpiringSoon) return 'yellow';
            return 'green';
          };
          const statusColor = getStatusColor();

          return (
            <div
              key={platform.id}
              className={`border rounded-xl p-4 transition-colors ${
                isConnected
                  ? statusColor === 'red'
                    ? 'border-red-500/30 bg-red-500/5 light:bg-red-50 light:border-red-200'
                    : statusColor === 'yellow'
                    ? 'border-yellow-500/30 bg-yellow-500/5 light:bg-yellow-50 light:border-yellow-200'
                    : 'border-emerald-500/30 bg-emerald-500/5 light:bg-emerald-50 light:border-emerald-200'
                  : 'border-gray-700 light:border-gray-200 bg-gray-900/50 light:bg-white hover:border-gray-600 light:hover:border-gray-300 light:shadow-sm'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl ${platform.bgColor} flex items-center justify-center shrink-0`}>
                  {platform.icon}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-semibold text-white light:text-gray-900">{platform.name}</h3>
                    {isConnected && (
                      <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                        statusColor === 'red'
                          ? 'bg-red-500/20 text-red-400'
                          : statusColor === 'yellow'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        {statusColor === 'red' ? (
                          <>
                            <AlertTriangle className="w-3 h-3" />
                            Expired
                          </>
                        ) : statusColor === 'yellow' ? (
                          <>
                            <Clock className="w-3 h-3" />
                            Expiring Soon
                          </>
                        ) : (
                          <>
                            <Check className="w-3 h-3" />
                            Connected
                          </>
                        )}
                      </span>
                    )}
                  </div>
                  {isConnected && details?.email ? (
                    <div className="mt-1">
                      <p className="text-sm text-gray-300 light:text-gray-700 truncate">{details.email}</p>
                      {details.connectedAt && (
                        <p className="text-xs text-gray-500 light:text-gray-400 mt-0.5">
                          Connected {formatRelativeTime(details.connectedAt, nowMs)}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 light:text-gray-500 mt-0.5">{platform.description}</p>
                  )}
                  {isConnected && (details?.isExpired || details?.isExpiringSoon) && (
                    <p className={`text-xs mt-1 ${
                      details.isExpired ? 'text-red-400' : 'text-yellow-400'
                    }`}>
                      {details.isExpired
                        ? 'Token expired. Reconnect to continue sending from your email.'
                        : 'Token expiring soon. Consider reconnecting to avoid interruptions.'}
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons - separate row on mobile */}
              <div className="mt-3 flex justify-end">
                {isConnected ? (
                  <div className="flex items-center gap-2">
                    {(details?.isExpired || details?.isExpiringSoon || details?.needsReconnect) && (
                      <button
                        onClick={() => handleConnect(platform)}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-white rounded-lg transition-colors disabled:opacity-50"
                        style={{ backgroundColor: platform.color }}
                      >
                        {isLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <ExternalLink className="w-4 h-4" />
                        )}
                        Reconnect
                      </button>
                    )}
                    {disconnectConfirm === platform.id ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">Are you sure?</span>
                        <button
                          onClick={() => handleDisconnect(platform)}
                          disabled={isLoading}
                          className="px-3 py-1.5 text-xs font-medium text-red-400 bg-red-500/15 hover:bg-red-500/25 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Yes, disconnect'}
                        </button>
                        <button
                          onClick={() => setDisconnectConfirm(null)}
                          className="px-3 py-1.5 text-xs text-gray-400 hover:text-white transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleDisconnect(platform)}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {isLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Unplug className="w-4 h-4" />
                        )}
                        Disconnect
                      </button>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => handleConnect(platform)}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-white rounded-lg transition-colors disabled:opacity-50"
                    style={{ backgroundColor: platform.color }}
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ExternalLink className="w-4 h-4" />
                    )}
                    Connect
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
          </div>
        </div>
      </div>

      {/* CRM Integrations */}
      <div className="mb-4">
        <button
          onClick={() => toggleSection('crm')}
          className="w-full flex items-center justify-between py-3 px-1 group cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-white light:text-gray-900">CRM Integrations</h3>
            {(() => {
              const { connected, total } = getSectionCounts('crm');
              return (
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  connected > 0
                    ? 'bg-emerald-500/20 text-emerald-400 light:bg-emerald-100 light:text-emerald-700'
                    : 'bg-gray-700 text-gray-400 light:bg-gray-200 light:text-gray-500'
                }`}>
                  {connected}/{total} connected
                </span>
              );
            })()}
          </div>
          <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
            expandedSections.has('crm') ? 'rotate-180' : ''
          }`} />
        </button>
        <div className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
          expandedSections.has('crm') ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}>
          <div className="overflow-hidden">
      <p className="text-sm text-gray-400 light:text-gray-500 mb-3">
        Connect your CRM to automatically sync sent emails and meeting summaries.
      </p>
      <div className="space-y-4 pb-4">
        {platforms.filter(p => p.category === 'crm').map((platform) => {
          const isConnected = connectionStatus[platform.id];
          const details = connectionDetails[platform.id];
          const isLoading = actionLoading === platform.id;

          const getStatusColor = () => {
            if (!isConnected) return null;
            if (details?.isExpired) return 'red';
            if (details?.isExpiringSoon) return 'yellow';
            return 'green';
          };
          const statusColor = getStatusColor();

          return (
            <div
              key={platform.id}
              className={`border rounded-xl p-4 transition-colors ${
                isConnected
                  ? statusColor === 'red'
                    ? 'border-red-500/30 bg-red-500/5 light:bg-red-50 light:border-red-200'
                    : statusColor === 'yellow'
                    ? 'border-yellow-500/30 bg-yellow-500/5 light:bg-yellow-50 light:border-yellow-200'
                    : 'border-emerald-500/30 bg-emerald-500/5 light:bg-emerald-50 light:border-emerald-200'
                  : 'border-gray-700 light:border-gray-200 bg-gray-900/50 light:bg-white hover:border-gray-600 light:hover:border-gray-300 light:shadow-sm'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl ${platform.bgColor} flex items-center justify-center shrink-0`}>
                  {platform.icon}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-semibold text-white light:text-gray-900">{platform.name}</h3>
                    {isConnected && (
                      <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                        statusColor === 'red'
                          ? 'bg-red-500/20 text-red-400'
                          : statusColor === 'yellow'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        {statusColor === 'red' ? (
                          <>
                            <AlertTriangle className="w-3 h-3" />
                            Expired
                          </>
                        ) : statusColor === 'yellow' ? (
                          <>
                            <Clock className="w-3 h-3" />
                            Expiring Soon
                          </>
                        ) : (
                          <>
                            <Check className="w-3 h-3" />
                            Connected
                          </>
                        )}
                      </span>
                    )}
                  </div>
                  {isConnected && details?.email ? (
                    <div className="mt-1">
                      <p className="text-sm text-gray-300 light:text-gray-700 truncate">{details.email}</p>
                      {details.connectedAt && (
                        <p className="text-xs text-gray-500 light:text-gray-400 mt-0.5">
                          Connected {formatRelativeTime(details.connectedAt, nowMs)}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 light:text-gray-500 mt-0.5">{platform.description}</p>
                  )}
                  {isConnected && details?.needsReconnect && (
                    <p className="text-xs mt-1 text-yellow-400">
                      Your HubSpot connection needs to be updated to sync meeting data. Please disconnect and reconnect.
                    </p>
                  )}
                  {isConnected && !details?.needsReconnect && !details?.isExpired && details?.lastSyncAt && (
                    <p className="text-xs mt-1 text-gray-500">
                      Last synced {formatRelativeTime(details.lastSyncAt, nowMs)}
                    </p>
                  )}
                  {isConnected && (details?.isExpired || details?.isExpiringSoon) && !details?.needsReconnect && (
                    <p className={`text-xs mt-1 ${
                      details.isExpired ? 'text-red-400' : 'text-yellow-400'
                    }`}>
                      {details.isExpired
                        ? 'Token expired. Reconnect to continue syncing to your CRM.'
                        : 'Token expiring soon. Consider reconnecting to avoid interruptions.'}
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons - separate row on mobile */}
              <div className="mt-3 flex justify-end">
                {isConnected ? (
                  <div className="flex items-center gap-2">
                    {(details?.isExpired || details?.isExpiringSoon || details?.needsReconnect) && (
                      <button
                        onClick={() => handleConnect(platform)}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-white rounded-lg transition-colors disabled:opacity-50"
                        style={{ backgroundColor: platform.color }}
                      >
                        {isLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <ExternalLink className="w-4 h-4" />
                        )}
                        Reconnect
                      </button>
                    )}
                    {disconnectConfirm === platform.id ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">Are you sure?</span>
                        <button
                          onClick={() => handleDisconnect(platform)}
                          disabled={isLoading}
                          className="px-3 py-1.5 text-xs font-medium text-red-400 bg-red-500/15 hover:bg-red-500/25 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Yes, disconnect'}
                        </button>
                        <button
                          onClick={() => setDisconnectConfirm(null)}
                          className="px-3 py-1.5 text-xs text-gray-400 hover:text-white transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleDisconnect(platform)}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {isLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Unplug className="w-4 h-4" />
                        )}
                        Disconnect
                      </button>
                    )}
                  </div>
                ) : (
                  platform.id === 'airtable' ? (
                    <button
                      onClick={() => setShowAirtableForm(true)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-white rounded-lg transition-colors"
                      style={{ backgroundColor: platform.color }}
                    >
                      <Settings2 className="w-4 h-4" />
                      Configure
                    </button>
                  ) : (
                    <button
                      onClick={() => handleConnect(platform)}
                      disabled={isLoading}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-white rounded-lg transition-colors disabled:opacity-50"
                      style={{ backgroundColor: platform.color }}
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <ExternalLink className="w-4 h-4" />
                      )}
                      Connect
                    </button>
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>
          </div>
        </div>
      </div>

      {/* Airtable Configuration Form Modal */}
      {showAirtableForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 light:bg-white border border-gray-700 light:border-gray-200 rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white light:text-gray-900">Connect Airtable</h3>
              <button onClick={() => { setShowAirtableForm(false); setAirtableError(null); }} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-gray-400 light:text-gray-500 mb-4">
              Enter your Airtable Personal Access Token and Base ID. You can find these in your{' '}
              <a href="https://airtable.com/create/tokens" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline">
                Airtable account settings
              </a>.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 light:text-gray-700 mb-1">
                  Personal Access Token
                </label>
                <input
                  type="password"
                  value={airtableApiKey}
                  onChange={(e) => setAirtableApiKey(e.target.value)}
                  placeholder="pat..."
                  className="w-full px-3 py-2 bg-gray-800 light:bg-gray-50 border border-gray-600 light:border-gray-300 rounded-lg text-white light:text-gray-900 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 light:text-gray-700 mb-1">
                  Base ID
                </label>
                <input
                  type="text"
                  value={airtableBaseId}
                  onChange={(e) => setAirtableBaseId(e.target.value)}
                  placeholder="appXXXXXXXXXXXXXX"
                  className="w-full px-3 py-2 bg-gray-800 light:bg-gray-50 border border-gray-600 light:border-gray-300 rounded-lg text-white light:text-gray-900 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Find this in your base URL: airtable.com/<strong>appXXX</strong>/...
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300 light:text-gray-700 mb-1">
                    Contacts Table
                  </label>
                  <input
                    type="text"
                    value={airtableContactsTable}
                    onChange={(e) => setAirtableContactsTable(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 light:bg-gray-50 border border-gray-600 light:border-gray-300 rounded-lg text-white light:text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 light:text-gray-700 mb-1">
                    Meetings Table
                  </label>
                  <input
                    type="text"
                    value={airtableMeetingsTable}
                    onChange={(e) => setAirtableMeetingsTable(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 light:bg-gray-50 border border-gray-600 light:border-gray-300 rounded-lg text-white light:text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {airtableError && (
                <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                  {airtableError}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => { setShowAirtableForm(false); setAirtableError(null); }}
                  className="flex-1 px-4 py-2 text-sm text-gray-400 hover:text-white border border-gray-600 light:border-gray-300 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAirtableConnect}
                  disabled={airtableConnecting || !airtableApiKey || !airtableBaseId}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm text-white bg-[#18BFFF] hover:bg-[#14a8e6] rounded-lg transition-colors disabled:opacity-50"
                >
                  {airtableConnecting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  {airtableConnecting ? 'Testing...' : 'Test & Connect'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pro Tip */}
      <div className="mt-8 p-5 bg-blue-500/10 light:bg-blue-50 border border-blue-500/20 light:border-blue-200 rounded-xl">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500/20 light:bg-blue-100 flex items-center justify-center flex-shrink-0">
            <Lightbulb className="w-4 h-4 text-blue-400 light:text-blue-600" />
          </div>
          <div>
            <h4 className="text-white light:text-gray-900 font-semibold mb-1">Pro Tip</h4>
            <p className="text-gray-300 light:text-gray-600 text-sm">
              You can connect multiple platforms! ReplySequence will automatically capture meetings from all connected platforms and generate follow-up emails for each.
            </p>
          </div>
        </div>
      </div>

      {/* Connection Summary */}
      {connectedCount > 0 && (
        <div className="mt-6 text-center text-sm text-gray-400 light:text-gray-500">
          {connectedCount} platform{connectedCount !== 1 ? 's' : ''} connected
        </div>
      )}
        </div>
      )}
    </div>
  );
}
