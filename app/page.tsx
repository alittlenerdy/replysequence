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
              className="text-blue-400 light:text-blue-600 font-bold text-lg w-5 text-center"
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
  FileText,
  Zap,
  Link2,
  Link2Off,
  BarChart3,
  Users,
  ArrowDown,
  FileX,
  Shield,
  Lock,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { GradientText } from '@/components/ui/GradientText';
import { GradientButton } from '@/components/ui/GradientButton';
import { FeatureCard } from '@/components/ui/FeatureCard';

// Lazy load heavy animation components
const BlueprintGrid = dynamic(() => import('@/components/landing/BlueprintGrid').then(m => ({ default: m.BlueprintGrid })), { ssr: false });
const HeroAnimation = dynamic(() => import('@/components/landing/HeroAnimation').then(m => ({ default: m.HeroAnimation })), { ssr: false });
const VideoSection = dynamic(() => import('@/components/landing/VideoSection').then(m => ({ default: m.VideoSection })), { ssr: false });
const BentoGrid = dynamic(() => import('@/components/landing/BentoGrid').then(m => ({ default: m.BentoGrid })), { ssr: false });
const FAQ = dynamic(() => import('@/components/landing/FAQ').then(m => ({ default: m.FAQ })), { ssr: false });

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] light:bg-gray-50 text-white light:text-gray-900 font-sans relative overflow-hidden">
      {/* Header */}
      <Header />

      {/* Hero Section with Blueprint Grid Background */}
      <section className="relative min-h-screen pt-32 pb-20 px-4 z-10">
        {/* Blueprint Grid Background */}
        <BlueprintGrid />

        {/* Animated gradient orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 8, repeat: Infinity }}
          />
          <motion.div
            className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"
            animate={{ scale: [1.2, 1, 1.2], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 8, repeat: Infinity, delay: 1 }}
          />
          <motion.div
            className="absolute top-3/4 left-1/2 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl"
            animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 8, repeat: Infinity, delay: 2 }}
          />
        </div>

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              <GradientText className="font-extrabold">8 Seconds</GradientText> from Call to{' '}
              <span className="text-white light:text-gray-900">Follow-up.</span>
            </h1>

            <p className="text-xl text-gray-400 light:text-gray-600 mb-4 leading-relaxed max-w-3xl mx-auto">
              AI drafts perfect follow-up emails the moment your Zoom, Teams, or Meet call ends. No notes. No typing. Just send.
            </p>

            {/* Countdown animation and speed comparison */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 mb-6"
            >
              <div className="px-5 py-2.5 rounded-full bg-gradient-to-r from-blue-500/10 to-indigo-500/10 light:from-blue-100 light:to-indigo-100 border-2 border-blue-500/30 light:border-blue-400/50 shadow-lg shadow-blue-500/10 light:shadow-blue-200/50">
                <CountdownAnimation />
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20">
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
                href="https://tally.so/r/D4pv0j"
                external
                showArrow
                size="lg"
              >
                Join Beta Waitlist
              </GradientButton>
            </motion.div>

            {/* Trust signal with avatars */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="flex items-center justify-center gap-3 text-gray-500 light:text-gray-600"
            >
              <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 border-2 border-[#0a0a0f] light:border-white shadow-sm" />
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 border-2 border-[#0a0a0f] light:border-white shadow-sm" />
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-rose-500 border-2 border-[#0a0a0f] light:border-white shadow-sm" />
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 border-2 border-[#0a0a0f] light:border-white shadow-sm" />
              </div>
              <span className="text-sm font-medium">Join 1,200+ sales teams on the waitlist</span>
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
                className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full hover:bg-green-500/20 transition-colors"
              >
                <Shield className="w-3.5 h-3.5 text-green-400" />
                <span className="text-xs font-medium text-green-400">SOC 2 Infrastructure</span>
              </a>
              <a
                href="/security"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full hover:bg-blue-500/20 transition-colors"
              >
                <Lock className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-xs font-medium text-blue-400">256-bit Encryption</span>
              </a>
              <a
                href="/privacy"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/10 border border-purple-500/20 rounded-full hover:bg-purple-500/20 transition-colors"
              >
                <Shield className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-xs font-medium text-purple-400">GDPR Compliant</span>
              </a>
            </motion.div>
          </motion.div>

          {/* Hero Animation */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 1 }}
            className="relative mt-8"
          >
            <HeroAnimation />
          </motion.div>
        </div>
      </section>

      {/* Video Demo Section */}
      <VideoSection />

      {/* Bento Grid Features */}
      <BentoGrid />

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
              The Real Cost of <GradientText variant="secondary">Manual Follow-ups</GradientText>
            </h2>
            <p className="text-gray-400 light:text-gray-600 max-w-2xl mx-auto">
              Every VP Sales knows these problems. Most accept them as &quot;the cost of doing business.&quot;
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Clock,
                title: 'Follow-ups eat 10-15 hours/week',
                description: 'Sales reps only spend 28% of their time actually selling',
              },
              {
                icon: FileX,
                title: 'Notes scattered & incomplete',
                description: 'Paper notes, Google Docs, half-filled CRM fields',
              },
              {
                icon: Zap,
                title: 'Slow follow-up kills momentum',
                description: 'Competitor demos while your rep is still writing notes',
              },
              {
                icon: Link2Off,
                title: 'Siloed tools = double entry',
                description: 'Zoom + email + CRM all disconnected',
              },
              {
                icon: BarChart3,
                title: 'CRM data wrong = vibes forecasts',
                description: 'Missing fields, stale stages, deals falling through cracks',
              },
              {
                icon: Users,
                title: 'Scaling multiplies chaos',
                description: 'Going from 5→20 reps means 4x the admin work',
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
            <div className="hidden md:block absolute top-24 left-[16.67%] right-[16.67%] h-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-30" />

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
                      item.color === 'blue' ? 'border-blue-500/50 bg-blue-500/10 text-blue-400' :
                      item.color === 'purple' ? 'border-purple-500/50 bg-purple-500/10 text-purple-400' :
                      'border-pink-500/50 bg-pink-500/10 text-pink-400'
                    }`}>
                      {item.icon}
                      {/* Step number badge */}
                      <span className={`absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                        item.color === 'blue' ? 'bg-blue-500' :
                        item.color === 'purple' ? 'bg-purple-500' :
                        'bg-pink-500'
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

      {/* Pain to Result Mapping */}
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
              From <span className="text-red-400">Pain</span> to{' '}
              <span className="text-emerald-400">Results</span>
            </h2>
            <p className="text-gray-400 light:text-gray-600 max-w-2xl mx-auto">
              See exactly how ReplySequence transforms your workflow
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Clock,
                pain: 'Follow-ups eat 10-15 hours/week',
                feature: 'Auto-drafted emails in 8 seconds',
                result: 'Give reps 10 hours/week back',
              },
              {
                icon: FileText,
                pain: 'Notes scattered & incomplete',
                feature: 'Transcript parsing + extraction',
                result: 'Complete context, every time',
              },
              {
                icon: Zap,
                pain: 'Slow follow-up kills momentum',
                feature: '8-second generation',
                result: 'Strike while iron is hot',
              },
              {
                icon: Link2,
                pain: 'Siloed tools = double entry',
                feature: 'Email + CRM logging in one',
                result: 'One action, two updates',
              },
              {
                icon: BarChart3,
                pain: 'CRM data wrong = vibes forecasts',
                feature: 'Accurate auto-logging',
                result: 'Forecasts you can trust',
              },
              {
                icon: Users,
                pain: 'Scaling multiplies chaos',
                feature: 'Same process, any team size',
                result: '10 reps or 100, same quality',
              },
            ].map((mapping, index) => {
              const IconComponent = mapping.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05, duration: 0.5 }}
                  className="group relative rounded-2xl bg-gray-900/50 light:bg-white light:shadow-lg border border-gray-700 light:border-gray-200 p-6 transition-all duration-300 hover:scale-[1.02] hover:border-blue-500/30"
                >
                  <div className="flex justify-center mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center border border-gray-700 light:border-gray-200">
                      <IconComponent className="w-6 h-6 text-blue-400" />
                    </div>
                  </div>

                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-red-400">Pain</span>
                    <p className="text-sm text-red-300 light:text-red-600 font-medium mt-1">{mapping.pain}</p>
                  </div>

                  <div className="flex flex-col items-center my-3">
                    <motion.div
                      animate={{ y: [0, 4, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      <ArrowDown className="w-5 h-5 text-blue-400 mb-1" />
                    </motion.div>
                    <span className="text-xs text-blue-400 font-medium text-center px-2">{mapping.feature}</span>
                    <motion.div
                      animate={{ y: [0, 4, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
                    >
                      <ArrowDown className="w-5 h-5 text-blue-400 mt-1" />
                    </motion.div>
                  </div>

                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                    <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Result</span>
                    <p className="text-sm text-emerald-300 light:text-emerald-600 font-medium mt-1">{mapping.result}</p>
                  </div>
                </motion.div>
              );
            })}
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
              Join the <GradientText>Beta Waitlist</GradientText>
            </h2>
            <p className="text-gray-400 light:text-gray-600 mb-8">
              Be among the first to automate your follow-ups. Limited spots available for pilot program.
            </p>

            <div className="rounded-2xl bg-gray-900/50 light:bg-white light:shadow-xl border border-gray-700 light:border-gray-200 p-6 sm:p-12 mx-4 sm:mx-0">
              <GradientButton
                href="https://tally.so/r/D4pv0j"
                external
                showArrow
                size="lg"
              >
                Join Beta Waitlist
              </GradientButton>
              <p className="text-gray-500 light:text-gray-600 text-xs sm:text-sm mt-6">
                Takes 30 seconds - Limited to 100 pilot users
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20 px-4 relative z-10">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-gray-500 light:text-gray-600 text-sm mb-8 font-medium">Trusted by sales teams at</p>
          <div className="flex flex-wrap justify-center items-center gap-12">
            {['TechCorp', 'SalesHub', 'GrowthCo', 'ScaleUp', 'CloudBase'].map((company, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="text-2xl font-bold text-gray-700 light:text-gray-400"
              >
                {company}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <FAQ />

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-gray-800 light:border-gray-200 relative z-10">
        <div className="max-w-7xl mx-auto text-center text-gray-500 light:text-gray-600 text-sm">
          <div className="mb-4">
            <GradientText className="text-2xl font-bold">ReplySequence</GradientText>
          </div>
          <div className="flex flex-wrap justify-center gap-6 mb-4">
            <a href="/terms" className="hover:text-purple-400 transition-colors">
              Terms of Service
            </a>
            <a href="/privacy" className="hover:text-purple-400 transition-colors">
              Privacy Policy
            </a>
            <a href="/security" className="hover:text-purple-400 transition-colors">
              Security
            </a>
          </div>
          <p>&copy; 2026 ReplySequence. Built by Playground Giants.</p>
        </div>
      </footer>
    </div>
  );
}
