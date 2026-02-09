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
  Video,
  Clock,
  Shield,
  Trophy,
  Timer,
  Target,
  Languages,
} from 'lucide-react';

// Floating particles for hero
function FloatingParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(15)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-purple-400/30 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, Math.random() * 20 - 10, 0],
            opacity: [0.2, 0.5, 0.2],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: 3 + Math.random() * 4,
            repeat: Infinity,
            delay: Math.random() * 2,
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
  tldv: string | boolean;
  winner?: 'replysequence' | 'tldv' | 'tie';
  category?: string;
}

const comparisonData: ComparisonRow[] = [
  // Email Focus
  { feature: 'Auto Follow-up Emails', replysequence: 'Core Focus', tldv: 'Manual Process', winner: 'replysequence', category: 'Email Workflow' },
  { feature: 'Email Generation Speed', replysequence: '8 seconds', tldv: 'Not available', winner: 'replysequence', category: 'Email Workflow' },
  { feature: 'Conversational Email Editing', replysequence: true, tldv: false, winner: 'replysequence', category: 'Email Workflow' },
  { feature: 'One-Click Send', replysequence: true, tldv: false, winner: 'replysequence', category: 'Email Workflow' },
  { feature: 'Custom Email Templates', replysequence: true, tldv: false, winner: 'replysequence', category: 'Email Workflow' },
  // Core Features
  { feature: 'Meeting Recording', replysequence: true, tldv: true, winner: 'tie', category: 'Core Features' },
  { feature: 'AI Meeting Summaries', replysequence: true, tldv: true, winner: 'tie', category: 'Core Features' },
  { feature: 'Action Item Extraction', replysequence: true, tldv: true, winner: 'tie', category: 'Core Features' },
  { feature: 'CRM Integration', replysequence: true, tldv: true, winner: 'tie', category: 'Core Features' },
  // Integrations
  { feature: 'Zoom Integration', replysequence: true, tldv: true, winner: 'tie', category: 'Integrations' },
  { feature: 'Google Meet Integration', replysequence: true, tldv: true, winner: 'tie', category: 'Integrations' },
  { feature: 'Microsoft Teams Integration', replysequence: true, tldv: true, winner: 'tie', category: 'Integrations' },
  // tl;dv Advantages - Recording
  { feature: 'Unlimited Free Recordings', replysequence: 'Limited', tldv: 'Unlimited', winner: 'tldv', category: 'Recording Features' },
  { feature: 'Timestamp Bookmarks', replysequence: false, tldv: true, winner: 'tldv', category: 'Recording Features' },
  { feature: 'Video Clip Creation', replysequence: 'Coming Soon', tldv: true, winner: 'tldv', category: 'Recording Features' },
  { feature: 'Unlimited Cloud Storage', replysequence: 'Limited', tldv: 'Unlimited', winner: 'tldv', category: 'Recording Features' },
  // tl;dv Advantages - Language
  { feature: 'Multi-Language Support', replysequence: 'English Primary', tldv: '30+ Languages', winner: 'tldv', category: 'Language & Localization' },
  { feature: 'Auto Language Detection', replysequence: 'Coming Soon', tldv: true, winner: 'tldv', category: 'Language & Localization' },
  // Collaboration
  { feature: 'Team Collaboration', replysequence: true, tldv: true, winner: 'tie', category: 'Collaboration' },
  { feature: 'Shareable Highlights', replysequence: 'Coming Soon', tldv: true, winner: 'tldv', category: 'Collaboration' },
];

const pricingComparison = [
  {
    tier: 'Free',
    replysequence: { price: '$0', period: '/mo', features: ['5 AI email drafts/month', 'Unlimited meetings', 'Basic templates'] },
    tldv: { price: '$0', period: '/mo', features: ['Unlimited recordings', 'AI summaries', 'Timestamp bookmarks', '30+ languages'] },
  },
  {
    tier: 'Pro',
    replysequence: { price: '$19', period: '/mo', features: ['Unlimited AI drafts', 'Priority processing', 'Custom templates', 'No branding'] },
    tldv: { price: '$25', period: '/user/mo', features: ['Advanced AI features', 'CRM integrations', 'Team collaboration', 'Priority support'] },
    highlighted: true,
  },
  {
    tier: 'Enterprise',
    replysequence: { price: '$29', period: '/mo', features: ['Everything in Pro', 'CRM sync', 'Team collaboration', 'API access'] },
    tldv: { price: 'Custom', period: '', features: ['Everything in Pro', 'SSO & SAML', 'Dedicated support', 'Custom integrations'] },
  },
];

const keyDifferences = [
  {
    icon: Timer,
    title: '8-Second Email Drafts',
    description: 'ReplySequence generates ready-to-send follow-up emails in 8 seconds. No watching recordings, no scrubbing through timestamps—actual emails ready to send.',
    stat: '8 sec',
    advantage: 'replysequence' as const,
  },
  {
    icon: Target,
    title: 'Email-First Design',
    description: 'Every feature is built around the email workflow. Meeting ends, email appears, one click to send. That\'s the whole point.',
    stat: '1-click',
    advantage: 'replysequence' as const,
  },
  {
    icon: Video,
    title: 'Unlimited Free Recordings',
    description: 'tl;dv offers unlimited meeting recordings and cloud storage on their free plan—no minute limits. Great if recording is your primary need.',
    stat: 'Free tier',
    advantage: 'tldv' as const,
  },
  {
    icon: Languages,
    title: 'Multi-Language Support',
    description: 'tl;dv supports 30+ languages with automatic detection, perfect for international teams and global meetings.',
    stat: '30+ langs',
    advantage: 'tldv' as const,
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

export default function TldvComparisonPage() {
  const categories = [...new Set(comparisonData.map(row => row.category))];

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <Header />
      {/* Hero Section */}
      <section className="relative pt-24 pb-20 px-4 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 via-transparent to-transparent" />
        <motion.div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-purple-500/10 rounded-full blur-[120px]"
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
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 text-purple-300 text-sm font-medium mb-8"
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
            <span className="text-gray-400">tl;dv</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto mb-12"
          >
            Recording vs. Action.{' '}
            <span className="text-white">Here&apos;s which approach fits your workflow.</span>
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
              className="relative p-8 rounded-2xl bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-blue-500/10 border-2 border-purple-500/50 overflow-hidden group shadow-xl shadow-purple-500/20"
              style={{ boxShadow: '0 0 40px rgba(168, 85, 247, 0.15), inset 0 1px 0 rgba(255,255,255,0.1)' }}
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
                <Trophy className="w-6 h-6 text-purple-400 drop-shadow-lg" />
              </motion.div>
              <h3 className="text-xl font-bold text-white mb-3">Choose ReplySequence if...</h3>
              <p className="text-gray-300 leading-relaxed">
                Your #1 goal is <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 font-semibold">sending follow-up emails faster</span>.
                You don&apos;t need to watch recordings—you need actionable emails in 8 seconds.
              </p>
              <div className="mt-6 flex items-center gap-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 font-medium">
                <Zap className="w-4 h-4 text-purple-400" />
                Best for: Sales teams, account managers, anyone drowning in follow-ups
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02, y: -4 }}
              transition={{ type: 'spring', stiffness: 300 }}
              className="relative p-8 rounded-2xl bg-gray-900/50 border border-gray-700 overflow-hidden group"
            >
              <h3 className="text-xl font-bold text-gray-200 mb-3">Choose tl;dv if...</h3>
              <p className="text-gray-400 leading-relaxed">
                You need <span className="text-gray-200 font-semibold">unlimited free recordings</span>,
                video clips for sharing, and timestamp-based navigation through meetings.
              </p>
              <div className="mt-6 flex items-center gap-2 text-gray-400 font-medium">
                <Video className="w-4 h-4" />
                Best for: Teams who review calls, share highlights, or need a video archive
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats Banner */}
      <AnimatedSection className="py-10 px-4 border-y border-purple-500/20 bg-gradient-to-r from-purple-500/5 via-pink-500/5 to-blue-500/5 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-transparent to-pink-500/10 pointer-events-none" />
        <div className="max-w-5xl mx-auto relative">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
          >
            {[
              { value: '8 sec', label: 'Email draft time', gradient: 'from-purple-400 to-pink-400' },
              { value: '10+ hrs', label: 'Saved per week', gradient: 'from-pink-400 to-rose-400' },
              { value: '3', label: 'Platforms supported', gradient: 'from-blue-400 to-cyan-400' },
              { value: '$19', label: 'Pro plan / month', gradient: 'from-emerald-400 to-teal-400' },
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
                <span className="text-purple-400 font-bold text-lg">ReplySequence</span>
              </div>
              <div className="text-center">
                <span className="text-gray-400 font-bold text-lg">tl;dv</span>
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
                          ? 'bg-gradient-to-r from-purple-500/10 via-pink-500/5 to-transparent hover:from-purple-500/15 hover:via-pink-500/10 border-l-2 border-l-purple-500 border border-purple-500/30 shadow-lg shadow-purple-500/5'
                          : row.winner === 'tldv'
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
                            className="px-2.5 py-1 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold shadow-lg shadow-purple-500/30"
                          >
                            Winner
                          </motion.span>
                        )}
                      </div>
                      <div className="flex justify-center">
                        <FeatureValue value={row.replysequence} isWinner={row.winner === 'replysequence' || row.winner === 'tie'} />
                      </div>
                      <div className="flex justify-center">
                        <FeatureValue value={row.tldv} isWinner={row.winner === 'tldv'} />
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
                    ? 'bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-blue-500/10 border-purple-500/40 shadow-xl shadow-purple-500/10'
                    : 'bg-gray-900/50 border-gray-600 hover:border-gray-500'
                }`}
                style={diff.advantage === 'replysequence' ? { boxShadow: '0 0 30px rgba(168, 85, 247, 0.1), inset 0 1px 0 rgba(255,255,255,0.05)' } : {}}
              >
                {/* Stat badge */}
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className={`absolute top-4 right-4 px-3 py-1 rounded-full text-sm font-bold ${
                    diff.advantage === 'replysequence'
                      ? 'bg-purple-500/20 text-purple-400'
                      : 'bg-gray-700 text-gray-400'
                  }`}
                >
                  {diff.stat}
                </motion.div>

                <motion.div
                  whileHover={{ rotate: 5 }}
                  className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4 ${
                    diff.advantage === 'replysequence'
                      ? 'bg-purple-500/20 text-purple-400'
                      : 'bg-gray-700 text-gray-400'
                  }`}
                >
                  <diff.icon className="w-6 h-6" />
                </motion.div>

                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-lg font-bold text-white">{diff.title}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    diff.advantage === 'replysequence'
                      ? 'bg-purple-500/20 text-purple-400'
                      : 'bg-gray-700 text-gray-400'
                  }`}>
                    {diff.advantage === 'replysequence' ? 'ReplySequence' : 'tl;dv'}
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
              Both offer free tiers—here&apos;s how the paid plans stack up
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
                    ? 'border-2 border-pink-500/50 bg-gradient-to-b from-pink-500/10 via-purple-500/5 to-transparent shadow-xl shadow-pink-500/10'
                    : 'border border-gray-700 bg-gray-900/30 hover:border-gray-600'
                }`}
                style={tier.highlighted ? { boxShadow: '0 0 40px rgba(236, 72, 153, 0.1)' } : {}}
              >
                {tier.highlighted && (
                  <motion.div
                    className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500"
                    animate={{ opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}

                <div className="p-6">
                  <h3 className="text-lg font-bold text-white text-center mb-6">{tier.tier}</h3>

                  {/* ReplySequence */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="p-5 rounded-xl bg-gradient-to-br from-purple-500/15 to-pink-500/10 border border-purple-500/40 mb-4 shadow-lg shadow-purple-500/5"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 font-bold">ReplySequence</span>
                      <div className="flex items-baseline">
                        <span className="text-2xl font-bold text-white">{tier.replysequence.price}</span>
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
                          <Check className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                          {feature}
                        </motion.li>
                      ))}
                    </ul>
                  </motion.div>

                  {/* tl;dv */}
                  <div className="p-5 rounded-xl bg-gray-800/50 border border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-gray-400 font-semibold">tl;dv</span>
                      <div className="flex items-baseline">
                        <span className="text-2xl font-bold text-gray-300">{tier.tldv.price}</span>
                        <span className="text-gray-500 text-sm">{tier.tldv.period}</span>
                      </div>
                    </div>
                    <ul className="space-y-2">
                      {tier.tldv.features.map((feature, i) => (
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
            className="relative p-8 md:p-12 rounded-3xl bg-gradient-to-br from-gray-900 via-purple-900/10 to-gray-900/50 border-2 border-purple-500/30 overflow-hidden shadow-2xl"
            style={{ boxShadow: '0 0 60px rgba(168, 85, 247, 0.1), inset 0 1px 0 rgba(255,255,255,0.05)' }}
          >
            {/* Decorative elements */}
            <motion.div
              className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl"
              animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.6, 0.4] }}
              transition={{ duration: 6, repeat: Infinity }}
            />
            <motion.div
              className="absolute bottom-0 left-0 w-48 h-48 bg-pink-500/10 rounded-full blur-3xl"
              animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 8, repeat: Infinity, delay: 1 }}
            />
            <motion.div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"
              animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.3, 0.2] }}
              transition={{ duration: 10, repeat: Infinity, delay: 2 }}
            />

            <div className="relative">
              <div className="flex items-center gap-3 mb-6">
                <motion.div
                  whileHover={{ rotate: 10 }}
                  className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20"
                >
                  <Shield className="w-6 h-6 text-purple-400" />
                </motion.div>
                <h2 className="text-2xl md:text-3xl font-bold text-white">The Bottom Line</h2>
              </div>

              <div className="space-y-4 text-gray-300 leading-relaxed mb-8">
                <p>
                  <strong className="text-white">tl;dv</strong> is an excellent meeting recorder with a generous
                  free tier. If you need unlimited recordings, shareable video clips, and timestamp-based
                  navigation—especially for training or reviewing sales calls—tl;dv delivers.
                </p>
                <p>
                  <strong className="text-purple-400">ReplySequence</strong> is purpose-built for one thing:
                  turning meetings into follow-up emails as fast as possible. You don&apos;t watch recordings.
                  You don&apos;t scrub through timestamps. Meeting ends, email appears in 8 seconds, you send it.
                </p>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                className="p-5 rounded-xl bg-gradient-to-r from-pink-500/10 via-purple-500/5 to-blue-500/10 border border-pink-500/30 shadow-lg shadow-pink-500/5"
              >
                <p className="text-gray-300 text-sm italic flex items-start gap-3">
                  <Clock className="w-5 h-5 text-pink-400 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">Think about it:</strong> tl;dv saves your recordings.
                    ReplySequence sends your follow-ups. If watching call recordings is your workflow, go with tl;dv.
                    If you want emails sent in 8 seconds without watching anything, that&apos;s us.
                  </span>
                </p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </AnimatedSection>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-t from-purple-500/10 via-pink-500/5 to-transparent relative overflow-hidden">
        {/* Background glows */}
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />
        <AnimatedSection className="max-w-4xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold text-white mb-6"
          >
            Ready to Send Follow-ups in{' '}
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
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
                className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300"
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
            No credit card required • 5 free AI drafts • Cancel anytime
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
                "name": "What is the main difference between ReplySequence and tl;dv?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "ReplySequence is focused specifically on generating follow-up emails from meetings in 8 seconds, while tl;dv is a meeting recording platform with unlimited free recordings, timestamp bookmarks, and multi-language support for 30+ languages."
                }
              },
              {
                "@type": "Question",
                "name": "Is tl;dv free to use?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes, tl;dv offers unlimited free recordings with AI summaries, timestamp bookmarks, and 30+ language support on their free plan. Their Pro plan is $25/user/month with CRM integrations and team collaboration. ReplySequence also has a free tier with 5 AI email drafts per month."
                }
              },
              {
                "@type": "Question",
                "name": "Which tool is better for sales teams?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "If your priority is sending follow-up emails quickly after sales calls, ReplySequence is purpose-built for that workflow with 8-second email generation. If you need to review call recordings, create timestamp bookmarks, and share video clips with your team, tl;dv is a better fit."
                }
              },
              {
                "@type": "Question",
                "name": "Does tl;dv support multiple languages?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes, tl;dv supports 30+ languages with automatic language detection, making it ideal for international teams and global meetings. ReplySequence currently focuses primarily on English."
                }
              },
              {
                "@type": "Question",
                "name": "Can I use both ReplySequence and tl;dv together?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes! Many teams use tl;dv for unlimited call recordings, video clips, and multi-language support while using ReplySequence specifically for fast email follow-ups. They solve different problems and complement each other well."
                }
              }
            ]
          })
        }}
      />
    </div>
  );
}
