// components/product/SequenceDemo.tsx
'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SequenceStep {
  title: string;
  day: number;
  status: 'Sent' | 'Scheduled' | 'Draft';
  description: string;
}

const steps: SequenceStep[] = [
  {
    title: 'Follow-up email',
    day: 0,
    status: 'Sent',
    description: 'Recap key discussion points and confirm next steps from the meeting.',
  },
  {
    title: 'Check-in if no reply',
    day: 3,
    status: 'Scheduled',
    description: 'Gentle nudge referencing specific topics they showed interest in.',
  },
  {
    title: 'Value-add resource',
    day: 7,
    status: 'Scheduled',
    description: 'Share a relevant case study or resource tied to their pain points.',
  },
  {
    title: 'Final nudge',
    day: 14,
    status: 'Draft',
    description: 'Last touch with a clear call-to-action and easy way to re-engage.',
  },
];

const statusStyles: Record<string, { bg: string; text: string; lightBg: string; lightText: string }> = {
  Sent: {
    bg: 'bg-teal-500/15',
    text: 'text-teal-400',
    lightBg: 'light:bg-teal-50',
    lightText: 'light:text-teal-700',
  },
  Scheduled: {
    bg: 'bg-indigo-500/15',
    text: 'text-indigo-400',
    lightBg: 'light:bg-indigo-50',
    lightText: 'light:text-indigo-700',
  },
  Draft: {
    bg: 'bg-amber-500/15',
    text: 'text-amber-400',
    lightBg: 'light:bg-amber-50',
    lightText: 'light:text-amber-700',
  },
};

export function SequenceDemo() {
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    let isMounted = true;

    function runCycle() {
      if (!isMounted) return;

      // Reveal steps one by one
      for (let i = 0; i < steps.length; i++) {
        timeout = setTimeout(() => {
          if (isMounted) setActiveIndex(i);
        }, i * 800);
      }

      // Hold for 3s then reset and loop
      timeout = setTimeout(() => {
        if (isMounted) {
          setActiveIndex(-1);
          setTimeout(() => {
            if (isMounted) runCycle();
          }, 600);
        }
      }, steps.length * 800 + 3000);
    }

    runCycle();

    return () => {
      isMounted = false;
      clearTimeout(timeout);
    };
  }, []);

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
    >
      <h3 className="text-lg font-semibold text-[#E8ECF4] light:text-gray-900 mb-2">
        Post-Demo Sequence Preview
      </h3>
      <p className="text-sm text-[#8892B0] light:text-gray-500 mb-8">
        Every step is written from your actual conversation — not a template.
      </p>

      <div className="relative flex flex-col gap-0">
        {/* Progress line */}
        <div className="absolute left-5 top-5 bottom-5 w-px bg-[#1E2A4A] light:bg-gray-200" />
        <motion.div
          className="absolute left-5 top-5 w-px origin-top"
          style={{ backgroundColor: '#7A5CFF' }}
          animate={{
            height: activeIndex >= 0
              ? `${(activeIndex / (steps.length - 1)) * 100}%`
              : '0%',
          }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />

        {steps.map((step, i) => {
          const style = statusStyles[step.status];
          const isVisible = i <= activeIndex;

          return (
            <div key={i} className="relative pl-14 pb-8 last:pb-0">
              {/* Numbered circle */}
              <motion.div
                className={`absolute left-2.5 top-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                  isVisible
                    ? 'border-[#7A5CFF] bg-[#7A5CFF]/20 text-[#7A5CFF] light:bg-[#7A5CFF]/10'
                    : 'border-[#1E2A4A] bg-[#0F1629] text-[#8892B0] light:border-gray-300 light:bg-white light:text-gray-400'
                }`}
                animate={{ scale: isVisible ? 1 : 0.85, opacity: isVisible ? 1 : 0.4 }}
                transition={{ duration: 0.3 }}
              >
                {i + 1}
              </motion.div>

              {/* Step card */}
              <AnimatePresence>
                {isVisible && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="rounded-lg border border-[#1E2A4A] light:border-gray-200 bg-[#0A101F] light:bg-gray-50 p-4"
                  >
                    <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                      <span className="text-sm font-semibold text-[#E8ECF4] light:text-gray-900">
                        {step.title}
                      </span>
                      <span className="text-xs text-[#8892B0] light:text-gray-400 font-medium">
                        Day {step.day}
                      </span>
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${style.bg} ${style.text} ${style.lightBg} ${style.lightText}`}
                      >
                        {step.status}
                      </span>
                    </div>
                    <p className="text-xs text-[#8892B0] light:text-gray-500 leading-relaxed">
                      {step.description}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Placeholder when hidden */}
              {!isVisible && (
                <div className="h-[72px] rounded-lg border border-[#1E2A4A]/30 light:border-gray-100 bg-[#0A101F]/30 light:bg-gray-50/50" />
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
