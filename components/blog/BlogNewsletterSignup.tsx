'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Mail } from 'lucide-react';

export function BlogNewsletterSignup() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          utmSource: 'blog',
          utmMedium: 'newsletter',
          utmCampaign: window.location.pathname.split('/').pop() || 'blog-index',
        }),
      });

      if (!res.ok && res.status !== 409) {
        const data = await res.json();
        setError(data.error || 'Something went wrong');
        return;
      }

      // 409 = already on waitlist, still counts as success
      setSuccess(true);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/5 to-indigo-600/10 light:from-indigo-50 light:to-indigo-100/50 light:border-indigo-200 p-8 md:p-10">
      <AnimatePresence mode="wait">
        {success ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-2"
          >
            <div className="flex justify-center mb-3">
              <div className="w-12 h-12 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-400" />
              </div>
            </div>
            <p className="text-lg font-semibold text-white light:text-gray-900">
              You&apos;re in!
            </p>
            <p className="text-sm text-gray-400 light:text-gray-600 mt-1">
              We&apos;ll send you our best meeting productivity content.
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Mail className="w-5 h-5 text-indigo-400 light:text-indigo-600" />
              <h3 className="text-lg font-bold text-white light:text-gray-900">
                Get meeting productivity tips in your inbox
              </h3>
            </div>
            <p className="text-sm text-gray-400 light:text-gray-600 mb-5">
              Actionable follow-up strategies, templates, and product updates. No spam.
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                className="flex-1 px-4 py-3 bg-gray-800/80 light:bg-white border border-gray-700 light:border-gray-300 rounded-xl text-white light:text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              />
              <button
                type="submit"
                disabled={isSubmitting || !email}
                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-500/20 whitespace-nowrap"
              >
                {isSubmitting ? 'Subscribing...' : 'Subscribe'}
              </button>
            </form>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-400 text-sm mt-2"
              >
                {error}
              </motion.p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
