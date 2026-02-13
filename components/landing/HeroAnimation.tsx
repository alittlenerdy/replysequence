'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Video, Users, Calendar, Mail, Database, Sparkles, MessageSquare, FileText } from 'lucide-react';

// Static connection lines - deterministic to avoid hydration mismatch
const STATIC_CONNECTION_LINES = [
  { x2: 25, y2: 35, delay: 0 },
  { x2: 75, y2: 25, delay: 0.6 },
  { x2: 85, y2: 65, delay: 1.2 },
  { x2: 35, y2: 85, delay: 1.8 },
  { x2: 15, y2: 55, delay: 2.4 },
  { x2: 65, y2: 15, delay: 3.0 },
  { x2: 55, y2: 75, delay: 3.6 },
  { x2: 45, y2: 45, delay: 4.2 },
];

export function HeroAnimation() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Outer ring icons (largest orbit) - Video platforms
  const outerRingIcons = [
    { Icon: Video, angle: 0, color: '#2D8CFF', label: 'Zoom' },           // Zoom blue
    { Icon: Users, angle: 120, color: '#5B5FC7', label: 'Teams' },        // Teams purple
    { Icon: MessageSquare, angle: 240, color: '#00897B', label: 'Meet' }, // Meet teal
  ];

  // Middle ring icons - Core features
  const middleRingIcons = [
    { Icon: Mail, angle: 45, color: '#EA4335', label: 'Email' },          // Email red
    { Icon: Calendar, angle: 165, color: '#4285F4', label: 'Calendar' },  // Calendar blue
    { Icon: Database, angle: 285, color: '#FF7A59', label: 'CRM' },       // HubSpot orange
  ];

  // Inner ring icons - AI/Docs
  const innerRingIcons = [
    { Icon: Sparkles, angle: 90, color: '#8B5CF6', label: 'AI' },         // AI purple
    { Icon: FileText, angle: 270, color: '#10B981', label: 'Docs' },      // Docs green
  ];

  return (
    <div className="relative w-full h-[500px] md:h-[700px] overflow-hidden">
      {/* Central visualization */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.5 }}
      >
        <div className="relative" style={{ willChange: 'transform' }}>
          {/* Outer ring - Video platforms */}
          <div
            className="absolute rounded-full border-2 border-blue-500/30 animate-orbit-slow"
            style={{
              width: 'min(600px, 90vw)',
              height: 'min(600px, 90vw)',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              willChange: 'transform',
            }}
          >
            {/* Platform icons on outer ring */}
            {outerRingIcons.map((item, i) => {
              const IconComponent = item.Icon;
              return (
                <div
                  key={item.label}
                  className="absolute"
                  style={{
                    top: '50%',
                    left: '50%',
                    transform: `rotate(${item.angle}deg) translateX(min(300px, 45vw)) translateY(-50%)`,
                  }}
                >
                  <motion.div
                    className="w-12 h-12 md:w-14 md:h-14 rounded-xl shadow-xl flex items-center justify-center animate-orbit-counter"
                    style={{
                      backgroundColor: item.color,
                      boxShadow: `0 4px 20px ${item.color}50`,
                      willChange: 'transform',
                    }}
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 3, repeat: Infinity, delay: i * 0.8 }}
                  >
                    <IconComponent className="w-6 h-6 md:w-7 md:h-7 text-white" strokeWidth={2} />
                  </motion.div>
                </div>
              );
            })}
          </div>

          {/* Middle ring - Core features (counter-rotate) */}
          <div
            className="absolute rounded-full border-2 border-purple-500/40 animate-orbit-reverse"
            style={{
              width: 'min(450px, 70vw)',
              height: 'min(450px, 70vw)',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              willChange: 'transform',
            }}
          >
            {/* Core feature icons on middle ring */}
            {middleRingIcons.map((item, i) => {
              const IconComponent = item.Icon;
              return (
                <div
                  key={item.label}
                  className="absolute"
                  style={{
                    top: '50%',
                    left: '50%',
                    transform: `rotate(${item.angle}deg) translateX(min(225px, 35vw)) translateY(-50%)`,
                  }}
                >
                  <motion.div
                    className="w-11 h-11 md:w-13 md:h-13 rounded-xl shadow-xl flex items-center justify-center animate-orbit-slow"
                    style={{
                      backgroundColor: item.color,
                      boxShadow: `0 4px 16px ${item.color}40`,
                      willChange: 'transform',
                    }}
                    animate={{ scale: [1, 1.08, 1] }}
                    transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.6 }}
                  >
                    <IconComponent className="w-5 h-5 md:w-6 md:h-6 text-white" strokeWidth={2} />
                  </motion.div>
                </div>
              );
            })}
          </div>

          {/* Inner ring - AI/Docs */}
          <div
            className="absolute rounded-full border border-pink-500/30 animate-orbit-fast"
            style={{
              width: 'min(300px, 50vw)',
              height: 'min(300px, 50vw)',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              willChange: 'transform',
            }}
          >
            {/* AI and Docs icons on inner ring */}
            {innerRingIcons.map((item, i) => {
              const IconComponent = item.Icon;
              return (
                <div
                  key={item.label}
                  className="absolute"
                  style={{
                    top: '50%',
                    left: '50%',
                    transform: `rotate(${item.angle}deg) translateX(min(150px, 25vw)) translateY(-50%)`,
                  }}
                >
                  <motion.div
                    className="w-9 h-9 md:w-10 md:h-10 rounded-lg shadow-lg flex items-center justify-center animate-orbit-reverse"
                    style={{
                      backgroundColor: item.color,
                      boxShadow: `0 4px 12px ${item.color}40`,
                      willChange: 'transform',
                    }}
                    animate={{ scale: [1, 1.12, 1] }}
                    transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}
                  >
                    <IconComponent className="w-4 h-4 md:w-5 md:h-5 text-white" strokeWidth={2} />
                  </motion.div>
                </div>
              );
            })}
          </div>

          {/* Center piece */}
          <motion.div
            className="relative flex items-center justify-center"
            style={{
              width: 'min(600px, 90vw)',
              height: 'min(600px, 90vw)',
            }}
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <div className="relative">
              {/* Outer glow ring - use opacity instead of scale for better perf */}
              <motion.div
                className="absolute rounded-3xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 blur-xl"
                style={{
                  width: 'min(160px, 30vw)',
                  height: 'min(160px, 30vw)',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%) scale(1.2)',
                }}
                animate={{ opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 3, repeat: Infinity }}
              />

              {/* Glowing core */}
              <div
                className="relative w-28 h-28 md:w-32 md:h-32 rounded-3xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-2xl animate-glow-pulse"
                style={{ willChange: 'transform, box-shadow' }}
              >
                {/* AI Icon */}
                <div className="w-full h-full flex items-center justify-center">
                  <svg className="w-14 h-14 md:w-16 md:h-16 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                  </svg>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Connection lines - subtle background effect */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30">
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(59, 130, 246, 0.5)" />
            <stop offset="100%" stopColor="rgba(139, 92, 246, 0.5)" />
          </linearGradient>
        </defs>
        {/* Animated connection lines */}
        {STATIC_CONNECTION_LINES.map((line, i) => (
          <motion.line
            key={i}
            x1="50%"
            y1="50%"
            x2={`${line.x2}%`}
            y2={`${line.y2}%`}
            stroke="url(#lineGradient)"
            strokeWidth="1"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: [0, 0.6, 0] }}
            transition={{
              duration: 4,
              repeat: Infinity,
              delay: line.delay,
              ease: 'easeInOut',
            }}
          />
        ))}
      </svg>
    </div>
  );
}
