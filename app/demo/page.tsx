'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Play,
  Loader2,
  CheckCircle2,
  Mail,
  Clock,
  FileText,
  ArrowRight,
  Sparkles,
  Video,
  Users,
  ChevronDown,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

interface DemoResult {
  subject: string;
  body: string;
  actionItems: string[];
  generationMs: number;
}

const SAMPLE_OPTIONS = [
  {
    id: 'sample-sales-discovery',
    label: 'Sales Discovery Call',
    description: 'Discovery call with VP Sales at Acme Corp',
    icon: Users,
    color: '#5B6CFF',
  },
  {
    id: 'sample-team-standup',
    label: 'Team Standup',
    description: 'Weekly product & engineering sync',
    icon: Video,
    color: '#38E8FF',
  },
];

export default function DemoPage() {
  const [selectedSample, setSelectedSample] = useState(SAMPLE_OPTIONS[0].id);
  const [result, setResult] = useState<DemoResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  const selected = SAMPLE_OPTIONS.find((s) => s.id === selectedSample) || SAMPLE_OPTIONS[0];

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/demo/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sampleId: selectedSample }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Generation failed');
      }

      const data = await res.json();
      setResult({
        subject: data.subject,
        body: data.body,
        actionItems: data.actionItems || [],
        generationMs: data.generationMs,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white">
      <Header />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-32 pb-20">
        {/* Hero */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#5B6CFF]/10 border border-[#5B6CFF]/20 text-[#5B6CFF] text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            Live Demo — No Signup Required
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            See ReplySequence in action
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Pick a sample meeting, hit generate, and watch AI turn a transcript into a
            ready-to-send follow-up email in seconds.
          </p>
        </motion.div>

        {/* Demo Card */}
        <motion.div
          className="rounded-3xl bg-gray-900/60 border border-gray-700/50 overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {/* Step 1: Select meeting */}
          <div className="p-6 sm:p-8 border-b border-gray-800/50">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-7 h-7 rounded-lg bg-[#5B6CFF]/15 flex items-center justify-center text-sm font-bold text-[#5B6CFF]">
                1
              </div>
              <h2 className="text-lg font-semibold">Choose a meeting</h2>
            </div>

            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="w-full flex items-center gap-3 p-4 rounded-xl bg-gray-800/50 border border-gray-700/50 hover:border-[#5B6CFF]/30 transition-colors text-left"
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${selected.color}15` }}
                >
                  <selected.icon className="w-4.5 h-4.5" style={{ color: selected.color }} />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">{selected.label}</div>
                  <div className="text-xs text-gray-500">{selected.description}</div>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {showDropdown && (
                  <motion.div
                    className="absolute top-full left-0 right-0 mt-2 rounded-xl bg-gray-800 border border-gray-700/50 overflow-hidden z-10"
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                  >
                    {SAMPLE_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => {
                          setSelectedSample(opt.id);
                          setShowDropdown(false);
                          setResult(null);
                        }}
                        className={`w-full flex items-center gap-3 p-3 text-left hover:bg-white/[0.04] transition-colors ${
                          opt.id === selectedSample ? 'bg-[#5B6CFF]/5' : ''
                        }`}
                      >
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                          style={{ backgroundColor: `${opt.color}15` }}
                        >
                          <opt.icon className="w-4 h-4" style={{ color: opt.color }} />
                        </div>
                        <div>
                          <div className="text-sm font-medium">{opt.label}</div>
                          <div className="text-xs text-gray-500">{opt.description}</div>
                        </div>
                        {opt.id === selectedSample && (
                          <CheckCircle2 className="w-4 h-4 text-[#5B6CFF] ml-auto" />
                        )}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Step 2: Generate */}
          <div className="p-6 sm:p-8 border-b border-gray-800/50">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-7 h-7 rounded-lg bg-[#38E8FF]/15 flex items-center justify-center text-sm font-bold text-[#38E8FF]">
                2
              </div>
              <h2 className="text-lg font-semibold">Generate follow-up</h2>
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading}
              className="group w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-gradient-to-r from-[#5B6CFF] to-[#7A5CFF] hover:from-[#6B7CFF] hover:to-[#8A6CFF] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating your follow-up...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  Generate Follow-Up Email
                </>
              )}
            </button>

            {error && (
              <p className="mt-3 text-sm text-red-400 text-center">{error}</p>
            )}
          </div>

          {/* Step 3: Result */}
          <AnimatePresence>
            {result && (
              <motion.div
                className="p-6 sm:p-8"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-7 h-7 rounded-lg bg-[#4DFFA3]/15 flex items-center justify-center text-sm font-bold text-[#4DFFA3]">
                    3
                  </div>
                  <h2 className="text-lg font-semibold">Your AI-generated follow-up</h2>
                  <div className="flex items-center gap-1.5 ml-auto text-[11px] text-gray-500">
                    <Clock className="w-3 h-3" />
                    {(result.generationMs / 1000).toFixed(1)}s
                  </div>
                </div>

                {/* Email preview */}
                <div className="rounded-xl bg-gray-800/40 border border-gray-700/30 overflow-hidden">
                  {/* Email header */}
                  <div className="px-5 py-3 border-b border-gray-700/30 bg-gray-800/30">
                    <div className="flex items-center gap-2 mb-1">
                      <Mail className="w-3.5 h-3.5 text-[#5B6CFF]" />
                      <span className="text-xs text-gray-400">Subject:</span>
                    </div>
                    <div className="text-sm font-medium text-white">{result.subject}</div>
                  </div>

                  {/* Email body */}
                  <div className="px-5 py-4">
                    <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                      {result.body}
                    </div>
                  </div>

                  {/* Action items */}
                  {result.actionItems.length > 0 && (
                    <div className="px-5 py-3 border-t border-gray-700/30 bg-gray-800/20">
                      <div className="text-[11px] uppercase tracking-wider text-gray-500 mb-2 font-medium">
                        Action Items
                      </div>
                      <ul className="space-y-1.5">
                        {result.actionItems.map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-400">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#4DFFA3] mt-0.5 shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* CTA */}
                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-400 mb-4">
                    This is what ReplySequence generates after every meeting — automatically.
                  </p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <Link
                      href="/#waitlist"
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#5B6CFF] to-[#7A5CFF] hover:from-[#6B7CFF] hover:to-[#8A6CFF] text-white font-semibold transition-all"
                    >
                      Join the Waitlist
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => {
                        setResult(null);
                        const next = SAMPLE_OPTIONS.find((s) => s.id !== selectedSample);
                        if (next) setSelectedSample(next.id);
                      }}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-gray-700/50 text-gray-300 hover:bg-white/[0.04] transition-colors text-sm"
                    >
                      Try Another Meeting
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Trust signals */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {[
            {
              icon: Clock,
              title: '8-second follow-ups',
              description: 'AI drafts are ready before you close the meeting tab',
              color: '#38E8FF',
            },
            {
              icon: FileText,
              title: 'Not a summary — an email',
              description: 'Ready to review, tweak, and send. Action items included.',
              color: '#5B6CFF',
            },
            {
              icon: Sparkles,
              title: 'Learns your voice',
              description: 'Gets better with every edit. Your tone, your structure.',
              color: '#4DFFA3',
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-2xl bg-gray-900/40 border border-gray-800/50 p-5"
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                style={{ backgroundColor: `${item.color}10` }}
              >
                <item.icon className="w-4.5 h-4.5" style={{ color: item.color }} />
              </div>
              <h3 className="text-sm font-semibold text-white mb-1">{item.title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{item.description}</p>
            </div>
          ))}
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
