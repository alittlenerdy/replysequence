'use client';

import { motion } from 'framer-motion';
import { useMemo } from 'react';

// Generate random bubbles for left and right margins
function generateBubbles(side: 'left' | 'right', count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: `${side}-${i}`,
    size: Math.floor(Math.random() * 60) + 20, // 20-80px diameter
    x: side === 'left'
      ? Math.random() * 80 // 0-80px from left edge
      : Math.random() * 80, // 0-80px from right edge
    startY: -100 - Math.random() * 200, // Start above viewport
    delay: Math.random() * 8, // Stagger start times
    duration: 12 + Math.random() * 10, // 12-22 seconds to fall
    isMint: Math.random() > 0.6, // 40% chance of mint color
    opacity: 0.08 + Math.random() * 0.08, // 0.08-0.16 opacity
  }));
}

export default function DashboardMarginBubbles() {
  // Generate bubbles once on mount
  const leftBubbles = useMemo(() => generateBubbles('left', 8), []);
  const rightBubbles = useMemo(() => generateBubbles('right', 8), []);

  const renderBubble = (bubble: ReturnType<typeof generateBubbles>[0], side: 'left' | 'right') => {
    const baseColor = bubble.isMint
      ? `rgba(37, 99, 235, ${bubble.opacity})`
      : `rgba(0, 0, 0, ${bubble.opacity})`;

    return (
      <motion.div
        key={bubble.id}
        style={{
          position: 'absolute',
          width: bubble.size,
          height: bubble.size,
          [side]: bubble.x,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${baseColor} 0%, transparent 70%)`,
          pointerEvents: 'none',
        }}
        initial={{
          y: bubble.startY,
          opacity: 0,
          scale: 0.8,
        }}
        animate={{
          y: ['0vh', '120vh'],
          opacity: [0, 1, 1, 0],
          scale: [0.8, 1, 1, 0.8],
        }}
        transition={{
          duration: bubble.duration,
          delay: bubble.delay,
          repeat: Infinity,
          ease: 'linear',
          times: [0, 0.1, 0.9, 1], // Fade in at start, fade out at end
        }}
      />
    );
  };

  return (
    <>
      {/* Left margin bubbles */}
      <div
        className="pointer-events-none"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '120px',
          height: '100vh',
          overflow: 'hidden',
          zIndex: 0,
        }}
      >
        {leftBubbles.map((bubble) => renderBubble(bubble, 'left'))}
      </div>

      {/* Right margin bubbles */}
      <div
        className="pointer-events-none"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: '120px',
          height: '100vh',
          overflow: 'hidden',
          zIndex: 0,
        }}
      >
        {rightBubbles.map((bubble) => renderBubble(bubble, 'right'))}
      </div>
    </>
  );
}
