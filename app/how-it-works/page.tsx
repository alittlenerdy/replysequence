'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  ChevronDown,
  Video,
  Sparkles,
  Mail,
  CheckCircle,
  Clock,
  Shield,
  Edit3,
  Zap,
  MessageSquare,
  Users,
  FileText,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { GradientText } from '@/components/ui/GradientText';
import { GradientButton } from '@/components/ui/GradientButton';

// Platform icons as SVG components
function ZoomIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="#2D8CFF">
      <path d="M4.585 6.836C3.71 6.836 3 7.547 3 8.42v7.16c0 .872.71 1.584 1.585 1.584h9.83c.875 0 1.585-.712 1.585-1.585V8.42c0-.872-.71-1.585-1.585-1.585H4.585zm12.415 2.11l3.96-2.376c.666-.4 1.04-.266 1.04.56v9.74c0 .826-.374.96-1.04.56L17 15.054V8.946z" />
    </svg>
  );
}

function TeamsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="#5B5FC7">
      <path d="M20.625 8.5h-6.25a.625.625 0 00-.625.625v6.25c0 .345.28.625.625.625h6.25c.345 0 .625-.28.625-.625v-6.25a.625.625 0 00-.625-.625zM17.5 6.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM12.5 8a3 3 0 100-6 3 3 0 000 6zm0 1c-2.21 0-4 1.567-4 3.5V15h8v-2.5c0-1.933-1.79-3.5-4-3.5z" />
    </svg>
  );
}

function MeetIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="#00897B">
      <path d="M12 11.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
      <path d="M15.29 15.71L18 18.41V5.59l-2.71 2.7A5.977 5.977 0 0112 7c-1.38 0-2.65.47-3.66 1.26L14.59 2H5a2 2 0 00-2 2v16a2 2 0 002 2h14a2 2 0 002-2V9.41l-5.71 6.3zM6 10a6 6 0 1112 0 6 6 0 01-12 0z" />
    </svg>
  );
}

// Accordion component for platform tips
function Accordion({
  title,
  children,
  icon,
}: {
  title: string;
  children: React.ReactNode;
  icon: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-gray-700 light:border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-gray-800/50 light:bg-gray-50 hover:bg-gray-800 light:hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          {icon}
          <span className="font-medium text-white light:text-gray-900">{title}</span>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      <motion.div
        initial={false}
        animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden"
      >
        <div className="p-4 bg-gray-900/30 light:bg-white text-sm text-gray-400 light:text-gray-600">
          {children}
        </div>
      </motion.div>
    </div>
  );
}

// FAQ Item component
function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-gray-700 light:border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-5 bg-gray-900/50 light:bg-white hover:bg-gray-800/50 light:hover:bg-gray-50 transition-colors text-left"
      >
        <span className="font-semibold text-white light:text-gray-900 pr-4">{question}</span>
        <ChevronDown
          className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      <motion.div
        initial={false}
        animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden"
      >
        <div className="p-5 pt-0 bg-gray-900/50 light:bg-white text-gray-400 light:text-gray-600">
          {answer}
        </div>
      </motion.div>
    </div>
  );
}

// Step card component with animation
function StepCard({
  step,
  icon,
  title,
  description,
  children,
  color,
}: {
  step: number;
  icon: React.ReactNode;
  title: string;
  description: string;
  children?: React.ReactNode;
  color: 'blue' | 'purple' | 'pink' | 'emerald';
}) {
  const colorClasses = {
    blue: {
      border: 'border-blue-500/50',
      bg: 'bg-blue-500/10',
      text: 'text-blue-400',
      badge: 'bg-blue-500',
      glow: 'shadow-blue-500/20',
    },
    purple: {
      border: 'border-purple-500/50',
      bg: 'bg-purple-500/10',
      text: 'text-purple-400',
      badge: 'bg-purple-500',
      glow: 'shadow-purple-500/20',
    },
    pink: {
      border: 'border-pink-500/50',
      bg: 'bg-pink-500/10',
      text: 'text-pink-400',
      badge: 'bg-pink-500',
      glow: 'shadow-pink-500/20',
    },
    emerald: {
      border: 'border-emerald-500/50',
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      badge: 'bg-emerald-500',
      glow: 'shadow-emerald-500/20',
    },
  };

  const classes = colorClasses[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, delay: step * 0.1 }}
      className={`relative rounded-2xl bg-gray-900/50 light:bg-white light:shadow-lg border ${classes.border} p-6 md:p-8`}
    >
      {/* Step number badge */}
      <div className={`absolute -top-4 left-6 px-4 py-1.5 rounded-full ${classes.badge} text-white text-sm font-bold shadow-lg ${classes.glow}`}>
        Step {step}
      </div>

      {/* Icon */}
      <div className={`w-16 h-16 rounded-2xl ${classes.bg} flex items-center justify-center mb-6 mt-2 border ${classes.border}`}>
        <div className={classes.text}>{icon}</div>
      </div>

      {/* Content */}
      <h3 className="text-xl md:text-2xl font-bold text-white light:text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-400 light:text-gray-600 mb-4">{description}</p>

      {/* Additional content (like accordions or examples) */}
      {children}
    </motion.div>
  );
}

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] light:bg-gray-50 text-white light:text-gray-900">
      <Header />

      {/* Hero Section */}
      <section className="relative pt-32 pb-16 px-4 overflow-hidden">
        {/* Background gradient orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 8, repeat: Infinity }}
          />
          <motion.div
            className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"
            animate={{ scale: [1.2, 1, 1.2], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 8, repeat: Infinity, delay: 1 }}
          />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              How <GradientText>ReplySequence</GradientText> Works
            </h1>
            <p className="text-xl text-gray-400 light:text-gray-600 max-w-2xl mx-auto">
              From meeting to follow-up email in 4 simple steps. No manual note-taking. No forgotten action items. Just perfect follow-ups, every time.
            </p>
          </motion.div>

          {/* Quick stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="flex flex-wrap justify-center gap-6 mt-10"
          >
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-semibold text-gray-300 light:text-gray-700">
                8 seconds to draft
              </span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-semibold text-gray-300 light:text-gray-700">
                Save 10+ hours/week
              </span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20">
              <CheckCircle className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-semibold text-gray-300 light:text-gray-700">
                100% accurate action items
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Steps Section */}
      <section className="py-16 px-4 relative z-10">
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Step 1: Connect Your Platform */}
          <StepCard
            step={1}
            icon={<Video className="w-8 h-8" />}
            title="Connect Your Platform"
            description="Link your Zoom, Microsoft Teams, or Google Meet account with one click. We use secure OAuth to access only what we need - your meeting transcripts."
            color="blue"
          >
            <div className="mt-6 space-y-3">
              {/* Platform badges */}
              <div className="flex flex-wrap gap-3 mb-4">
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#2D8CFF]/10 border border-[#2D8CFF]/30">
                  <ZoomIcon className="w-5 h-5" />
                  <span className="text-sm font-medium text-[#2D8CFF]">Zoom</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#5B5FC7]/10 border border-[#5B5FC7]/30">
                  <TeamsIcon className="w-5 h-5" />
                  <span className="text-sm font-medium text-[#5B5FC7]">Teams</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#00897B]/10 border border-[#00897B]/30">
                  <MeetIcon className="w-5 h-5" />
                  <span className="text-sm font-medium text-[#00897B]">Meet</span>
                </div>
              </div>

              {/* Benefits list */}
              <div className="flex items-center gap-2 text-sm text-gray-400 light:text-gray-600">
                <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>One-click OAuth connection</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400 light:text-gray-600">
                <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Takes less than 30 seconds</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400 light:text-gray-600">
                <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Minimal permissions - only transcript access</span>
              </div>
            </div>
          </StepCard>

          {/* Step 2: Record Your Meeting */}
          <StepCard
            step={2}
            icon={<MessageSquare className="w-8 h-8" />}
            title="Record Your Meeting"
            description="Just enable transcription in your meeting settings and have your call as usual. ReplySequence automatically detects when a transcript is available."
            color="purple"
          >
            <div className="mt-6 space-y-3">
              {/* Platform-specific tips */}
              <Accordion
                title="Zoom Tips"
                icon={<ZoomIcon className="w-5 h-5" />}
              >
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-0.5">1.</span>
                    Enable "Audio Transcript" in your Zoom settings
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-0.5">2.</span>
                    Record to cloud (not local) for automatic processing
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-0.5">3.</span>
                    Transcript is ready within minutes of meeting end
                  </li>
                </ul>
              </Accordion>

              <Accordion
                title="Microsoft Teams Tips"
                icon={<TeamsIcon className="w-5 h-5" />}
              >
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-0.5">1.</span>
                    Start transcription from the meeting controls
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-0.5">2.</span>
                    Ensure your admin has enabled transcription
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-0.5">3.</span>
                    Transcript appears in Teams chat after meeting
                  </li>
                </ul>
              </Accordion>

              <Accordion
                title="Google Meet Tips"
                icon={<MeetIcon className="w-5 h-5" />}
              >
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-teal-400 mt-0.5">1.</span>
                    Click "Activities" then "Transcripts" to enable
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-teal-400 mt-0.5">2.</span>
                    Requires Google Workspace Business Standard+
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-teal-400 mt-0.5">3.</span>
                    Transcript saves to Google Drive automatically
                  </li>
                </ul>
              </Accordion>
            </div>
          </StepCard>

          {/* Step 3: AI Analyzes Transcript */}
          <StepCard
            step={3}
            icon={<Sparkles className="w-8 h-8" />}
            title="AI Analyzes Transcript"
            description="Our AI (powered by Claude) reads the entire transcript and extracts everything that matters - key discussion points, commitments made, and action items."
            color="pink"
          >
            <div className="mt-6">
              {/* Example output preview */}
              <div className="rounded-xl bg-gray-800/50 light:bg-gray-100 border border-gray-700 light:border-gray-200 p-4">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
                  Example Output
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-2 text-sm font-medium text-blue-400 mb-1">
                      <FileText className="w-4 h-4" />
                      Key Points
                    </div>
                    <ul className="text-sm text-gray-400 light:text-gray-600 space-y-1 pl-6">
                      <li className="list-disc">Discussed Q1 roadmap priorities</li>
                      <li className="list-disc">Agreed on new pricing structure</li>
                      <li className="list-disc">Reviewed competitor analysis</li>
                    </ul>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-sm font-medium text-emerald-400 mb-1">
                      <CheckCircle className="w-4 h-4" />
                      Action Items
                    </div>
                    <ul className="text-sm text-gray-400 light:text-gray-600 space-y-1 pl-6">
                      <li className="list-disc">Send proposal by Friday (John)</li>
                      <li className="list-disc">Schedule follow-up demo (Sarah)</li>
                      <li className="list-disc">Share updated pricing deck (You)</li>
                    </ul>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-sm font-medium text-purple-400 mb-1">
                      <Users className="w-4 h-4" />
                      Attendees Detected
                    </div>
                    <div className="text-sm text-gray-400 light:text-gray-600 pl-6">
                      John Smith, Sarah Johnson, + 2 others
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </StepCard>

          {/* Step 4: Review & Send */}
          <StepCard
            step={4}
            icon={<Mail className="w-8 h-8" />}
            title="Review & Send"
            description="Your polished follow-up email draft appears in your dashboard within seconds. Make quick edits if needed, then send with one click."
            color="emerald"
          >
            <div className="mt-6 space-y-4">
              {/* Features list */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/50 light:bg-gray-100 border border-gray-700 light:border-gray-200">
                  <Edit3 className="w-5 h-5 text-emerald-400" />
                  <span className="text-sm text-gray-300 light:text-gray-700">One-click editing</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/50 light:bg-gray-100 border border-gray-700 light:border-gray-200">
                  <Shield className="w-5 h-5 text-emerald-400" />
                  <span className="text-sm text-gray-300 light:text-gray-700">Review before sending</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/50 light:bg-gray-100 border border-gray-700 light:border-gray-200">
                  <Zap className="w-5 h-5 text-emerald-400" />
                  <span className="text-sm text-gray-300 light:text-gray-700">Send instantly</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/50 light:bg-gray-100 border border-gray-700 light:border-gray-200">
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                  <span className="text-sm text-gray-300 light:text-gray-700">CRM auto-update</span>
                </div>
              </div>
            </div>
          </StepCard>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 relative z-10">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white light:text-gray-900">
              Frequently Asked <GradientText>Questions</GradientText>
            </h2>
            <p className="text-gray-400 light:text-gray-600">
              Everything you need to know about ReplySequence
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="space-y-4"
          >
            <FAQItem
              question="What platforms are supported?"
              answer="ReplySequence currently supports Zoom, Microsoft Teams, and Google Meet. We're always working on adding more integrations based on user feedback. All three platforms are fully integrated with OAuth for secure, one-click connections."
            />
            <FAQItem
              question="How long does it take to generate a draft?"
              answer="Most drafts are generated within 8 seconds of the transcript becoming available. The actual time depends on meeting length - a 30-minute call typically processes in under 10 seconds, while hour-long meetings may take 15-20 seconds."
            />
            <FAQItem
              question="Is my data secure?"
              answer="Absolutely. We use AES-256 encryption for all data at rest and TLS 1.3 for data in transit. Your meeting transcripts are processed but never used to train AI models. OAuth tokens are encrypted, and we follow SOC 2 security practices. See our Security page for full details."
            />
            <FAQItem
              question="Can I edit drafts before sending?"
              answer="Yes! Every draft appears in your dashboard where you can review and edit it. Make changes directly in the editor, then send when you're satisfied. You maintain full control over what gets sent."
            />
            <FAQItem
              question="Do I need to install anything?"
              answer="No installation required. ReplySequence is a web-based application that connects to your meeting platforms via secure OAuth. Just sign up, connect your accounts, and you're ready to go."
            />
            <FAQItem
              question="What if my meeting doesn't have transcription enabled?"
              answer="ReplySequence requires meeting transcripts to generate follow-ups. If transcription wasn't enabled for a meeting, we won't be able to process it. Make sure to enable transcription before your meetings start - we provide platform-specific guides above!"
            />
          </motion.div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 px-4 relative z-10">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white light:text-gray-900">
              Ready to Save Hours on <GradientText>Follow-ups</GradientText>?
            </h2>
            <p className="text-gray-400 light:text-gray-600 mb-8 max-w-xl mx-auto">
              Join thousands of sales professionals who never write another follow-up email from scratch.
            </p>

            <div className="rounded-2xl bg-gray-900/50 light:bg-white light:shadow-xl border border-gray-700 light:border-gray-200 p-8 md:p-12">
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
                <GradientButton
                  href="https://tally.so/r/D4pv0j"
                  external
                  showArrow
                  size="lg"
                >
                  Join Beta Waitlist
                </GradientButton>
                <GradientButton
                  href="/pricing"
                  variant="secondary"
                  size="lg"
                >
                  View Pricing
                </GradientButton>
              </div>
              <p className="text-gray-500 light:text-gray-600 text-sm">
                Free to try - No credit card required
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-gray-800 light:border-gray-200 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-center md:text-left">
              <GradientText className="text-2xl font-bold">ReplySequence</GradientText>
              <p className="text-gray-500 light:text-gray-600 text-sm mt-2">
                &copy; 2026 ReplySequence. Built by Playground Giants.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-400 light:text-gray-600">
              <Link href="/" className="hover:text-white light:hover:text-gray-900 transition-colors">
                Home
              </Link>
              <Link href="/pricing" className="hover:text-white light:hover:text-gray-900 transition-colors">
                Pricing
              </Link>
              <Link href="/security" className="hover:text-white light:hover:text-gray-900 transition-colors">
                Security
              </Link>
              <Link href="/privacy" className="hover:text-white light:hover:text-gray-900 transition-colors">
                Privacy
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
