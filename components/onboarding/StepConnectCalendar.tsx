'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, ExternalLink, Loader2, AlertTriangle, Calendar } from 'lucide-react';

interface StepConnectCalendarProps {
  calendarConnected: boolean;
  onCalendarConnected: () => void;
  onSkip: () => void;
}

export function StepConnectCalendar({
  calendarConnected,
  onCalendarConnected,
  onSkip,
}: StepConnectCalendarProps) {
  const [connecting, setConnecting] = useState<string | null>(null);
  const [showSkipWarning, setShowSkipWarning] = useState(false);

  const handleConnect = (provider: 'google' | 'outlook') => {
    setConnecting(provider);
    // Store which calendar we're connecting so callback knows
    sessionStorage.setItem('onboarding_calendar', provider);
    // Build the return URL for after OAuth completes
    const returnUrl = `/onboarding?step=3&calendar_connected=true`;

    if (provider === 'google') {
      // Redirect to Google Calendar OAuth
      window.location.href = `/api/auth/calendar?redirect=${encodeURIComponent(returnUrl)}`;
    } else {
      // Redirect to Outlook Calendar OAuth (Microsoft Graph)
      window.location.href = `/api/auth/outlook-calendar?redirect=${encodeURIComponent(returnUrl)}`;
    }
  };

  const calendars = [
    {
      id: 'google' as const,
      name: 'Google Calendar',
      description: 'Connect to automatically detect Google Meet meetings',
      color: '#4285F4',
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
      name: 'Outlook Calendar',
      description: 'Connect to automatically detect Teams meetings',
      color: '#0078D4',
      icon: (
        <svg className="w-7 h-7" viewBox="0 0 24 24" fill="#0078D4">
          <path d="M24 7.387v10.478c0 .23-.08.424-.238.576-.158.154-.352.23-.58.23h-8.547v-6.959l1.6 1.229c.101.072.222.109.363.109.142 0 .263-.037.363-.109l6.348-4.879.004-.004c.088-.072.149-.163.18-.273a.499.499 0 00-.184-.398L17.635 3.59v3.797h8.547c.228 0 .422.076.58.23.158.152.238.346.238.576v-.806z"/>
          <path d="M15.635 7.387V3.59L7.088 10.11v7.561h8.547V7.387z"/>
          <path d="M7.088 2.613v7.497l8.547 6.561v-7.56l-8.547-6.498z"/>
          <path d="M0 5.67v12.66c0 .346.123.643.37.89.246.247.543.37.889.37h5.83V4.41H1.259c-.346 0-.643.123-.89.37C.123 5.027 0 5.324 0 5.67z"/>
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
          <Calendar className="w-8 h-8 text-blue-400" />
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl md:text-4xl font-bold text-white mb-3"
        >
          Connect your calendar
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-gray-400 text-lg max-w-lg mx-auto"
        >
          We&apos;ll automatically watch for new meetings and process them for you
        </motion.p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto mb-8">
        {calendars.map((calendar, index) => {
          const isConnecting = connecting === calendar.id;

          return (
            <motion.div
              key={calendar.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              className={`relative rounded-2xl bg-gray-900/50 border transition-all duration-300 overflow-hidden ${
                calendarConnected
                  ? 'border-emerald-500/50 bg-emerald-500/5'
                  : 'border-gray-700 hover:border-gray-600'
              }`}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${calendar.color}15` }}
                  >
                    {calendar.icon}
                  </div>
                  {calendarConnected && (
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium">
                      <Check className="w-3.5 h-3.5" />
                      Connected
                    </div>
                  )}
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{calendar.name}</h3>
                <p className="text-sm text-gray-400 mb-4">{calendar.description}</p>
                <button
                  onClick={() => handleConnect(calendar.id)}
                  disabled={calendarConnected || connecting !== null}
                  className={`w-full py-2.5 px-4 rounded-lg font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                    calendarConnected
                      ? 'bg-emerald-500/10 text-emerald-400 cursor-default'
                      : isConnecting
                      ? 'bg-gray-800 text-gray-400'
                      : 'text-white hover:opacity-90'
                  }`}
                  style={
                    !calendarConnected && !isConnecting
                      ? { backgroundColor: calendar.color }
                      : undefined
                  }
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Connecting...
                    </>
                  ) : calendarConnected ? (
                    'Connected'
                  ) : (
                    <>
                      Connect {calendar.name.split(' ')[0]}
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
                Without calendar access, you&apos;ll need to manually trigger processing
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
