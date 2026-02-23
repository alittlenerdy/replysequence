'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2 } from 'lucide-react';

const DISMISS_KEY = 'newsletter-bar-dismissed';
const SUBSCRIBED_KEY = 'newsletter-subscribed';
const DISMISS_DAYS = 7;

export function StickyNewsletterBar() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(true); // Start hidden
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Check if already subscribed or recently dismissed
    const subscribed = localStorage.getItem(SUBSCRIBED_KEY);
    if (subscribed) return;

    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    if (dismissedAt) {
      const elapsed = Date.now() - parseInt(dismissedAt, 10);
      if (elapsed < DISMISS_DAYS * 24 * 60 * 60 * 1000) return;
    }

    setDismissed(false);

    // Show after scrolling 40% of page
    function onScroll() {
      const scrollPercent = window.scrollY / (document.body.scrollHeight - window.innerHeight);
      setVisible(scrollPercent > 0.4);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  function handleDismiss() {
    setDismissed(true);
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          utmSource: 'blog',
          utmMedium: 'sticky-bar',
          utmCampaign: window.location.pathname.split('/').pop() || 'blog',
        }),
      });

      if (!res.ok && res.status !== 409) return;

      setSuccess(true);
      localStorage.setItem(SUBSCRIBED_KEY, 'true');
      setTimeout(() => setDismissed(true), 2500);
    } catch {
      // Silently fail - sticky bar shouldn't be intrusive with errors
    } finally {
      setIsSubmitting(false);
    }
  }

  if (dismissed) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-800 light:border-gray-200 bg-gray-950/95 light:bg-white/95 backdrop-blur-sm"
        >
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
            {success ? (
              <div className="flex items-center gap-2 flex-1">
                <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
                <span className="text-sm font-medium text-white light:text-gray-900">
                  You&apos;re subscribed!
                </span>
              </div>
            ) : (
              <>
                <p className="text-sm font-medium text-white light:text-gray-900 hidden sm:block shrink-0">
                  Get follow-up tips in your inbox
                </p>
                <form onSubmit={handleSubmit} className="flex items-center gap-2 flex-1">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    required
                    className="flex-1 min-w-0 px-3 py-2 bg-gray-800/80 light:bg-gray-100 border border-gray-700 light:border-gray-300 rounded-lg text-white light:text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting || !email}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors whitespace-nowrap"
                  >
                    {isSubmitting ? '...' : 'Subscribe'}
                  </button>
                </form>
              </>
            )}
            <button
              onClick={handleDismiss}
              className="p-1.5 text-gray-500 hover:text-gray-300 light:hover:text-gray-700 transition-colors shrink-0"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
