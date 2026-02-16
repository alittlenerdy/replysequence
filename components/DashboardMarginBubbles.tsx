'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

// Static bubbles - deterministic to avoid hydration mismatch
const STATIC_BUBBLES = [
  { id: 'bubble-0', size: 65, x: 5, startY: -120, delay: 0.5, duration: 12, colorType: 0, opacity: 0.65 },
  { id: 'bubble-1', size: 45, x: 15, startY: -180, delay: 2.1, duration: 14, colorType: 1, opacity: 0.72 },
  { id: 'bubble-2', size: 85, x: 25, startY: -150, delay: 0.8, duration: 16, colorType: 2, opacity: 0.58 },
  { id: 'bubble-3', size: 55, x: 35, startY: -200, delay: 3.5, duration: 11, colorType: 0, opacity: 0.80 },
  { id: 'bubble-4', size: 75, x: 45, startY: -130, delay: 1.2, duration: 15, colorType: 1, opacity: 0.68 },
  { id: 'bubble-5', size: 40, x: 55, startY: -170, delay: 4.2, duration: 13, colorType: 2, opacity: 0.75 },
  { id: 'bubble-6', size: 95, x: 65, startY: -140, delay: 0.3, duration: 17, colorType: 0, opacity: 0.62 },
  { id: 'bubble-7', size: 50, x: 75, startY: -190, delay: 2.8, duration: 12, colorType: 1, opacity: 0.78 },
  { id: 'bubble-8', size: 70, x: 85, startY: -160, delay: 5.1, duration: 14, colorType: 2, opacity: 0.70 },
  { id: 'bubble-9', size: 60, x: 95, startY: -110, delay: 1.8, duration: 16, colorType: 0, opacity: 0.66 },
  { id: 'bubble-10', size: 80, x: 10, startY: -145, delay: 3.9, duration: 15, colorType: 1, opacity: 0.73 },
  { id: 'bubble-11', size: 35, x: 20, startY: -175, delay: 0.1, duration: 11, colorType: 2, opacity: 0.82 },
  { id: 'bubble-12', size: 90, x: 30, startY: -125, delay: 4.6, duration: 18, colorType: 0, opacity: 0.60 },
  { id: 'bubble-13', size: 48, x: 40, startY: -195, delay: 2.4, duration: 13, colorType: 1, opacity: 0.77 },
  { id: 'bubble-14', size: 72, x: 50, startY: -155, delay: 5.5, duration: 12, colorType: 2, opacity: 0.69 },
  { id: 'bubble-15', size: 58, x: 60, startY: -185, delay: 1.5, duration: 14, colorType: 0, opacity: 0.74 },
  { id: 'bubble-16', size: 82, x: 70, startY: -135, delay: 3.2, duration: 16, colorType: 1, opacity: 0.64 },
  { id: 'bubble-17', size: 42, x: 80, startY: -165, delay: 0.7, duration: 15, colorType: 2, opacity: 0.79 },
  { id: 'bubble-18', size: 68, x: 90, startY: -115, delay: 4.0, duration: 11, colorType: 0, opacity: 0.71 },
  { id: 'bubble-19', size: 52, x: 98, startY: -205, delay: 2.0, duration: 17, colorType: 1, opacity: 0.67 },
];

export default function DashboardMarginBubbles() {
  const bubbles = STATIC_BUBBLES;
  const [isLight, setIsLight] = useState(false);

  // Check for light mode (dark is now default)
  useEffect(() => {
    const checkLightMode = () => {
      setIsLight(document.documentElement.classList.contains('light'));
    };

    checkLightMode();

    // Watch for class changes
    const observer = new MutationObserver(checkLightMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    return () => observer.disconnect();
  }, []);

  const renderBubble = (bubble: typeof STATIC_BUBBLES[0]) => {
    // Dark mode (default): brighter colors at lower opacity
    // Light mode: dark colors at higher opacity
    const colors = isLight
      ? [
          `rgba(59, 130, 246, ${bubble.opacity * 0.18})`,   // blue-500 visible
          `rgba(147, 51, 234, ${bubble.opacity * 0.15})`,   // purple-600 visible
          `rgba(236, 72, 153, ${bubble.opacity * 0.15})`,   // pink-500 visible
        ]
      : [
          `rgba(59, 130, 246, ${bubble.opacity * 0.4})`,  // blue-500
          `rgba(147, 51, 234, ${bubble.opacity * 0.4})`,  // purple-600
          `rgba(236, 72, 153, ${bubble.opacity * 0.4})`,  // pink-500
        ];

    const baseColor = colors[bubble.colorType];

    return (
      <motion.div
        key={bubble.id}
        style={{
          position: 'absolute',
          width: bubble.size,
          height: bubble.size,
          left: `${bubble.x}vw`,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${baseColor} 0%, ${baseColor} 50%, transparent 85%)`,
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
          times: [0, 0.1, 0.9, 1],
        }}
      />
    );
  };

  return (
    <div
      className="pointer-events-none"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        zIndex: 0,
      }}
    >
      {bubbles.map((bubble) => renderBubble(bubble))}
    </div>
  );
}
