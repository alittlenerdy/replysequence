'use client';

import { useRef, useState, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import {
  Check,
  X,
  Zap,
  ArrowRight,
  Sparkles,
  Clock,
  DollarSign,
  Shield,
  Trophy,
  Timer,
  AlertTriangle,
  Brain,
  Mail,
  TrendingDown,
} from 'lucide-react';

// Static particle positions - deterministic to avoid hydration mismatch
const STATIC_PARTICLES = [
  { left: 8, top: 15, xMove: -6, duration: 3.4, delay: 0.2 },
  { left: 28, top: 55, xMove: -4, duration: 5.2, delay: 1.3 },
  { left: 48, top: 72, xMove: -8, duration: 6.1, delay: 1.7 },
  { left: 68, top: 85, xMove: -3, duration: 5.7, delay: 1.1 },
  { left: 88, top: 62, xMove: -7, duration: 4.9, delay: 1.5 },
  { left: 12, top: 78, xMove: 6, duration: 4.1, delay: 1.8 },
  { left: 52, top: 92, xMove: 3, duration: 3.7, delay: 1.2 },
  { left: 92, top: 68, xMove: 2, duration: 6.3, delay: 1.4 },
];

// Floating particles for hero - deterministic to avoid hydration mismatch
function FloatingParticles() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none transition-opacity duration-700 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
      {STATIC_PARTICLES.map((particle, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 light:w-2 light:h-2 bg-indigo-400/30 light:bg-indigo-500/40 rounded-full"
          style={{
            left: `${particle.left}%`,
            top: `${particle.top}%`,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, particle.xMove, 0],
            opacity: [0.2, 0.5, 0.2],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

// Animated section wrapper
function AnimatedSection({
  children,
  className = '',
  delay = 0
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.6, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Stagger container for lists
const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

interface ComparisonRow {
  feature: string;
  replysequence: string | boolean;
  manual: string | boolean;
  winner?: 'replysequence' | 'manual' | 'tie';
  category?: string;
}

const comparisonData: ComparisonRow[] = [
  // Speed & Consistency
  { feature: 'Time to Send Follow-Up', replysequence: '8 seconds', manual: '23+ minutes', winner: 'replysequence', category: 'Speed & Consistency' },
  { feature: 'Every Meeting Gets a Follow-Up', replysequence: true, manual: '44% get skipped', winner: 'replysequence', category: 'Speed & Consistency' },
  { feature: 'Follow-Up Within 5 Minutes', replysequence: true, manual: 'Rarely', winner: 'replysequence', category: 'Speed & Consistency' },
  { feature: 'Works Across All Platforms', replysequence: 'Zoom, Teams, Meet', manual: 'Depends on notes', winner: 'replysequence', category: 'Speed & Consistency' },
  { feature: 'No Context Switching', replysequence: true, manual: false, winner: 'replysequence', category: 'Speed & Consistency' },
  // Quality & Personalization
  { feature: 'Personalized to Conversation', replysequence: 'AI from transcript', manual: 'Depends on memory', winner: 'replysequence', category: 'Quality & Personalization' },
  { feature: 'Captures All Action Items', replysequence: true, manual: 'Often missed', winner: 'replysequence', category: 'Quality & Personalization' },
  { feature: 'Consistent Professional Tone', replysequence: true, manual: 'Varies by rep', winner: 'replysequence', category: 'Quality & Personalization' },
  { feature: 'Custom Templates', replysequence: true, manual: 'Copy-paste templates', winner: 'replysequence', category: 'Quality & Personalization' },
  { feature: 'Human Review Before Sending', replysequence: true, manual: true, winner: 'tie', category: 'Quality & Personalization' },
  // Workflow & Integration
  { feature: 'CRM Auto-Sync', replysequence: true, manual: 'Manual entry', winner: 'replysequence', category: 'Workflow & Integration' },
  { feature: 'No Note-Taking Required', replysequence: true, manual: false, winner: 'replysequence', category: 'Workflow & Integration' },
  { feature: 'Works While You Move to Next Call', replysequence: true, manual: false, winner: 'replysequence', category: 'Workflow & Integration' },
  { feature: 'Transcript-Based Accuracy', replysequence: true, manual: 'Memory-based', winner: 'replysequence', category: 'Workflow & Integration' },
  // Cost
  { feature: 'Monthly Cost', replysequence: '$19/mo', manual: '$0 (tool cost)', winner: 'manual', category: 'Cost Analysis' },
  { feature: 'Time Cost Per Follow-Up', replysequence: '~0 minutes', manual: '23 minutes', winner: 'replysequence', category: 'Cost Analysis' },
  { feature: 'Monthly Time Investment (20 calls)', replysequence: '~3 minutes', manual: '7.6 hours', winner: 'replysequence', category: 'Cost Analysis' },
  { feature: 'Revenue Lost to Missed Follow-Ups', replysequence: 'Near zero', manual: 'Significant', winner: 'replysequence', category: 'Cost Analysis' },
];

const keyDifferences = [
  {
    icon: Timer,
    title: '8 Seconds vs 23 Minutes',
    description: 'The average sales rep spends 23 minutes crafting a follow-up after a meeting. Reviewing notes, recalling details, writing, editing, and formatting. ReplySequence reads the full transcript and generates a follow-up, triggers a multi-step sequence, extracts next steps with due dates, and flags deal risks -- all in 8 seconds.',
    stat: '172x faster',
    advantage: 'replysequence' as const,
  },
  {
    icon: AlertTriangle,
    title: '44% of Follow-Ups Never Happen',
    description: 'Nearly half of sales reps never send a follow-up after a meeting. Not because they don\'t want to, but because they get pulled into the next call, the next meeting, the next fire. ReplySequence makes it automatic -- every meeting gets a follow-up, a sequence, next-step reminders, and deal health tracking.',
    stat: '0% missed',
    advantage: 'replysequence' as const,
  },
  {
    icon: Brain,
    title: 'Transcript vs Memory',
    description: 'Manual follow-ups rely on what you remember. After back-to-back calls, details blur together. ReplySequence reads the complete transcript -- every action item, every commitment, every name -- and extracts next steps with due dates, scores deal health, and alerts you to risks so nothing falls through the cracks.',
    stat: '100% recall',
    advantage: 'replysequence' as const,
  },
  {
    icon: DollarSign,
    title: 'The Real Cost of "Free"',
    description: 'Manual follow-ups cost $0 in tools but burn 7.6 hours per month on just 20 calls. At a $75/hr sales rep cost, that\'s $570/month in time -- 30x the cost of ReplySequence. Plus the deals lost to slow follow-ups, missed next steps, and risks you never saw coming.',
    stat: '$570 saved',
    advantage: 'replysequence' as const,
  },
];

const timelineSteps = [
  {
    manual: { time: '0:00', action: 'Meeting ends', detail: 'Open notes app, try to recall key points' },
    replysequence: { time: '0:00', action: 'Meeting ends', detail: 'Transcript automatically processed' },
  },
  {
    manual: { time: '0:05', action: 'Review notes', detail: 'Scan through messy meeting notes' },
    replysequence: { time: '0:08', action: 'AI draft ready', detail: 'Follow-up, sequence, and next steps in your inbox' },
  },
  {
    manual: { time: '5:00', action: 'Start writing', detail: 'Open email, stare at blank compose window' },
    replysequence: { time: '0:30', action: 'Review and send', detail: 'Quick edit if needed, sequence auto-schedules' },
  },
  {
    manual: { time: '15:00', action: 'Still writing', detail: 'Trying to sound professional, recalling details' },
    replysequence: { time: '1:00', action: 'Done', detail: 'Sequence running, next steps tracked, CRM synced' },
  },
  {
    manual: { time: '23:00', action: 'Finally sent', detail: 'Hope you didn\'t forget anything important' },
    replysequence: { time: '1:00', action: 'Still done', detail: 'Prospect already read your email' },
  },
];

function FeatureValue({ value, isWinner }: { value: string | boolean; isWinner: boolean }) {
  if (typeof value === 'boolean') {
    return value ? (
      <motion.div
        className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${isWinner ? 'bg-indigo-500/20' : 'bg-gray-700/50 light:bg-gray-200'}`}
        whileHover={{ scale: 1.1 }}
      >
        <Check className={`w-5 h-5 ${isWinner ? 'text-indigo-400' : 'text-gray-400 light:text-gray-500'}`} />
      </motion.div>
    ) : (
      <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-800/50 light:bg-gray-100">
        <X className="w-5 h-5 text-gray-600 light:text-gray-400" />
      </div>
    );
  }
  return (
    <span className={`text-xs sm:text-sm font-medium ${isWinner ? 'text-white light:text-gray-900' : 'text-gray-400 light:text-gray-500'}`}>
      {value}
    </span>
  );
}

export default function ManualComparisonPage() {
  const categories = [...new Set(comparisonData.map(row => row.category))];

  return (
    <div className="min-h-screen bg-[#0a0a0f] light:bg-white">
      <Header />
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 light:from-indigo-400/10 via-transparent to-transparent" />
        <motion.div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-indigo-500/10 light:bg-indigo-400/20 rounded-full blur-[120px]"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <FloatingParticles />

        <div className="relative max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-indigo-500/20 to-indigo-700/20 border border-indigo-500/30 text-indigo-300 light:text-indigo-600 text-sm font-medium mb-8"
          >
            <Sparkles className="w-4 h-4" />
            The Case for Automation
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="inline-flex items-center gap-3 mb-6"
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold text-white" style={{ backgroundColor: '#6B7280' }}>M</div>
            <span className="text-lg font-medium text-gray-400">vs</span>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden bg-indigo-600">
              <span className="text-xl font-bold text-white">RS</span>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight"
          >
            <span className="text-white light:text-gray-900">ReplySequence</span>
            <span className="text-gray-500 mx-2 sm:mx-3">vs</span>
            <span className="text-gray-400 light:text-gray-500">Manual Follow-Up</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg sm:text-xl md:text-2xl text-gray-400 light:text-gray-500 max-w-3xl mx-auto mb-8"
          >
            You already know you should follow up faster.{' '}
            <span className="text-white light:text-gray-900">The question is whether you can afford to keep doing it by hand.</span>
          </motion.p>

          {/* The problem statement */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="max-w-3xl mx-auto mb-12 p-5 rounded-2xl bg-gray-900/60 light:bg-indigo-50/80 border border-gray-700/50 light:border-indigo-200"
          >
            <p className="text-xs font-semibold text-gray-500 light:text-indigo-500 uppercase tracking-wider mb-3">The reality</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-400 light:text-gray-500 mb-1">Manual Process</p>
                <p className="text-sm text-gray-300 light:text-gray-600">23 minutes per email. 44% never sent. Details forgotten between calls.</p>
              </div>
              <div>
                <p className="text-sm font-medium text-indigo-400 light:text-indigo-600 mb-1">ReplySequence</p>
                <p className="text-sm text-gray-300 light:text-gray-600">8-second AI drafts, multi-step sequences, next-step extraction, deal risk alerts, and CRM sync. Every meeting, every time.</p>
              </div>
            </div>
          </motion.div>

          {/* Quick verdict cards */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto"
          >
            <motion.div
              whileHover={{ scale: 1.02, y: -4 }}
              transition={{ type: 'spring', stiffness: 300 }}
              className="relative p-8 rounded-2xl bg-gradient-to-br from-indigo-500/10 via-indigo-400/5 to-indigo-600/10 border-2 border-indigo-500/50 overflow-hidden group shadow-xl shadow-indigo-500/20"
              style={{ boxShadow: '0 0 40px rgba(59, 130, 246, 0.15), inset 0 1px 0 rgba(255,255,255,0.1)' }}
            >
              {/* Shine effect on hover */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 opacity-0 group-hover:opacity-100"
                initial={{ x: '-200%' }}
                whileHover={{ x: '200%' }}
                transition={{ duration: 0.6 }}
              />
              <motion.div
                className="absolute top-4 right-4"
                animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                <Trophy className="w-6 h-6 text-indigo-400 drop-shadow-lg" />
              </motion.div>
              <h2 className="text-xl font-bold text-white light:text-gray-900 mb-3">Switch to ReplySequence if...</h2>
              <ul className="text-gray-300 light:text-gray-600 leading-relaxed space-y-2 text-sm">
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" /> You have more than 5 meetings a week</li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" /> Follow-ups, next steps, or deal risks slip through the cracks</li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" /> You want personalized follow-ups, automated sequences, and deal intelligence</li>
              </ul>
              <div className="mt-5 space-y-1">
                <div className="flex items-center gap-2 text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-indigo-500 font-medium text-sm">
                  <Zap className="w-4 h-4 text-indigo-400" />
                  Anyone who takes sales calls
                </div>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02, y: -4 }}
              transition={{ type: 'spring', stiffness: 300 }}
              className="relative p-8 rounded-2xl bg-gray-900/50 light:bg-gradient-to-br light:from-slate-50 light:to-indigo-50 border border-gray-700 light:border-indigo-200 overflow-hidden group"
            >
              <h2 className="text-xl font-bold text-gray-200 light:text-gray-800 mb-3">Keep manual follow-ups if...</h2>
              <ul className="text-gray-400 light:text-gray-600 leading-relaxed space-y-2 text-sm">
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" /> You have fewer than 2 meetings a week</li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" /> You enjoy crafting each email from scratch</li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" /> Follow-up speed isn&apos;t a competitive advantage in your role</li>
              </ul>
              <div className="mt-5 flex items-center gap-2 text-gray-400 light:text-indigo-600 font-medium text-sm">
                <Clock className="w-4 h-4" />
                Best for: Very low meeting volume, non-sales roles
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats Banner */}
      <AnimatedSection className="py-10 px-4 border-y border-indigo-500/20 bg-gradient-to-r from-indigo-500/5 via-indigo-500/5 to-amber-500/5 relative">
        {/* Background glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-transparent to-indigo-500/10 pointer-events-none" />
        <div className="max-w-5xl mx-auto relative">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
          >
            {[
              { value: '8 sec', label: 'vs 23 min per follow-up', gradient: 'from-indigo-400 to-indigo-600' },
              { value: '44%', label: 'of manual follow-ups skipped', gradient: 'from-red-400 to-amber-400' },
              { value: '7.6 hrs', label: 'saved per month (20 calls)', gradient: 'from-amber-400 to-amber-500' },
              { value: '$570', label: 'monthly time cost saved', gradient: 'from-indigo-400 to-indigo-600' },
            ].map((stat, i) => (
              <motion.div key={i} variants={staggerItem} className="relative">
                <motion.div
                  className={`text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r ${stat.gradient} mb-1`}
                  initial={{ scale: 0.5 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ type: 'spring', stiffness: 200, delay: i * 0.1 }}
                >
                  {stat.value}
                </motion.div>
                <div className="text-sm text-gray-400 light:text-gray-500">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </AnimatedSection>

      {/* Timeline Comparison */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <AnimatedSection className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white light:text-gray-900 mb-4">After the Call Ends</h2>
            <p className="text-gray-400 light:text-gray-500 text-lg max-w-2xl mx-auto">
              A side-by-side look at what happens in the minutes after your meeting
            </p>
          </AnimatedSection>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="space-y-4"
          >
            {/* Timeline header */}
            <div className="grid grid-cols-[80px_1fr_1fr] gap-4 px-4 pb-2">
              <div />
              <div className="text-center text-sm font-bold text-indigo-400 light:text-indigo-600">ReplySequence</div>
              <div className="text-center text-sm font-bold text-gray-400 light:text-gray-500">Manual Process</div>
            </div>

            {timelineSteps.map((step, index) => (
              <motion.div
                key={index}
                variants={staggerItem}
                className="grid grid-cols-[80px_1fr_1fr] gap-4 items-center"
              >
                {/* Time marker */}
                <div className="text-right">
                  <span className="text-xs font-mono text-gray-500">{step.manual.time}</span>
                </div>

                {/* ReplySequence side */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className={`p-4 rounded-xl border ${
                    index <= 2
                      ? 'bg-gradient-to-r from-indigo-500/10 via-indigo-400/5 to-transparent border-indigo-500/30 light:from-indigo-50 light:border-indigo-200'
                      : 'bg-gray-900/20 light:bg-gray-50 border-gray-800/50 light:border-gray-200'
                  }`}
                >
                  <p className="text-sm font-medium text-white light:text-gray-900">{step.replysequence.action}</p>
                  <p className="text-xs text-gray-400 light:text-gray-500 mt-1">{step.replysequence.detail}</p>
                </motion.div>

                {/* Manual side */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className={`p-4 rounded-xl border ${
                    index >= 3
                      ? 'bg-red-500/5 border-red-500/20 light:bg-red-50/50 light:border-red-200'
                      : 'bg-gray-900/30 light:bg-gray-50 border-gray-800/50 light:border-gray-200'
                  }`}
                >
                  <p className="text-sm font-medium text-gray-300 light:text-gray-700">{step.manual.action}</p>
                  <p className="text-xs text-gray-500 mt-1">{step.manual.detail}</p>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Feature Comparison */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <AnimatedSection className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white light:text-gray-900 mb-4">Feature Comparison</h2>
            <p className="text-gray-400 light:text-gray-500 text-lg max-w-2xl mx-auto">
              What you gain by switching from manual follow-ups to ReplySequence
            </p>
          </AnimatedSection>

          {/* Comparison Header */}
          <div className="sticky top-0 z-10 bg-[#0a0a0f]/95 light:bg-gradient-to-r light:from-indigo-50/95 light:to-indigo-50/95 backdrop-blur-sm border-b border-gray-800 light:border-indigo-200 mb-4">
            <div className="grid grid-cols-[2fr_1fr_1fr] sm:grid-cols-3 py-3 sm:py-4">
              <div className="text-gray-500 light:text-indigo-600 font-medium pl-4">Feature</div>
              <div className="text-center">
                <span className="text-indigo-400 light:text-indigo-600 font-bold text-sm sm:text-lg">ReplySequence</span>
              </div>
              <div className="text-center">
                <span className="text-gray-400 light:text-slate-600 font-bold text-sm sm:text-lg">Manual</span>
              </div>
            </div>
          </div>

          {/* Grouped Features */}
          {categories.map((category, catIndex) => (
            <AnimatedSection key={category} delay={catIndex * 0.1} className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-700 light:via-indigo-200 to-transparent" />
                <span className="text-xs font-semibold text-gray-500 light:text-indigo-500 uppercase tracking-wider">{category}</span>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-700 light:via-indigo-200 to-transparent" />
              </div>

              <motion.div
                variants={staggerContainer}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                className="space-y-2"
              >
                {comparisonData
                  .filter((row) => row.category === category)
                  .map((row, index) => (
                    <motion.div
                      key={index}
                      variants={staggerItem}
                      whileHover={{ scale: 1.01, x: 4 }}
                      className={`grid grid-cols-[2fr_1fr_1fr] sm:grid-cols-3 items-center py-3 px-3 sm:py-4 sm:px-4 rounded-xl transition-colors duration-200 ${
                        row.winner === 'replysequence'
                          ? 'bg-gradient-to-r from-indigo-500/10 via-indigo-400/5 to-transparent hover:from-indigo-500/15 hover:via-indigo-400/10 light:from-indigo-100/80 light:via-indigo-50/60 light:to-transparent light:hover:from-indigo-100 light:hover:via-indigo-50/80 border-l-2 border-l-indigo-500 border border-indigo-500/30 light:border-indigo-300 shadow-lg shadow-indigo-500/5 light:shadow-indigo-200/30'
                          : row.winner === 'manual'
                          ? 'bg-gray-800/30 light:bg-slate-50 hover:bg-gray-800/50 light:hover:bg-slate-100 border border-gray-700/50 light:border-slate-200'
                          : 'bg-gray-900/30 light:bg-indigo-50/30 hover:bg-gray-800/30 light:hover:bg-indigo-50/60 border border-gray-700/30 light:border-indigo-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs sm:text-sm text-gray-200 light:text-gray-800 font-medium">{row.feature}</span>
                        {row.winner === 'replysequence' && (
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="hidden sm:inline-flex px-2.5 py-1 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-700 text-white text-xs font-bold shadow-lg shadow-indigo-500/30"
                          >
                            Winner
                          </motion.span>
                        )}
                      </div>
                      <div className="flex justify-center">
                        <FeatureValue value={row.replysequence} isWinner={row.winner === 'replysequence' || row.winner === 'tie'} />
                      </div>
                      <div className="flex justify-center">
                        <FeatureValue value={row.manual} isWinner={row.winner === 'manual'} />
                      </div>
                    </motion.div>
                  ))}
              </motion.div>
            </AnimatedSection>
          ))}
        </div>
      </section>

      {/* Key Differences */}
      <section className="py-20 px-4 bg-gradient-to-b from-gray-900/50 light:from-indigo-50/50 to-transparent">
        <div className="max-w-5xl mx-auto">
          <AnimatedSection className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white light:text-gray-900 mb-4">Why Reps Switch</h2>
            <p className="text-gray-400 light:text-gray-500 text-lg max-w-2xl mx-auto">
              The numbers behind the switch from manual to automated follow-ups
            </p>
          </AnimatedSection>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 gap-6"
          >
            {keyDifferences.map((diff, index) => (
              <motion.div
                key={index}
                variants={staggerItem}
                whileHover={{ scale: 1.02, y: -4 }}
                className="relative p-6 rounded-2xl border-2 overflow-hidden group bg-gradient-to-br from-indigo-500/10 via-indigo-400/5 to-indigo-600/10 light:from-indigo-50 light:via-indigo-50/50 light:to-amber-50 border-indigo-500/40 light:border-indigo-300 shadow-xl shadow-indigo-500/10 light:shadow-indigo-200/40"
                style={{ boxShadow: '0 0 30px rgba(59, 130, 246, 0.1), inset 0 1px 0 rgba(255,255,255,0.05)' }}
              >
                {/* Stat badge */}
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className="absolute top-4 right-4 px-3 py-1 rounded-full text-sm font-bold bg-indigo-500/20 light:bg-indigo-100 text-indigo-400 light:text-indigo-600"
                >
                  {diff.stat}
                </motion.div>

                <motion.div
                  whileHover={{ rotate: 5 }}
                  className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4 bg-indigo-500/20 light:bg-indigo-100 text-indigo-400 light:text-indigo-600"
                >
                  <diff.icon className="w-6 h-6" />
                </motion.div>

                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-lg font-bold text-white light:text-gray-900">{diff.title}</h3>
                </div>

                <p className="text-gray-400 light:text-gray-500 leading-relaxed">{diff.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Cost Calculator */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <AnimatedSection className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white light:text-gray-900 mb-4">The Math</h2>
            <p className="text-gray-400 light:text-gray-500 text-lg max-w-2xl mx-auto">
              What manual follow-ups actually cost your business
            </p>
          </AnimatedSection>

          <AnimatedSection>
            <motion.div
              whileHover={{ scale: 1.01 }}
              className="p-8 md:p-10 rounded-2xl bg-gray-900/50 light:bg-gradient-to-br light:from-indigo-50 light:to-amber-50 border border-gray-700 light:border-indigo-200"
            >
              <div className="grid md:grid-cols-2 gap-8">
                {/* Manual side */}
                <div>
                  <div className="flex items-center gap-2 mb-6">
                    <TrendingDown className="w-5 h-5 text-red-400" />
                    <h3 className="text-lg font-bold text-gray-300 light:text-gray-700">Manual Follow-Up Cost</h3>
                  </div>
                  <div className="space-y-4">
                    {[
                      { label: 'Meetings per month', value: '20' },
                      { label: 'Time per follow-up', value: '23 min' },
                      { label: 'Total time', value: '7.6 hours' },
                      { label: 'At $75/hr rep cost', value: '$570/month' },
                      { label: 'Follow-ups skipped (44%)', value: '~9 missed' },
                      { label: 'Revenue at risk', value: 'Incalculable' },
                    ].map((item, i) => (
                      <div key={i} className="flex justify-between items-center py-2 border-b border-gray-800 light:border-gray-200 last:border-0">
                        <span className="text-sm text-gray-400 light:text-gray-500">{item.label}</span>
                        <span className="text-sm font-semibold text-gray-200 light:text-gray-700">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* RS side */}
                <div>
                  <div className="flex items-center gap-2 mb-6">
                    <Mail className="w-5 h-5 text-indigo-400" />
                    <h3 className="text-lg font-bold text-indigo-400 light:text-indigo-600">ReplySequence Cost</h3>
                  </div>
                  <div className="space-y-4">
                    {[
                      { label: 'Meetings per month', value: '20' },
                      { label: 'Time per follow-up', value: '~8 seconds' },
                      { label: 'Total time', value: '~3 minutes' },
                      { label: 'Monthly subscription', value: '$19/month' },
                      { label: 'Follow-ups skipped', value: '0' },
                      { label: 'Net savings', value: '$551/month' },
                    ].map((item, i) => (
                      <div key={i} className="flex justify-between items-center py-2 border-b border-indigo-500/20 light:border-indigo-200 last:border-0">
                        <span className="text-sm text-gray-400 light:text-gray-500">{item.label}</span>
                        <span className="text-sm font-semibold text-indigo-300 light:text-indigo-600">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatedSection>
        </div>
      </section>

      {/* Bottom Line */}
      <AnimatedSection className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            whileHover={{ scale: 1.01 }}
            className="relative p-8 md:p-12 rounded-3xl bg-gradient-to-br from-gray-900 via-indigo-900/10 to-gray-900/50 light:from-white light:via-indigo-50 light:to-indigo-50 border-2 border-indigo-500/30 light:border-indigo-200 overflow-hidden shadow-2xl light:shadow-indigo-100/50"
            style={{ boxShadow: '0 0 60px rgba(59, 130, 246, 0.1), inset 0 1px 0 rgba(255,255,255,0.05)' }}
          >
            {/* Decorative elements */}
            <motion.div
              className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 light:bg-indigo-400/20 rounded-full blur-3xl"
              animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.6, 0.4] }}
              transition={{ duration: 6, repeat: Infinity }}
            />
            <motion.div
              className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/10 light:bg-indigo-400/20 rounded-full blur-3xl"
              animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 8, repeat: Infinity, delay: 1 }}
            />

            <div className="relative">
              <div className="flex items-center gap-3 mb-6">
                <motion.div
                  whileHover={{ rotate: 10 }}
                  className="p-3 rounded-xl bg-gradient-to-br from-indigo-500/20 to-indigo-700/20 light:from-indigo-100 light:to-indigo-100"
                >
                  <Shield className="w-6 h-6 text-indigo-400" />
                </motion.div>
                <h2 className="text-2xl md:text-3xl font-bold text-white light:text-gray-900">The Bottom Line</h2>
              </div>

              <div className="space-y-4 text-gray-300 light:text-gray-600 leading-relaxed mb-8">
                <p>
                  <strong className="text-white light:text-gray-900">Manual follow-ups</strong> work fine when you have
                  2-3 meetings a week and plenty of time between calls. But for anyone doing serious sales --
                  back-to-back calls, multiple prospects, tight timelines -- the manual approach breaks down fast.
                </p>
                <p>
                  <strong className="text-indigo-400">ReplySequence</strong> doesn&apos;t replace your judgment. You still
                  review every follow-up before it sends. It replaces the 23 minutes of staring at a blank compose
                  window, trying to remember what was said, and hoping you didn&apos;t miss an action item -- while also
                  scheduling multi-step sequences, extracting next steps with due dates, and alerting you to deal risks.
                </p>
                <p className="font-medium text-white light:text-gray-900">
                  Your time is better spent on the next conversation, not writing about the last one.
                </p>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                className="p-5 rounded-xl bg-gradient-to-r from-indigo-500/10 via-indigo-400/5 to-indigo-600/10 border border-indigo-500/30 shadow-lg shadow-indigo-500/5"
              >
                <p className="text-gray-300 light:text-gray-600 text-sm italic flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-amber-400">The speed advantage:</strong> Research shows that
                    responding within 5 minutes of a meeting makes you 21x more likely to qualify a lead than waiting 30 minutes.
                    ReplySequence puts you in that window every time.
                  </span>
                </p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </AnimatedSection>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-t from-indigo-500/10 via-indigo-500/5 light:from-indigo-50 light:via-indigo-50 to-transparent relative overflow-hidden">
        {/* Background glows */}
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-indigo-500/10 light:bg-indigo-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/10 light:bg-indigo-400/20 rounded-full blur-3xl pointer-events-none" />
        <AnimatedSection className="max-w-4xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold text-white light:text-gray-900 mb-6"
          >
            Stop Writing Follow-Ups.{' '}
            <span className="bg-gradient-to-r from-indigo-400 to-indigo-400 bg-clip-text text-transparent">
              Start Sending Them.
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-xl text-gray-400 light:text-gray-500 mb-10 max-w-2xl mx-auto"
          >
            Connect your Zoom, Teams, or Meet. Your next meeting&apos;s follow-up, sequence,
            and next steps will be waiting before you close the tab.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
              <Link
                href="/#waitlist"
                className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-white bg-gradient-to-r from-indigo-500 to-indigo-700 hover:from-indigo-400 hover:to-indigo-400 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-[background,box-shadow] duration-300"
              >
                Join the Waitlist
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
              <Link
                href="/compare"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-gray-300 light:text-indigo-700 bg-gray-800/80 light:bg-indigo-50 hover:bg-gray-700 light:hover:bg-indigo-100 border border-gray-700 light:border-indigo-300 hover:border-gray-600 light:hover:border-indigo-400 transition-[color,background-color,border-color] duration-300"
              >
                Compare to Other Tools
              </Link>
            </motion.div>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="text-gray-500 text-sm mt-8"
          >
            5 free AI drafts included. Sequences, next steps, and deal alerts built in. No credit card required.
          </motion.p>
        </AnimatedSection>
      </section>

      <Footer />

      {/* BreadcrumbList Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.replysequence.com" },
              { "@type": "ListItem", "position": 2, "name": "Compare", "item": "https://www.replysequence.com/compare" },
              { "@type": "ListItem", "position": 3, "name": "ReplySequence vs Manual Follow-Up", "item": "https://www.replysequence.com/compare/manual" }
            ]
          })
        }}
      />

      {/* FAQ Schema for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "How long does it take to write a meeting follow-up email manually?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "The average sales rep spends 23 minutes writing a follow-up after a meeting, including reviewing notes, drafting, and formatting. ReplySequence generates a ready-to-send follow-up in 8 seconds and also triggers a multi-step sequence, extracts next steps with due dates, scores deal health, and flags risks -- all automatically."
                }
              },
              {
                "@type": "Question",
                "name": "What percentage of sales follow-ups are never sent?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Research shows that approximately 44% of sales reps never send a follow-up email after a meeting. This is typically due to time constraints, context switching between calls, and competing priorities."
                }
              },
              {
                "@type": "Question",
                "name": "Does ReplySequence send emails automatically without review?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "No. ReplySequence generates AI-drafted follow-ups from your meeting transcript, but you always review and approve before sending. It also auto-generates multi-step sequences, extracts next steps with due dates, sends overdue reminders, and surfaces MEDDIC-based deal risk alerts -- all with full human review."
                }
              },
              {
                "@type": "Question",
                "name": "How much does manual follow-up cost compared to ReplySequence?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "For 20 meetings per month, manual follow-ups cost approximately $570/month in rep time (at $75/hr). ReplySequence costs $19/month and saves 7.6 hours of writing time, plus eliminates missed follow-ups. It also includes multi-step sequences, next-step tracking with overdue reminders, deal health scoring, and CRM auto-sync at no extra cost."
                }
              }
            ]
          })
        }}
      />
    </div>
  );
}
