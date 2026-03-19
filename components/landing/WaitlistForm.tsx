'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Copy, Check, Users } from 'lucide-react';

interface WaitlistFormProps {
  className?: string;
}

export function WaitlistForm({ className = '' }: WaitlistFormProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{
    position: number;
    referralCode: string;
    referralLink: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [totalSignups, setTotalSignups] = useState<number | null>(null);

  // Read ref param from URL
  const [refCode, setRefCode] = useState<string | null>(null);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setRefCode(params.get('ref'));
  }, []);

  // Fetch total signups count
  useEffect(() => {
    fetch('/api/waitlist')
      .then(res => res.json())
      .then(data => {
        if (data.totalSignups > 0) {
          setTotalSignups(data.totalSignups);
        }
      })
      .catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      // Collect UTM params
      const params = new URLSearchParams(window.location.search);

      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name: name || undefined,
          ref: refCode || undefined,
          utmSource: params.get('utm_source') || undefined,
          utmMedium: params.get('utm_medium') || undefined,
          utmCampaign: params.get('utm_campaign') || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          // Already on waitlist - show their position
          setResult({
            position: data.position,
            referralCode: data.referralCode,
            referralLink: `https://www.replysequence.com?ref=${data.referralCode}`,
          });
          return;
        }
        setError(data.error || 'Something went wrong');
        return;
      }

      setResult({
        position: data.position,
        referralCode: data.referralCode,
        referralLink: data.referralLink,
      });
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleCopy() {
    if (result) {
      navigator.clipboard.writeText(result.referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className={className}>
      <AnimatePresence mode="wait">
        {result ? (
          // Success state
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="text-center space-y-4"
          >
            <div className="flex justify-center">
              <div className="w-14 h-14 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7 text-green-400" />
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold text-white light:text-gray-900">
                You&apos;re #{result.position} on the list!
              </h3>
              <p className="text-sm text-gray-400 light:text-gray-600 mt-1">
                We&apos;ll email you when your invite is ready.
              </p>
            </div>

            {/* Referral link */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-300 light:text-gray-700">
                Share to move up the list:
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={result.referralLink}
                  aria-label="Referral link"
                  className="flex-1 px-3 py-2 bg-gray-800 light:bg-gray-100 border border-gray-700 light:border-gray-300 rounded-lg text-sm text-gray-300 light:text-gray-700 truncate"
                />
                <button
                  onClick={handleCopy}
                  className="px-3 py-2 bg-[#4F46E5] hover:bg-[#3A4BDD] text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060B18]"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Share buttons */}
            <div className="flex items-center justify-center gap-3 pt-2">
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(result.referralLink)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-[#0077B5]/10 border border-[#0077B5]/30 text-[#0077B5] rounded-lg text-sm font-medium hover:bg-[#0077B5]/20 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060B18]"
              >
                Share on LinkedIn
              </a>
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent('Just joined @replysequence — the follow-up layer for sales. AI turns your meetings into personalized follow-ups, sequences, and CRM updates.')}&url=${encodeURIComponent(result.referralLink)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-gray-700/50 border border-gray-600 text-gray-300 light:text-gray-700 light:bg-gray-100 light:border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-700 light:hover:bg-gray-200 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060B18]"
              >
                Share on X
              </a>
            </div>
          </motion.div>
        ) : (
          // Form state
          <motion.form
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onSubmit={handleSubmit}
            className="space-y-3"
          >
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Name (optional)"
                aria-label="Name"
                autoComplete="name"
                className="px-4 py-3 bg-gray-800/80 light:bg-white border border-gray-600 light:border-gray-300 rounded-xl text-white light:text-gray-900 placeholder-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1] focus-visible:border-transparent text-sm sm:w-[180px]"
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                aria-label="Email address"
                autoComplete="email"
                spellCheck={false}
                className="flex-1 px-4 py-3 bg-gray-800/80 light:bg-white border border-gray-600 light:border-gray-300 rounded-xl text-white light:text-gray-900 placeholder-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1] focus-visible:border-transparent text-sm"
              />
              <button
                type="submit"
                disabled={isSubmitting || !email}
                className="px-6 py-3 rounded-xl text-sm font-semibold text-white whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:-translate-y-0.5 outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060B18]"
                style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)', boxShadow: '0 4px 14px rgba(245,158,11,0.4)' }}
              >
                {isSubmitting ? 'Joining\u2026' : 'Join Waitlist'}
              </button>
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-400 text-sm"
                role="alert"
                aria-live="polite"
              >
                {error}
              </motion.p>
            )}

            <div className="flex items-center justify-center gap-4 text-gray-400 light:text-gray-500">
              {totalSignups !== null && totalSignups > 0 && (
                <div className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" />
                  <span className="text-xs font-medium">
                    {totalSignups} {totalSignups === 1 ? 'person' : 'people'} on the list
                  </span>
                </div>
              )}
              <span className="text-xs">No spam. Unsubscribe anytime.</span>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
