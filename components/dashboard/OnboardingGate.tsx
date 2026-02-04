'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { checkPlatformConnections } from '@/app/actions/checkPlatformConnections';
import { Toast } from '@/components/ui/Toast';
import { Check, ExternalLink, Loader2 } from 'lucide-react';

interface OnboardingGateProps {
  children: React.ReactNode;
}

interface PlatformState {
  zoom: boolean;
  teams: boolean;
  meet: boolean;
}

export function OnboardingGate({ children }: OnboardingGateProps) {
  const searchParams = useSearchParams();
  const [connected, setConnected] = useState<boolean | null>(null);
  const [platforms, setPlatforms] = useState<PlatformState>({ zoom: false, teams: false, meet: false });
  const [checking, setChecking] = useState(true);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState('Connected! Your dashboard is ready');
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);
  const previousConnected = useRef<boolean | null>(null);
  const hasCheckedUrlParams = useRef(false);

  const checkConnection = useCallback(async () => {
    try {
      const result = await checkPlatformConnections();
      setPlatforms(result.platforms);
      setConnected(result.connected);

      // Show success toast when connection changes from false to true
      if (previousConnected.current === false && result.connected === true) {
        setShowSuccessToast(true);
      }
      previousConnected.current = result.connected;

      // Check for OAuth success params (only once after initial load)
      if (!hasCheckedUrlParams.current) {
        const zoomConnectedParam = searchParams.get('zoom_connected');
        const teamsConnectedParam = searchParams.get('teams_connected');
        const meetConnectedParam = searchParams.get('meet_connected');

        if (zoomConnectedParam === 'true' && result.platforms.zoom) {
          console.log('[ONBOARDING] Zoom OAuth success detected');
          setSuccessMessage('Zoom connected! You\'re ready to go.');
          setShowSuccessToast(true);
          window.history.replaceState({}, '', '/dashboard');
        } else if (teamsConnectedParam === 'true' && result.platforms.teams) {
          console.log('[ONBOARDING] Teams OAuth success detected');
          setSuccessMessage('Microsoft Teams connected! You\'re ready to go.');
          setShowSuccessToast(true);
          window.history.replaceState({}, '', '/dashboard');
        } else if (meetConnectedParam === 'true' && result.platforms.meet) {
          console.log('[ONBOARDING] Meet OAuth success detected');
          setSuccessMessage('Google Meet connected! You\'re ready to go.');
          setShowSuccessToast(true);
          window.history.replaceState({}, '', '/dashboard');
        }
        hasCheckedUrlParams.current = true;
      }
    } catch (error) {
      console.error('Failed to check platform connections:', error);
      setConnected(false);
    } finally {
      setChecking(false);
    }
  }, [searchParams]);

  useEffect(() => {
    checkConnection();

    // Check again when window regains focus (after OAuth redirect)
    const handleFocus = () => {
      checkConnection();
    };
    window.addEventListener('focus', handleFocus);

    // Also check on visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkConnection();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [checkConnection]);

  // Handle platform connection
  const handleConnect = async (platform: 'zoom' | 'teams' | 'meet') => {
    console.log('[ONBOARDING] handleConnect called', { platform });
    setConnectingPlatform(platform);

    // Zoom uses real OAuth flow - redirect immediately
    if (platform === 'zoom') {
      console.log('[ONBOARDING] Redirecting to Zoom OAuth...');
      window.location.href = '/api/auth/zoom';
      return;
    }

    // Teams uses real OAuth flow - redirect immediately
    if (platform === 'teams') {
      console.log('[ONBOARDING] Redirecting to Teams OAuth...');
      window.location.href = '/api/auth/teams';
      return;
    }

    // Meet uses real OAuth flow - redirect immediately
    if (platform === 'meet') {
      console.log('[ONBOARDING] Redirecting to Meet OAuth...');
      window.location.href = '/api/auth/meet';
      return;
    }

    setConnectingPlatform(null);
  };

  // Debug logging
  console.log('[ONBOARDING-RENDER] State:', { checking, connected, platforms });

  // Show loading state
  if (checking) {
    console.log('[ONBOARDING-RENDER] Showing loading state');
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-500/20 rounded-full" />
            <div className="absolute top-0 left-0 w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="mt-4 text-gray-400 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Show gated state if not connected
  if (!connected) {
    console.log('[ONBOARDING-RENDER] Showing integration cards (not connected)');
    return (
      <div className="min-h-screen bg-[#0a0a0f] relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto py-16 px-4">
          {/* Header */}
          <div className="mb-12 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 mb-6">
              <span className="text-blue-400 text-sm font-medium">Get Started</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Connect a Platform
              </span>
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Connect Zoom, Microsoft Teams, or Google Meet to start generating AI-powered follow-up emails automatically
            </p>
          </div>

          {/* Integration Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {/* Zoom Card */}
            <div className={`relative group rounded-2xl bg-gray-900/50 border transition-all duration-300 overflow-hidden ${
              platforms.zoom ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-gray-700 hover:border-[#2D8CFF]/50'
            }`}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-[#2D8CFF]/10 flex items-center justify-center">
                    <svg className="w-7 h-7" viewBox="0 0 24 24" fill="#2D8CFF">
                      <path d="M4.585 6.836C3.71 6.836 3 7.547 3 8.42v7.16c0 .872.71 1.584 1.585 1.584h9.83c.875 0 1.585-.712 1.585-1.585V8.42c0-.872-.71-1.585-1.585-1.585H4.585zm12.415 2.11l3.96-2.376c.666-.4 1.04-.266 1.04.56v9.74c0 .826-.374.96-1.04.56L17 15.054V8.946z"/>
                    </svg>
                  </div>
                  {platforms.zoom && (
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium">
                      <Check className="w-3.5 h-3.5" />
                      Connected
                    </div>
                  )}
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Zoom</h3>
                <p className="text-sm text-gray-400 mb-4">
                  Automatically capture transcripts from your Zoom meetings
                </p>
                <button
                  onClick={() => handleConnect('zoom')}
                  disabled={platforms.zoom || connectingPlatform !== null}
                  className={`w-full py-2.5 px-4 rounded-lg font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                    platforms.zoom
                      ? 'bg-emerald-500/10 text-emerald-400 cursor-default'
                      : connectingPlatform === 'zoom'
                      ? 'bg-[#2D8CFF]/20 text-[#2D8CFF]'
                      : 'bg-[#2D8CFF] text-white hover:bg-[#2D8CFF]/90'
                  }`}
                >
                  {connectingPlatform === 'zoom' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Connecting...
                    </>
                  ) : platforms.zoom ? (
                    'Connected'
                  ) : (
                    <>
                      Connect Zoom
                      <ExternalLink className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Teams Card */}
            <div className={`relative group rounded-2xl bg-gray-900/50 border transition-all duration-300 overflow-hidden ${
              platforms.teams ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-gray-700 hover:border-[#5B5FC7]/50'
            }`}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-[#5B5FC7]/10 flex items-center justify-center">
                    <svg className="w-7 h-7" viewBox="0 0 24 24" fill="#5B5FC7">
                      <path d="M20.625 8.5h-6.25a.625.625 0 00-.625.625v6.25c0 .345.28.625.625.625h6.25c.345 0 .625-.28.625-.625v-6.25a.625.625 0 00-.625-.625zM17.5 6.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM12.5 8a3 3 0 100-6 3 3 0 000 6zm0 1c-2.21 0-4 1.567-4 3.5V15h8v-2.5c0-1.933-1.79-3.5-4-3.5z"/>
                    </svg>
                  </div>
                  {platforms.teams && (
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium">
                      <Check className="w-3.5 h-3.5" />
                      Connected
                    </div>
                  )}
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Microsoft Teams</h3>
                <p className="text-sm text-gray-400 mb-4">
                  Sync meeting transcripts from your Teams calls
                </p>
                <button
                  onClick={() => handleConnect('teams')}
                  disabled={platforms.teams || connectingPlatform !== null}
                  className={`w-full py-2.5 px-4 rounded-lg font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                    platforms.teams
                      ? 'bg-emerald-500/10 text-emerald-400 cursor-default'
                      : connectingPlatform === 'teams'
                      ? 'bg-[#5B5FC7]/20 text-[#5B5FC7]'
                      : 'bg-[#5B5FC7] text-white hover:bg-[#5B5FC7]/90'
                  }`}
                >
                  {connectingPlatform === 'teams' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Connecting...
                    </>
                  ) : platforms.teams ? (
                    'Connected'
                  ) : (
                    <>
                      Connect Teams
                      <ExternalLink className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Google Meet Card */}
            <div className={`relative group rounded-2xl bg-gray-900/50 border transition-all duration-300 overflow-hidden ${
              platforms.meet ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-gray-700 hover:border-[#00897B]/50'
            }`}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-[#00897B]/10 flex items-center justify-center">
                    <svg className="w-7 h-7" viewBox="0 0 24 24" fill="#00897B">
                      <path d="M12 11.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"/>
                      <path d="M15.29 15.71L18 18.41V5.59l-2.71 2.7A5.977 5.977 0 0112 7c-1.38 0-2.65.47-3.66 1.26L14.59 2H5a2 2 0 00-2 2v16a2 2 0 002 2h14a2 2 0 002-2V9.41l-5.71 6.3zM6 10a6 6 0 1112 0 6 6 0 01-12 0z"/>
                    </svg>
                  </div>
                  {platforms.meet && (
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium">
                      <Check className="w-3.5 h-3.5" />
                      Connected
                    </div>
                  )}
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Google Meet</h3>
                <p className="text-sm text-gray-400 mb-4">
                  Import transcripts from your Google Meet sessions
                </p>
                <button
                  onClick={() => handleConnect('meet')}
                  disabled={platforms.meet || connectingPlatform !== null}
                  className={`w-full py-2.5 px-4 rounded-lg font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                    platforms.meet
                      ? 'bg-emerald-500/10 text-emerald-400 cursor-default'
                      : connectingPlatform === 'meet'
                      ? 'bg-[#00897B]/20 text-[#00897B]'
                      : 'bg-[#00897B] text-white hover:bg-[#00897B]/90'
                  }`}
                >
                  {connectingPlatform === 'meet' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Connecting...
                    </>
                  ) : platforms.meet ? (
                    'Connected'
                  ) : (
                    <>
                      Connect Meet
                      <ExternalLink className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* CRM Notice */}
          <div className="text-center">
            <p className="text-sm text-gray-500">
              CRM integrations (HubSpot, Salesforce) are optional and can be configured later in settings
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Connected: show the dashboard immediately
  console.log('[ONBOARDING-RENDER] Showing dashboard (connected)');
  return (
    <>
      {children}
      {showSuccessToast && (
        <Toast
          message={successMessage}
          type="success"
          onClose={() => setShowSuccessToast(false)}
        />
      )}
    </>
  );
}
