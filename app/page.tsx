'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
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
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { GradientText } from '@/components/ui/GradientText';
import { GradientButton } from '@/components/ui/GradientButton';
import { FeatureCard } from '@/components/ui/FeatureCard';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white font-sans relative overflow-hidden">
      {/* Animated gradient background - matching onboarding */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-3/4 left-1/2 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Header */}
      <Header />

      {/* Hero Section */}
      <section className="relative min-h-screen pt-32 pb-20 px-4 z-10">
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              Stop Losing Deals to{' '}
              <GradientText className="font-extrabold">Forgotten Promises.</GradientText>
            </h1>

            <p className="text-xl text-gray-400 mb-6 leading-relaxed max-w-3xl mx-auto">
              Turn every Zoom call into a perfect follow-up email and CRM update—automatically.
            </p>

            {/* Platform logos */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="flex items-center justify-center gap-2 mb-8 text-gray-500 flex-wrap"
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
              className="flex items-center justify-center gap-3 text-gray-500"
            >
              <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 border-2 border-[#0a0a0f] shadow-sm" />
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 border-2 border-[#0a0a0f] shadow-sm" />
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-rose-500 border-2 border-[#0a0a0f] shadow-sm" />
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 border-2 border-[#0a0a0f] shadow-sm" />
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

          {/* Hero visual */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="relative mt-16"
          >
            <div className="relative rounded-2xl bg-gray-900/50 border border-gray-700 p-8 backdrop-blur-sm">
              <div className="flex flex-col md:flex-row items-center gap-8">
                {/* Left: Meeting visualization */}
                <div className="flex-1 text-center">
                  <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center mb-4 border border-gray-700">
                    <svg className="w-10 h-10" viewBox="0 0 24 24" fill="#2D8CFF">
                      <path d="M4.585 6.836C3.71 6.836 3 7.547 3 8.42v7.16c0 .872.71 1.584 1.585 1.584h9.83c.875 0 1.585-.712 1.585-1.585V8.42c0-.872-.71-1.585-1.585-1.585H4.585zm12.415 2.11l3.96-2.376c.666-.4 1.04-.266 1.04.56v9.74c0 .826-.374.96-1.04.56L17 15.054V8.946z"/>
                    </svg>
                  </div>
                  <p className="text-gray-400 text-sm">Your Meeting Ends</p>
                </div>

                {/* Arrow */}
                <ArrowRight className="w-8 h-8 text-blue-400 hidden md:block" />
                <ArrowDown className="w-8 h-8 text-blue-400 md:hidden" />

                {/* Center: AI Processing */}
                <div className="flex-1 text-center">
                  <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mb-4 border border-gray-700">
                    <Zap className="w-10 h-10 text-purple-400" />
                  </div>
                  <p className="text-gray-400 text-sm">AI Processes in 8 Seconds</p>
                </div>

                {/* Arrow */}
                <ArrowRight className="w-8 h-8 text-blue-400 hidden md:block" />
                <ArrowDown className="w-8 h-8 text-blue-400 md:hidden" />

                {/* Right: Output */}
                <div className="flex-1 text-center">
                  <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center mb-4 border border-gray-700">
                    <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                  </div>
                  <p className="text-gray-400 text-sm">Perfect Follow-up Ready</p>
                </div>
              </div>
            </div>
          </motion.div>
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
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              The Real Cost of <GradientText variant="secondary">Manual Follow-ups</GradientText>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
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
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              How <GradientText>ReplySequence</GradientText> Works
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Connect once, automate forever. Three steps to transform your follow-up workflow.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Connect Your Meeting Platform',
                description: 'Link Zoom, Teams, or Google Meet in one click. We securely access transcripts with your permission.',
              },
              {
                step: '02',
                title: 'AI Analyzes Your Calls',
                description: 'Our AI extracts action items, commitments, and key discussion points from every meeting.',
              },
              {
                step: '03',
                title: 'Review & Send',
                description: 'Get polished follow-up drafts in your inbox. Review, customize, and send with one click.',
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="relative"
              >
                <div className="rounded-2xl bg-gray-900/50 border border-gray-700 p-6 h-full hover:border-blue-500/50 transition-colors">
                  <span className="text-5xl font-bold text-blue-500/20">{item.step}</span>
                  <h3 className="text-xl font-bold text-white mt-2 mb-3">{item.title}</h3>
                  <p className="text-gray-400">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Product Screenshots */}
      <section className="py-20 px-4 relative z-10">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              See It In <GradientText>Action</GradientText>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              From meeting transcript to polished follow-up email in seconds
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                src: '/screenshots/dashboard.svg',
                alt: 'ReplySequence Dashboard',
                caption: 'Dashboard Overview',
                description: 'See all your meetings and drafts in one place',
              },
              {
                src: '/screenshots/draft-editor.svg',
                alt: 'AI Draft Editor',
                caption: 'AI-Powered Drafts',
                description: 'Review and customize AI-generated emails',
              },
              {
                src: '/screenshots/email-preview.svg',
                alt: 'Email Preview',
                caption: 'Email Preview',
                description: 'Preview before sending to your contacts',
              },
              {
                src: '/screenshots/integrations.svg',
                alt: 'Platform Integrations',
                caption: 'Seamless Integrations',
                description: 'Connect Zoom, Teams, and Google Meet',
              },
            ].map((screenshot, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="group relative overflow-hidden rounded-2xl bg-gray-900/50 border border-gray-700 shadow-xl transition-all duration-300 hover:scale-[1.02] hover:border-blue-500/50"
              >
                <div className="aspect-video relative">
                  <Image
                    src={screenshot.src}
                    alt={screenshot.alt}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 50vw"
                    priority={index < 2}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f]/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                  <h3 className="text-lg font-bold text-white mb-1">{screenshot.caption}</h3>
                  <p className="text-sm text-gray-400">{screenshot.description}</p>
                </div>
              </motion.div>
            ))}
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
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              From <span className="text-red-400">Pain</span> to{' '}
              <span className="text-emerald-400">Results</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
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
                  className="group relative rounded-2xl bg-gray-900/50 border border-gray-700 p-6 transition-all duration-300 hover:scale-[1.02] hover:border-blue-500/30"
                >
                  <div className="flex justify-center mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center border border-gray-700">
                      <IconComponent className="w-6 h-6 text-blue-400" />
                    </div>
                  </div>

                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-red-400">Pain</span>
                    <p className="text-sm text-red-300 font-medium mt-1">{mapping.pain}</p>
                  </div>

                  <div className="flex flex-col items-center my-3">
                    <ArrowDown className="w-5 h-5 text-blue-400 mb-1" />
                    <span className="text-xs text-blue-400 font-medium text-center px-2">{mapping.feature}</span>
                    <ArrowDown className="w-5 h-5 text-blue-400 mt-1" />
                  </div>

                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                    <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Result</span>
                    <p className="text-sm text-emerald-300 font-medium mt-1">{mapping.result}</p>
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
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Join the <GradientText>Beta Waitlist</GradientText>
            </h2>
            <p className="text-gray-400 mb-8">
              Be among the first to automate your follow-ups. Limited spots available for pilot program.
            </p>

            <div className="rounded-2xl bg-gray-900/50 border border-gray-700 p-6 sm:p-12 mx-4 sm:mx-0">
              <GradientButton
                href="https://tally.so/r/D4pv0j"
                external
                showArrow
                size="lg"
              >
                Join Beta Waitlist
              </GradientButton>
              <p className="text-gray-500 text-xs sm:text-sm mt-6">
                Takes 30 seconds - No credit card required - Limited to 100 pilot users
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20 px-4 relative z-10">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-gray-500 text-sm mb-8 font-medium">Trusted by sales teams at</p>
          <div className="flex flex-wrap justify-center items-center gap-12">
            {['TechCorp', 'SalesHub', 'GrowthCo', 'ScaleUp', 'CloudBase'].map((company, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="text-2xl font-bold text-gray-700"
              >
                {company}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-gray-800 relative z-10">
        <div className="max-w-7xl mx-auto text-center text-gray-500 text-sm">
          <div className="mb-4">
            <GradientText className="text-2xl font-bold">ReplySequence</GradientText>
          </div>
          <p>&copy; 2026 ReplySequence. Built by Playground Giants.</p>
        </div>
      </footer>
    </div>
  );
}
