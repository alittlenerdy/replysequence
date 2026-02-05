'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, ExternalLink, Loader2, AlertTriangle } from 'lucide-react';

type ConnectedPlatform = 'zoom' | 'teams' | 'meet' | null;

interface StepConnectPlatformProps {
  connectedPlatform: ConnectedPlatform;
  onPlatformConnected: (platform: ConnectedPlatform) => void;
  onSkip: () => void;
}

export function StepConnectPlatform({
  connectedPlatform,
  onPlatformConnected,
  onSkip,
}: StepConnectPlatformProps) {
  const [connecting, setConnecting] = useState<string | null>(null);
  const [showSkipWarning, setShowSkipWarning] = useState(false);

  const handleConnect = (platform: 'zoom' | 'teams' | 'meet') => {
    setConnecting(platform);
    // Store which platform we're connecting so callback knows
    sessionStorage.setItem('onboarding_platform', platform);
    // Redirect to OAuth
    window.location.href = `/api/auth/${platform}?redirect=/onboarding?platform_connected=${platform}&success=true`;
  };

  const platforms = [
    {
      id: 'zoom' as const,
      name: 'Zoom',
      description: 'Connect your Zoom account to capture meeting transcripts',
      color: '#2D8CFF',
      icon: (
        <svg className="w-7 h-7" viewBox="0 0 24 24" fill="#2D8CFF">
          <path d="M4.585 6.836C3.71 6.836 3 7.547 3 8.42v7.16c0 .872.71 1.584 1.585 1.584h9.83c.875 0 1.585-.712 1.585-1.585V8.42c0-.872-.71-1.585-1.585-1.585H4.585zm12.415 2.11l3.96-2.376c.666-.4 1.04-.266 1.04.56v9.74c0 .826-.374.96-1.04.56L17 15.054V8.946z"/>
        </svg>
      ),
    },
    {
      id: 'teams' as const,
      name: 'Microsoft Teams',
      description: 'Sync meeting transcripts from your Teams calls',
      color: '#5B5FC7',
      icon: (
        <svg className="w-7 h-7" viewBox="0 0 24 24" fill="#5B5FC7">
          <path d="M20.625 8.5h-6.25a.625.625 0 00-.625.625v6.25c0 .345.28.625.625.625h6.25c.345 0 .625-.28.625-.625v-6.25a.625.625 0 00-.625-.625zM17.5 6.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM12.5 8a3 3 0 100-6 3 3 0 000 6zm0 1c-2.21 0-4 1.567-4 3.5V15h8v-2.5c0-1.933-1.79-3.5-4-3.5z"/>
        </svg>
      ),
    },
    {
      id: 'meet' as const,
      name: 'Google Meet',
      description: 'Import transcripts from your Google Meet sessions',
      color: '#00897B',
      icon: (
        <svg className="w-7 h-7" viewBox="0 0 24 24" fill="#00897B">
          <path d="M12 11.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"/>
          <path d="M15.29 15.71L18 18.41V5.59l-2.71 2.7A5.977 5.977 0 0112 7c-1.38 0-2.65.47-3.66 1.26L14.59 2H5a2 2 0 00-2 2v16a2 2 0 002 2h14a2 2 0 002-2V9.41l-5.71 6.3zM6 10a6 6 0 1112 0 6 6 0 01-12 0z"/>
        </svg>
      ),
    },
  ];

  return (
    <div className="py-8">
      <div className="text-center mb-10">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl md:text-4xl font-bold text-white mb-3"
        >
          Connect your meeting platform
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-gray-400 text-lg"
        >
          We&apos;ll automatically capture transcripts from your meetings
        </motion.p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {platforms.map((platform, index) => {
          const isConnected = connectedPlatform === platform.id;
          const isConnecting = connecting === platform.id;

          return (
            <motion.div
              key={platform.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              className={`relative rounded-2xl bg-gray-900/50 border transition-all duration-300 overflow-hidden ${
                isConnected
                  ? 'border-emerald-500/50 bg-emerald-500/5'
                  : 'border-gray-700 hover:border-gray-600'
              }`}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${platform.color}15` }}
                  >
                    {platform.icon}
                  </div>
                  {isConnected && (
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium">
                      <Check className="w-3.5 h-3.5" />
                      Connected
                    </div>
                  )}
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{platform.name}</h3>
                <p className="text-sm text-gray-400 mb-4">{platform.description}</p>
                <button
                  onClick={() => handleConnect(platform.id)}
                  disabled={isConnected || connecting !== null}
                  className={`w-full py-2.5 px-4 rounded-lg font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                    isConnected
                      ? 'bg-emerald-500/10 text-emerald-400 cursor-default'
                      : isConnecting
                      ? 'bg-gray-800 text-gray-400'
                      : 'text-white hover:opacity-90'
                  }`}
                  style={
                    !isConnected && !isConnecting
                      ? { backgroundColor: platform.color }
                      : undefined
                  }
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Connecting...
                    </>
                  ) : isConnected ? (
                    'Connected'
                  ) : (
                    <>
                      Connect {platform.name.split(' ')[0]}
                      <ExternalLink className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-center"
      >
        {!showSkipWarning ? (
          <button
            onClick={() => setShowSkipWarning(true)}
            className="text-sm text-gray-500 hover:text-gray-400 transition-colors"
          >
            I&apos;ll do this later
          </button>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex flex-col items-center gap-3 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg"
          >
            <div className="flex items-center gap-2 text-yellow-400">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm font-medium">
                You&apos;ll need to connect a platform to use ReplySequence
              </span>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSkipWarning(false)}
                className="px-4 py-2 text-sm font-medium text-white bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Connect Now
              </button>
              <button
                onClick={onSkip}
                className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
              >
                Skip Anyway
              </button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
