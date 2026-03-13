'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { BriefingsSection } from './BriefingsSection';
import { NextStepTimeline } from './NextStepTimeline';
import { DealRiskAlerts } from './DealRiskAlerts';

const sidebarContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.2 },
  },
};

const sidebarItem = {
  hidden: { opacity: 0, x: 12 },
  show: { opacity: 1, x: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
};

const mobileContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

const mobileItem = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
};

/** Desktop sidebar layout — hidden on mobile */
export function IntelligenceSidebar() {
  return (
    <motion.aside
      className="hidden lg:block space-y-4 lg:sticky lg:top-8 lg:self-start"
      variants={sidebarContainer}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={sidebarItem}>
        <h3 className="text-xs font-medium uppercase tracking-wider text-gray-500 light:text-gray-400 mb-3 px-1">Intelligence</h3>
      </motion.div>
      <motion.div variants={sidebarItem} className="glass-border rounded-2xl">
        <div className="p-0.5">
          <BriefingsSection />
        </div>
      </motion.div>
      <motion.div variants={sidebarItem} className="glass-border rounded-2xl">
        <div className="p-0.5">
          <NextStepTimeline compact />
        </div>
      </motion.div>
      <motion.div variants={sidebarItem} className="glass-border rounded-2xl">
        <div className="p-0.5">
          <DealRiskAlerts compact />
        </div>
      </motion.div>
    </motion.aside>
  );
}

/** Mobile collapsible intelligence strip — hidden on desktop */
export function IntelligenceMobileStrip() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="lg:hidden mb-6">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 glass-border rounded-2xl hover:bg-white/5 light:hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
          <h3 className="text-xs font-medium uppercase tracking-wider text-gray-400 light:text-gray-500">Intelligence</h3>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-500" />
        )}
      </button>

      {isExpanded && (
        <motion.div
          className="mt-3 space-y-3"
          variants={mobileContainer}
          initial="hidden"
          animate="show"
        >
          <motion.div variants={mobileItem} className="glass-border rounded-2xl">
            <div className="p-0.5">
              <BriefingsSection />
            </div>
          </motion.div>
          <motion.div variants={mobileItem} className="glass-border rounded-2xl">
            <div className="p-0.5">
              <NextStepTimeline compact />
            </div>
          </motion.div>
          <motion.div variants={mobileItem} className="glass-border rounded-2xl">
            <div className="p-0.5">
              <DealRiskAlerts compact />
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
