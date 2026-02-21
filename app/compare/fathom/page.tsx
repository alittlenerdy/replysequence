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
  Gift,
  Users,
  Shield,
  Trophy,
  Timer,
  Target,
  Database,
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
  fathom: string | boolean;
  winner?: 'replysequence' | 'fathom' | 'tie';
  category?: string;
}

const comparisonData: ComparisonRow[] = [
  // Revenue & Follow-up
  { feature: 'Auto Follow-up Emails', replysequence: 'Core Focus', fathom: 'Not Available', winner: 'replysequence', category: 'Revenue & Follow-up' },
  { feature: 'Email Generation Speed', replysequence: '8 seconds', fathom: 'Manual copy-paste', winner: 'replysequence', category: 'Revenue & Follow-up' },
  { feature: 'Conversational Email Editing', replysequence: true, fathom: false, winner: 'replysequence', category: 'Revenue & Follow-up' },
  { feature: 'One-Click Send', replysequence: true, fathom: false, winner: 'replysequence', category: 'Revenue & Follow-up' },
  { feature: 'Custom Email Templates', replysequence: true, fathom: false, winner: 'replysequence', category: 'Revenue & Follow-up' },
  { feature: 'Ask Your Meetings Anything', replysequence: true, fathom: false, winner: 'replysequence', category: 'Revenue & Follow-up' },
  { feature: 'CRM Auto-Sync', replysequence: true, fathom: true, winner: 'tie', category: 'Revenue & Follow-up' },
  // Recording & Transcription
  { feature: 'Meeting Transcription', replysequence: true, fathom: true, winner: 'tie', category: 'Recording & Transcription' },
  { feature: 'AI Meeting Summaries', replysequence: true, fathom: true, winner: 'tie', category: 'Recording & Transcription' },
  { feature: 'Action Item Extraction', replysequence: true, fathom: true, winner: 'tie', category: 'Recording & Transcription' },
  { feature: 'Free Unlimited Recordings', replysequence: false, fathom: true, winner: 'fathom', category: 'Recording & Transcription' },
  { feature: 'Free AI Meetings', replysequence: '5/month', fathom: '5/month', winner: 'tie', category: 'Recording & Transcription' },
  // CRM Integration
  { feature: 'HubSpot Integration', replysequence: true, fathom: true, winner: 'tie', category: 'CRM Integration' },
  { feature: 'Salesforce Integration', replysequence: true, fathom: true, winner: 'tie', category: 'CRM Integration' },
  { feature: 'Copy-Paste Formatting', replysequence: true, fathom: 'Optimized', winner: 'fathom', category: 'CRM Integration' },
  // Platform Support
  { feature: 'Zoom Integration', replysequence: true, fathom: true, winner: 'tie', category: 'Platform Support' },
  { feature: 'Google Meet Integration', replysequence: true, fathom: true, winner: 'tie', category: 'Platform Support' },
  { feature: 'Microsoft Teams Integration', replysequence: true, fathom: true, winner: 'tie', category: 'Platform Support' },
  // Collaboration
  { feature: 'Team Sharing & Playlists', replysequence: 'Coming Soon', fathom: true, winner: 'fathom', category: 'Collaboration' },
  { feature: 'Highlight Clips', replysequence: false, fathom: true, winner: 'fathom', category: 'Collaboration' },
  { feature: 'AI Notetaker Bot', replysequence: true, fathom: 'Free tier', winner: 'fathom', category: 'Collaboration' },
];

const pricingComparison = [
  {
    tier: 'Free',
    replysequence: { price: '$0', period: '/mo', features: ['5 AI email drafts/month', 'Unlimited meetings', 'Basic templates'] },
    fathom: { price: '$0', period: '/mo', features: ['Unlimited recordings', '5 AI-powered meetings/month', 'Basic transcription'] },
  },
  {
    tier: 'Pro / Premium',
    replysequence: { price: '$19', period: '/mo', features: ['Unlimited AI drafts', 'Priority processing', 'Custom templates', 'CRM sync'] },
    fathom: { price: '$19', period: '/mo', features: ['Unlimited AI meetings', 'AI summaries', 'HubSpot/Salesforce sync', '~$15/mo billed annually'] },
    highlighted: true,
  },
  {
    tier: 'Team',
    replysequence: { price: '$29', period: '/mo', features: ['Everything in Pro', 'Team collaboration', 'API access', 'Priority support'] },
    fathom: { price: '$29', period: '/mo', features: ['Team collaboration', 'Team playlists', 'Advanced CRM sync', '~$19/mo billed annually'] },
  },
  {
    tier: 'Team Pro / Enterprise',
    replysequence: { price: 'Contact', period: 'Sales', features: ['Custom deployment', 'SSO/SAML', 'Dedicated support', 'Custom integrations'] },
    fathom: { price: '$39', period: '/mo', features: ['All Team features', 'Priority support', 'Advanced analytics', '~$29/mo billed annually'] },
  },
];

const keyDifferences = [
  {
    icon: Timer,
    title: '8-Second Email Drafts',
    description: 'ReplySequence generates ready-to-send follow-up emails in 8 seconds. Not summaries you copy-paste—actual personalized emails ready to send.',
    stat: '8 sec',
    advantage: 'replysequence' as const,
  },
  {
    icon: Target,
    title: 'Ask Your Meetings Anything',
    description: 'Query across all your meetings with conversational AI. Ask "what pricing concerns came up this week?" and get answers that turn into follow-ups—not just meeting notes.',
    stat: 'AI Chat',
    advantage: 'replysequence' as const,
  },
  {
    icon: Gift,
    title: 'Generous Free Tier',
    description: 'Fathom offers unlimited free recordings with 5 AI-powered meetings per month. Great for occasional users who need basic transcription.',
    stat: '5/mo',
    advantage: 'fathom' as const,
  },
  {
    icon: Database,
    title: 'Native CRM Sync',
    description: 'Fathom has deep HubSpot and Salesforce integrations with automatic field population, deal tracking, and optimized copy-paste formatting.',
    stat: 'Native',
    advantage: 'fathom' as const,
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
    <span className={`text-sm font-medium ${isWinner ? 'text-white light:text-gray-900' : 'text-gray-400 light:text-gray-500'}`}>
      {value}
    </span>
  );
}

export default function FathomComparisonPage() {
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
            Honest Comparison
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight"
          >
            <span className="text-white light:text-gray-900">ReplySequence</span>
            <span className="text-gray-500 mx-3">vs</span>
            <span className="text-gray-400 light:text-gray-500">Fathom</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xl md:text-2xl text-gray-400 light:text-gray-500 max-w-3xl mx-auto mb-8"
          >
            If you want free meeting notes with solid CRM sync, Fathom is great.{' '}
            <span className="text-white light:text-gray-900">If you want every call to trigger ready-to-send follow-ups without extra steps, ReplySequence is built for that.</span>
          </motion.p>

          {/* Two Different Jobs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="max-w-3xl mx-auto mb-12 p-5 rounded-2xl bg-gray-900/60 light:bg-indigo-50/80 border border-gray-700/50 light:border-indigo-200"
          >
            <p className="text-xs font-semibold text-gray-500 light:text-indigo-500 uppercase tracking-wider mb-3">Two different jobs</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-400 light:text-gray-500 mb-1">Fathom</p>
                <p className="text-sm text-gray-300 light:text-gray-600">Free meeting notes and CRM updates after every call.</p>
              </div>
              <div>
                <p className="text-sm font-medium text-indigo-400 light:text-indigo-600 mb-1">ReplySequence</p>
                <p className="text-sm text-gray-300 light:text-gray-600">Turn meetings into revenue-driving follow-ups in minutes.</p>
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
              style={{ boxShadow: '0 0 40px rgba(99, 102, 241, 0.15), inset 0 1px 0 rgba(255,255,255,0.1)' }}
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
              <h3 className="text-xl font-bold text-white light:text-gray-900 mb-3">Choose ReplySequence if...</h3>
              <ul className="text-gray-300 light:text-gray-600 leading-relaxed space-y-2 text-sm">
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" /> You want meetings to auto-generate follow-up emails, not just notes and summaries</li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" /> Your real bottleneck is writing emails after calls, not taking notes</li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" /> You want one tool that goes from meeting to sent email in 8 seconds</li>
              </ul>
              <div className="mt-5 space-y-1">
                <div className="flex items-center gap-2 text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-amber-400 font-medium text-sm">
                  <Zap className="w-4 h-4 text-indigo-400" />
                  Sales reps &middot; Account managers &middot; Consultants
                </div>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02, y: -4 }}
              transition={{ type: 'spring', stiffness: 300 }}
              className="relative p-8 rounded-2xl bg-gray-900/50 light:bg-gradient-to-br light:from-slate-50 light:to-indigo-50 border border-gray-700 light:border-gray-200 overflow-hidden group"
            >
              <h3 className="text-xl font-bold text-gray-200 light:text-gray-800 mb-3">Choose Fathom if...</h3>
              <p className="text-gray-400 light:text-gray-600 leading-relaxed">
                You want a <span className="text-gray-200 light:text-gray-800 font-semibold">generous free tier</span> for meeting notes
                and summaries, with solid CRM integration for deal tracking.
              </p>
              <div className="mt-6 flex items-center gap-2 text-gray-400 light:text-gray-600 font-medium">
                <Users className="w-4 h-4" />
                Best for: Teams needing free note-taking, CRM-focused workflows
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats Banner */}
      <AnimatedSection className="py-10 px-4 border-y border-indigo-500/20 bg-gradient-to-r from-indigo-500/5 via-indigo-400/5 to-amber-500/5 relative">
        {/* Background glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-transparent to-amber-500/10 pointer-events-none" />
        <div className="max-w-5xl mx-auto relative">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
          >
            {[
              { value: '8 sec', label: 'Email draft time', gradient: 'from-indigo-400 to-amber-400' },
              { value: '10+ hrs', label: 'Saved per week', gradient: 'from-amber-400 to-indigo-400' },
              { value: '3', label: 'Platforms supported', gradient: 'from-indigo-400 to-indigo-600' },
              { value: '$19', label: 'Pro plan / month', gradient: 'from-indigo-400 to-amber-400' },
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
          <div className="sticky top-0 z-10 bg-[#0a0a0f]/95 light:bg-gradient-to-r light:from-indigo-50/95 light:to-indigo-50/95 backdrop-blur-sm border-b border-gray-800 light:border-indigo-200 mb-4">
            <div className="grid grid-cols-3 py-4">
              <div className="text-gray-500 light:text-indigo-600 font-medium pl-4">Feature</div>
              <div className="text-center">
                <span className="text-indigo-400 light:text-indigo-600 font-bold text-lg">ReplySequence</span>
              </div>
              <div className="text-center">
                <span className="text-gray-400 light:text-slate-600 font-bold text-lg">Fathom</span>
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
                      className={`grid grid-cols-3 items-center py-4 px-4 rounded-xl transition-all duration-200 ${
                        row.winner === 'replysequence'
                          ? 'bg-gradient-to-r from-indigo-500/10 via-indigo-400/5 to-transparent hover:from-indigo-500/15 hover:via-indigo-400/10 light:from-indigo-100/80 light:via-indigo-50/60 light:to-transparent light:hover:from-indigo-100 light:hover:via-indigo-50/80 border-l-2 border-l-indigo-500 border border-indigo-500/30 light:border-indigo-300 shadow-lg shadow-indigo-500/5 light:shadow-indigo-200/30'
                          : row.winner === 'fathom'
                          ? 'bg-gray-800/30 light:bg-slate-50 hover:bg-gray-800/50 light:hover:bg-slate-100 border border-gray-700/50 light:border-slate-200'
                          : 'bg-gray-900/30 light:bg-indigo-50/30 hover:bg-gray-800/30 light:hover:bg-indigo-50/60 border border-gray-700/30 light:border-indigo-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-gray-200 light:text-gray-800 font-medium">{row.feature}</span>
                        {row.winner === 'replysequence' && (
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="px-2.5 py-1 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-700 text-white text-xs font-bold shadow-lg shadow-indigo-500/30"
                          >
                            Winner
                          </motion.span>
                        )}
                      </div>
                      <div className="flex justify-center">
                        <FeatureValue value={row.replysequence} isWinner={row.winner === 'replysequence' || row.winner === 'tie'} />
                      </div>
                      <div className="flex justify-center">
                        <FeatureValue value={row.fathom} isWinner={row.winner === 'fathom'} />
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
            <h2 className="text-3xl md:text-4xl font-bold text-white light:text-gray-900 mb-4">Key Differences</h2>
            <p className="text-gray-400 light:text-gray-500 text-lg max-w-2xl mx-auto">
              Understanding where each tool excels
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
                    ? 'bg-gradient-to-br from-indigo-500/10 via-indigo-400/5 to-indigo-600/10 light:from-indigo-50 light:via-indigo-50/50 light:to-amber-50 border-indigo-500/40 light:border-indigo-300 shadow-xl shadow-indigo-500/10 light:shadow-indigo-200/40'
                    : 'bg-gray-900/50 light:bg-gradient-to-br light:from-slate-50 light:to-indigo-50 border-gray-600 light:border-slate-300 hover:border-gray-500 light:hover:border-indigo-300'
                }`}
                style={diff.advantage === 'replysequence' ? { boxShadow: '0 0 30px rgba(99, 102, 241, 0.1), inset 0 1px 0 rgba(255,255,255,0.05)' } : {}}
              >
                {/* Stat badge */}
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className={`absolute top-4 right-4 px-3 py-1 rounded-full text-sm font-bold ${
                    diff.advantage === 'replysequence'
                      ? 'bg-indigo-500/20 light:bg-indigo-100 text-indigo-400 light:text-indigo-600'
                      : 'bg-gray-700 light:bg-slate-200 text-gray-400 light:text-slate-600'
                  }`}
                >
                  {diff.stat}
                </motion.div>

                <motion.div
                  whileHover={{ rotate: 5 }}
                  className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4 ${
                    diff.advantage === 'replysequence'
                      ? 'bg-indigo-500/20 light:bg-indigo-100 text-indigo-400 light:text-indigo-600'
                      : 'bg-gray-700 light:bg-slate-200 text-gray-400 light:text-slate-600'
                  }`}
                >
                  <diff.icon className="w-6 h-6" />
                </motion.div>

                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-lg font-bold text-white light:text-gray-900">{diff.title}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    diff.advantage === 'replysequence'
                      ? 'bg-indigo-500/20 light:bg-indigo-100 text-indigo-400 light:text-indigo-600'
                      : 'bg-gray-700 light:bg-slate-200 text-gray-400 light:text-slate-600'
                  }`}>
                    {diff.advantage === 'replysequence' ? 'ReplySequence' : 'Fathom'}
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
              Similar pricing, different strengths at each tier
            </p>
          </AnimatedSection>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {pricingComparison.map((tier, index) => (
              <motion.div
                key={index}
                variants={staggerItem}
                whileHover={{ scale: 1.03, y: -8 }}
                className={`relative rounded-2xl overflow-hidden group ${
                  tier.highlighted
                    ? 'border-2 border-indigo-500/50 light:border-indigo-300 bg-gradient-to-b from-indigo-500/10 via-indigo-400/5 to-transparent light:from-indigo-50 light:via-indigo-50 light:to-amber-50 shadow-xl shadow-indigo-500/10 light:shadow-indigo-200/40'
                    : 'border border-gray-700 light:border-indigo-200 bg-gray-900/30 light:bg-gradient-to-b light:from-indigo-50/50 light:to-amber-50/30 hover:border-gray-600 light:hover:border-indigo-300 light:hover:from-indigo-50/80 light:hover:to-amber-50/60'
                }`}
                style={tier.highlighted ? { boxShadow: '0 0 40px rgba(99, 102, 241, 0.1)' } : {}}
              >
                {tier.highlighted && (
                  <motion.div
                    className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-indigo-400 to-amber-500"
                    animate={{ opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}

                <div className="p-6">
                  <h3 className="text-lg font-bold text-white light:text-gray-900 text-center mb-6">{tier.tier}</h3>

                  {/* ReplySequence */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="p-5 rounded-xl bg-gradient-to-br from-indigo-500/15 to-indigo-500/10 border border-indigo-500/40 mb-4 shadow-lg shadow-indigo-500/5"
                  >
                    <div className="mb-4">
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-amber-400 font-bold text-sm">ReplySequence</span>
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
                          <Check className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                          {feature}
                        </motion.li>
                      ))}
                    </ul>
                  </motion.div>

                  {/* Fathom */}
                  <div className="p-5 rounded-xl bg-gray-800/50 light:bg-slate-50 border border-gray-700 light:border-slate-200">
                    <div className="mb-4">
                      <span className="text-gray-400 light:text-gray-500 font-semibold text-sm">Fathom</span>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className={`font-bold text-gray-300 light:text-gray-600 ${tier.fathom.price.startsWith('$') ? 'text-2xl' : 'text-base'}`}>{tier.fathom.price}</span>
                        <span className="text-gray-500 text-sm">{tier.fathom.period}</span>
                      </div>
                    </div>
                    <ul className="space-y-2">
                      {tier.fathom.features.map((feature, i) => (
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
            className="relative p-8 md:p-12 rounded-3xl bg-gradient-to-br from-gray-900 via-indigo-900/10 to-gray-900/50 light:from-white light:via-indigo-50 light:to-amber-50 border-2 border-indigo-500/30 light:border-indigo-200 overflow-hidden shadow-2xl light:shadow-indigo-100/50"
            style={{ boxShadow: '0 0 60px rgba(99, 102, 241, 0.1), inset 0 1px 0 rgba(255,255,255,0.05)' }}
          >
            {/* Decorative elements */}
            <motion.div
              className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 light:bg-indigo-400/20 rounded-full blur-3xl"
              animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.6, 0.4] }}
              transition={{ duration: 6, repeat: Infinity }}
            />
            <motion.div
              className="absolute bottom-0 left-0 w-48 h-48 bg-amber-500/10 light:bg-amber-400/20 rounded-full blur-3xl"
              animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 8, repeat: Infinity, delay: 1 }}
            />
            <motion.div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/5 light:bg-indigo-400/15 rounded-full blur-3xl"
              animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.3, 0.2] }}
              transition={{ duration: 10, repeat: Infinity, delay: 2 }}
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
                  <strong className="text-white light:text-gray-900">Fathom</strong> is an excellent free AI meeting assistant with
                  generous unlimited recording, solid CRM integrations, and a clean interface. If you need meeting
                  notes and action items without paying, Fathom is a great choice.
                </p>
                <p>
                  <strong className="text-indigo-400">ReplySequence</strong> starts where Fathom stops: turning notes into replies, not just summaries. Ask your meetings anything, generate ready-to-send follow-ups in 8 seconds, and keep your pipeline moving without the manual email writing.
                </p>
                <p className="font-medium text-white light:text-gray-900">If your main problem is turning meetings into replies and pipeline, ReplySequence is likely the better fit.</p>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                className="p-5 rounded-xl bg-gradient-to-r from-indigo-500/10 via-indigo-400/5 to-indigo-600/10 border border-indigo-500/30 shadow-lg shadow-indigo-500/5"
              >
                <p className="text-gray-300 light:text-gray-600 text-sm italic flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-amber-400">Pro tip:</strong> Start with Fathom&apos;s
                    free tier for meeting notes. When you realize the real time sink is writing emails after calls,
                    add ReplySequence to close the loop in 8 seconds.
                  </span>
                </p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </AnimatedSection>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-t from-indigo-500/10 via-indigo-400/5 to-transparent light:from-indigo-50 light:via-amber-50 light:to-transparent relative overflow-hidden">
        {/* Background glows */}
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-indigo-500/10 light:bg-indigo-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-500/10 light:bg-amber-400/20 rounded-full blur-3xl pointer-events-none" />
        <AnimatedSection className="max-w-4xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold text-white light:text-gray-900 mb-6"
          >
            Run Your Next 5 Calls Through{' '}
            <span className="bg-gradient-to-r from-indigo-400 to-amber-400 bg-clip-text text-transparent">
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
            Connect your Zoom, Teams, or Meet. See follow-ups appear in your inbox before you&apos;ve even closed the meeting tab.
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
                href="/sign-up"
                className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-white bg-gradient-to-r from-indigo-500 to-indigo-700 hover:from-indigo-400 hover:to-indigo-600 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all duration-300"
              >
                Turn This Week&apos;s Calls Into Replies
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-gray-300 light:text-indigo-700 bg-gray-800/80 light:bg-indigo-50 hover:bg-gray-700 light:hover:bg-indigo-100 border border-gray-700 light:border-indigo-300 hover:border-gray-600 light:hover:border-indigo-400 transition-all duration-300"
              >
                View Pricing
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
            5 free AI drafts included. No credit card required.
          </motion.p>
        </AnimatedSection>
      </section>

      <Footer />

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
                "name": "What is the main difference between ReplySequence and Fathom?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "ReplySequence generates follow-up emails from meetings in 8 seconds, while Fathom is an AI notetaker with meeting summaries and CRM sync. ReplySequence is email-first; Fathom is notes-first with a generous free tier (5 AI meetings/month)."
                }
              },
              {
                "@type": "Question",
                "name": "Is Fathom really free?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Fathom offers a free tier with unlimited recordings and 5 AI-powered meetings per month. Premium plans start at $19/month ($15/month billed annually) for unlimited AI features. Team plans are $29/month and Team Pro is $39/month. ReplySequence's free tier includes 5 AI email drafts per month."
                }
              },
              {
                "@type": "Question",
                "name": "Which tool is better for sales teams?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "It depends on your bottleneck. If you struggle to write follow-up emails after calls, ReplySequence generates them in 8 seconds. If you need free meeting notes with HubSpot/Salesforce sync, Fathom is excellent. Many sales teams use both."
                }
              },
              {
                "@type": "Question",
                "name": "Does Fathom integrate with HubSpot and Salesforce?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes, Fathom has native integrations with HubSpot and Salesforce, automatically syncing meeting notes and action items to your CRM. ReplySequence also integrates with HubSpot, Salesforce, Airtable, and Google Sheets."
                }
              },
              {
                "@type": "Question",
                "name": "Can I use ReplySequence and Fathom together?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Absolutely! Many users use Fathom's free tier for meeting notes and CRM updates, then use ReplySequence specifically for generating and sending follow-up emails in 8 seconds. Different tools for different parts of the workflow."
                }
              }
            ]
          })
        }}
      />
    </div>
  );
}
