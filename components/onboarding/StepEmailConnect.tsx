'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, ExternalLink, Loader2, AlertTriangle, Mail } from 'lucide-react';

interface StepEmailConnectProps {
  emailConnected: boolean;
  connectedEmail: string | null;
  onEmailConnected: () => void;
  onSkip: () => void;
}

export function StepEmailConnect({
  emailConnected,
  connectedEmail,
  onEmailConnected,
  onSkip,
}: StepEmailConnectProps) {
  const [connecting, setConnecting] = useState<string | null>(null);
  const [showSkipWarning, setShowSkipWarning] = useState(false);

  const handleConnect = (provider: 'gmail' | 'outlook') => {
    setConnecting(provider);
    sessionStorage.setItem('onboarding_email', provider);
    const returnUrl = `/onboarding?step=3&email_connected=true`;

    if (provider === 'gmail') {
      window.location.href = `/api/auth/gmail?redirect=${encodeURIComponent(returnUrl)}`;
    } else {
      window.location.href = `/api/auth/outlook?redirect=${encodeURIComponent(returnUrl)}`;
    }
  };

  const providers = [
    {
      id: 'gmail' as const,
      name: 'Gmail',
      description: 'Send follow-ups from your Gmail address',
      color: '#EA4335',
      icon: (
        <svg className="w-7 h-7" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
      ),
    },
    {
      id: 'outlook' as const,
      name: 'Outlook',
      description: 'Send follow-ups from your Outlook address',
      color: '#0078D4',
      icon: (
        <svg className="w-7 h-7" viewBox="0 0 24 24" fill="#0078D4">
          <path d="M20 18h-2V9.25L12 13 6 9.25V18H4V6h1.2l6.8 4.25L18.8 6H20m0-2H4c-1.11 0-2 .89-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2z"/>
        </svg>
      ),
    },
  ];

  return (
    <div className="py-8">
      <div className="text-center mb-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center mx-auto mb-6"
        >
          <Mail className="w-8 h-8 text-blue-400" />
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl md:text-4xl font-bold text-white mb-3"
        >
          Send emails from your inbox
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-gray-400 text-lg max-w-lg mx-auto"
        >
          Connect your email so follow-ups come from you, not a generic noreply address.
          Recipients are 3x more likely to open emails from real people.
        </motion.p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto mb-8">
        {providers.map((provider, index) => {
          const isConnecting = connecting === provider.id;

          return (
            <motion.div
              key={provider.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              className={`relative rounded-2xl bg-gray-900/50 border transition-all duration-300 overflow-hidden ${
                emailConnected
                  ? 'border-emerald-500/50 bg-emerald-500/5'
                  : 'border-gray-700 hover:border-gray-600'
              }`}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${provider.color}15` }}
                  >
                    {provider.icon}
                  </div>
                  {emailConnected && (
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium">
                      <Check className="w-3.5 h-3.5" />
                      Connected
                    </div>
                  )}
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{provider.name}</h3>
                <p className="text-sm text-gray-400 mb-4">{provider.description}</p>
                {emailConnected && connectedEmail && (
                  <p className="text-sm text-emerald-400 mb-4 truncate">{connectedEmail}</p>
                )}
                <button
                  onClick={() => handleConnect(provider.id)}
                  disabled={emailConnected || connecting !== null}
                  className={`w-full py-2.5 px-4 rounded-lg font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                    emailConnected
                      ? 'bg-emerald-500/10 text-emerald-400 cursor-default'
                      : isConnecting
                      ? 'bg-gray-800 text-gray-400'
                      : 'text-white hover:opacity-90'
                  }`}
                  style={
                    !emailConnected && !isConnecting
                      ? { backgroundColor: provider.color }
                      : undefined
                  }
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Connecting...
                    </>
                  ) : emailConnected ? (
                    'Connected'
                  ) : (
                    <>
                      Connect {provider.name}
                      <ExternalLink className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Continue button when email is connected */}
      {emailConnected && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center mb-6"
        >
          <button
            onClick={onEmailConnected}
            className="px-8 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300 flex items-center gap-2"
          >
            Continue to AI Voice
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
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
                Emails will be sent from noreply@replysequence.com
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
