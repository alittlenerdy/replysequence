'use client';

import { useRef, useState, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import Link from 'next/link';
import { WaitlistForm } from '@/components/landing/WaitlistForm';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import {
  Check,
  X,
  Zap,
  ArrowRight,
  Sparkles,
  MessageSquare,
  DollarSign,
  Shield,
  Trophy,
  Timer,
  BarChart3,
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
          className="absolute w-1 h-1 light:w-2 light:h-2 bg-[#6366F1]/30 light:bg-[#6366F1]/40 rounded-full"
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
  gong: string | boolean;
  winner?: 'replysequence' | 'gong' | 'tie';
  category?: string;
}

const comparisonData: ComparisonRow[] = [
  // Revenue & Follow-up
  { feature: 'Auto Follow-up Emails', replysequence: 'Core Focus', gong: false, winner: 'replysequence', category: 'Revenue & Follow-up' },
  { feature: 'Email Generation Speed', replysequence: '8 seconds', gong: 'N/A', winner: 'replysequence', category: 'Revenue & Follow-up' },
  { feature: 'One-Click Send', replysequence: true, gong: false, winner: 'replysequence', category: 'Revenue & Follow-up' },
  { feature: 'CRM Auto-Sync', replysequence: true, gong: true, winner: 'tie', category: 'Revenue & Follow-up' },
  { feature: 'Ask Your Meetings Anything', replysequence: true, gong: true, winner: 'tie', category: 'Revenue & Follow-up' },
  { feature: 'Custom Email Templates', replysequence: true, gong: false, winner: 'replysequence', category: 'Revenue & Follow-up' },
  { feature: 'Multi-Step Sequences', replysequence: true, gong: false, winner: 'replysequence', category: 'Revenue & Follow-up' },
  { feature: 'Next-Step Tracking', replysequence: true, gong: false, winner: 'replysequence', category: 'Revenue & Follow-up' },
  { feature: 'Deal Risk Alerts', replysequence: true, gong: true, winner: 'tie', category: 'Revenue & Follow-up' },
  // Analytics & Intelligence
  { feature: 'Conversation Analytics', replysequence: 'Basic', gong: 'Deep Analytics', winner: 'gong', category: 'Analytics & Intelligence' },
  { feature: 'Deal Health Scoring', replysequence: true, gong: true, winner: 'tie', category: 'Analytics & Intelligence' },
  { feature: 'Deal Intelligence', replysequence: false, gong: true, winner: 'gong', category: 'Analytics & Intelligence' },
  { feature: 'Pipeline Forecasting', replysequence: false, gong: true, winner: 'gong', category: 'Analytics & Intelligence' },
  { feature: 'Talk-to-Listen Ratios', replysequence: false, gong: true, winner: 'gong', category: 'Analytics & Intelligence' },
  { feature: 'Quality Scoring', replysequence: true, gong: true, winner: 'tie', category: 'Analytics & Intelligence' },
  // Integrations
  { feature: 'Zoom Integration', replysequence: true, gong: true, winner: 'tie', category: 'Integrations' },
  { feature: 'Google Meet Integration', replysequence: true, gong: true, winner: 'tie', category: 'Integrations' },
  { feature: 'Microsoft Teams Integration', replysequence: true, gong: true, winner: 'tie', category: 'Integrations' },
  { feature: 'Salesforce', replysequence: true, gong: true, winner: 'tie', category: 'Integrations' },
  { feature: 'HubSpot', replysequence: true, gong: true, winner: 'tie', category: 'Integrations' },
  // Accessibility
  { feature: 'Free Tier', replysequence: '5 drafts/mo', gong: 'No free tier', winner: 'replysequence', category: 'Accessibility' },
  { feature: 'Solo-Friendly Pricing', replysequence: '$19/mo', gong: '$100+/user/mo', winner: 'replysequence', category: 'Accessibility' },
  { feature: 'No Minimum Seats', replysequence: true, gong: 'Typically 5+', winner: 'replysequence', category: 'Accessibility' },
  { feature: 'Setup Time', replysequence: '2 minutes', gong: 'Weeks', winner: 'replysequence', category: 'Accessibility' },
];

const pricingComparison = [
  {
    tier: 'Free',
    replysequence: { price: '$0', period: '/mo', features: ['5 AI email drafts/month', 'Unlimited meetings', 'Next-step extraction'] },
    gong: { price: 'No free tier', period: '', features: ['Demo required', 'Annual contract only', 'Sales team consultation'] },
  },
  {
    tier: 'Pro / Growth',
    replysequence: { price: '$19', period: '/mo', features: ['Unlimited AI drafts & sequences', 'Deal risk alerts & health scoring', 'Next-step tracking with reminders', 'AI learns your writing style'] },
    gong: { price: '$100+', period: '/user/mo', features: ['Full platform access', 'Minimum seats required', 'Annual commitment', 'Implementation fee'] },
    highlighted: true,
  },
  {
    tier: 'Team / Enterprise',
    replysequence: { price: '$29', period: '/mo per user', features: ['Everything in Pro', 'CRM auto-sync (summaries, next steps, deal health)', 'Meeting intelligence across all calls', 'API access'] },
    gong: { price: 'Custom', period: ' pricing', features: ['Advanced analytics', 'Custom integrations', 'Dedicated support', 'Enterprise security'] },
  },
];

const keyDifferences = [
  {
    icon: Timer,
    title: 'Follow-Up Sequences in Seconds',
    description: 'ReplySequence generates personalized multi-step follow-up sequences, extracts next steps with due dates, and flags deal risks--all within seconds of your meeting ending.',
    stat: 'Auto',
    advantage: 'replysequence' as const,
  },
  {
    icon: DollarSign,
    title: 'Accessible Pricing',
    description: 'ReplySequence is $19/mo with no annual contract and no minimum seats. Gong typically costs $100-150+ per user per month with annual commitments and minimum seat requirements.',
    stat: '5x less',
    advantage: 'replysequence' as const,
  },
  {
    icon: MessageSquare,
    title: 'Conversation Intelligence',
    description: 'Gong provides deep conversation analytics--talk-to-listen ratios, topic tracking, competitive mention detection, and rep coaching insights across your entire team.',
    stat: 'Deep AI',
    advantage: 'gong' as const,
  },
  {
    icon: BarChart3,
    title: 'Enterprise Pipeline',
    description: 'Gong excels at deal risk scoring, pipeline forecasting, and multi-stakeholder tracking. Purpose-built for enterprise sales orgs managing complex deal cycles.',
    stat: 'Forecast',
    advantage: 'gong' as const,
  },
];

function FeatureValue({ value, isWinner }: { value: string | boolean; isWinner: boolean }) {
  if (typeof value === 'boolean') {
    return value ? (
      <motion.div
        className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${isWinner ? 'bg-[#6366F1]/20' : 'bg-gray-700/50 light:bg-gray-200'}`}
        whileHover={{ scale: 1.1 }}
      >
        <Check className={`w-5 h-5 ${isWinner ? 'text-[#6366F1]' : 'text-gray-400 light:text-gray-500'}`} />
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

export default function GongComparisonPage() {
  const categories = [...new Set(comparisonData.map(row => row.category))];

  return (
    <div className="min-h-screen bg-[#060B18] light:bg-white">
      <Header />
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#6366F1]/5 light:from-[#6366F1]/10 via-transparent to-transparent" />
        <motion.div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[#6366F1]/10 light:bg-[#6366F1]/20 rounded-full blur-[120px]"
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
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#6366F1]/20 to-[#3A4BDD]/20 border border-[#6366F1]/30 text-[#818CF8] light:text-[#4F46E5] text-sm font-medium mb-8"
          >
            <Sparkles className="w-4 h-4" />
            Honest Comparison
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight"
          >
            <span className="text-white light:text-gray-900">ReplySequence</span>
            <span className="text-gray-500 mx-2 sm:mx-3">vs</span>
            <span className="text-gray-400 light:text-gray-500">Gong</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg sm:text-xl md:text-2xl text-gray-400 light:text-gray-500 max-w-3xl mx-auto mb-8"
          >
            Gong is the gold standard for revenue intelligence.{' '}
            <span className="text-white light:text-gray-900">ReplySequence turns meetings into follow-up sequences, next steps, and deal risk alerts--at a fraction of the cost.</span>
          </motion.p>

          {/* Two Different Jobs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="max-w-3xl mx-auto mb-12 p-5 rounded-2xl bg-gray-900/60 light:bg-[#EEF0FF]/80 border border-gray-700/50 light:border-[#4F46E5]/30"
          >
            <p className="text-xs font-semibold text-gray-500 light:text-[#6366F1] uppercase tracking-wider mb-3">Two different jobs</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-400 light:text-gray-500 mb-1">Gong</p>
                <p className="text-sm text-gray-300 light:text-gray-600">Analyze conversations to forecast pipeline and coach reps.</p>
              </div>
              <div>
                <p className="text-sm font-medium text-[#6366F1] light:text-[#4F46E5] mb-1">ReplySequence</p>
                <p className="text-sm text-gray-300 light:text-gray-600">Turn meetings into follow-up sequences, next steps, risk alerts, and CRM updates--automatically.</p>
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
              className="relative p-8 rounded-2xl bg-gradient-to-br from-[#6366F1]/10 via-[#6366F1]/5 to-[#4F46E5]/10 border-2 border-[#6366F1]/50 overflow-hidden group shadow-xl shadow-[#6366F1]/20"
              style={{ boxShadow: '0 0 40px rgba(91, 108, 255, 0.15), inset 0 1px 0 rgba(255,255,255,0.1)' }}
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
                <Trophy className="w-6 h-6 text-[#6366F1] drop-shadow-lg" />
              </motion.div>
              <h2 className="text-xl font-bold text-white light:text-gray-900 mb-3">Choose ReplySequence if...</h2>
              <ul className="text-gray-300 light:text-gray-600 leading-relaxed space-y-2 text-sm">
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-[#6366F1] flex-shrink-0 mt-0.5" /> You want auto follow-up sequences and next-step tracking, not just analytics</li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-[#6366F1] flex-shrink-0 mt-0.5" /> You need deal risk alerts and health scoring without enterprise pricing</li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-[#6366F1] flex-shrink-0 mt-0.5" /> You want 2-minute setup with AI that learns your writing style</li>
              </ul>
              <div className="mt-5 space-y-1">
                <div className="flex items-center gap-2 text-transparent bg-clip-text bg-gradient-to-r from-[#6366F1] to-[#6366F1] font-medium text-sm">
                  <Zap className="w-4 h-4 text-[#6366F1]" />
                  Founders / Solo sellers &middot; SMB sales teams
                </div>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02, y: -4 }}
              transition={{ type: 'spring', stiffness: 300 }}
              className="relative p-8 rounded-2xl bg-gray-900/50 light:bg-gradient-to-br light:from-slate-50 light:to-[#EEF0FF] border border-gray-700 light:border-[#4F46E5]/30 overflow-hidden group"
            >
              <h2 className="text-xl font-bold text-gray-200 light:text-gray-800 mb-3">Choose Gong if...</h2>
              <p className="text-gray-400 light:text-gray-600 leading-relaxed">
                You need <span className="text-gray-200 light:text-[#3A4BDD] font-semibold">deep conversation analytics</span>,
                pipeline forecasting, and enterprise-grade coaching tools for a large sales org.
              </p>
              <div className="mt-6 flex items-center gap-2 text-gray-400 light:text-[#4F46E5] font-medium">
                <BarChart3 className="w-4 h-4" />
                Best for: Enterprise sales teams, revenue ops, sales leadership
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats Banner */}
      <AnimatedSection className="py-10 px-4 border-y border-[#6366F1]/20 bg-gradient-to-r from-[#6366F1]/5 via-[#6366F1]/5 to-amber-500/5 relative">
        {/* Background glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#6366F1]/10 via-transparent to-[#6366F1]/10 pointer-events-none" />
        <div className="max-w-5xl mx-auto relative">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
          >
            {[
              { value: '8 sec', label: 'Meeting to action', gradient: 'from-[#6366F1] to-[#4F46E5]' },
              { value: '5x', label: 'Less expensive', gradient: 'from-[#6366F1] to-amber-400' },
              { value: '2 min', label: 'Setup time', gradient: 'from-amber-400 to-amber-500' },
              { value: '$0', label: 'Minimum commitment', gradient: 'from-[#6366F1] to-[#4F46E5]' },
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

      {/* Feature Comparison */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <AnimatedSection className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white light:text-gray-900 mb-4">Feature Comparison</h2>
            <p className="text-gray-400 light:text-gray-500 text-lg max-w-2xl mx-auto">
              Side-by-side breakdown of what each platform offers
            </p>
          </AnimatedSection>

          {/* Comparison Header */}
          <div className="sticky top-0 z-10 bg-[#060B18]/95 light:bg-gradient-to-r light:from-[#EEF0FF]/95 light:to-[#EEF0FF]/95 backdrop-blur-sm border-b border-gray-800 light:border-[#4F46E5]/30 mb-4">
            <div className="grid grid-cols-[2fr_1fr_1fr] sm:grid-cols-3 py-3 sm:py-4">
              <div className="text-gray-500 light:text-[#4F46E5] font-medium pl-4">Feature</div>
              <div className="text-center">
                <span className="text-[#6366F1] light:text-[#4F46E5] font-bold text-sm sm:text-lg">ReplySequence</span>
              </div>
              <div className="text-center">
                <span className="text-gray-400 light:text-slate-600 font-bold text-sm sm:text-lg">Gong</span>
              </div>
            </div>
          </div>

          {/* Grouped Features */}
          {categories.map((category, catIndex) => (
            <AnimatedSection key={category} delay={catIndex * 0.1} className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-700 light:via-[#B3BFFF] to-transparent" />
                <span className="text-xs font-semibold text-gray-500 light:text-[#6366F1] uppercase tracking-wider">{category}</span>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-700 light:via-[#B3BFFF] to-transparent" />
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
                          ? 'bg-gradient-to-r from-[#6366F1]/10 via-[#6366F1]/5 to-transparent hover:from-[#6366F1]/15 hover:via-[#6366F1]/10 light:from-[#DDE1FF]/80 light:via-[#EEF0FF]/60 light:to-transparent light:hover:from-[#EEF0FF] light:hover:via-[#F5F6FF]/80 border-l-2 border-l-[#6366F1] border border-[#6366F1]/30 light:border-[#4F46E5]/40 shadow-lg shadow-[#6366F1]/5 light:shadow-[#DDE1FF]/30'
                          : row.winner === 'gong'
                          ? 'bg-gray-800/30 light:bg-slate-50 hover:bg-gray-800/50 light:hover:bg-slate-100 border border-gray-700/50 light:border-slate-200'
                          : 'bg-gray-900/30 light:bg-[#EEF0FF]/30 hover:bg-gray-800/30 light:hover:bg-[#F5F6FF]/60 border border-gray-700/30 light:border-[#EEF0FF]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs sm:text-sm text-gray-200 light:text-gray-800 font-medium">{row.feature}</span>
                        {row.winner === 'replysequence' && (
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="hidden sm:inline-flex px-2.5 py-1 rounded-full bg-gradient-to-r from-[#6366F1] to-[#3A4BDD] text-white text-xs font-bold shadow-lg shadow-[#6366F1]/30"
                          >
                            Winner
                          </motion.span>
                        )}
                      </div>
                      <div className="flex justify-center">
                        <FeatureValue value={row.replysequence} isWinner={row.winner === 'replysequence' || row.winner === 'tie'} />
                      </div>
                      <div className="flex justify-center">
                        <FeatureValue value={row.gong} isWinner={row.winner === 'gong'} />
                      </div>
                    </motion.div>
                  ))}
              </motion.div>
            </AnimatedSection>
          ))}
        </div>
      </section>

      {/* Key Differences */}
      <section className="py-20 px-4 bg-gradient-to-b from-gray-900/50 light:from-[#EEF0FF]/50 to-transparent">
        <div className="max-w-5xl mx-auto">
          <AnimatedSection className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white light:text-gray-900 mb-4">Key Differences</h2>
            <p className="text-gray-400 light:text-gray-500 text-lg max-w-2xl mx-auto">
              Understanding where each tool shines
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
                className={`relative p-6 rounded-2xl border-2 overflow-hidden group ${
                  diff.advantage === 'replysequence'
                    ? 'bg-gradient-to-br from-[#6366F1]/10 via-[#6366F1]/5 to-[#4F46E5]/10 light:from-[#EEF0FF] light:via-[#EEF0FF]/50 light:to-amber-50 border-[#6366F1]/40 light:border-[#4F46E5]/40 shadow-xl shadow-[#6366F1]/10 light:shadow-[#DDE1FF]/40'
                    : 'bg-gray-900/50 light:bg-gradient-to-br light:from-slate-50 light:to-[#EEF0FF] border-gray-600 light:border-slate-300 hover:border-gray-500 light:hover:border-[#99A8FF]'
                }`}
                style={diff.advantage === 'replysequence' ? { boxShadow: '0 0 30px rgba(91, 108, 255, 0.1), inset 0 1px 0 rgba(255,255,255,0.05)' } : {}}
              >
                {/* Stat badge */}
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className={`absolute top-4 right-4 px-3 py-1 rounded-full text-sm font-bold ${
                    diff.advantage === 'replysequence'
                      ? 'bg-[#6366F1]/20 light:bg-[#DDE1FF] text-[#6366F1] light:text-[#4F46E5]'
                      : 'bg-gray-700 light:bg-slate-200 text-gray-400 light:text-slate-600'
                  }`}
                >
                  {diff.stat}
                </motion.div>

                <motion.div
                  whileHover={{ rotate: 5 }}
                  className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4 ${
                    diff.advantage === 'replysequence'
                      ? 'bg-[#6366F1]/20 light:bg-[#DDE1FF] text-[#6366F1] light:text-[#4F46E5]'
                      : 'bg-gray-700 light:bg-slate-200 text-gray-400 light:text-slate-600'
                  }`}
                >
                  <diff.icon className="w-6 h-6" />
                </motion.div>

                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-lg font-bold text-white light:text-gray-900">{diff.title}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    diff.advantage === 'replysequence'
                      ? 'bg-[#6366F1]/20 light:bg-[#DDE1FF] text-[#6366F1] light:text-[#4F46E5]'
                      : 'bg-gray-700 light:bg-slate-200 text-gray-400 light:text-slate-600'
                  }`}>
                    {diff.advantage === 'replysequence' ? 'ReplySequence' : 'Gong'}
                  </span>
                </div>

                <p className="text-gray-400 light:text-gray-500 leading-relaxed">{diff.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Pricing Comparison */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <AnimatedSection className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white light:text-gray-900 mb-4">Pricing Comparison</h2>
            <p className="text-gray-400 light:text-gray-500 text-lg max-w-2xl mx-auto">
              Accessible pricing vs enterprise commitment
            </p>
          </AnimatedSection>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-6"
          >
            {pricingComparison.map((tier, index) => (
              <motion.div
                key={index}
                variants={staggerItem}
                whileHover={{ scale: 1.03, y: -8 }}
                className={`relative rounded-2xl overflow-hidden group ${
                  tier.highlighted
                    ? 'border-2 border-[#6366F1]/50 light:border-[#4F46E5]/40 bg-gradient-to-b from-[#6366F1]/10 via-[#6366F1]/5 to-transparent light:from-[#EEF0FF] light:via-[#EEF0FF] light:to-[#EEF0FF] shadow-xl shadow-[#6366F1]/10 light:shadow-[#DDE1FF]/40'
                    : 'border border-gray-700 light:border-[#4F46E5]/30 bg-gray-900/30 light:bg-gradient-to-b light:from-[#EEF0FF]/50 light:to-[#EEF0FF]/30 hover:border-gray-600 light:hover:border-[#99A8FF] light:hover:from-[#F5F6FF]/80 light:hover:to-[#F5F6FF]/60'
                }`}
                style={tier.highlighted ? { boxShadow: '0 0 40px rgba(91, 108, 255, 0.1)' } : {}}
              >
                {tier.highlighted && (
                  <motion.div
                    className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#6366F1] via-[#6366F1] to-amber-500"
                    animate={{ opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}

                <div className="p-6">
                  <h3 className="text-lg font-bold text-white light:text-gray-900 text-center mb-6">{tier.tier}</h3>

                  {/* ReplySequence */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="p-5 rounded-xl bg-gradient-to-br from-[#6366F1]/15 to-[#6366F1]/10 border border-[#6366F1]/40 mb-4 shadow-lg shadow-[#6366F1]/5"
                  >
                    <div className="mb-4">
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6366F1] to-[#6366F1] font-bold text-sm">ReplySequence</span>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className={`font-bold text-white light:text-gray-900 ${tier.replysequence.price.startsWith('$') ? 'text-2xl' : 'text-base'}`}>{tier.replysequence.price}</span>
                        <span className="text-gray-400 light:text-gray-500 text-sm">{tier.replysequence.period}</span>
                      </div>
                    </div>
                    <ul className="space-y-2">
                      {tier.replysequence.features.map((feature, i) => (
                        <motion.li
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="flex items-start gap-2 text-sm text-gray-300 light:text-gray-600"
                        >
                          <Check className="w-4 h-4 text-[#6366F1] flex-shrink-0 mt-0.5" />
                          {feature}
                        </motion.li>
                      ))}
                    </ul>
                  </motion.div>

                  {/* Gong */}
                  <div className="p-5 rounded-xl bg-gray-800/50 light:bg-slate-50 border border-gray-700 light:border-slate-200">
                    <div className="mb-4">
                      <span className="text-gray-400 light:text-gray-500 font-semibold text-sm">Gong</span>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className={`font-bold text-gray-300 light:text-gray-600 ${tier.gong.price.startsWith('$') ? 'text-2xl' : 'text-base'}`}>{tier.gong.price}</span>
                        <span className="text-gray-500 text-sm">{tier.gong.period}</span>
                      </div>
                    </div>
                    <ul className="space-y-2">
                      {tier.gong.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-400 light:text-gray-500">
                          <Check className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Bottom Line */}
      <AnimatedSection className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            whileHover={{ scale: 1.01 }}
            className="relative p-8 md:p-12 rounded-3xl bg-gradient-to-br from-gray-900 via-[#1C2545]/10 to-gray-900/50 light:from-white light:via-[#EEF0FF] light:to-[#EEF0FF] border-2 border-[#6366F1]/30 light:border-[#4F46E5]/30 overflow-hidden shadow-2xl light:shadow-[#EEF0FF]/50"
            style={{ boxShadow: '0 0 60px rgba(91, 108, 255, 0.1), inset 0 1px 0 rgba(255,255,255,0.05)' }}
          >
            {/* Decorative elements */}
            <motion.div
              className="absolute top-0 right-0 w-64 h-64 bg-[#6366F1]/10 light:bg-[#6366F1]/20 rounded-full blur-3xl"
              animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.6, 0.4] }}
              transition={{ duration: 6, repeat: Infinity }}
            />
            <motion.div
              className="absolute bottom-0 left-0 w-48 h-48 bg-[#6366F1]/10 light:bg-[#6366F1]/20 rounded-full blur-3xl"
              animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 8, repeat: Infinity, delay: 1 }}
            />
            <motion.div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/5 light:bg-amber-400/15 rounded-full blur-3xl"
              animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.3, 0.2] }}
              transition={{ duration: 10, repeat: Infinity, delay: 2 }}
            />

            <div className="relative">
              <div className="flex items-center gap-3 mb-6">
                <motion.div
                  whileHover={{ rotate: 10 }}
                  className="p-3 rounded-xl bg-gradient-to-br from-[#6366F1]/20 to-[#3A4BDD]/20 light:from-[#DDE1FF] light:to-[#DDE1FF]"
                >
                  <Shield className="w-6 h-6 text-[#6366F1]" />
                </motion.div>
                <h2 className="text-2xl md:text-3xl font-bold text-white light:text-gray-900">The Bottom Line</h2>
              </div>

              <div className="space-y-4 text-gray-300 light:text-gray-600 leading-relaxed mb-8">
                <p>
                  <strong className="text-white light:text-gray-900">Gong</strong> is the gold standard for revenue intelligence
                  and conversation analytics in enterprise sales. If your team needs deep deal insights,
                  pipeline forecasting, and coaching tools, Gong delivers enormous value.
                </p>
                <p>
                  <strong className="text-[#6366F1]">ReplySequence</strong> solves a different problem: turning
                  meetings into follow-up sequences, next steps with due dates, deal risk alerts, and CRM
                  updates--automatically. At a fraction of the cost, with zero minimum seats and 2-minute
                  setup, it&apos;s built for founders, solo sellers, and SMB teams who need meetings to
                  produce action--not dashboards.
                </p>
                <p className="font-medium text-white light:text-gray-900">
                  If your main problem is turning meetings into sequences, tracked next steps, and deal intelligence without enterprise pricing, ReplySequence is likely the better fit.
                </p>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                className="p-5 rounded-xl bg-gradient-to-r from-[#6366F1]/10 via-[#6366F1]/5 to-[#4F46E5]/10 border border-[#6366F1]/30 shadow-lg shadow-[#6366F1]/5"
              >
                <p className="text-gray-300 light:text-gray-600 text-sm italic flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-[#6366F1] flex-shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-transparent bg-clip-text bg-gradient-to-r from-[#6366F1] to-amber-400">Pro tip:</strong> Some teams use Gong for pipeline intelligence
                    and ReplySequence for automated sequences, next-step tracking, and deal alerts. Enterprise analytics + instant action = no deals left behind.
                  </span>
                </p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </AnimatedSection>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-t from-[#6366F1]/10 via-[#6366F1]/5 light:from-[#EEF0FF] light:via-[#EEF0FF] to-transparent relative overflow-hidden">
        {/* Background glows */}
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-[#6366F1]/10 light:bg-[#6366F1]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#6366F1]/10 light:bg-[#6366F1]/20 rounded-full blur-3xl pointer-events-none" />
        <AnimatedSection className="max-w-4xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold text-white light:text-gray-900 mb-6"
          >
            Run Your Next 5 Calls Through{' '}
            <span className="bg-gradient-to-r from-[#6366F1] to-[#6366F1] bg-clip-text text-transparent">
              ReplySequence
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-xl text-gray-400 light:text-gray-500 mb-10 max-w-2xl mx-auto"
          >
            Connect your Zoom, Teams, or Meet. Get follow-up sequences, next steps,
            and deal alerts before you&apos;ve even closed the meeting tab.
          </motion.p>

          <div className="glass-border-accent rounded-2xl p-6 sm:p-10 max-w-lg mx-auto text-left">
            <WaitlistForm />
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="text-gray-500 text-sm mt-8"
          >
            5 free AI drafts included. No credit card required.
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
              { "@type": "ListItem", "position": 3, "name": "ReplySequence vs Gong", "item": "https://www.replysequence.com/compare/gong" }
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
                "name": "What is the main difference between ReplySequence and Gong?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Gong is a revenue intelligence platform focused on conversation analytics, deal scoring, and pipeline forecasting. ReplySequence turns meetings into personalized follow-up sequences, extracts next steps with due dates, surfaces deal risk alerts, scores deal health, and auto-syncs everything to your CRM."
                }
              },
              {
                "@type": "Question",
                "name": "Is ReplySequence cheaper than Gong?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Significantly. ReplySequence starts free (5 drafts/month) and Pro is $19/month. Gong typically costs $100-150+ per user per month with annual contracts and minimum seat requirements."
                }
              },
              {
                "@type": "Question",
                "name": "Can I use ReplySequence and Gong together?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes. Many sales teams use Gong for conversation analytics and pipeline intelligence, and ReplySequence for automated follow-up sequences, next-step tracking, and deal risk alerts. Enterprise analytics plus instant action--no deals left behind."
                }
              }
            ]
          })
        }}
      />
    </div>
  );
}
