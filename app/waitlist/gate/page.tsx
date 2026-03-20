'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import Image from 'next/image';
import { Copy, Check, Users, Loader2, Share2 } from 'lucide-react';

export default function WaitlistGatePage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();

  const [loading, setLoading] = useState(true);
  const [position, setPosition] = useState<number | null>(null);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referralCount, setReferralCount] = useState(0);
  const [copied, setCopied] = useState(false);

  const referralLink = referralCode
    ? `https://www.replysequence.com?ref=${referralCode}`
    : null;

  // Check admission status and load waitlist info
  const checkStatus = useCallback(async () => {
    if (!isLoaded || !user) return;

    try {
      // Check if admitted
      const admitRes = await fetch('/api/waitlist/admit');
      if (admitRes.ok) {
        const admitData = await admitRes.json();
        if (admitData.admitted) {
          // User is admitted, send them to onboarding or dashboard
          router.replace('/onboarding');
          return;
        }
      }

      // Load waitlist position by email
      const email = user.emailAddresses?.[0]?.emailAddress;
      if (email) {
        const waitlistRes = await fetch(`/api/waitlist?email=${encodeURIComponent(email)}`);
        if (waitlistRes.ok) {
          const data = await waitlistRes.json();
          setPosition(data.position);
          setReferralCode(data.referralCode);
          setReferralCount(data.referralCount || 0);
        }
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  }, [isLoaded, user, router]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  // Poll admission status every 30 seconds (in case admin admits them)
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/waitlist/admit');
        if (res.ok) {
          const data = await res.json();
          if (data.admitted) {
            router.replace('/onboarding');
          }
        }
      } catch {
        // ignore
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [router]);

  function handleCopy() {
    if (referralLink) {
      navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-[#060B18] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#6366F1] animate-spin mx-auto" />
          <p className="mt-4 text-gray-400">Checking your status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060B18] flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-10">
          <Image src="/logo.png" alt="" width={32} height={32} className="rounded-sm" />
          <span className="text-2xl font-bold bg-gradient-to-r from-[#6366F1] to-[#4F46E5] bg-clip-text text-transparent">
            ReplySequence
          </span>
        </div>

        {/* Card */}
        <div className="rounded-2xl bg-gray-900/80 border border-gray-700 p-8 text-center space-y-6">
          {/* Position badge */}
          {position && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#6366F1]/10 border border-[#6366F1]/30">
              <Users className="w-4 h-4 text-[#6366F1]" />
              <span className="text-sm font-semibold text-[#6366F1]">
                #{position} on the list
              </span>
            </div>
          )}

          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-white">
              You&apos;re on the list!
            </h1>
            <p className="text-gray-400 text-sm leading-relaxed">
              We&apos;re letting people in gradually to make sure everything runs smoothly.
              We&apos;ll let you in soon. Share your link to move up.
            </p>
          </div>

          {/* Referral section */}
          {referralLink && (
            <div className="space-y-3 pt-2">
              <p className="text-sm font-medium text-gray-300">
                Share to move up the list:
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={referralLink}
                  aria-label="Referral link"
                  className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 truncate"
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

              {referralCount > 0 && (
                <p className="text-xs text-gray-500">
                  {referralCount} {referralCount === 1 ? 'person' : 'people'} joined through your link
                </p>
              )}

              {/* Share buttons */}
              <div className="flex items-center justify-center gap-3 pt-2">
                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralLink)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-[#0077B5]/10 border border-[#0077B5]/30 text-[#0077B5] rounded-lg text-sm font-medium hover:bg-[#0077B5]/20 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060B18]"
                >
                  Share on LinkedIn
                </a>
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent('Just joined @replysequence — the follow-up layer for sales. AI turns your meetings into personalized follow-ups, sequences, and CRM updates.')}&url=${encodeURIComponent(referralLink)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-gray-700/50 border border-gray-600 text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060B18]"
                >
                  Share on X
                </a>
              </div>
            </div>
          )}

          {/* Connect platform CTA - fast-track admission */}
          <div className="pt-4 border-t border-gray-700/50">
            <div className="flex items-center gap-2 justify-center mb-3">
              <Share2 className="w-4 h-4 text-amber-400" />
              <p className="text-sm font-medium text-amber-400">
                Skip the wait
              </p>
            </div>
            <p className="text-xs text-gray-400 mb-4">
              Connect your meeting platform now and get instant access.
            </p>
            <button
              onClick={() => router.push('/onboarding?step=2')}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060B18]"
              style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)', boxShadow: '0 4px 14px rgba(245,158,11,0.4)' }}
            >
              Connect Zoom, Meet, or Teams
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-600 mt-6">
          Questions? Reach out to jimmy@replysequence.com
        </p>
      </div>
    </div>
  );
}
