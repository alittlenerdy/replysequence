'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
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
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

// Lazy load heavy components
const FAQ = dynamic(() => import('@/components/landing/FAQ').then(m => ({ default: m.FAQ })), { ssr: false });
const WaitlistForm = dynamic(() => import('@/components/landing/WaitlistForm').then(m => ({ default: m.WaitlistForm })), { ssr: false });

const platformPillars = [
  {
    icon: FileText,
    title: 'Follow-Ups',
    description: 'AI-drafted emails that reference the real conversation. Every follow-up sounds like you wrote it.',
    color: '#6366F1',
    href: '/product/follow-ups',
  },
  {
    icon: Layers,
    title: 'Sequences',
    description: 'Multi-step nurture flows triggered by each meeting. Keep deals warm without manual effort.',
    color: '#7A5CFF',
    href: '/product/sequences',
  },
  {
    icon: Brain,
    title: 'Meeting Intelligence',
    description: 'Next steps extracted with due dates. Risk flags for budget, timeline, and champion gaps.',
    color: '#06B6D4',
    href: '/product/meeting-intelligence',
  },
  {
    icon: TrendingUp,
    title: 'Pipeline Automation',
    description: 'CRM updates, deal health scores, and pre-meeting briefings — all from your transcripts.',
    color: '#F59E0B',
    href: '/product/pipeline-automation',
  },
];

export default function LandingPage() {
  // Arcade popout handler
  useEffect(() => {
    function onArcadeIframeMessage(e: MessageEvent) {
      if (e.origin !== 'https://demo.arcade.software' || !e.isTrusted) return;
      const arcadeIframe = document.querySelector(`iframe[src*="${e.data.id}"]`) as HTMLIFrameElement | null;
      if (!arcadeIframe || !arcadeIframe.contentWindow) return;
      if (e.data.event === 'arcade-init') {
        arcadeIframe.contentWindow.postMessage({ event: 'register-popout-handler' }, '*');
      }
      if (e.data.event === 'arcade-popout-open') {
        arcadeIframe.style.position = 'fixed';
        arcadeIframe.style.zIndex = '9999999';
      }
      if (e.data.event === 'arcade-popout-close') {
        arcadeIframe.style.position = 'absolute';
        arcadeIframe.style.zIndex = 'auto';
      }
    }
    window.addEventListener('message', onArcadeIframeMessage);
    return () => window.removeEventListener('message', onArcadeIframeMessage);
  }, []);

  return (
    <div className="min-h-screen bg-[#060B18] light:bg-gray-50 text-white light:text-gray-900 font-sans relative overflow-hidden">
      <Header />

      {/* ============ 1. HERO ============ */}
      <section id="hero" className="relative pt-32 pb-24 px-4 z-10">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(91,108,255,0.12)_0%,transparent_70%)] pointer-events-none light:hidden" />
        <div className="absolute top-1/3 left-1/3 w-[500px] h-[500px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(245,158,11,0.06)_0%,transparent_70%)] pointer-events-none light:hidden" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          {/* Headline */}
          <div className="animate-fade-in-up">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-8 leading-[1.1] text-pretty text-white light:text-gray-900">
              Every Tool Records the Meeting.{' '}
              <span className="bg-gradient-to-r from-[#6366F1] to-[#7A5CFF] bg-clip-text text-transparent">None of Them Send the Follow-Up.</span>
            </h1>

            <p className="text-xl text-[#C0C8E0] light:text-gray-600 mb-4 leading-relaxed max-w-2xl mx-auto">
              ReplySequence turns every sales call into personalized follow-ups, multi-step sequences, tracked next steps, and CRM updates — automatically.
            </p>
            <p className="text-sm text-white/60 light:text-gray-500 mt-4 mb-10 max-w-xl mx-auto">
              44% of reps never follow up. The rest send generic emails.
            </p>
          </div>

          {/* Primary CTA: Waitlist */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="max-w-2xl mx-auto mb-5 px-4 sm:px-0"
          >
            <div className="rounded-2xl bg-[#0F172A] light:bg-white border border-[#1E2A4A] light:border-gray-200 p-6 sm:p-10 shadow-lg shadow-black/20 light:shadow-gray-200/30">
              <WaitlistForm />
            </div>
          </motion.div>

          {/* Watch Demo — scrolls to demo below */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="flex items-center justify-center"
          >
            <a
              href="#product-demo"
              className="inline-flex items-center gap-3 px-8 py-3.5 rounded-xl text-base font-bold text-white light:text-gray-900 border-2 border-[#F59E0B]/40 light:border-[#F59E0B]/60 hover:border-[#F59E0B]/70 hover:bg-[#F59E0B]/5 light:hover:bg-[#F59E0B]/10 transition-all duration-200 hover:-translate-y-0.5 group"
            >
              <span className="w-8 h-8 rounded-full bg-[#F59E0B] flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <svg className="w-4 h-4 text-black ml-0.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </span>
              Watch the Demo
              <svg className="w-4 h-4 text-[#8892B0] light:text-gray-400 rotate-90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </a>
          </motion.div>
        </div>
      </section>

      {/* ============ ARCADE DEMO — primary product proof ============ */}
      <section id="product-demo" className="relative z-10 mt-[-40px] md:mt-[-60px] pt-0 pb-20 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-center text-white light:text-gray-900 mb-6">
              See what happens 5 seconds after your call ends
            </h2>

            {/* Arcade embed */}
            <div className="rounded-2xl overflow-hidden border border-white/10 light:border-gray-200 light:bg-white bg-gradient-to-b from-white/[0.03] to-transparent light:from-transparent backdrop-blur-sm shadow-[0_0_60px_rgba(99,102,241,0.15),0_25px_50px_rgba(0,0,0,0.3)] light:shadow-xl light:shadow-gray-300/40">
              <div style={{ position: 'relative', paddingBottom: 'calc(54.28% + 41px)', height: 0, width: '100%' }}>
                <iframe
                  src="https://demo.arcade.software/vgH8BUFUeiIHapleaNQ8?embed&embed_mobile=modal&embed_desktop=tab&show_copy_link=true"
                  title="ReplySequence Demo"
                  frameBorder="0"
                  loading="lazy"
                  allowFullScreen
                  allow="clipboard-write"
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', colorScheme: 'light' }}
                />
              </div>
            </div>

            {/* Post-demo CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
              <Link
                href="/demo"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-base font-bold text-black transition-all duration-200 hover:-translate-y-0.5 hover:scale-[1.02]"
                style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)', boxShadow: '0 4px 20px rgba(245,158,11,0.3)' }}
              >
                Try the Interactive Demo
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
              </Link>
              <Link
                href="#waitlist"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-base font-semibold text-[#C0C8E0] light:text-gray-700 border border-[#1E2A4A] light:border-gray-300 hover:border-[#06B6D4]/40 hover:text-white light:hover:text-gray-900 transition-all duration-200"
              >
                Join the Waitlist
              </Link>
            </div>

            {/* Trust line */}
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[#8892B0] light:text-gray-500 text-xs font-medium mt-8">
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#2D8CFF" aria-hidden="true"><path d="M4.585 6.836C3.71 6.836 3 7.547 3 8.42v7.16c0 .872.71 1.584 1.585 1.584h9.83c.875 0 1.585-.712 1.585-1.585V8.42c0-.872-.71-1.585-1.585-1.585H4.585zm12.415 2.11l3.96-2.376c.666-.4 1.04-.266 1.04.56v9.74c0 .826-.374.96-1.04.56L17 15.054V8.946z"/></svg>
                Zoom
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#5B5FC7" aria-hidden="true"><path d="M20.625 8.5h-6.25a.625.625 0 00-.625.625v6.25c0 .345.28.625.625.625h6.25c.345 0 .625-.28.625-.625v-6.25a.625.625 0 00-.625-.625zM17.5 6.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM12.5 8a3 3 0 100-6 3 3 0 000 6zm0 1c-2.21 0-4 1.567-4 3.5V15h8v-2.5c0-1.933-1.79-3.5-4-3.5z"/></svg>
                Teams
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#00897B" aria-hidden="true"><path d="M12 11.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"/><path d="M15.29 15.71L18 18.41V5.59l-2.71 2.7A5.977 5.977 0 0112 7c-1.38 0-2.65.47-3.66 1.26L14.59 2H5a2 2 0 00-2 2v16a2 2 0 002 2h14a2 2 0 002-2V9.41l-5.71 6.3zM6 10a6 6 0 1112 0 6 6 0 01-12 0z"/></svg>
                Meet
              </span>
              <span className="text-[#1E2A4A] light:text-gray-300">|</span>
              <a href="/security" className="flex items-center gap-1 hover:text-gray-300 light:hover:text-gray-700 transition-colors">
                <Lock className="w-3 h-3" aria-hidden="true" />
                AES-256
              </a>
              <a href="/privacy" className="flex items-center gap-1 hover:text-gray-300 light:hover:text-gray-700 transition-colors">
                <Shield className="w-3 h-3" aria-hidden="true" />
                Privacy First
              </a>
              <span className="text-[#1E2A4A] light:text-gray-300">|</span>
              <span>Built from 1,000+ sales calls</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============ 2. THE FOLLOW-UP GAP ============ */}
      <section className="py-20 px-4 relative z-10 bg-[#060B18] light:bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0.15, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8"
          >
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 text-white light:text-gray-900 text-pretty">
              Your stack records the call. Nothing connects it to <span className="bg-gradient-to-r from-[#6366F1] to-[#7A5CFF] bg-clip-text text-transparent">revenue</span>.
            </h2>
            <p className="text-[#C0C8E0] light:text-gray-600 max-w-2xl mx-auto mt-4">
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
                className="rounded-2xl bg-[#0F172A] light:bg-white border border-[#1E2A4A] light:border-gray-200 p-6 shadow-lg shadow-black/10 light:shadow-gray-200/50 flex flex-col items-center text-center"
              >
                <div className="w-12 h-12 rounded-lg bg-[#06B6D4]/10 border border-[#06B6D4]/20 flex items-center justify-center mb-4">
                  <item.icon className="w-6 h-6 text-[#06B6D4]" aria-hidden="true" />
                </div>

                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 light:text-gray-500 mb-2">Before</span>
                <p className="text-sm text-gray-300 light:text-gray-700 mb-3">{item.before}</p>

                <ArrowDown className="w-4 h-4 text-[#06B6D4]/60 mb-1" aria-hidden="true" />
                <p className="text-xs text-[#06B6D4] light:text-teal-600 mb-1 font-medium">{item.process}</p>
                <ArrowDown className="w-4 h-4 text-[#06B6D4]/60 mb-3" aria-hidden="true" />

                <span className="text-xs font-semibold uppercase tracking-wider text-[#F59E0B] light:text-amber-600 mb-2">After</span>
                <p className="text-sm text-white light:text-gray-900 font-medium">{item.after}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <div className="h-px bg-gradient-to-r from-transparent via-[#F59E0B]/20 light:via-gray-200 to-transparent" />

      {/* ============ 3. THE PLATFORM (4 Pillars) ============ */}
      <section className="py-20 md:py-28 px-4 relative z-10 bg-[#0A1020] light:bg-white">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0.15, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8 md:mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 text-white light:text-gray-900 text-pretty">
              One Platform. Four <span className="bg-gradient-to-r from-[#6366F1] to-[#7A5CFF] bg-clip-text text-transparent">Pillars</span>.
            </h2>
            <p className="text-gray-300 light:text-gray-600 max-w-2xl mx-auto">
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
                  className="h-full"
                >
                  <Link
                    href={pillar.href}
                    className="block h-full rounded-2xl bg-[#0F172A] light:bg-white border border-[#1E2A4A] light:border-gray-200 p-6 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/30 transition-all duration-200 cursor-pointer light:shadow-sm group flex flex-col"
                    style={{ borderTop: `3px solid ${pillar.color}` }}
                  >
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                      style={{ backgroundColor: `${pillar.color}15`, boxShadow: `0 4px 16px ${pillar.color}20` }}
                    >
                      <Icon className="w-6 h-6" style={{ color: pillar.color }} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-lg font-bold text-white light:text-gray-900 mb-2">{pillar.title}</h3>
                    <p className="text-sm text-gray-300 light:text-gray-600 mb-4 flex-1">{pillar.description}</p>
                    <span className="text-xs font-semibold group-hover:translate-x-1 transition-transform duration-200 inline-block" style={{ color: pillar.color }}>
                      Learn more →
                    </span>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <div className="h-px bg-gradient-to-r from-transparent via-[#F59E0B]/20 light:via-gray-200 to-transparent" />

      {/* ============ 4. HOW IT WORKS ============ */}
      <section className="py-20 md:py-28 px-4 relative z-10 bg-[#060B18] light:bg-gray-50">
        <div className="max-w-6xl mx-auto bg-[#0A1020] light:bg-white backdrop-blur-sm border border-[#1E2A4A] light:border-gray-200 rounded-3xl p-8 md:p-12 light:shadow-md">
          <motion.div
            initial={{ opacity: 0.15, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8 md:mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 text-white light:text-gray-900 text-pretty">
              From Call to <span className="bg-gradient-to-r from-[#6366F1] to-[#7A5CFF] bg-clip-text text-transparent">Pipeline Automation</span> in Three Steps
            </h2>
            <p className="text-[#C0C8E0] light:text-gray-600 max-w-2xl mx-auto">
              Connect once. Have your meetings. Follow-ups, sequences, next steps, and CRM updates handle themselves.
            </p>
          </motion.div>

          <div className="relative">
            <div className="hidden md:block absolute top-24 left-[16.67%] right-[16.67%] h-0.5 bg-gradient-to-r from-[#6366F1] via-[#7A5CFF] to-[#FF9D2D] opacity-30" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  step: '01',
                  icon: <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path strokeLinecap="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" /></svg>,
                  title: 'Have Your Meeting',
                  description: 'Use Zoom, Teams, or Meet like you already do. ReplySequence captures the transcript automatically — no separate app to install.',
                  color: '#6366F1',
                },
                {
                  step: '02',
                  icon: <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" /></svg>,
                  title: 'AI Generates Everything',
                  description: 'Personalized follow-up. Multi-step sequence. Next steps with due dates. Deal risk flags. CRM updates. All from the transcript, in seconds.',
                  color: '#06B6D4',
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
                      style={{ borderColor: `${item.color}50`, backgroundColor: `${item.color}10`, color: item.color, boxShadow: `0 0 30px ${item.color}20, 0 0 60px ${item.color}10` }}
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
                      <svg className="w-8 h-8 text-[#1E2A4A]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    </motion.div>
                  )}

                  <div className="text-center">
                    <h3 className="text-xl font-bold text-white light:text-gray-900 mb-3">{item.title}</h3>
                    <p className="text-[#C0C8E0] light:text-gray-600">{item.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="h-px bg-gradient-to-r from-transparent via-[#F59E0B]/20 light:via-gray-200 to-transparent" />

      {/* ============ 5. THE SYSTEM IN MOTION (Bento) ============ */}
      <section className="py-20 md:py-28 px-4 relative z-10 bg-[#0A1020] light:bg-white">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 text-white light:text-gray-900">
              What Happens After <span className="bg-gradient-to-r from-[#6366F1] to-[#7A5CFF] bg-clip-text text-transparent">Every Call</span>
            </h2>
            <p className="text-[#C0C8E0] light:text-gray-600 max-w-2xl mx-auto">
              After every meeting, six things happen automatically. Here is what the system produces.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Card 1: Follow-Up Draft — spans 2 cols to lead */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0, duration: 0.5 }}
              className="md:col-span-2 rounded-2xl bg-[#0F172A] light:bg-white border border-[#1E2A4A] light:border-gray-200 p-6 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/20 hover:border-white/20 transition-all duration-200"
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-[#06B6D4]" />
                <span className="text-xs font-semibold text-[#06B6D4] uppercase tracking-wider">AI Draft</span>
              </div>
              <div className="rounded-lg bg-[#0A1020] light:bg-gray-50 border border-[#1E2A4A] light:border-gray-200 p-4 mb-4">
                <p className="text-xs text-[#8892B0] light:text-gray-400 mb-1">Subject:</p>
                <p className="text-sm font-medium text-[#E8ECF4] light:text-gray-900 mb-3">Great connecting — proposal and pricing follow-up</p>
                <p className="text-xs text-[#C0C8E0] light:text-gray-600 leading-relaxed">Hi Sarah, great speaking with you today. As discussed, I wanted to follow up on the proposal review we have planned for next week...</p>
              </div>
              <h3 className="text-base font-bold text-white light:text-gray-900 mb-1">Personalized Follow-Up</h3>
              <p className="text-sm text-[#8892B0] light:text-gray-500">References the real conversation, not a generic template.</p>
            </motion.div>

            {/* Card 2: Sequence Progression */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1, duration: 0.5 }}
              className="rounded-2xl bg-[#0F172A] light:bg-white border border-[#1E2A4A] light:border-gray-200 p-6 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/20 hover:border-white/20 transition-all duration-200"
            >
              <p className="text-[10px] uppercase text-white/40 mb-2 tracking-wider">Execution</p>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-[#6366F1]" />
                <span className="text-xs font-semibold text-[#6366F1] uppercase tracking-wider">Sequence</span>
              </div>
              <div className="space-y-3 mb-4">
                {[
                  { step: 1, label: 'Personalized follow-up', status: 'Sent', color: '#22C55E' },
                  { step: 2, label: 'Value-add check-in', status: '+3 days', color: '#6366F1' },
                  { step: 3, label: 'Decision nudge', status: '+7 days', color: '#8892B0' },
                ].map((s) => (
                  <div key={s.step} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ backgroundColor: `${s.color}20`, color: s.color }}>{s.step}</div>
                    <span className="text-sm text-[#C0C8E0] light:text-gray-600 flex-1">{s.label}</span>
                    <span className="text-xs font-medium" style={{ color: s.color }}>{s.status}</span>
                  </div>
                ))}
              </div>
              <h3 className="text-base font-bold text-white light:text-gray-900 mb-1">Multi-Step Sequences</h3>
              <p className="text-sm text-[#8892B0] light:text-gray-500">Keeps deals warm automatically after every call.</p>
            </motion.div>

            {/* Card 3: Next Steps */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2, duration: 0.5 }}
              className="rounded-2xl bg-[#0F172A] light:bg-white border border-[#1E2A4A] light:border-gray-200 p-6 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/20 hover:border-white/20 transition-all duration-200"
            >
              <p className="text-[10px] uppercase text-white/40 mb-2 tracking-wider">Execution</p>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-[#06B6D4]" />
                <span className="text-xs font-semibold text-[#06B6D4] uppercase tracking-wider">Next Steps</span>
              </div>
              <div className="space-y-2.5 mb-4">
                {[
                  { task: 'Send pricing proposal', owner: 'Sarah', due: 'Mar 22', overdue: false },
                  { task: 'Schedule technical review', owner: 'Mike', due: 'Mar 25', overdue: false },
                  { task: 'Share case studies', owner: 'You', due: 'Mar 20', overdue: true },
                ].map((item) => (
                  <div key={item.task} className="flex items-center gap-2 rounded-lg bg-[#0A1020] light:bg-gray-50 border border-[#1E2A4A] light:border-gray-200 px-3 py-2">
                    <CheckCircle2 className={`w-3.5 h-3.5 flex-shrink-0 ${item.overdue ? 'text-[#F59E0B]' : 'text-[#06B6D4]'}`} />
                    <span className="text-xs text-[#E8ECF4] light:text-gray-900 flex-1 truncate">{item.task}</span>
                    <span className="text-[10px] text-[#8892B0] light:text-gray-500">{item.owner}</span>
                    <span className={`text-[10px] font-medium ${item.overdue ? 'text-[#F59E0B]' : 'text-[#8892B0] light:text-gray-400'}`}>{item.due}</span>
                  </div>
                ))}
              </div>
              <h3 className="text-base font-bold text-white light:text-gray-900 mb-1">Tracked Commitments</h3>
              <p className="text-sm text-[#8892B0] light:text-gray-500">Owners, due dates, and overdue reminders — extracted from the call.</p>
            </motion.div>

            {/* Card 4: Deal Risk Flags */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3, duration: 0.5 }}
              className="rounded-2xl bg-[#0F172A] light:bg-white border border-[#1E2A4A] light:border-gray-200 p-6 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/20 hover:border-white/20 transition-all duration-200"
            >
              <p className="text-[10px] uppercase text-white/40 mb-2 tracking-wider">Intelligence</p>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-[#F59E0B]" />
                <span className="text-xs font-semibold text-[#F59E0B] uppercase tracking-wider">Risk Flags</span>
              </div>
              <div className="space-y-2.5 mb-4">
                {[
                  { risk: 'Budget', detail: 'CFO pushing to next quarter', severity: 'high' },
                  { risk: 'Champion', detail: 'Main contact went silent', severity: 'critical' },
                  { risk: 'Timeline', detail: 'Implementation deadline moved', severity: 'medium' },
                ].map((alert) => (
                  <div key={alert.risk} className={`flex items-start gap-2.5 rounded-lg px-3 py-2 ${alert.severity === 'critical' ? 'bg-red-500/10 border border-red-500/20' : alert.severity === 'high' ? 'bg-[#F59E0B]/10 border border-[#F59E0B]/20' : 'bg-yellow-500/10 border border-yellow-500/20'}`}>
                    <span className={`text-xs font-bold uppercase mt-0.5 ${alert.severity === 'critical' ? 'text-red-400' : 'text-[#F59E0B]'}`}>{alert.risk}</span>
                    <span className="text-xs text-[#C0C8E0] light:text-gray-600">{alert.detail}</span>
                  </div>
                ))}
              </div>
              <h3 className="text-base font-bold text-white light:text-gray-900 mb-1">Deal Risk Detection</h3>
              <p className="text-sm text-[#8892B0] light:text-gray-500">BANT gaps flagged before they cost you the deal.</p>
            </motion.div>

            {/* Card 5: CRM Sync */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.4, duration: 0.5 }}
              className="rounded-2xl bg-[#0F172A] light:bg-white border border-[#1E2A4A] light:border-gray-200 p-6 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/20 hover:border-white/20 transition-all duration-200"
            >
              <p className="text-[10px] uppercase text-white/40 mb-2 tracking-wider">Intelligence</p>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-[#06B6D4]" />
                <span className="text-xs font-semibold text-[#06B6D4] uppercase tracking-wider">CRM Sync</span>
              </div>
              <div className="space-y-2.5 mb-4">
                {[
                  { contact: 'Sarah Chen', action: 'Summary + next steps synced', crm: 'HubSpot', color: '#FF7A59' },
                  { contact: 'Mike Johnson', action: 'Deal health updated', crm: 'Salesforce', color: '#00A1E0' },
                  { contact: 'Emily Davis', action: 'Risk alert logged', crm: 'Sheets', color: '#34A853' },
                ].map((item) => (
                  <div key={item.contact} className="flex items-center gap-2 rounded-lg bg-[#0A1020] light:bg-gray-50 border border-[#1E2A4A] light:border-gray-200 px-3 py-2">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-xs font-medium text-[#E8ECF4] light:text-gray-900">{item.contact}</span>
                    <span className="text-[10px] text-[#8892B0] light:text-gray-500 flex-1 text-right truncate">{item.action}</span>
                  </div>
                ))}
              </div>
              <h3 className="text-base font-bold text-white light:text-gray-900 mb-1">Automatic CRM Updates</h3>
              <p className="text-sm text-[#8892B0] light:text-gray-500">HubSpot, Salesforce, and Sheets — synced after every call.</p>
            </motion.div>

            {/* Card 6: Meeting Briefing */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.5, duration: 0.5 }}
              className="rounded-2xl bg-[#0F172A] light:bg-white border border-[#1E2A4A] light:border-gray-200 p-6 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/20 hover:border-white/20 transition-all duration-200"
            >
              <p className="text-[10px] uppercase text-white/40 mb-2 tracking-wider">Intelligence</p>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-[#6366F1]" />
                <span className="text-xs font-semibold text-[#6366F1] uppercase tracking-wider">Briefing</span>
              </div>
              <div className="rounded-lg bg-[#0A1020] light:bg-gray-50 border border-[#1E2A4A] light:border-gray-200 p-4 mb-4">
                <p className="text-xs font-semibold text-[#E8ECF4] light:text-gray-900 mb-2">Pre-Meeting Brief: Acme Corp</p>
                <div className="space-y-1.5 text-xs text-[#C0C8E0] light:text-gray-600">
                  <p className="flex items-center gap-2"><span className="text-[#06B6D4]">Last call:</span> Mar 16 — Pricing discussion</p>
                  <p className="flex items-center gap-2"><span className="text-[#F59E0B]">Open risk:</span> Budget not confirmed</p>
                  <p className="flex items-center gap-2"><span className="text-[#06B6D4]">Next step:</span> Send revised proposal</p>
                </div>
              </div>
              <h3 className="text-base font-bold text-white light:text-gray-900 mb-1">Pre-Meeting Briefings</h3>
              <p className="text-sm text-[#8892B0] light:text-gray-500">Walk into every call knowing the context, risks, and open items.</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ============ 6. SOCIAL PROOF STATS ============ */}
      <section className="py-20 md:py-28 px-4 relative z-10 bg-[#060B18] light:bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0.15, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-10 md:mb-14"
          >
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 text-white light:text-gray-900 text-pretty">
              Built for Teams That <span className="bg-gradient-to-r from-[#F59E0B] to-[#FDE047] bg-clip-text text-transparent">Follow Up Fast</span>
            </h2>
            <p className="text-gray-400 light:text-gray-500 max-w-lg mx-auto">
              The numbers that define the follow-up problem — and why automation wins.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
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
                transition={{ delay: index * 0.15, duration: 0.5 }}
                className="rounded-2xl bg-[#131c2f] light:bg-white border border-[#1E2A4A] light:border-gray-200 p-8 sm:p-10 text-center light:shadow-md hover:-translate-y-1 hover:scale-[1.02] hover:border-white/20 light:hover:border-gray-300 transition-all duration-200"
              >
                <span
                  className="text-7xl font-extrabold bg-gradient-to-b from-amber-300 to-[#F59E0B] light:from-[#D97706] light:to-[#F59E0B] bg-clip-text text-transparent block mb-4"
                  style={{ filter: 'drop-shadow(0 0 25px rgba(245,158,11,0.4))', WebkitTextStroke: '0' }}
                >{item.stat}</span>
                <p className="text-base text-gray-200 light:text-gray-700 mb-1 font-semibold">{item.highlight}</p>
                <p className="text-sm text-gray-400 light:text-gray-500">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ 7. CTA ============ */}
      <section id="waitlist" className="py-20 md:py-28 px-4 relative z-10 overflow-hidden bg-[#0A1020] light:bg-white">
        {/* Amber glow orb */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] rounded-full pointer-events-none light:hidden" style={{ background: 'radial-gradient(ellipse at center, rgba(245,158,11,0.07) 0%, transparent 55%)' }} />

        <div className="max-w-3xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0.15, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            {/* Value recap — what you get */}
            <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
              {[
                { label: 'AI Follow-Ups', color: '#06B6D4' },
                { label: 'Multi-Step Sequences', color: '#06B6D4' },
                { label: 'Next-Step Tracking', color: '#06B6D4' },
                { label: 'Deal Risk Alerts', color: '#F59E0B' },
                { label: 'CRM Sync', color: '#06B6D4' },
              ].map((item) => (
                <span
                  key={item.label}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border"
                  style={{ color: item.color, borderColor: `${item.color}30`, backgroundColor: `${item.color}08` }}
                >
                  <CheckCircle2 className="w-3 h-3" />
                  {item.label}
                </span>
              ))}
            </div>

            <p className="text-sm text-amber-400 text-center mb-3">
              Every hour you wait lowers your chance of closing.
            </p>
            <h2 className="text-center text-3xl md:text-5xl font-extrabold tracking-tight mb-5 text-white light:text-gray-900 text-pretty leading-tight">
              Stop Losing Deals to <span className="bg-gradient-to-r from-[#F59E0B] to-[#FDE047] bg-clip-text text-transparent">Slow Follow-Ups</span>.
            </h2>
            <p className="text-center text-lg text-[#C0C8E0] light:text-gray-600 mb-10 max-w-2xl mx-auto">
              5 free AI drafts. No credit card. Connect Zoom, Teams, or Meet and get your first automated follow-up in under 5 minutes.
            </p>

            <div className="rounded-2xl border border-amber-500/20 bg-[#0F172A] light:bg-white light:border-gray-200 light:shadow-lg p-6 sm:p-10 shadow-[0_0_40px_rgba(251,191,36,0.15)] light:shadow-gray-200/50">
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
