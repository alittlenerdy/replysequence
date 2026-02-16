'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
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
  { left: 18, top: 35, xMove: 7, duration: 4.8, delay: 0.9 },
  { left: 28, top: 55, xMove: -4, duration: 5.2, delay: 1.3 },
  { left: 38, top: 12, xMove: 8, duration: 3.9, delay: 0.5 },
  { left: 48, top: 72, xMove: -8, duration: 6.1, delay: 1.7 },
  { left: 58, top: 42, xMove: 5, duration: 4.3, delay: 0.4 },
  { left: 68, top: 85, xMove: -3, duration: 5.7, delay: 1.1 },
  { left: 78, top: 25, xMove: 9, duration: 3.6, delay: 0.7 },
  { left: 88, top: 62, xMove: -7, duration: 4.9, delay: 1.5 },
  { left: 95, top: 8, xMove: 4, duration: 5.4, delay: 0.1 },
  { left: 12, top: 78, xMove: 6, duration: 4.1, delay: 1.8 },
  { left: 32, top: 48, xMove: -5, duration: 5.9, delay: 0.6 },
  { left: 52, top: 92, xMove: 3, duration: 3.7, delay: 1.2 },
  { left: 72, top: 38, xMove: -9, duration: 4.6, delay: 0.3 },
  { left: 92, top: 68, xMove: 2, duration: 6.3, delay: 1.4 },
];

// Floating particles for hero - deterministic to avoid hydration mismatch
function FloatingParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {STATIC_PARTICLES.map((particle, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-emerald-400/30 rounded-full"
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
  // Email Focus
  { feature: 'Auto Follow-up Emails', replysequence: 'Core Focus', fathom: 'Not Available', winner: 'replysequence', category: 'Email Workflow' },
  { feature: 'Email Generation Speed', replysequence: '8 seconds', fathom: 'Manual copy-paste', winner: 'replysequence', category: 'Email Workflow' },
  { feature: 'Conversational Email Editing', replysequence: true, fathom: false, winner: 'replysequence', category: 'Email Workflow' },
  { feature: 'One-Click Send', replysequence: true, fathom: false, winner: 'replysequence', category: 'Email Workflow' },
  { feature: 'Custom Email Templates', replysequence: true, fathom: false, winner: 'replysequence', category: 'Email Workflow' },
  // Core Features
  { feature: 'Meeting Transcription', replysequence: true, fathom: true, winner: 'tie', category: 'Core Features' },
  { feature: 'AI Meeting Summaries', replysequence: true, fathom: true, winner: 'tie', category: 'Core Features' },
  { feature: 'Action Item Extraction', replysequence: true, fathom: true, winner: 'tie', category: 'Core Features' },
  { feature: 'Free Unlimited Recordings', replysequence: false, fathom: true, winner: 'fathom', category: 'Core Features' },
  { feature: 'Free AI Meetings', replysequence: '5/month', fathom: '5/month', winner: 'tie', category: 'Core Features' },
  // CRM & Integrations
  { feature: 'HubSpot Integration', replysequence: true, fathom: true, winner: 'tie', category: 'CRM Integration' },
  { feature: 'Salesforce Integration', replysequence: true, fathom: true, winner: 'tie', category: 'CRM Integration' },
  { feature: 'CRM Auto-Population', replysequence: true, fathom: true, winner: 'tie', category: 'CRM Integration' },
  { feature: 'Copy-Paste Formatting', replysequence: true, fathom: 'Optimized', winner: 'fathom', category: 'CRM Integration' },
  // Platform Support
  { feature: 'Zoom Integration', replysequence: true, fathom: true, winner: 'tie', category: 'Platform Support' },
  { feature: 'Google Meet Integration', replysequence: true, fathom: true, winner: 'tie', category: 'Platform Support' },
  { feature: 'Microsoft Teams Integration', replysequence: true, fathom: true, winner: 'tie', category: 'Platform Support' },
  // Fathom Advantages
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
    title: 'Email-First Workflow',
    description: 'Every feature is optimized for the email follow-up workflow. Draft, edit conversationally with AI, and send—all without switching apps.',
    stat: '1-click',
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
        className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${isWinner ? 'bg-emerald-500/20' : 'bg-gray-700/50'}`}
        whileHover={{ scale: 1.1 }}
      >
        <Check className={`w-5 h-5 ${isWinner ? 'text-emerald-400' : 'text-gray-400'}`} />
      </motion.div>
    ) : (
      <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-800/50">
        <X className="w-5 h-5 text-gray-600" />
      </div>
    );
  }
  return (
    <span className={`text-sm font-medium ${isWinner ? 'text-white' : 'text-gray-400'}`}>
      {value}
    </span>
  );
}

export default function FathomComparisonPage() {
  const categories = [...new Set(comparisonData.map(row => row.category))];

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <Header />
      {/* Hero Section */}
      <section className="relative pt-24 pb-20 px-4 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 via-transparent to-transparent" />
        <motion.div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-emerald-500/10 rounded-full blur-[120px]"
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
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-emerald-300 text-sm font-medium mb-8"
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
            <span className="text-white">ReplySequence</span>
            <span className="text-gray-500 mx-3">vs</span>
            <span className="text-gray-400">Fathom</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto mb-12"
          >
            Fathom: best free AI notetaker.{' '}
            <span className="text-white">ReplySequence: 8-second email drafts.</span>
          </motion.p>

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
              className="relative p-8 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-cyan-500/10 border-2 border-emerald-500/50 overflow-hidden group shadow-xl shadow-emerald-500/20"
              style={{ boxShadow: '0 0 40px rgba(16, 185, 129, 0.15), inset 0 1px 0 rgba(255,255,255,0.1)' }}
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
                <Trophy className="w-6 h-6 text-emerald-400 drop-shadow-lg" />
              </motion.div>
              <h3 className="text-xl font-bold text-white mb-3">Choose ReplySequence if...</h3>
              <p className="text-gray-300 leading-relaxed">
                Your #1 priority is <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400 font-semibold">sending follow-up emails faster</span>.
                You need AI-drafted emails in 8 seconds, ready to send or edit, not just meeting notes.
              </p>
              <div className="mt-6 flex items-center gap-2 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 font-medium">
                <Zap className="w-4 h-4 text-emerald-400" />
                Best for: Sales reps, consultants, account managers
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02, y: -4 }}
              transition={{ type: 'spring', stiffness: 300 }}
              className="relative p-8 rounded-2xl bg-gray-900/50 border border-gray-700 overflow-hidden group"
            >
              <h3 className="text-xl font-bold text-gray-200 mb-3">Choose Fathom if...</h3>
              <p className="text-gray-400 leading-relaxed">
                You want a <span className="text-gray-200 font-semibold">generous free tier</span> for meeting notes
                and summaries, with solid CRM integration for deal tracking.
              </p>
              <div className="mt-6 flex items-center gap-2 text-gray-400 font-medium">
                <Users className="w-4 h-4" />
                Best for: Teams needing free note-taking, CRM-focused workflows
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats Banner */}
      <AnimatedSection className="py-10 px-4 border-y border-emerald-500/20 bg-gradient-to-r from-emerald-500/5 via-teal-500/5 to-cyan-500/5 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-transparent to-teal-500/10 pointer-events-none" />
        <div className="max-w-5xl mx-auto relative">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
          >
            {[
              { value: '8 sec', label: 'Email draft time', gradient: 'from-emerald-400 to-teal-400' },
              { value: '10+ hrs', label: 'Saved per week', gradient: 'from-teal-400 to-cyan-400' },
              { value: '3', label: 'Platforms supported', gradient: 'from-cyan-400 to-blue-400' },
              { value: '$19', label: 'Pro plan / month', gradient: 'from-blue-400 to-purple-400' },
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
                <div className="text-sm text-gray-400">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </AnimatedSection>

      {/* Feature Comparison */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <AnimatedSection className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Feature Comparison</h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Side-by-side breakdown of what each platform offers
            </p>
          </AnimatedSection>

          {/* Comparison Header */}
          <div className="sticky top-0 z-10 bg-[#0a0a0f]/95 backdrop-blur-sm border-b border-gray-800 mb-4">
            <div className="grid grid-cols-3 py-4">
              <div className="text-gray-500 font-medium pl-4">Feature</div>
              <div className="text-center">
                <span className="text-emerald-400 font-bold text-lg">ReplySequence</span>
              </div>
              <div className="text-center">
                <span className="text-gray-400 font-bold text-lg">Fathom</span>
              </div>
            </div>
          </div>

          {/* Grouped Features */}
          {categories.map((category, catIndex) => (
            <AnimatedSection key={category} delay={catIndex * 0.1} className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-700 to-transparent" />
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{category}</span>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-700 to-transparent" />
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
                          ? 'bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent hover:from-emerald-500/15 hover:via-teal-500/10 border-l-2 border-l-emerald-500 border border-emerald-500/30 shadow-lg shadow-emerald-500/5'
                          : row.winner === 'fathom'
                          ? 'bg-gray-800/30 hover:bg-gray-800/50 border border-gray-700/50'
                          : 'bg-gray-900/30 hover:bg-gray-800/30 border border-gray-700/30'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-gray-200 font-medium">{row.feature}</span>
                        {row.winner === 'replysequence' && (
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="px-2.5 py-1 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/30"
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
      <section className="py-20 px-4 bg-gradient-to-b from-gray-900/50 to-transparent">
        <div className="max-w-5xl mx-auto">
          <AnimatedSection className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Key Differences</h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
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
                    ? 'bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-cyan-500/10 border-emerald-500/40 shadow-xl shadow-emerald-500/10'
                    : 'bg-gray-900/50 border-gray-600 hover:border-gray-500'
                }`}
                style={diff.advantage === 'replysequence' ? { boxShadow: '0 0 30px rgba(16, 185, 129, 0.1), inset 0 1px 0 rgba(255,255,255,0.05)' } : {}}
              >
                {/* Stat badge */}
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className={`absolute top-4 right-4 px-3 py-1 rounded-full text-sm font-bold ${
                    diff.advantage === 'replysequence'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-gray-700 text-gray-400'
                  }`}
                >
                  {diff.stat}
                </motion.div>

                <motion.div
                  whileHover={{ rotate: 5 }}
                  className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4 ${
                    diff.advantage === 'replysequence'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-gray-700 text-gray-400'
                  }`}
                >
                  <diff.icon className="w-6 h-6" />
                </motion.div>

                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-lg font-bold text-white">{diff.title}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    diff.advantage === 'replysequence'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-gray-700 text-gray-400'
                  }`}>
                    {diff.advantage === 'replysequence' ? 'ReplySequence' : 'Fathom'}
                  </span>
                </div>

                <p className="text-gray-400 leading-relaxed">{diff.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Pricing Comparison */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <AnimatedSection className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Pricing Comparison</h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
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
                    ? 'border-2 border-teal-500/50 bg-gradient-to-b from-teal-500/10 via-emerald-500/5 to-transparent shadow-xl shadow-teal-500/10'
                    : 'border border-gray-700 bg-gray-900/30 hover:border-gray-600'
                }`}
                style={tier.highlighted ? { boxShadow: '0 0 40px rgba(20, 184, 166, 0.1)' } : {}}
              >
                {tier.highlighted && (
                  <motion.div
                    className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500"
                    animate={{ opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}

                <div className="p-6">
                  <h3 className="text-lg font-bold text-white text-center mb-6">{tier.tier}</h3>

                  {/* ReplySequence */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="p-5 rounded-xl bg-gradient-to-br from-emerald-500/15 to-teal-500/10 border border-emerald-500/40 mb-4 shadow-lg shadow-emerald-500/5"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 font-bold">ReplySequence</span>
                      <div className="flex items-baseline">
                        <span className={`font-bold text-white ${tier.replysequence.price.startsWith('$') ? 'text-2xl' : 'text-base'}`}>{tier.replysequence.price}</span>
                        <span className="text-gray-400 text-sm">{tier.replysequence.period}</span>
                      </div>
                    </div>
                    <ul className="space-y-2">
                      {tier.replysequence.features.map((feature, i) => (
                        <motion.li
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="flex items-start gap-2 text-sm text-gray-300"
                        >
                          <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                          {feature}
                        </motion.li>
                      ))}
                    </ul>
                  </motion.div>

                  {/* Fathom */}
                  <div className="p-5 rounded-xl bg-gray-800/50 border border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-gray-400 font-semibold">Fathom</span>
                      <div className="flex items-baseline">
                        <span className={`font-bold text-gray-300 ${tier.fathom.price.startsWith('$') ? 'text-2xl' : 'text-base'}`}>{tier.fathom.price}</span>
                        <span className="text-gray-500 text-sm">{tier.fathom.period}</span>
                      </div>
                    </div>
                    <ul className="space-y-2">
                      {tier.fathom.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-400">
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
            className="relative p-8 md:p-12 rounded-3xl bg-gradient-to-br from-gray-900 via-emerald-900/10 to-gray-900/50 border-2 border-emerald-500/30 overflow-hidden shadow-2xl"
            style={{ boxShadow: '0 0 60px rgba(16, 185, 129, 0.1), inset 0 1px 0 rgba(255,255,255,0.05)' }}
          >
            {/* Decorative elements */}
            <motion.div
              className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl"
              animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.6, 0.4] }}
              transition={{ duration: 6, repeat: Infinity }}
            />
            <motion.div
              className="absolute bottom-0 left-0 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl"
              animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 8, repeat: Infinity, delay: 1 }}
            />
            <motion.div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl"
              animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.3, 0.2] }}
              transition={{ duration: 10, repeat: Infinity, delay: 2 }}
            />

            <div className="relative">
              <div className="flex items-center gap-3 mb-6">
                <motion.div
                  whileHover={{ rotate: 10 }}
                  className="p-3 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20"
                >
                  <Shield className="w-6 h-6 text-emerald-400" />
                </motion.div>
                <h2 className="text-2xl md:text-3xl font-bold text-white">The Bottom Line</h2>
              </div>

              <div className="space-y-4 text-gray-300 leading-relaxed mb-8">
                <p>
                  <strong className="text-white">Fathom</strong> is an excellent free AI meeting assistant with
                  generous unlimited recording, solid CRM integrations, and a clean interface. If you need meeting
                  notes and action items without paying, Fathom is a great choice.
                </p>
                <p>
                  <strong className="text-emerald-400">ReplySequence</strong> is purpose-built for one thing:
                  turning your meetings into ready-to-send follow-up emails in 8 seconds. If email follow-up is your
                  bottleneck, ReplySequence will save you 10+ hours per week that Fathom&apos;s notes can&apos;t.
                </p>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                className="p-5 rounded-xl bg-gradient-to-r from-teal-500/10 via-emerald-500/5 to-cyan-500/10 border border-teal-500/30 shadow-lg shadow-teal-500/5"
              >
                <p className="text-gray-300 text-sm italic flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-teal-400 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-400">Pro tip:</strong> Start with Fathom&apos;s
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
      <section className="py-20 px-4 bg-gradient-to-t from-emerald-500/10 via-teal-500/5 to-transparent relative overflow-hidden">
        {/* Background glows */}
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <AnimatedSection className="max-w-4xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold text-white mb-6"
          >
            Ready to Send Follow-ups in{' '}
            <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              8 Seconds?
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto"
          >
            Try ReplySequence free. Connect your Zoom, Teams, or Meet
            and see the difference for yourself.
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
                className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-300"
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-gray-300 bg-gray-800/80 hover:bg-gray-700 border border-gray-700 hover:border-gray-600 transition-all duration-300"
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
            Start with 5 free AI drafts - Cancel anytime
          </motion.p>
        </AnimatedSection>
      </section>

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
                  "text": "Yes, Fathom has native integrations with HubSpot and Salesforce, automatically syncing meeting notes and action items to your CRM. ReplySequence also integrates with these CRMs plus Airtable."
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
