'use client';

import { motion } from 'framer-motion';
import { useMemo, useEffect, useState } from 'react';

// Generate random bubbles across entire viewport
function generateBubbles(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: `bubble-${i}`,
    size: Math.floor(Math.random() * 80) + 30, // 30-110px diameter
    x: Math.random() * 100, // 0-100vw (full width)
    startY: -100 - Math.random() * 200, // Start above viewport
    delay: Math.random() * 6, // Stagger start times
    duration: 10 + Math.random() * 8, // 10-18 seconds to fall
    colorType: Math.floor(Math.random() * 3), // 0=blue, 1=purple, 2=pink
    opacity: 0.55 + Math.random() * 0.3, // 0.55-0.85 opacity
  }));
}

export default function DashboardMarginBubbles() {
  // Generate bubbles across full viewport
  const bubbles = useMemo(() => generateBubbles(20), []);
  const [isDark, setIsDark] = useState(false);

  // Check for dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };

    checkDarkMode();

    // Watch for class changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    return () => observer.disconnect();
  }, []);

  const renderBubble = (bubble: ReturnType<typeof generateBubbles>[0]) => {
    // Light mode: pale pastels at higher opacity
    // Dark mode: brighter colors at lower opacity
    const colors = isDark
      ? [
          `rgba(59, 130, 246, ${bubble.opacity * 0.4})`,  // blue-500
          `rgba(147, 51, 234, ${bubble.opacity * 0.4})`,  // purple-600
          `rgba(236, 72, 153, ${bubble.opacity * 0.4})`,  // pink-500
        ]
      : [
          `rgba(37, 99, 235, ${bubble.opacity})`,   // blue-600
          `rgba(0, 0, 0, ${bubble.opacity})`,       // black
          `rgba(147, 51, 234, ${bubble.opacity * 0.6})`, // purple-600
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
