// components/product/MeetingIntelligenceDemo.tsx
'use client';

import { motion, useInView, type Variants } from 'framer-motion';
import { useRef, useState, useEffect, useCallback } from 'react';
import { CheckSquare, AlertTriangle, User, Calendar } from 'lucide-react';

const nextSteps = [
  { task: 'Send pricing proposal', assignee: 'Sarah', due: 'Mar 22' },
  { task: 'Schedule technical review', assignee: 'Mike', due: 'Mar 25' },
  { task: 'Share case studies', assignee: 'You', due: 'Mar 20' },
];

const riskFlags = ['No budget discussed', 'Timeline unclear'];

const actionItems = [
  'Confirm decision-maker availability',
  'Prepare ROI breakdown',
  'Draft implementation timeline',
  'Follow up on security requirements',
];

const ACCENT = '#06B6D4';

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

function ConfidenceGauge({ animate }: { animate: boolean }) {
  const targetValue = 72;
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!animate) {
      setValue(0);
      return;
    }

    let frame: number;
    const start = performance.now();
    const duration = 1200;

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out quad
      const eased = 1 - (1 - progress) * (1 - progress);
      setValue(Math.round(eased * targetValue));
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [animate]);

  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="88" height="88" viewBox="0 0 88 88" className="-rotate-90">
        <circle
          cx="44"
          cy="44"
          r={radius}
          fill="none"
          stroke="#1E2A4A"
          strokeWidth="6"
          className="light:stroke-gray-200"
        />
        <circle
          cx="44"
          cy="44"
          r={radius}
          fill="none"
          stroke={ACCENT}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: 'stroke-dashoffset 0.1s linear' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center" style={{ width: 88, height: 88 }}>
        <span className="text-xl font-bold text-white light:text-gray-900">{value}%</span>
      </div>
      <span className="text-xs text-[#8892B0] light:text-gray-500 font-medium mt-1">Deal Confidence</span>
    </div>
  );
}

export function MeetingIntelligenceDemo() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { amount: 0.3 });
  const [cycle, setCycle] = useState(0);
  const [phase, setPhase] = useState<'animating' | 'holding' | 'resetting'>('resetting');

  const startCycle = useCallback(() => {
    setPhase('animating');
  }, []);

  // Trigger cycle when in view
  useEffect(() => {
    if (isInView && phase === 'resetting') {
      startCycle();
    }
  }, [isInView, phase, startCycle]);

  // Hold then reset after animation completes
  // Total animation time: meeting title (0.3s) + 3 next steps (1.8s) + risks (0.6s) + actions (0.8s) + gauge (1.2s) ~ 4.7s
  useEffect(() => {
    if (phase !== 'animating') return;
    const holdTimer = setTimeout(() => {
      setPhase('holding');
    }, 5000);
    return () => clearTimeout(holdTimer);
  }, [phase, cycle]);

  useEffect(() => {
    if (phase !== 'holding') return;
    const resetTimer = setTimeout(() => {
      setPhase('resetting');
      setCycle(c => c + 1);
    }, 3000);
    return () => clearTimeout(resetTimer);
  }, [phase]);

  const show = phase === 'animating' || phase === 'holding';

  return (
    <div ref={containerRef} className="space-y-6" key={cycle}>
      {/* Meeting Title */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate={show ? 'visible' : 'hidden'}
        transition={{ duration: 0.3 }}
        className="flex items-center gap-3 pb-4 border-b border-[#1E2A4A] light:border-gray-200"
      >
        <div
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: ACCENT }}
        />
        <h3 className="text-lg font-semibold text-white light:text-gray-900">
          Sales Discovery Call — Meridian Health
        </h3>
        <span className="ml-auto text-xs text-[#8892B0] light:text-gray-400">45 min</span>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Next Steps */}
        <div className="md:col-span-2 space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-[#8892B0] light:text-gray-400 mb-3">
            Next Steps
          </h4>
          {nextSteps.map((step, i) => (
            <motion.div
              key={step.task}
              variants={fadeUp}
              initial="hidden"
              animate={show ? 'visible' : 'hidden'}
              transition={{ delay: 0.3 + i * 0.6, duration: 0.4 }}
              className="flex items-center gap-3 rounded-lg bg-[#0A1024] light:bg-gray-50 border border-[#1E2A4A] light:border-gray-200 px-4 py-3"
            >
              <CheckSquare className="w-4 h-4 flex-shrink-0" style={{ color: ACCENT }} />
              <span className="text-sm text-white light:text-gray-900 flex-1">{step.task}</span>
              <div className="flex items-center gap-1.5 text-xs text-[#8892B0] light:text-gray-500">
                <User className="w-3 h-3" />
                <span>{step.assignee}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-[#8892B0] light:text-gray-500">
                <Calendar className="w-3 h-3" />
                <span>{step.due}</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Confidence Gauge */}
        <div className="flex flex-col items-center justify-center">
          <div className="relative flex items-center justify-center">
            <ConfidenceGauge animate={show} />
          </div>
        </div>
      </div>

      {/* Risk Flags + Action Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        {/* Risk Flags */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-[#8892B0] light:text-gray-400 mb-3">
            Risk Flags
          </h4>
          <div className="flex flex-wrap gap-2">
            {riskFlags.map((flag, i) => (
              <motion.span
                key={flag}
                variants={fadeUp}
                initial="hidden"
                animate={show ? 'visible' : 'hidden'}
                transition={{ delay: 2.4 + i * 0.3, duration: 0.3 }}
                className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 light:bg-amber-50 light:text-amber-600 light:border-amber-200"
              >
                <AlertTriangle className="w-3 h-3" />
                {flag}
              </motion.span>
            ))}
          </div>
        </div>

        {/* Action Items */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-[#8892B0] light:text-gray-400 mb-3">
            Action Items
          </h4>
          <div className="space-y-2">
            {actionItems.map((item, i) => (
              <motion.div
                key={item}
                variants={fadeUp}
                initial="hidden"
                animate={show ? 'visible' : 'hidden'}
                transition={{ delay: 3.0 + i * 0.2, duration: 0.3 }}
                className="flex items-center gap-2"
              >
                <div className="w-3.5 h-3.5 rounded border border-[#1E2A4A] light:border-gray-300 flex-shrink-0 flex items-center justify-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={show ? { scale: 1 } : { scale: 0 }}
                    transition={{ delay: 3.4 + i * 0.2, duration: 0.2 }}
                    className="w-2 h-2 rounded-sm"
                    style={{ backgroundColor: ACCENT }}
                  />
                </div>
                <span className="text-sm text-[#C0C8E0] light:text-gray-600">{item}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
