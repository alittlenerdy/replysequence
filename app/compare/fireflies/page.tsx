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
  MessageSquare,
  Globe,
  Shield,
  Trophy,
  Timer,
  Target,
  Search,
  Users,
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
          className="absolute w-1 h-1 light:w-2 light:h-2 bg-orange-400/30 light:bg-indigo-500/40 rounded-full"
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
  fireflies: string | boolean;
  winner?: 'replysequence' | 'fireflies' | 'tie';
  category?: string;
}

const comparisonData: ComparisonRow[] = [
  // Email Focus
  { feature: 'Auto Follow-up Emails', replysequence: 'Core Focus', fireflies: 'Not Available', winner: 'replysequence', category: 'Email Workflow' },
  { feature: 'Email Generation Speed', replysequence: '8 seconds', fireflies: 'N/A', winner: 'replysequence', category: 'Email Workflow' },
  { feature: 'Conversational Email Editing', replysequence: true, fireflies: false, winner: 'replysequence', category: 'Email Workflow' },
  { feature: 'One-Click Send', replysequence: true, fireflies: false, winner: 'replysequence', category: 'Email Workflow' },
  { feature: 'Custom Email Templates', replysequence: true, fireflies: false, winner: 'replysequence', category: 'Email Workflow' },
  // Core Features
  { feature: 'Meeting Transcription', replysequence: true, fireflies: true, winner: 'tie', category: 'Core Features' },
  { feature: 'AI Meeting Notes', replysequence: true, fireflies: true, winner: 'tie', category: 'Core Features' },
  { feature: 'Action Item Extraction', replysequence: true, fireflies: true, winner: 'tie', category: 'Core Features' },
  { feature: 'Speaker Identification', replysequence: true, fireflies: true, winner: 'tie', category: 'Core Features' },
  // Integrations
  { feature: 'Zoom Integration', replysequence: true, fireflies: true, winner: 'tie', category: 'Integrations' },
  { feature: 'Google Meet Integration', replysequence: true, fireflies: true, winner: 'tie', category: 'Integrations' },
  { feature: 'Microsoft Teams Integration', replysequence: true, fireflies: true, winner: 'tie', category: 'Integrations' },
  { feature: 'CRM Integrations', replysequence: 'Airtable + Coming Soon', fireflies: 'Salesforce, HubSpot +20', winner: 'fireflies', category: 'Integrations' },
  // Fireflies Advantages
  { feature: 'Smart Search', replysequence: 'Basic Search', fireflies: 'AI-Powered Search', winner: 'fireflies', category: 'Search & Analytics' },
  { feature: 'Topic Tracker', replysequence: false, fireflies: true, winner: 'fireflies', category: 'Search & Analytics' },
  { feature: 'Conversation Intelligence', replysequence: 'Coming Soon', fireflies: true, winner: 'fireflies', category: 'Search & Analytics' },
  { feature: 'Auto-Join Meetings', replysequence: false, fireflies: true, winner: 'fireflies', category: 'Search & Analytics' },
];

const pricingComparison = [
  {
    tier: 'Free',
    replysequence: { price: '$0', period: '/mo', features: ['5 AI email drafts/month', 'Unlimited meetings', 'Basic templates'] },
    fireflies: { price: '$0', period: '/mo', features: ['800 min/month transcription', 'Basic AI summaries', 'Limited features'] },
  },
  {
    tier: 'Pro',
    replysequence: { price: '$19', period: '/mo', features: ['Unlimited AI drafts', 'Priority processing', 'Custom templates', 'No branding'] },
    fireflies: { price: '$18', period: '/user/mo', features: ['Unlimited transcription', 'Smart Search', 'CRM integrations', 'AI summaries'], note: '$10/mo billed annually' },
    highlighted: true,
  },
  {
    tier: 'Business / Team',
    replysequence: { price: '$29', period: '/mo', features: ['Everything in Pro', 'CRM sync', 'Team collaboration', 'API access'] },
    fireflies: { price: '$29', period: '/user/mo', features: ['Conversation Intelligence', 'Topic Tracker', 'Team insights', 'Admin controls'], note: '$19/mo billed annually' },
  },
];

const keyDifferences = [
  {
    icon: Timer,
    title: '8-Second Email Drafts',
    description: 'ReplySequence generates ready-to-send follow-up emails in 8 seconds. Fireflies gives you meeting notes; you still have to write the email yourself.',
    stat: '8 sec',
    advantage: 'replysequence' as const,
  },
  {
    icon: Target,
    title: 'Email-First Design',
    description: 'Every feature is built around the email workflow. Draft, edit conversationally, send—all without leaving the app.',
    stat: '1-click',
    advantage: 'replysequence' as const,
  },
  {
    icon: Search,
    title: 'Smart Search & Topic Tracker',
    description: 'Fireflies excels with AI-powered search across all your meetings. Track topics, find specific discussions, and surface insights from your entire conversation history.',
    stat: 'AI Search',
    advantage: 'fireflies' as const,
  },
  {
    icon: Users,
    title: 'Auto-Join & Conversation Intelligence',
    description: 'Fireflies can automatically join and record your meetings. Built-in conversation intelligence analyzes talk patterns and meeting dynamics.',
    stat: 'Automatic',
    advantage: 'fireflies' as const,
  },
];

function FeatureValue({ value, isWinner }: { value: string | boolean; isWinner: boolean }) {
  if (typeof value === 'boolean') {
    return value ? (
      <motion.div
        className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${isWinner ? 'bg-emerald-500/20' : 'bg-gray-700/50 light:bg-gray-200'}`}
        whileHover={{ scale: 1.1 }}
      >
        <Check className={`w-5 h-5 ${isWinner ? 'text-emerald-400' : 'text-gray-400 light:text-gray-500'}`} />
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

export default function FirefliesComparisonPage() {
  const categories = [...new Set(comparisonData.map(row => row.category))];

  return (
    <div className="min-h-screen bg-[#0a0a0f] light:bg-white">
      <Header />
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-orange-500/5 light:from-indigo-400/10 via-transparent to-transparent" />
        <motion.div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-orange-500/10 light:bg-indigo-400/20 rounded-full blur-[120px]"
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
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-orange-500/20 to-amber-500/20 border border-orange-500/30 text-orange-300 light:text-indigo-600 text-sm font-medium mb-8"
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
            <span className="text-gray-400 light:text-gray-500">Fireflies.ai</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xl md:text-2xl text-gray-400 light:text-gray-500 max-w-3xl mx-auto mb-12"
          >
            Two approaches to meeting productivity.{' '}
            <span className="text-white light:text-gray-900">Here&apos;s which one fits your workflow.</span>
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
              <h3 className="text-xl font-bold text-white light:text-gray-900 mb-3">Choose ReplySequence if...</h3>
              <p className="text-gray-300 light:text-gray-600 leading-relaxed">
                Your #1 goal is <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-indigo-400 font-semibold">sending follow-up emails instantly</span>.
                You want AI-drafted emails in 8 seconds, not transcripts you have to turn into emails yourself.
              </p>
              <div className="mt-6 flex items-center gap-2 text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400 font-medium">
                <Zap className="w-4 h-4 text-indigo-400" />
                Best for: Sales teams, consultants, account managers
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02, y: -4 }}
              transition={{ type: 'spring', stiffness: 300 }}
              className="relative p-8 rounded-2xl bg-gray-900/50 light:bg-gradient-to-br light:from-slate-50 light:to-orange-50 border border-gray-700 light:border-orange-200 overflow-hidden group"
            >
              <h3 className="text-xl font-bold text-gray-200 light:text-gray-800 mb-3">Choose Fireflies if...</h3>
              <p className="text-gray-400 light:text-gray-600 leading-relaxed">
                You need <span className="text-gray-200 light:text-orange-700 font-semibold">searchable meeting archives</span>,
                extensive CRM integrations, and team collaboration features.
              </p>
              <div className="mt-6 flex items-center gap-2 text-gray-400 light:text-orange-600 font-medium">
                <Globe className="w-4 h-4" />
                Best for: Revenue teams, customer success, product research
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats Banner */}
      <AnimatedSection className="py-10 px-4 border-y border-orange-500/20 bg-gradient-to-r from-orange-500/5 via-amber-500/5 to-orange-500/5 relative">
        {/* Background glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 via-transparent to-amber-500/10 pointer-events-none" />
        <div className="max-w-5xl mx-auto relative">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
          >
            {[
              { value: '8 sec', label: 'Email draft time', gradient: 'from-indigo-400 to-cyan-400' },
              { value: '10+ hrs', label: 'Saved per week', gradient: 'from-indigo-400 to-amber-400' },
              { value: '3', label: 'Platforms supported', gradient: 'from-orange-400 to-amber-400' },
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
          <div className="sticky top-0 z-10 bg-[#0a0a0f]/95 light:bg-gradient-to-r light:from-indigo-50/95 light:to-orange-50/95 backdrop-blur-sm border-b border-gray-800 light:border-indigo-200 mb-4">
            <div className="grid grid-cols-3 py-4">
              <div className="text-gray-500 light:text-indigo-600 font-medium pl-4">Feature</div>
              <div className="text-center">
                <span className="text-indigo-400 light:text-indigo-600 font-bold text-lg">ReplySequence</span>
              </div>
              <div className="text-center">
                <span className="text-orange-400 light:text-orange-600 font-bold text-lg">Fireflies.ai</span>
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
                          : row.winner === 'fireflies'
                          ? 'bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-transparent hover:from-orange-500/15 hover:via-amber-500/10 light:from-orange-100/80 light:via-amber-50/60 light:to-transparent light:hover:from-orange-100 light:hover:via-amber-50/80 border-l-2 border-l-orange-500 border border-orange-500/30 light:border-orange-300'
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
                        {row.winner === 'fireflies' && (
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="px-2.5 py-1 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-bold shadow-lg shadow-orange-500/30"
                          >
                            Winner
                          </motion.span>
                        )}
                      </div>
                      <div className="flex justify-center">
                        <FeatureValue value={row.replysequence} isWinner={row.winner === 'replysequence' || row.winner === 'tie'} />
                      </div>
                      <div className="flex justify-center">
                        <FeatureValue value={row.fireflies} isWinner={row.winner === 'fireflies'} />
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
                    ? 'bg-gradient-to-br from-indigo-500/10 via-indigo-400/5 to-indigo-600/10 light:from-indigo-50 light:via-indigo-50/50 light:to-amber-50 border-indigo-500/40 light:border-indigo-300 shadow-xl shadow-indigo-500/10 light:shadow-indigo-200/40'
                    : 'bg-gradient-to-br from-orange-500/10 via-amber-500/5 to-yellow-500/10 light:from-orange-50 light:via-amber-50/50 light:to-yellow-50 border-orange-500/40 light:border-orange-300 shadow-xl shadow-orange-500/10 light:shadow-orange-200/40'
                }`}
                style={diff.advantage === 'replysequence' ? { boxShadow: '0 0 30px rgba(59, 130, 246, 0.1), inset 0 1px 0 rgba(255,255,255,0.05)' } : { boxShadow: '0 0 30px rgba(249, 115, 22, 0.1), inset 0 1px 0 rgba(255,255,255,0.05)' }}
              >
                {/* Stat badge */}
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className={`absolute top-4 right-4 px-3 py-1 rounded-full text-sm font-bold ${
                    diff.advantage === 'replysequence'
                      ? 'bg-indigo-500/20 light:bg-indigo-100 text-indigo-400 light:text-indigo-600'
                      : 'bg-orange-500/20 light:bg-orange-100 text-orange-400 light:text-orange-600'
                  }`}
                >
                  {diff.stat}
                </motion.div>

                <motion.div
                  whileHover={{ rotate: 5 }}
                  className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4 ${
                    diff.advantage === 'replysequence'
                      ? 'bg-indigo-500/20 light:bg-indigo-100 text-indigo-400 light:text-indigo-600'
                      : 'bg-orange-500/20 light:bg-orange-100 text-orange-400 light:text-orange-600'
                  }`}
                >
                  <diff.icon className="w-6 h-6" />
                </motion.div>

                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-lg font-bold text-white light:text-gray-900">{diff.title}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    diff.advantage === 'replysequence'
                      ? 'bg-indigo-500/20 light:bg-indigo-100 text-indigo-400 light:text-indigo-600'
                      : 'bg-orange-500/20 light:bg-orange-100 text-orange-400 light:text-orange-600'
                  }`}>
                    {diff.advantage === 'replysequence' ? 'ReplySequence' : 'Fireflies'}
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
              Similar pricing, different superpowers—choose based on your workflow
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
                    ? 'border-2 border-indigo-500/50 light:border-indigo-300 bg-gradient-to-b from-indigo-500/10 via-indigo-400/5 to-transparent light:from-indigo-50 light:via-indigo-50 light:to-indigo-50 shadow-xl shadow-indigo-500/10 light:shadow-indigo-200/40'
                    : 'border border-gray-700 light:border-indigo-200 bg-gray-900/30 light:bg-gradient-to-b light:from-indigo-50/50 light:to-orange-50/30 hover:border-gray-600 light:hover:border-indigo-300 light:hover:from-indigo-50/80 light:hover:to-orange-50/60'
                }`}
                style={tier.highlighted ? { boxShadow: '0 0 40px rgba(168, 85, 247, 0.1)' } : {}}
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
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400 font-bold text-sm">ReplySequence</span>
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

                  {/* Fireflies */}
                  <div className="p-5 rounded-xl bg-gradient-to-br from-orange-500/10 to-amber-500/5 border border-orange-500/30">
                    <div className="mb-4">
                      <span className="text-orange-400 font-semibold text-sm">Fireflies.ai</span>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className={`font-bold text-gray-300 light:text-gray-600 ${tier.fireflies.price.startsWith('$') ? 'text-2xl' : 'text-base'}`}>{tier.fireflies.price}</span>
                        <span className="text-gray-500 text-sm">{tier.fireflies.period}</span>
                      </div>
                      {tier.fireflies.note && (
                        <span className="text-xs text-gray-500">{tier.fireflies.note}</span>
                      )}
                    </div>
                    <ul className="space-y-2">
                      {tier.fireflies.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-400 light:text-gray-500">
                          <Check className="w-4 h-4 text-orange-500/70 flex-shrink-0 mt-0.5" />
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
            className="relative p-8 md:p-12 rounded-3xl bg-gradient-to-br from-gray-900 via-indigo-900/10 to-gray-900/50 light:from-white light:via-indigo-50 light:to-orange-50 border-2 border-indigo-500/30 light:border-indigo-200 overflow-hidden shadow-2xl light:shadow-indigo-100/50"
            style={{ boxShadow: '0 0 60px rgba(59, 130, 246, 0.1), inset 0 1px 0 rgba(255,255,255,0.05)' }}
          >
            {/* Decorative elements */}
            <motion.div
              className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 light:bg-indigo-400/20 rounded-full blur-3xl"
              animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.6, 0.4] }}
              transition={{ duration: 6, repeat: Infinity }}
            />
            <motion.div
              className="absolute bottom-0 left-0 w-48 h-48 bg-orange-500/10 light:bg-orange-400/20 rounded-full blur-3xl"
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
                  <strong className="text-orange-400">Fireflies.ai</strong> is a powerful meeting intelligence platform
                  with excellent search capabilities and extensive CRM integrations. If you need to search across
                  all your meetings, collaborate with your team on transcripts, or integrate deeply with Salesforce/HubSpot,
                  Fireflies delivers real value at a competitive price point.
                </p>
                <p>
                  <strong className="text-indigo-400">ReplySequence</strong> is purpose-built for one thing:
                  turning meetings into follow-up emails as fast as humanly possible. If your bottleneck is
                  the 20-30 minutes you spend writing emails after every sales call, ReplySequence cuts that to 8 seconds.
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
                    <strong className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-amber-400">Pro tip:</strong> They&apos;re not mutually exclusive.
                    Use Fireflies for your searchable meeting archive and team collaboration. Use ReplySequence
                    specifically when you need to fire off a follow-up email in seconds after your call ends.
                    Right tool for the right job.
                  </span>
                </p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </AnimatedSection>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-t from-indigo-500/10 via-indigo-400/5 to-transparent light:from-indigo-50 light:via-orange-50 light:to-transparent relative overflow-hidden">
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
            Ready to Send Follow-ups in{' '}
            <span className="bg-gradient-to-r from-indigo-400 to-indigo-400 bg-clip-text text-transparent">
              8 Seconds?
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-xl text-gray-400 light:text-gray-500 mb-10 max-w-2xl mx-auto"
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
                className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-white bg-gradient-to-r from-indigo-500 to-indigo-700 hover:from-indigo-400 hover:to-indigo-400 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all duration-300"
              >
                Start Free Trial
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
            className="text-gray-500 light:text-gray-400 text-sm mt-8"
          >
            Start with 5 free AI drafts. Cancel anytime.
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
                "name": "What is the main difference between ReplySequence and Fireflies.ai?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "ReplySequence is focused specifically on generating follow-up emails from meetings in 8 seconds, while Fireflies.ai is a comprehensive AI meeting assistant with Smart Search, Topic Tracker, conversation intelligence, and extensive CRM integrations like Salesforce and HubSpot."
                }
              },
              {
                "@type": "Question",
                "name": "How much does Fireflies.ai cost compared to ReplySequence?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Fireflies Pro is $18/user/month ($10/mo billed annually) with unlimited transcription and Smart Search. Fireflies Business is $29/user/month ($19/mo annually). ReplySequence Pro is $19/month with unlimited AI email drafts, and Team is $29/month with team features. Both offer free tiers - Fireflies includes 800 min/month transcription, ReplySequence includes 5 drafts/month."
                }
              },
              {
                "@type": "Question",
                "name": "Can I use both ReplySequence and Fireflies together?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Absolutely! Many teams use Fireflies for searchable transcripts, Topic Tracker, and conversation intelligence, and ReplySequence specifically for sending follow-up emails faster. They solve different problems and complement each other well."
                }
              },
              {
                "@type": "Question",
                "name": "Does Fireflies.ai generate follow-up emails?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Fireflies focuses on transcription, AI summaries, action items, and conversation intelligence. It does not generate ready-to-send follow-up emails. ReplySequence generates complete, personalized email drafts in 8 seconds."
                }
              },
              {
                "@type": "Question",
                "name": "Can Fireflies.ai automatically join my meetings?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes, Fireflies can automatically join and record your Zoom, Google Meet, and Microsoft Teams meetings without manual intervention. This is one of its key features for hands-free meeting capture."
                }
              }
            ]
          })
        }}
      />
    </div>
  );
}
