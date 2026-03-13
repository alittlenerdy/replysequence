'use client';

import { motion } from 'framer-motion';
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
  show: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
};

export function IntelligenceSidebar() {
  return (
    <motion.aside
      className="space-y-4 lg:sticky lg:top-8 lg:self-start"
      variants={sidebarContainer}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={sidebarItem}>
        <h3 className="text-xs font-medium uppercase tracking-wider text-gray-500 light:text-gray-400 mb-3 px-1">Intelligence</h3>
      </motion.div>
      <motion.div variants={sidebarItem}>
        <BriefingsSection />
      </motion.div>
      <motion.div variants={sidebarItem}>
        <NextStepTimeline compact />
      </motion.div>
      <motion.div variants={sidebarItem}>
        <DealRiskAlerts compact />
      </motion.div>
    </motion.aside>
  );
}
