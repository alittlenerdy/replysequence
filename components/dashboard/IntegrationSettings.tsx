'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, Check, ExternalLink, Unplug, Lightbulb, AlertTriangle, Clock } from 'lucide-react';
import { checkPlatformConnections, type PlatformConnectionDetails } from '@/app/actions/checkPlatformConnections';

interface PlatformConfig {
  id: 'zoom' | 'teams' | 'meet';
  name: string;
  description: string;
  color: string;
  bgColor: string;
  icon: React.ReactNode;
  connectUrl: string;
  disconnectUrl: string;
}

const platforms: PlatformConfig[] = [
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
  },
];

// Format relative time for "connected X ago"
function formatRelativeTime(date: Date | undefined): string {
  if (!date) return '';
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
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
  const [connectionStatus, setConnectionStatus] = useState<Record<string, boolean>>({
    zoom: false,
    teams: false,
    meet: false,
  });
  const [connectionDetails, setConnectionDetails] = useState<Record<string, PlatformConnectionDetails>>({
    zoom: { connected: false },
    teams: { connected: false },
    meet: { connected: false },
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

  const handleDisconnect = async (platform: PlatformConfig) => {
    if (!confirm(`Are you sure you want to disconnect ${platform.name}? You'll stop receiving follow-up emails from ${platform.name} meetings.`)) {
      return;
    }

    setActionLoading(platform.id);
    try {
      const response = await fetch(platform.disconnectUrl, {
        method: 'DELETE',
      });

      if (response.ok) {
        setConnectionStatus(prev => ({ ...prev, [platform.id]: false }));
      } else {
        alert('Failed to disconnect. Please try again.');
      }
    } catch (error) {
      console.error('Disconnect error:', error);
      alert('Failed to disconnect. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const connectedCount = Object.values(connectionStatus).filter(Boolean).length;

  if (loading) {
    return (
      <div className="max-w-2xl space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-gray-900/50 light:bg-white border border-gray-700 light:border-gray-200 rounded-xl p-6 animate-pulse light:shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gray-700 light:bg-gray-200" />
              <div className="flex-1">
                <div className="h-5 w-32 bg-gray-700 light:bg-gray-200 rounded mb-2" />
                <div className="h-4 w-48 bg-gray-700 light:bg-gray-200 rounded" />
              </div>
              <div className="h-9 w-24 bg-gray-700 light:bg-gray-200 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      {/* Platform Cards */}
      <div className="space-y-4">
        {platforms.map((platform) => {
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
              className={`border rounded-xl p-6 transition-all ${
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
                <div className={`w-12 h-12 rounded-xl ${platform.bgColor} flex items-center justify-center`}>
                  {platform.icon}
                </div>

                {/* Platform Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-white light:text-gray-900">{platform.name}</h3>
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
                      <p className="text-sm text-gray-300 light:text-gray-700">{details.email}</p>
                      {details.connectedAt && (
                        <p className="text-xs text-gray-500 light:text-gray-400 mt-0.5">
                          Connected {formatRelativeTime(details.connectedAt)}
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

                {/* Action Button */}
                {isConnected ? (
                  <div className="flex flex-col gap-2">
                    {(details?.isExpired || details?.isExpiringSoon) && (
                      <button
                        onClick={() => handleConnect(platform)}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50"
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
                    <button
                      onClick={() => handleDisconnect(platform)}
                      disabled={isLoading}
                      className="flex items-center gap-2 px-4 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Unplug className="w-4 h-4" />
                      )}
                      Disconnect
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleConnect(platform)}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50"
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
  );
}
