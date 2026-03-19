'use client';

import { motion } from 'framer-motion';

interface ActiveIndicatorProps {
  left: number;
  width: number;
}

export function ActiveIndicator({ left, width }: ActiveIndicatorProps) {
  return (
    <motion.div
      className="absolute top-0 bottom-0 pointer-events-none"
      animate={{ left, width }}
      transition={{ type: 'spring', stiffness: 300, damping: 18 }}
    >
      {/* Layer 1: Glow */}
      <div className="absolute inset-[-4px] rounded-[22px] bg-[#6366F1]/20 blur-md" style={{ boxShadow: '0 0 20px rgba(91, 108, 255, 0.3), 0 0 40px rgba(91, 108, 255, 0.15)' }} />

      {/* Layer 2: Clip container */}
      <div className="absolute inset-0 rounded-[18px] overflow-hidden">
        {/* Layer 3: Rotating gradient */}
        <div className="toolbar-ring-gradient" />
      </div>

      {/* Layer 4: Inner plate — masks center, only 2px ring visible */}
      <div className="absolute inset-[2px] rounded-[16px] bg-[#060B18]/95 light:bg-white/95" />
    </motion.div>
  );
}
