'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import {
  Clock,
  Zap,
  FileX,
  Shield,
  Lock,
  ArrowDown,
  CheckCircle2,
  FileText,
  Layers,
  Brain,
  TrendingUp,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

// Lazy load heavy components
const BentoGrid = dynamic(() => import('@/components/landing/BentoGrid').then(m => ({ default: m.BentoGrid })), { ssr: false });
const FAQ = dynamic(() => import('@/components/landing/FAQ').then(m => ({ default: m.FAQ })), { ssr: false });
const WaitlistForm = dynamic(() => import('@/components/landing/WaitlistForm').then(m => ({ default: m.WaitlistForm })), { ssr: false });

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
            className="text-[#5B6CFF] light:text-[#4A5BEE] font-bold text-base"
          >
            ✓ Follow-up, sequence, and next steps ready
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
              className="text-[#5B6CFF] light:text-[#4A5BEE] font-bold text-lg w-5 text-center"
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

const platformPillars = [
  {
    icon: FileText,
    title: 'Follow-Ups',
    description: 'AI-drafted emails that reference the real conversation. Every follow-up sounds like you wrote it.',
    color: '#5B6CFF',
  },
  {
    icon: Layers,
    title: 'Sequences',
    description: 'Multi-step nurture flows triggered by each meeting. Keep deals warm without manual effort.',
    color: '#7A5CFF',
  },
  {
    icon: Brain,
    title: 'Meeting Intelligence',
    description: 'Next steps extracted with due dates. Risk flags for budget, timeline, and champion gaps.',
    color: '#22D3EE',
  },
  {
    icon: TrendingUp,
    title: 'Pipeline Automation',
    description: 'CRM updates, deal health scores, and pre-meeting briefings — all from your transcripts.',
    color: '#37D67A',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#060B18] light:bg-gray-50 text-white light:text-gray-900 font-sans relative overflow-hidden">
      <Header />

      {/* ============ 1. HERO ============ */}
      <section id="hero" className="relative pt-32 pb-12 px-4 z-10">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(91,108,255,0.15)_0%,transparent_70%)] pointer-events-none" />
        <div className="absolute top-1/3 left-1/3 w-[500px] h-[500px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(255,157,45,0.08)_0%,transparent_70%)] pointer-events-none" />
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="animate-fade-in-up">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight text-pretty">
              Every Tool Records the Meeting.{' '}
              <span className="bg-gradient-to-r from-[#5B6CFF] to-[#7A5CFF] bg-clip-text text-transparent font-extrabold">None of Them Send the Follow-Up.</span>
            </h1>

            <p className="text-xl text-[#9AA6C6] light:text-gray-600 mb-6 leading-relaxed max-w-3xl mx-auto">
              ReplySequence turns every sales call into personalized follow-ups, multi-step sequences, tracked next steps, and CRM updates — automatically, before your next meeting starts.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 mb-6">
              {[
                'Follow-ups and sequences from the transcript',
                'Next steps tracked with overdue reminders',
                'Deal risks flagged before they cost you',
              ].map((bullet, i) => (
                <div key={i} className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#5B6CFF] shrink-0" aria-hidden="true" />
                  <span className="text-sm text-[#9AA6C6] light:text-gray-600 font-medium">{bullet}</span>
                </div>
              ))}
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 mb-6"
          >
            <div className="px-5 py-2.5 rounded-full bg-gradient-to-r from-[#5B6CFF]/10 to-[#7A5CFF]/10 light:from-[#EEF0FF] light:to-[#DDE1FF] border-2 border-[#5B6CFF]/30 light:border-[#4A5BEE]/50 shadow-lg shadow-[#5B6CFF]/10 light:shadow-[#DDE1FF]/50">
              <CountdownAnimation />
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#5B6CFF]/10 to-[#7A5CFF]/10 border border-[#5B6CFF]/20">
              <Zap className="w-4 h-4 text-[#FF9D2D]" aria-hidden="true" />
              <span className="text-sm font-semibold text-[#9AA6C6] light:text-gray-700">
                10x faster than typing it yourself
              </span>
            </div>
          </motion.div>

          {/* Platform logos */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="flex items-center justify-center gap-2 mb-8 text-[#6B7492] light:text-gray-600 flex-wrap"
          >
            <span className="text-sm font-medium">Works with</span>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#2D8CFF]/10 border border-[#2D8CFF]/20">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#2D8CFF" aria-hidden="true">
                <path d="M4.585 6.836C3.71 6.836 3 7.547 3 8.42v7.16c0 .872.71 1.584 1.585 1.584h9.83c.875 0 1.585-.712 1.585-1.585V8.42c0-.872-.71-1.585-1.585-1.585H4.585zm12.415 2.11l3.96-2.376c.666-.4 1.04-.266 1.04.56v9.74c0 .826-.374.96-1.04.56L17 15.054V8.946z"/>
              </svg>
              <span className="text-xs font-semibold text-[#2D8CFF]">Zoom</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#5B5FC7]/10 border border-[#5B5FC7]/20">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#5B5FC7" aria-hidden="true">
                <path d="M20.625 8.5h-6.25a.625.625 0 00-.625.625v6.25c0 .345.28.625.625.625h6.25c.345 0 .625-.28.625-.625v-6.25a.625.625 0 00-.625-.625zM17.5 6.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM12.5 8a3 3 0 100-6 3 3 0 000 6zm0 1c-2.21 0-4 1.567-4 3.5V15h8v-2.5c0-1.933-1.79-3.5-4-3.5z"/>
              </svg>
              <span className="text-xs font-semibold text-[#5B5FC7]">Teams</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#00897B]/10 border border-[#00897B]/20">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#00897B" aria-hidden="true">
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
            className="max-w-2xl mx-auto mb-6 px-4 sm:px-0"
          >
            <div className="glass-border-accent rounded-2xl p-6 sm:p-10">
              <WaitlistForm />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="flex items-center justify-center"
          >
            <a
              href="/how-it-works"
              className="inline-flex items-center gap-2 text-base font-medium text-[#6B7492] light:text-gray-600 hover:text-gray-200 light:hover:text-gray-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B6CFF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#060B18] rounded-md group"
            >
              See How It Works
              <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5 text-[#5B6CFF]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="flex flex-wrap items-center justify-center gap-3 mt-6"
          >
            <a
              href="/security"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#5B6CFF]/10 border border-[#5B6CFF]/20 rounded-full hover:bg-[#5B6CFF]/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B6CFF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#060B18]"
            >
              <Lock className="w-3.5 h-3.5 text-[#5B6CFF]" aria-hidden="true" />
              <span className="text-xs font-medium text-[#5B6CFF]">AES-256 Encryption</span>
            </a>
            <a
              href="/privacy"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#5B6CFF]/10 border border-[#5B6CFF]/20 rounded-full hover:bg-[#5B6CFF]/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B6CFF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#060B18]"
            >
              <Shield className="w-3.5 h-3.5 text-[#5B6CFF]" aria-hidden="true" />
              <span className="text-xs font-medium text-[#5B6CFF]">Privacy First</span>
            </a>
          </motion.div>
        </div>
      </section>

      <div className="h-px bg-gradient-to-r from-transparent via-[#5B6CFF]/20 to-transparent" />

      {/* ============ 2. THE FOLLOW-UP GAP ============ */}
      <section className="py-12 md:py-20 px-4 relative z-10" style={{ background: 'linear-gradient(90deg, rgba(91,108,255,0.05) 0%, transparent 60%)' }}>
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0.15, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8 md:mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white light:text-gray-900 text-pretty">
              Your Sales Stack Has a <span className="bg-gradient-to-r from-[#5B6CFF] to-[#7A5CFF] bg-clip-text text-transparent">Gap</span>. This Is It.
            </h2>
            <p className="text-[#9AA6C6] light:text-gray-600 max-w-2xl mx-auto">
              Your meeting tool records. Your CRM stores. Your sequencer sends cold emails. Nothing connects the conversation to the follow-up.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              {
                icon: Clock,
                before: '44% of reps never follow up at all',
                process: 'AI drafts follow-up + triggers a sequence',
                after: 'Every call gets a multi-step follow-up plan',
              },
              {
                icon: FileX,
                before: 'Generic "Great speaking with you" emails',
                process: 'AI pulls specific topics from the transcript',
                after: 'Each sequence step references the real conversation',
              },
              {
                icon: Zap,
                before: 'Action items forgotten after the call',
                process: 'AI extracts next steps with due dates',
                after: 'Every commitment tracked, reminders sent when overdue',
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0.15, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="rounded-2xl bg-[#141C34]/80 light:bg-white border border-[#273054] light:border-gray-200 p-6 flex flex-col items-center text-center light:shadow-sm"
              >
                <div className="w-12 h-12 rounded-lg bg-[#5B6CFF]/10 border border-[#5B6CFF]/20 flex items-center justify-center mb-4">
                  <item.icon className="w-6 h-6 text-[#5B6CFF] light:text-[#4A5BEE]" aria-hidden="true" />
                </div>

                <span className="text-xs font-semibold uppercase tracking-wider text-[#6B7492] light:text-gray-500 mb-2">Before</span>
                <p className="text-sm text-[#9AA6C6] light:text-gray-700 mb-3">{item.before}</p>

                <ArrowDown className="w-4 h-4 text-[#5B6CFF]/60 mb-1" aria-hidden="true" />
                <p className="text-xs text-[#6B7492] light:text-gray-500 mb-1">{item.process}</p>
                <ArrowDown className="w-4 h-4 text-[#5B6CFF]/60 mb-3" aria-hidden="true" />

                <span className="text-xs font-semibold uppercase tracking-wider text-[#5B6CFF] light:text-[#4A5BEE] mb-2">After</span>
                <p className="text-sm text-white light:text-gray-900 font-medium">{item.after}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <div className="h-px bg-gradient-to-r from-transparent via-[#5B6CFF]/20 to-transparent" />

      {/* ============ 3. THE PLATFORM (4 Pillars) ============ */}
      <section className="py-12 md:py-20 px-4 relative z-10">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0.15, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8 md:mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white light:text-gray-900 text-pretty">
              One Platform. Four <span className="bg-gradient-to-r from-[#5B6CFF] to-[#7A5CFF] bg-clip-text text-transparent">Pillars</span>.
            </h2>
            <p className="text-[#9AA6C6] light:text-gray-600 max-w-2xl mx-auto">
              Everything between the call ending and the deal closing — automated.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {platformPillars.map((pillar, index) => {
              const Icon = pillar.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0.15, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  className="rounded-2xl bg-[#141C34]/80 light:bg-white border border-[#273054] light:border-gray-200 p-6 hover:border-[#5B6CFF]/30 transition-colors light:shadow-sm"
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                    style={{ backgroundColor: `${pillar.color}15`, boxShadow: `0 4px 16px ${pillar.color}20` }}
                  >
                    <Icon className="w-6 h-6" style={{ color: pillar.color }} strokeWidth={1.5} />
                  </div>
                  <h3 className="text-lg font-bold text-white light:text-gray-900 mb-2">{pillar.title}</h3>
                  <p className="text-sm text-[#9AA6C6] light:text-gray-600">{pillar.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <div className="h-px bg-gradient-to-r from-transparent via-[#5B6CFF]/20 to-transparent" />

      {/* ============ 4. HOW IT WORKS ============ */}
      <section className="py-12 md:py-20 px-4 relative z-10">
        <div className="max-w-6xl mx-auto bg-white/[0.02] light:bg-white/60 backdrop-blur-sm border border-white/[0.05] light:border-gray-200 rounded-3xl p-8 md:p-12 light:shadow-sm">
          <motion.div
            initial={{ opacity: 0.15, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8 md:mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white light:text-gray-900 text-pretty">
              From Call to <span className="bg-gradient-to-r from-[#5B6CFF] to-[#7A5CFF] bg-clip-text text-transparent">Pipeline Automation</span> in Three Steps
            </h2>
            <p className="text-[#9AA6C6] light:text-gray-600 max-w-2xl mx-auto">
              Connect once. Have your meetings. Follow-ups, sequences, next steps, and CRM updates handle themselves.
            </p>
          </motion.div>

          <div className="relative">
            <div className="hidden md:block absolute top-24 left-[16.67%] right-[16.67%] h-0.5 bg-gradient-to-r from-[#5B6CFF] via-[#7A5CFF] to-[#FF9D2D] opacity-30" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  step: '01',
                  icon: <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path strokeLinecap="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" /></svg>,
                  title: 'Have Your Meeting',
                  description: 'Use Zoom, Teams, or Meet like you already do. ReplySequence captures the transcript automatically — no bot joins the call.',
                  color: '#5B6CFF',
                },
                {
                  step: '02',
                  icon: <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" /></svg>,
                  title: 'AI Generates Everything',
                  description: 'Personalized follow-up. Multi-step sequence. Next steps with due dates. Deal risk flags. CRM updates. All from the transcript, in seconds.',
                  color: '#7A5CFF',
                },
                {
                  step: '03',
                  icon: <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>,
                  title: 'Review, Approve, Automate',
                  description: 'Send the follow-up. Activate the sequence. Confirm next steps. The pipeline runs itself — you are already on your next call.',
                  color: '#FF9D2D',
                },
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0.15, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.15, duration: 0.5 }}
                  className="relative"
                >
                  <div className="flex justify-center mb-6">
                    <div
                      className="relative w-20 h-20 rounded-full flex items-center justify-center border-2"
                      style={{ borderColor: `${item.color}50`, backgroundColor: `${item.color}10`, color: item.color }}
                    >
                      {item.icon}
                      <span
                        className="absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-lg"
                        style={{ background: `linear-gradient(135deg, ${item.color}, ${item.color}CC)` }}
                      >
                        {item.step}
                      </span>
                    </div>
                  </div>

                  {index < 2 && (
                    <motion.div
                      className="hidden md:block absolute top-10 -right-4 z-10"
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      <svg className="w-8 h-8 text-[#273054]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    </motion.div>
                  )}

                  <div className="text-center">
                    <h3 className="text-xl font-bold text-white light:text-gray-900 mb-3">{item.title}</h3>
                    <p className="text-[#9AA6C6] light:text-gray-600">{item.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="h-px bg-gradient-to-r from-transparent via-[#5B6CFF]/20 to-transparent" />

      {/* ============ 5. FEATURE HIGHLIGHTS (Bento Grid) ============ */}
      <BentoGrid />

      {/* ============ 6. SOCIAL PROOF STATS ============ */}
      <section className="py-12 md:py-20 px-4 relative z-10 border-t border-transparent" style={{ borderImage: 'linear-gradient(to right, transparent, rgba(91,108,255,0.3), transparent) 1' }}>
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0.15, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8 md:mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white light:text-gray-900 text-pretty">
              Built for Teams That <span className="bg-gradient-to-r from-[#5B6CFF] to-[#7A5CFF] bg-clip-text text-transparent">Follow Up Fast</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              {
                stat: '44%',
                highlight: 'of reps never follow up.',
                description: 'ReplySequence makes it automatic.',
              },
              {
                stat: '5+',
                highlight: 'touches needed to close 80% of deals.',
                description: 'ReplySequence keeps the sequence going.',
              },
              {
                stat: '7x',
                highlight: 'higher close rate when you respond within 1 hour.',
                description: 'ReplySequence drafts in seconds.',
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0.15, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="rounded-2xl bg-[#141C34]/80 light:bg-white border border-[#273054] light:border-gray-200 p-6 sm:p-8 text-center light:shadow-sm"
              >
                <span className="text-5xl font-extrabold bg-gradient-to-r from-[#FF9D2D] to-[#FDE047] bg-clip-text text-transparent">{item.stat}</span>
                <p className="text-sm text-[#9AA6C6] light:text-gray-700 mt-3 mb-1 font-medium">{item.highlight}</p>
                <p className="text-sm text-[#6B7492] light:text-gray-500">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ 7. CTA ============ */}
      <section id="waitlist" className="py-12 md:py-20 px-4 relative z-10" style={{ background: 'radial-gradient(ellipse at center, rgba(91,108,255,0.1) 0%, transparent 50%), radial-gradient(ellipse at 70% 50%, rgba(255,157,45,0.06) 0%, transparent 50%)' }}>
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0.15, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white light:text-gray-900 text-pretty">
              Your Next Meeting Is Coming. The <span className="bg-gradient-to-r from-[#5B6CFF] to-[#7A5CFF] bg-clip-text text-transparent">Follow-Up</span> Should Be Automatic.
            </h2>
            <p className="text-[#9AA6C6] light:text-gray-600 mb-6">
              Start with 5 free AI drafts. No credit card. Connect your meeting platform and get follow-ups, sequences, next-step tracking, and deal intelligence in under 5 minutes.
            </p>

            <div className="glass-border-accent rounded-2xl p-6 sm:p-10 mx-4 sm:mx-0">
              <WaitlistForm />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============ 8. FAQ + FOOTER ============ */}
      <FAQ />
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
            "description": "The follow-up layer for sales. Turns meeting transcripts into personalized follow-ups, sequences, and CRM updates automatically.",
            "url": "https://www.replysequence.com",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD",
              "description": "Free tier with 5 AI follow-up drafts per month",
            },
            "creator": {
              "@type": "Organization",
              "name": "Playground Giants",
              "url": "https://playgroundgiants.com",
            },
            "featureList": [
              "AI-powered follow-up email generation from transcripts",
              "Multi-step follow-up sequences triggered by meetings",
              "Automatic next-step extraction with due dates and reminders",
              "Deal risk detection with MEDDIC-based categorization",
              "Pre-meeting intelligence briefings with deal context",
              "Deal health scoring across your pipeline",
              "Zoom, Microsoft Teams, and Google Meet integration",
              "CRM automation with HubSpot, Salesforce, and Google Sheets",
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
            "description": "The follow-up layer for sales — AI-powered follow-ups, sequences, and CRM updates from meeting transcripts",
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
