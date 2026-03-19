'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Video,
  Sparkles,
  Mail,
  ArrowRight,
  MessageSquare,
  BarChart3,
  RefreshCw,
  Brain,
  Shield,
  CheckCircle,
  Zap,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { GradientText } from '@/components/ui/GradientText';

const WaitlistForm = dynamic(
  () => import('@/components/landing/WaitlistForm').then((m) => m.WaitlistForm),
  { ssr: false }
);

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: 'easeOut' as const },
  }),
};

const products = [
  {
    href: '/product/follow-ups',
    icon: Mail,
    title: 'Follow-Ups',
    description:
      'AI-generated follow-up emails that reference real topics, action items, and next steps from your meeting. Ready to review and send in seconds.',
    color: '#6366F1',
  },
  {
    href: '/product/sequences',
    icon: MessageSquare,
    title: 'Sequences',
    description:
      'Multi-step email sequences built from your conversation. Automated nurture that keeps deals warm without you lifting a finger.',
    color: '#F59E0B',
  },
  {
    href: '/product/meeting-intelligence',
    icon: Brain,
    title: 'Meeting Intelligence',
    description:
      'Next-step extraction, deal risk alerts, buyer signal detection, and pre-meeting briefings. Know what happened and what to do next.',
    color: '#10B981',
  },
  {
    href: '/product/pipeline-automation',
    icon: RefreshCw,
    title: 'Pipeline Automation',
    description:
      'CRM updates, deal stage tracking, and pipeline health scoring happen automatically after every call. Zero manual data entry.',
    color: '#8B5CF6',
  },
];

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-[#060B18] light:bg-gray-50 text-white light:text-gray-900">
      <Header />

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.12 } },
            }}
          >
            <motion.h1
              variants={fadeUp}
              custom={0}
              className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight text-[#E8ECF4] light:text-gray-900 text-pretty"
            >
              How <GradientText>ReplySequence</GradientText> Works
            </motion.h1>
            <motion.p
              variants={fadeUp}
              custom={1}
              className="text-xl text-[#C0C8E0] light:text-gray-600 max-w-2xl mx-auto"
            >
              From meeting to pipeline automation in three steps
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Three-step flow */}
      <section className="py-16 px-4 relative z-10">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-4 relative">
            {/* Connecting lines (desktop) */}
            <div className="hidden lg:block absolute top-1/2 left-[33.33%] w-[33.33%] h-px -translate-y-1/2 z-0">
              <div className="h-full bg-gradient-to-r from-[#6366F1]/40 to-[#F59E0B]/40" />
            </div>
            <div className="hidden lg:block absolute top-1/2 left-[66.66%] w-[33.33%] h-px -translate-y-1/2 z-0">
              <div className="h-full bg-gradient-to-r from-[#F59E0B]/40 to-[#10B981]/40" />
            </div>

            {/* Step 1 */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="relative z-10 rounded-2xl bg-[#0F172A] light:bg-white border border-[#1E2A4A] light:border-gray-200 p-6 md:p-8"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#6366F1]/10 border border-[#6366F1]/30 flex items-center justify-center">
                  <Video className="w-5 h-5 text-[#6366F1]" aria-hidden="true" />
                </div>
                <span className="text-sm font-bold text-[#6366F1] uppercase tracking-wider">Step 1</span>
              </div>
              <h3 className="text-xl font-bold text-[#E8ECF4] light:text-gray-900 mb-2">Have Your Meeting</h3>
              <p className="text-[#C0C8E0] light:text-gray-600 text-sm leading-relaxed">
                Use Zoom, Teams, or Meet like you already do. ReplySequence captures the transcript
                automatically through a lightweight meeting bot. One-click OAuth setup.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {['Zoom', 'Teams', 'Meet'].map((p) => (
                  <span
                    key={p}
                    className="text-xs font-medium px-2.5 py-1 rounded-full bg-[#6366F1]/10 text-[#6366F1] border border-[#6366F1]/20"
                  >
                    {p}
                  </span>
                ))}
              </div>
            </motion.div>

            {/* Step 2 */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="relative z-10 rounded-2xl bg-[#0F172A] light:bg-white border border-[#1E2A4A] light:border-gray-200 p-6 md:p-8"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-amber-400" aria-hidden="true" />
                </div>
                <span className="text-sm font-bold text-amber-400 uppercase tracking-wider">Step 2</span>
              </div>
              <h3 className="text-xl font-bold text-[#E8ECF4] light:text-gray-900 mb-2">AI Processes Everything</h3>
              <p className="text-[#C0C8E0] light:text-gray-600 text-sm leading-relaxed">
                Within seconds of your call ending, Claude AI reads the full transcript and generates
                follow-up emails, sequences, next steps, risk alerts, and CRM updates.
              </p>
              <div className="mt-4 flex items-center gap-2 text-xs text-[#8892B0] light:text-gray-500">
                <Zap className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
                <span>Powered by Claude AI</span>
              </div>
            </motion.div>

            {/* Step 3 */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="relative z-10 rounded-2xl bg-[#0F172A] light:bg-white border border-[#1E2A4A] light:border-gray-200 p-6 md:p-8"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-emerald-400" aria-hidden="true" />
                </div>
                <span className="text-sm font-bold text-emerald-400 uppercase tracking-wider">Step 3</span>
              </div>
              <h3 className="text-xl font-bold text-[#E8ECF4] light:text-gray-900 mb-2">Review and Go</h3>
              <p className="text-[#C0C8E0] light:text-gray-600 text-sm leading-relaxed">
                Review your AI-drafted follow-up, tweak if needed, and send. Sequences activate
                automatically. Your CRM updates itself. You are already on your next call.
              </p>
              <div className="mt-4 flex items-center gap-2 text-xs text-[#8892B0] light:text-gray-500">
                <Shield className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                <span>You stay in control of every email</span>
              </div>
            </motion.div>
          </div>

          {/* Arrows between steps (mobile) */}
          <div className="flex flex-col items-center lg:hidden -mt-3 -mb-3">
            {/* These are already naturally stacked vertically on mobile */}
          </div>
        </div>
      </section>

      {/* Gradient divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-[#6366F1]/20 to-transparent my-4" />

      {/* Four product sections */}
      <section className="py-20 px-4 relative z-10">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-[#E8ECF4] light:text-gray-900 text-pretty">
              Everything That Happens <GradientText>After the Call</GradientText>
            </h2>
            <p className="text-[#C0C8E0] light:text-gray-600 max-w-2xl mx-auto">
              Four products working together so nothing falls through the cracks.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {products.map((product, i) => {
              const Icon = product.icon;
              return (
                <motion.div
                  key={product.href}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="group rounded-2xl bg-[#0F172A] light:bg-white border border-[#1E2A4A] light:border-gray-200 p-6 md:p-8 transition-all duration-200 hover:border-[#6366F1]/30 light:hover:border-indigo-300"
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 border"
                    style={{
                      backgroundColor: `${product.color}15`,
                      borderColor: `${product.color}40`,
                    }}
                  >
                    <Icon className="w-6 h-6" style={{ color: product.color }} aria-hidden="true" />
                  </div>
                  <h3 className="text-xl font-bold text-[#E8ECF4] light:text-gray-900 mb-3">
                    {product.title}
                  </h3>
                  <p className="text-[#C0C8E0] light:text-gray-600 text-sm leading-relaxed mb-5">
                    {product.description}
                  </p>
                  <Link
                    href={product.href}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#6366F1] hover:text-[#818CF8] transition-colors group-hover:gap-2.5"
                  >
                    Learn more
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Gradient divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-[#6366F1]/20 to-transparent my-4" />

      {/* Demo CTA */}
      <section className="py-16 px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <BarChart3 className="w-10 h-10 text-[#6366F1] mx-auto mb-4" aria-hidden="true" />
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-[#E8ECF4] light:text-gray-900 text-pretty">
              See It in Action
            </h2>
            <p className="text-[#C0C8E0] light:text-gray-600 max-w-xl mx-auto mb-8">
              Watch a real meeting turn into a follow-up email, a nurture sequence, extracted action items,
              and CRM updates -- all in under a minute.
            </p>
            <Link
              href="/demo"
              className="btn-secondary-cta inline-flex items-center gap-2"
            >
              Watch the demo
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Gradient divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-[#6366F1]/20 to-transparent my-4" />

      {/* Waitlist CTA */}
      <section className="py-20 px-4 relative z-10">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-[#E8ECF4] light:text-gray-900 text-pretty">
              Your next meeting is coming. The <GradientText>follow-up</GradientText> should be automatic.
            </h2>
            <p className="text-[#8892B0] light:text-gray-600 mb-8 max-w-xl mx-auto">
              Join the waitlist for early access. No credit card required.
            </p>
            <div className="glass-border-accent rounded-2xl p-6 sm:p-10 max-w-lg mx-auto">
              <WaitlistForm />
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
