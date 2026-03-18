'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const TRANSCRIPT_TEXT =
  "Let's schedule a follow-up for next week to review the proposal. Sarah, can you send over the pricing breakdown?";

const EMAIL_SUBJECT = 'Great connecting \u2014 proposal and pricing follow-up';
const EMAIL_BODY = [
  'Hi Sarah,',
  '',
  'Great speaking with you today. As discussed, I wanted to follow up on the proposal review we have planned for next week.',
  '',
  'Could you send over the pricing breakdown at your earliest convenience? That way we can hit the ground running when we reconnect.',
  '',
  'Looking forward to it!',
];

const CHAR_DELAY = 40;
const AI_PROCESSING_MS = 1500;
const STEP_DELAY = 800;
const HOLD_MS = 3000;

type DemoPhase = 'typing' | 'processing' | 'email' | 'hold' | 'reset';

export function FollowUpDemo() {
  const [phase, setPhase] = useState<DemoPhase>('reset');
  const [typedChars, setTypedChars] = useState(0);
  const [isInView, setIsInView] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimers = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  // Observe viewport
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => setIsInView(entry.isIntersecting),
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Start cycle when in view
  useEffect(() => {
    if (isInView && phase === 'reset') {
      timerRef.current = setTimeout(() => {
        setTypedChars(0);
        setPhase('typing');
      }, 400);
    }
    if (!isInView) {
      clearTimers();
      setPhase('reset');
      setTypedChars(0);
    }
    return clearTimers;
  }, [isInView, phase, clearTimers]);

  // Typing phase
  useEffect(() => {
    if (phase !== 'typing') return;
    intervalRef.current = setInterval(() => {
      setTypedChars((prev) => {
        if (prev >= TRANSCRIPT_TEXT.length) {
          clearInterval(intervalRef.current!);
          timerRef.current = setTimeout(() => setPhase('processing'), STEP_DELAY);
          return prev;
        }
        return prev + 1;
      });
    }, CHAR_DELAY);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [phase]);

  // Processing -> email
  useEffect(() => {
    if (phase !== 'processing') return;
    timerRef.current = setTimeout(() => setPhase('email'), AI_PROCESSING_MS);
    return clearTimers;
  }, [phase, clearTimers]);

  // Email -> hold -> reset
  useEffect(() => {
    if (phase !== 'email') return;
    timerRef.current = setTimeout(() => setPhase('hold'), STEP_DELAY);
    return clearTimers;
  }, [phase, clearTimers]);

  useEffect(() => {
    if (phase !== 'hold') return;
    timerRef.current = setTimeout(() => {
      setPhase('reset');
      setTypedChars(0);
    }, HOLD_MS);
    return clearTimers;
  }, [phase, clearTimers]);

  const showTranscript = phase === 'typing' || phase === 'processing' || phase === 'email' || phase === 'hold';
  const showProcessing = phase === 'processing';
  const showEmail = phase === 'email' || phase === 'hold';

  return (
    <div ref={containerRef} className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-6 items-start min-h-[340px]">
      {/* Left: Transcript */}
      <AnimatePresence>
        {showTranscript && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="rounded-xl bg-[#0A1020] light:bg-gray-50 border border-[#1E2A4A] light:border-gray-200 p-5"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <div className="w-2 h-2 rounded-full bg-yellow-500" />
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="ml-2 text-xs font-medium text-[#8892B0] light:text-gray-400 uppercase tracking-wider">
                Meeting Transcript
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-[10px] font-bold text-indigo-400">JM</span>
                </div>
                <span className="text-xs text-[#8892B0] light:text-gray-400">You</span>
                <span className="text-[10px] text-[#8892B0]/50 light:text-gray-300">2:34 PM</span>
              </div>
              <p className="text-sm text-[#C0C8E0] light:text-gray-600 leading-relaxed pl-8">
                {TRANSCRIPT_TEXT.slice(0, typedChars)}
                {phase === 'typing' && (
                  <span className="inline-block w-[2px] h-4 bg-indigo-400 ml-0.5 animate-pulse align-text-bottom" />
                )}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Center: AI Processing */}
      <div className="flex flex-col items-center justify-center lg:py-12">
        <AnimatePresence>
          {showProcessing && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center gap-3"
            >
              <div className="flex items-center gap-1.5">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-2.5 h-2.5 rounded-full bg-indigo-500"
                    animate={{
                      scale: [1, 1.4, 1],
                      opacity: [0.5, 1, 0.5],
                    }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      delay: i * 0.2,
                      ease: 'easeInOut',
                    }}
                  />
                ))}
              </div>
              <span className="text-xs text-indigo-400 font-medium">Drafting email...</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Arrow indicator when not processing */}
        {!showProcessing && (showTranscript || showEmail) && (
          <div className="hidden lg:flex items-center gap-1 text-[#1E2A4A] light:text-gray-300">
            <svg width="40" height="12" viewBox="0 0 40 12" fill="none" className="opacity-40">
              <path d="M0 6h36M32 1l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        )}
      </div>

      {/* Right: Generated Email */}
      <AnimatePresence>
        {showEmail && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="rounded-xl bg-[#0A1020] light:bg-gray-50 border border-[#1E2A4A] light:border-gray-200 p-5"
          >
            {/* Email header */}
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <div className="w-2 h-2 rounded-full bg-yellow-500" />
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="ml-2 text-xs font-medium text-[#8892B0] light:text-gray-400 uppercase tracking-wider">
                AI Draft
              </span>
            </div>

            <div className="space-y-3">
              {/* Subject */}
              <div className="flex items-start gap-2">
                <span className="text-[10px] font-semibold text-[#8892B0] light:text-gray-400 uppercase tracking-wider mt-0.5 flex-shrink-0">
                  Subject
                </span>
                <span className="text-sm font-semibold text-[#E8ECF4] light:text-gray-900">
                  {EMAIL_SUBJECT}
                </span>
              </div>

              {/* To */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold text-[#8892B0] light:text-gray-400 uppercase tracking-wider flex-shrink-0">
                  To
                </span>
                <span className="text-xs text-[#C0C8E0] light:text-gray-600 bg-[#111827] light:bg-gray-100 px-2 py-0.5 rounded">
                  sarah@acme.com
                </span>
              </div>

              <div className="border-t border-[#1E2A4A] light:border-gray-200" />

              {/* Body */}
              <div className="space-y-1">
                {EMAIL_BODY.map((line, i) => (
                  <motion.p
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.08, duration: 0.3 }}
                    className={`text-xs leading-relaxed ${
                      line === '' ? 'h-2' : 'text-[#C0C8E0] light:text-gray-600'
                    }`}
                  >
                    {line}
                  </motion.p>
                ))}
              </div>

              {/* Send button */}
              <motion.button
                className="w-full mt-3 py-2.5 rounded-lg font-semibold text-sm text-black cursor-default"
                style={{ backgroundColor: '#F59E0B' }}
                animate={{
                  boxShadow: [
                    '0 0 0px rgba(245,158,11,0)',
                    '0 0 20px rgba(245,158,11,0.4)',
                    '0 0 0px rgba(245,158,11,0)',
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              >
                Send Follow-Up
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
