'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';

// Countdown animation component
function CountdownAnimation() {
  const [count, setCount] = useState(8);
  const [showMessage, setShowMessage] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCount((prev) => {
        if (prev <= 1) {
          setShowMessage(true);
          setTimeout(() => {
            setShowMessage(false);
            setCount(8);
          }, 2000);
          return 0;
        }
        return prev - 1;
      });
    }, 800);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center justify-center gap-2 text-sm font-mono">
      <AnimatePresence mode="wait">
        {showMessage ? (
          <motion.span
            key="message"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="text-emerald-500 light:text-emerald-600 font-bold text-base"
          >
            ✓ Your email is ready
          </motion.span>
        ) : (
          <motion.div
            key="countdown"
            className="flex items-center gap-1.5"
          >
            <span className="text-gray-400 light:text-gray-600 font-medium">Drafting in</span>
            <motion.span
              key={count}
              initial={{ opacity: 0, y: -10, scale: 1.2 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.8 }}
              className="text-indigo-400 light:text-indigo-600 font-bold text-lg w-5 text-center"
            >
              {count}
            </motion.span>
            <span className="text-gray-400 light:text-gray-600 font-medium">seconds...</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
import {
  Clock,
  Zap,
  Link2Off,
  BarChart3,
  Users,
  FileX,
  Shield,
  Lock,
  ArrowDown,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { GradientText } from '@/components/ui/GradientText';
import { GradientButton } from '@/components/ui/GradientButton';
import { FeatureCard } from '@/components/ui/FeatureCard';

// Lazy load heavy components
const VideoSection = dynamic(() => import('@/components/landing/VideoSection').then(m => ({ default: m.VideoSection })), { ssr: false });
const BentoGrid = dynamic(() => import('@/components/landing/BentoGrid').then(m => ({ default: m.BentoGrid })), { ssr: false });
const FAQ = dynamic(() => import('@/components/landing/FAQ').then(m => ({ default: m.FAQ })), { ssr: false });

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] light:bg-gray-50 text-white light:text-gray-900 font-sans relative overflow-hidden">
      {/* Header */}
      <Header />

      {/* Hero Section */}
      <section className="relative min-h-screen pt-32 pb-20 px-4 z-10">
        <div className="max-w-5xl mx-auto text-center relative z-10">
          {/* H1 and description visible immediately for fast LCP */}
          <div className="animate-fade-in-up">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              Never Write Another{' '}
              <GradientText variant="amber" className="font-extrabold">Follow-Up</GradientText>{' '}
              From Scratch Again
            </h1>

            <p className="text-xl text-gray-400 light:text-gray-600 mb-4 leading-relaxed max-w-3xl mx-auto">
              Turn every Zoom, Teams, or Meet call into a deal-moving email and CRM update — in 8 seconds, not 30 minutes.
            </p>
          </div>

            {/* Countdown animation and speed comparison */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 mb-6"
            >
              <div className="px-5 py-2.5 rounded-full bg-gradient-to-r from-indigo-500/10 to-indigo-700/10 light:from-indigo-100 light:to-indigo-200 border-2 border-indigo-500/30 light:border-indigo-400/50 shadow-lg shadow-indigo-500/10 light:shadow-indigo-200/50">
                <CountdownAnimation />
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-indigo-500/10 to-indigo-700/10 border border-indigo-500/20">
                <Zap className="w-4 h-4 text-yellow-400" />
                <span className="text-sm font-semibold text-gray-300 light:text-gray-700">
                  10x faster than typing it yourself
                </span>
              </div>
            </motion.div>

            {/* Platform logos */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="flex items-center justify-center gap-2 mb-8 text-gray-500 light:text-gray-600 flex-wrap"
            >
              <span className="text-sm font-medium">Works with</span>
              {/* Zoom logo */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#2D8CFF]/10 border border-[#2D8CFF]/20">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#2D8CFF">
                  <path d="M4.585 6.836C3.71 6.836 3 7.547 3 8.42v7.16c0 .872.71 1.584 1.585 1.584h9.83c.875 0 1.585-.712 1.585-1.585V8.42c0-.872-.71-1.585-1.585-1.585H4.585zm12.415 2.11l3.96-2.376c.666-.4 1.04-.266 1.04.56v9.74c0 .826-.374.96-1.04.56L17 15.054V8.946z"/>
                </svg>
                <span className="text-xs font-semibold text-[#2D8CFF]">Zoom</span>
              </div>
              {/* Teams logo */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#5B5FC7]/10 border border-[#5B5FC7]/20">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#5B5FC7">
                  <path d="M20.625 8.5h-6.25a.625.625 0 00-.625.625v6.25c0 .345.28.625.625.625h6.25c.345 0 .625-.28.625-.625v-6.25a.625.625 0 00-.625-.625zM17.5 6.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM12.5 8a3 3 0 100-6 3 3 0 000 6zm0 1c-2.21 0-4 1.567-4 3.5V15h8v-2.5c0-1.933-1.79-3.5-4-3.5z"/>
                </svg>
                <span className="text-xs font-semibold text-[#5B5FC7]">Teams</span>
              </div>
              {/* Google Meet logo */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#00897B]/10 border border-[#00897B]/20">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#00897B">
                  <path d="M12 11.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"/>
                  <path d="M15.29 15.71L18 18.41V5.59l-2.71 2.7A5.977 5.977 0 0112 7c-1.38 0-2.65.47-3.66 1.26L14.59 2H5a2 2 0 00-2 2v16a2 2 0 002 2h14a2 2 0 002-2V9.41l-5.71 6.3zM6 10a6 6 0 1112 0 6 6 0 01-12 0z"/>
                </svg>
                <span className="text-xs font-semibold text-[#00897B]">Meet</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="flex flex-wrap gap-4 mb-6 justify-center px-4 sm:px-0"
            >
              <GradientButton
                href="/sign-up"
                showArrow
                size="lg"
              >
                Get Started Free
              </GradientButton>
              <a
                href="/how-it-works"
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-gray-300 light:text-gray-600 bg-gray-800/50 light:bg-gray-100 hover:bg-gray-700/50 light:hover:bg-gray-200 border border-gray-700 light:border-gray-300 rounded-xl transition-colors"
              >
                See How It Works
              </a>
            </motion.div>

            {/* Value proposition */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="flex items-center justify-center gap-3 text-gray-500 light:text-gray-600"
            >
              <span className="text-sm font-medium">Works with Zoom, Google Meet, and Microsoft Teams</span>
            </motion.div>

            {/* Security Trust Badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="flex flex-wrap items-center justify-center gap-3 mt-6"
            >
              <a
                href="/security"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full hover:bg-indigo-500/20 transition-colors"
              >
                <Lock className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-xs font-medium text-indigo-400">AES-256 Encryption</span>
              </a>
              <a
                href="/privacy"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full hover:bg-amber-500/20 transition-colors"
              >
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs font-medium text-amber-400">Privacy First</span>
              </a>
            </motion.div>

        </div>
      </section>

      {/* Video Demo Section */}
      <VideoSection />

      {/* Bento Grid Features */}
      <BentoGrid />

      {/* Pain-to-Results Section */}
      <section className="py-20 px-4 relative z-10">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white light:text-gray-900">
              From <GradientText variant="amber">Before</GradientText> to <GradientText>After</GradientText>
            </h2>
            <p className="text-gray-400 light:text-gray-600 max-w-2xl mx-auto">
              See exactly how ReplySequence transforms your post-meeting workflow
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Clock,
                before: 'Reps follow up late or not at all',
                process: 'Auto-drafted in 8 seconds',
                after: 'Every call gets same-day follow-up',
              },
              {
                icon: FileX,
                before: 'Generic templates that ignore the call',
                process: 'AI reads your transcript',
                after: 'Emails reference what was actually said',
              },
              {
                icon: Zap,
                before: 'No playbook for no-shows',
                process: 'Triggered recovery sequences',
                after: 'Winnable deals stop falling through',
              },
              {
                icon: Link2Off,
                before: 'Manager has zero visibility',
                process: 'Automatic activity logging',
                after: 'See every follow-up without asking',
              },
              {
                icon: BarChart3,
                before: 'Every rep reinvents follow-up',
                process: 'Standardized templates',
                after: 'Top-rep quality across the whole team',
              },
              {
                icon: Users,
                before: 'CRM tasks scattered everywhere',
                process: 'One unified system',
                after: 'Same process, any team size',
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="rounded-xl border border-gray-700 light:border-gray-200 bg-gray-900/50 light:bg-white p-6 flex flex-col items-center text-center"
              >
                <div className="w-12 h-12 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4">
                  <item.icon className="w-6 h-6 text-indigo-400 light:text-indigo-600" />
                </div>

                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Before</span>
                <p className="text-sm text-gray-300 light:text-gray-700 mb-3">{item.before}</p>

                <ArrowDown className="w-4 h-4 text-amber-400/60 mb-1" />
                <p className="text-xs text-gray-500 light:text-gray-500 mb-1">{item.process}</p>
                <ArrowDown className="w-4 h-4 text-amber-400/60 mb-3" />

                <span className="text-xs font-semibold uppercase tracking-wider text-amber-400 light:text-amber-600 mb-2">After</span>
                <p className="text-sm text-white light:text-gray-900 font-medium">{item.after}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pain Points Section */}
      <section className="py-20 px-4 relative z-10">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white light:text-gray-900">
              Your Real Leak Is Between <GradientText variant="amber">&apos;Great Call&apos;</GradientText> and <GradientText>&apos;Next Step&apos;</GradientText>
            </h2>
            <p className="text-gray-400 light:text-gray-600 max-w-2xl mx-auto">
              You&apos;re booking meetings — but losing deals after them.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Clock,
                title: 'Follow-ups are a 30-minute time suck',
                description: 'Reps spend 30-60 min/day turning messy notes into emails. That\'s selling time lost to admin.',
              },
              {
                icon: FileX,
                title: 'Rushed emails miss the nuance',
                description: 'Generic, low-quality follow-ups that feel templated. No mention of what was actually discussed.',
              },
              {
                icon: Zap,
                title: 'Great calls die in the inbox',
                description: 'Some meetings never get a recap or clear next steps. Deals stall and pipeline evaporates.',
              },
              {
                icon: Link2Off,
                title: 'Context switching kills momentum',
                description: 'Zoom to notes to Gmail to CRM. By the time you\'re drafting, the conversation is cold.',
              },
              {
                icon: BarChart3,
                title: 'Info scattered across 4 tools',
                description: 'Notes in Docs, tasks in Notion, CRM not updated. Hard to remember what was agreed.',
              },
              {
                icon: Users,
                title: 'Managers can\'t see what happened',
                description: 'Leaders have no way to know if next steps were clearly set or logged after each call.',
              },
            ].map((pain, index) => (
              <FeatureCard
                key={index}
                icon={pain.icon}
                title={pain.title}
                description={pain.description}
                index={index}
              />
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 relative z-10">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white light:text-gray-900">
              How <GradientText>ReplySequence</GradientText> Works
            </h2>
            <p className="text-gray-400 light:text-gray-600 max-w-2xl mx-auto">
              Connect once, automate forever. Three steps to transform your follow-up workflow.
            </p>
          </motion.div>

          <div className="relative">
            {/* Connecting line for desktop */}
            <div className="hidden md:block absolute top-24 left-[16.67%] right-[16.67%] h-0.5 bg-gradient-to-r from-indigo-300 via-indigo-400 to-indigo-600 opacity-30" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  step: '01',
                  icon: <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" /></svg>,
                  title: 'Connect Your Platform',
                  description: 'Link Zoom, Teams, or Google Meet in one click. We securely access transcripts with your permission.',
                  color: 'blue',
                },
                {
                  step: '02',
                  icon: <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" /></svg>,
                  title: 'AI Drafts in 8 Seconds',
                  description: 'Our AI extracts action items, commitments, and key points—then drafts a perfect follow-up instantly.',
                  color: 'purple',
                },
                {
                  step: '03',
                  icon: <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>,
                  title: 'Review & Send',
                  description: 'Get polished drafts in your inbox. Customize if needed, then send with one click. CRM updates automatically.',
                  color: 'pink',
                },
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.15, duration: 0.5 }}
                  className="relative"
                >
                  {/* Step indicator circle */}
                  <div className="flex justify-center mb-6">
                    <div className={`relative w-20 h-20 rounded-full flex items-center justify-center border-2 ${
                      item.color === 'blue' ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-400' :
                      item.color === 'purple' ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-400' :
                      'border-amber-500/50 bg-amber-500/10 text-amber-400'
                    }`}>
                      {item.icon}
                      {/* Step number badge */}
                      <span className={`absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-lg ${
                        item.color === 'blue' ? 'bg-gradient-to-br from-indigo-500 to-indigo-700' :
                        item.color === 'purple' ? 'bg-gradient-to-br from-indigo-500 to-indigo-700' :
                        'bg-gradient-to-br from-amber-500 to-amber-600'
                      }`}>
                        {item.step}
                      </span>
                    </div>
                  </div>

                  {/* Arrow between steps on desktop */}
                  {index < 2 && (
                    <motion.div
                      className="hidden md:block absolute top-10 -right-4 z-10"
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      <svg className="w-8 h-8 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    </motion.div>
                  )}

                  <div className="text-center">
                    <h3 className="text-xl font-bold text-white light:text-gray-900 mb-3">{item.title}</h3>
                    <p className="text-gray-400 light:text-gray-600">{item.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 relative z-10">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white light:text-gray-900">
              Ready to <GradientText variant="amber">Close the Gap</GradientText> After Every Meeting?
            </h2>
            <p className="text-gray-400 light:text-gray-600 mb-8">
              Start generating AI-powered follow-up emails from your meetings today. Free plan includes 5 drafts per month.
            </p>

            <div className="rounded-2xl bg-gray-900/50 light:bg-white light:shadow-xl border border-gray-700 light:border-gray-200 p-6 sm:p-12 mx-4 sm:mx-0">
              <GradientButton
                href="/sign-up"
                showArrow
                size="lg"
              >
                Get Started Free
              </GradientButton>
              <p className="text-gray-500 light:text-gray-600 text-xs sm:text-sm mt-6">
                No credit card required. 5 free drafts per month.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Product Capabilities */}
      <section className="py-20 px-4 relative z-10">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="inline-flex flex-col items-center"
          >
            <div className="flex items-center gap-6 mb-6">
              {[
                { label: 'Platforms Supported', value: '3', amber: false },
                { label: 'Avg. Draft Time', value: '<30s', amber: true },
                { label: 'CRM Integrations', value: '2+', amber: false },
              ].map((stat, i) => (
                <div key={i} className="text-center px-6">
                  <div className={`text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r ${stat.amber ? 'from-amber-400 via-amber-500 to-orange-500' : 'from-indigo-300 via-indigo-400 to-indigo-600'}`}>
                    {stat.value}
                  </div>
                  <div className="text-xs text-gray-500 light:text-gray-600 mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
            <p className="text-gray-500 light:text-gray-600 text-sm">
              Built for sales teams, account managers, and anyone who follows up after meetings
            </p>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <FAQ />

      {/* Footer */}
      <Footer />

      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "ReplySequence",
            "applicationCategory": "BusinessApplication",
            "operatingSystem": "Web",
            "description": "Turn Zoom, Teams, and Meet calls into perfect follow-up emails in seconds. AI-powered drafts with CRM integration.",
            "url": "https://www.replysequence.com",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD",
              "description": "Free tier with 5 drafts per month",
            },
            "creator": {
              "@type": "Organization",
              "name": "Playground Giants",
              "url": "https://playgroundgiants.com",
            },
            "featureList": [
              "AI-powered follow-up email generation",
              "Zoom, Microsoft Teams, and Google Meet integration",
              "CRM automation with HubSpot and Airtable",
              "Email tracking and analytics",
              "Connected email account sending",
            ],
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "ReplySequence",
            "url": "https://www.replysequence.com",
            "description": "AI-powered meeting follow-up emails",
            "publisher": {
              "@type": "Organization",
              "name": "Playground Giants",
            },
          }),
        }}
      />
    </div>
  );
}
