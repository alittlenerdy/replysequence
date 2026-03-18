// components/product/PipelineAutomationDemo.tsx
'use client';

import { motion, useInView } from 'framer-motion';
import { useRef, useState, useEffect, useCallback } from 'react';
import { Building2, Heart, FileText, Eye, Clock, Linkedin } from 'lucide-react';

function DealHealthGauge({ value, inView }: { value: number; inView: boolean }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * (inView ? value : 0)) / 100;

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="100" height="100" viewBox="0 0 100 100" className="transform -rotate-90">
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-[#1E2A4A] light:text-gray-200"
        />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="#14B8A6"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: 'stroke-dashoffset 1.2s ease-out' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center" style={{ marginTop: 24 }}>
        <span className="text-2xl font-bold text-white light:text-gray-900">
          {inView ? value : 0}%
        </span>
      </div>
    </div>
  );
}

export function PipelineAutomationDemo() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: false, amount: 0.3 });
  const [cycle, setCycle] = useState(0);

  const resetCycle = useCallback(() => {
    setCycle((c) => c + 1);
  }, []);

  useEffect(() => {
    if (!isInView) return;
    const timer = setTimeout(resetCycle, 6000);
    return () => clearTimeout(timer);
  }, [isInView, cycle, resetCycle]);

  const step = (index: number) => ({
    initial: { opacity: 0, y: 15, scale: 0.97 },
    animate: isInView
      ? { opacity: 1, y: 0, scale: 1 }
      : { opacity: 0, y: 15, scale: 0.97 },
    transition: { delay: index * 0.8, duration: 0.5, ease: 'easeOut' },
  });

  const slideLeft = (index: number) => ({
    initial: { opacity: 0, x: -30 },
    animate: isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 },
    transition: { delay: index * 0.8, duration: 0.5, ease: 'easeOut' },
  });

  const slideRight = (index: number) => ({
    initial: { opacity: 0, x: 30 },
    animate: isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 30 },
    transition: { delay: index * 0.8, duration: 0.5, ease: 'easeOut' },
  });

  return (
    <div ref={containerRef} key={cycle} className="space-y-4">
      {/* Top row: CRM update + Deal health */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: CRM Update */}
        <motion.div
          {...slideLeft(0)}
          className="rounded-xl bg-[#0A1020] light:bg-gray-50 border border-[#1E2A4A] light:border-gray-200 p-5"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-lg bg-amber-500/15 flex items-center justify-center">
              <Building2 className="w-4.5 h-4.5 text-amber-500" />
            </div>
            <div>
              <p className="text-xs text-[#8892B0] light:text-gray-500 font-medium">CRM Updated</p>
              <p className="text-sm font-semibold text-white light:text-gray-900">Meridian Health</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#8892B0] light:text-gray-500">Deal Stage:</span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 light:text-amber-600">
              Proposal Sent
            </span>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs text-[#556688] light:text-gray-400">
            <Clock className="w-3 h-3" />
            <span>Auto-synced 2 min ago</span>
          </div>
        </motion.div>

        {/* Card 2: Deal Health Gauge */}
        <motion.div
          {...slideRight(1)}
          className="rounded-xl bg-[#0A1020] light:bg-gray-50 border border-[#1E2A4A] light:border-gray-200 p-5"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-teal-500/15 flex items-center justify-center">
              <Heart className="w-4.5 h-4.5 text-teal-500" />
            </div>
            <div>
              <p className="text-xs text-[#8892B0] light:text-gray-500 font-medium">Deal Health Score</p>
            </div>
          </div>
          <div className="relative flex items-center justify-center">
            <DealHealthGauge value={85} inView={isInView} />
          </div>
          <div className="mt-2 flex items-center justify-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-teal-500" />
            <span className="text-xs text-teal-400 light:text-teal-600 font-medium">Strong</span>
            <span className="text-xs text-[#556688] light:text-gray-400 ml-1">+5 since last call</span>
          </div>
        </motion.div>
      </div>

      {/* Card 3: Pre-Meeting Briefing */}
      <motion.div
        {...step(2)}
        className="rounded-xl bg-[#0A1020] light:bg-gray-50 border border-[#1E2A4A] light:border-gray-200 p-5"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg bg-blue-500/15 flex items-center justify-center">
            <FileText className="w-4.5 h-4.5 text-blue-500" />
          </div>
          <div>
            <p className="text-xs text-[#8892B0] light:text-gray-500 font-medium">Pre-Meeting Briefing</p>
            <p className="text-sm font-semibold text-white light:text-gray-900">Meridian Health - Follow Up</p>
          </div>
        </div>
        <ul className="space-y-2.5">
          {[
            'Budget: $45K approved by finance team',
            'Decision maker: VP Sales (Sarah Chen)',
            'Next: Technical review March 25',
            'Competitor: Evaluating Gong side-by-side',
          ].map((point, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -10 }}
              transition={{ delay: 2 * 0.8 + i * 0.15, duration: 0.3 }}
              className="flex items-start gap-2 text-sm text-[#C0C8E0] light:text-gray-700"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
              {point}
            </motion.li>
          ))}
        </ul>
      </motion.div>

      {/* Card 4: Activity Timeline */}
      <motion.div
        {...step(3)}
        className="rounded-xl bg-[#0A1020] light:bg-gray-50 border border-[#1E2A4A] light:border-gray-200 p-5"
      >
        <p className="text-xs text-[#8892B0] light:text-gray-500 font-medium mb-3">Activity Timeline</p>
        <div className="flex flex-wrap gap-3">
          {[
            { icon: Eye, label: 'Email opened 3x', color: 'text-emerald-400 light:text-emerald-600' },
            { icon: FileText, label: 'Proposal viewed 12min', color: 'text-amber-400 light:text-amber-600' },
            { icon: Linkedin, label: 'LinkedIn profile visited', color: 'text-blue-400 light:text-blue-600' },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
              transition={{ delay: 3 * 0.8 + i * 0.2, duration: 0.3 }}
              className="flex items-center gap-2 rounded-lg bg-[#0F1629] light:bg-white border border-[#1E2A4A] light:border-gray-200 px-3 py-2"
            >
              <item.icon className={`w-3.5 h-3.5 ${item.color}`} />
              <span className="text-xs text-[#C0C8E0] light:text-gray-700 font-medium">{item.label}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
