'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  CheckCircle2,
  Target,
  Eye,
  Zap,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

const benefits = [
  {
    icon: Target,
    title: 'Actionable Tactics',
    description: 'One specific follow-up technique each week that you can use in your next meeting.',
    color: '#6366F1',
  },
  {
    icon: Eye,
    title: 'Real Examples',
    description: 'Before/after email comparisons from real sales meetings. See what works.',
    color: '#38E8FF',
  },
  {
    icon: Zap,
    title: 'No Fluff',
    description: 'Direct, practical, 2-minute read. No filler, no pitches, just tactics.',
    color: '#4DFFA3',
  },
];

const sampleTopics = [
  'The "3-Point Recap" — a follow-up format that gets 2x replies',
  'Why waiting 24 hours to follow up kills your deal momentum',
  'The exact subject line formula for post-demo follow-ups',
  'How to follow up after a "we need to think about it" meeting',
  'Turning a quiet thread into a booked next step in one email',
];

export default function NewsletterPage() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name: name || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          setError(data.error || 'Already subscribed.');
        } else if (res.status === 429) {
          setError('Too many requests. Please try again later.');
        } else {
          setError(data.error || 'Something went wrong.');
        }
        return;
      }

      setSuccess(true);
      setSuccessMessage(data.message);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#060B18] light:bg-white text-white light:text-gray-900">
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-32 pb-20">
        {/* Hero */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#6366F1]/10 border border-[#6366F1]/20 text-[#6366F1] text-sm font-medium mb-6">
            <Mail className="w-4 h-4" />
            Every Tuesday
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 bg-gradient-to-r from-white to-gray-400 light:from-gray-900 light:to-gray-600 bg-clip-text text-transparent">
            Close the Loop
          </h1>
          <p className="text-lg sm:text-xl text-gray-400 light:text-gray-600 max-w-2xl mx-auto">
            One actionable sales follow-up tactic every Tuesday. 2-minute read. No fluff.
          </p>
        </motion.div>

        {/* Subscribe Form */}
        <motion.div
          className="max-w-xl mx-auto mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="rounded-2xl bg-gray-900/60 light:bg-gray-50 border border-[#1E2A4A] light:border-gray-200 p-6 sm:p-8">
            <AnimatePresence mode="wait">
              {success ? (
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
                      {successMessage}
                    </h3>
                    <p className="text-sm text-gray-400 light:text-gray-600 mt-1">
                      Your first issue arrives next Tuesday.
                    </p>
                  </div>
                </motion.div>
              ) : (
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
                      className="px-4 py-3 bg-gray-800/80 light:bg-white border border-gray-700 light:border-gray-300 rounded-xl text-white light:text-gray-900 placeholder-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1] focus-visible:border-transparent text-sm sm:w-[180px]"
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
                      className="flex-1 px-4 py-3 bg-gray-800/80 light:bg-white border border-gray-700 light:border-gray-300 rounded-xl text-white light:text-gray-900 placeholder-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1] focus-visible:border-transparent text-sm"
                    />
                    <button
                      type="submit"
                      disabled={isSubmitting || !email}
                      className="btn-cta px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-sm font-semibold whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060B18] light:focus-visible:ring-offset-white"
                    >
                      {isSubmitting ? 'Subscribing...' : 'Subscribe'}
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

                  <p className="text-center text-xs text-gray-500 light:text-gray-600">
                    No spam. Unsubscribe anytime.
                  </p>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* What you'll get */}
        <motion.div
          className="mb-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-2xl font-bold text-center mb-8 text-white light:text-gray-900">
            What you&apos;ll get
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {benefits.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl bg-gray-900/40 light:bg-gray-50 border border-[#1E2A4A] light:border-gray-200 p-6"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: `${item.color}10` }}
                >
                  <item.icon className="w-5 h-5" style={{ color: item.color }} />
                </div>
                <h3 className="text-base font-semibold text-white light:text-gray-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-400 light:text-gray-600 leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Sample topics */}
        <motion.div
          className="mb-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-2xl font-bold text-center mb-8 text-white light:text-gray-900">
            Recent topics
          </h2>
          <div className="max-w-2xl mx-auto space-y-3">
            {sampleTopics.map((topic, i) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-xl bg-gray-900/30 light:bg-gray-50 border border-[#1E2A4A] light:border-gray-200 px-5 py-4"
              >
                <Mail className="w-4 h-4 text-[#6366F1] mt-0.5 shrink-0" />
                <span className="text-sm text-gray-300 light:text-gray-700">{topic}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <p className="text-gray-400 light:text-gray-600 mb-4">
            Want to see the product behind the newsletter?
          </p>
          <Link
            href="/demo"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-800/50 light:bg-gray-100 border border-[#1E2A4A] light:border-gray-300 rounded-xl text-sm font-medium text-white light:text-gray-900 hover:border-[#6366F1]/30 light:hover:border-[#6366F1]/30 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060B18] light:focus-visible:ring-offset-white"
          >
            Try the live demo
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
