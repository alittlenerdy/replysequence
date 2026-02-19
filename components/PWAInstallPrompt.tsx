'use client';

import { useState, useEffect } from 'react';
import { X, Download, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed as PWA
    const standalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsStandalone(standalone);

    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Check if user has dismissed before
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    const dismissedTime = dismissed ? parseInt(dismissed, 10) : 0;
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

    // Listen for beforeinstallprompt event (Chrome/Edge/Android)
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      // Show prompt if not dismissed recently
      if (!dismissedTime || dismissedTime < oneWeekAgo) {
        // Delay to not interrupt initial experience
        setTimeout(() => setShowPrompt(true), 3000);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // For iOS, show custom prompt after delay
    if (iOS && !standalone && (!dismissedTime || dismissedTime < oneWeekAgo)) {
      setTimeout(() => setShowPrompt(true), 5000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  // Don't show if already installed or prompt not ready
  if (isStandalone || !showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl p-4">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center flex-shrink-0">
            <Smartphone className="w-6 h-6 text-white" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white text-sm">
              Install ReplySequence
            </h3>
            <p className="text-gray-400 text-xs mt-1">
              {isIOS
                ? 'Tap the share button, then "Add to Home Screen"'
                : 'Get quick access from your home screen'
              }
            </p>
          </div>

          <button
            onClick={handleDismiss}
            className="text-gray-500 hover:text-gray-300 transition-colors p-1"
            aria-label="Dismiss"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!isIOS && (
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleDismiss}
              className="flex-1 px-3 py-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              Not now
            </button>
            <button
              onClick={handleInstall}
              className="flex-1 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Install
            </button>
          </div>
        )}

        {isIOS && (
          <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
            <span>Tap</span>
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L12 14M12 2L8 6M12 2L16 6M4 12V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V12"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            </svg>
            <span>then &quot;Add to Home Screen&quot;</span>
          </div>
        )}
      </div>
    </div>
  );
}
