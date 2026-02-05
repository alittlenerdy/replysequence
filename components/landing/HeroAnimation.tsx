'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Zap, CheckCircle2, Mail, BarChart3, FileText } from 'lucide-react';

export function HeroAnimation() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Orbiting icons configuration - Lucide icons instead of emojis
  const orbitingIcons = [
    { Icon: Mail, angle: 0, color: 'from-blue-500 to-blue-600' },
    { Icon: FileText, angle: 72, color: 'from-purple-500 to-purple-600' },
    { Icon: BarChart3, angle: 144, color: 'from-pink-500 to-pink-600' },
    { Icon: Zap, angle: 216, color: 'from-cyan-500 to-cyan-600' },
    { Icon: CheckCircle2, angle: 288, color: 'from-emerald-500 to-emerald-600' },
  ];

  return (
    <div className="relative w-full h-[500px] md:h-[700px] overflow-hidden">
      {/* Central visualization - BIGGER */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.5 }}
      >
        <div className="relative">
          {/* Outer ring - MUCH BIGGER */}
          <motion.div
            className="absolute rounded-full border-2 border-blue-500/30"
            style={{
              width: 'min(600px, 90vw)',
              height: 'min(600px, 90vw)',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
          >
            {/* Orbiting dots on outer ring */}
            {[0, 90, 180, 270].map((angle, i) => (
              <motion.div
                key={i}
                className="absolute w-4 h-4 rounded-full bg-blue-400 shadow-lg shadow-blue-400/50"
                style={{
                  top: '50%',
                  left: '50%',
                  transform: `rotate(${angle}deg) translateX(min(300px, 45vw)) translateY(-50%)`,
                }}
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}
              />
            ))}
          </motion.div>

          {/* Middle ring - BIGGER */}
          <motion.div
            className="absolute rounded-full border-2 border-purple-500/40"
            style={{
              width: 'min(450px, 70vw)',
              height: 'min(450px, 70vw)',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
            animate={{ rotate: -360 }}
            transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
          >
            {/* Orbiting icons - Professional Lucide icons */}
            {orbitingIcons.map((item, i) => {
              const IconComponent = item.Icon;
              return (
                <motion.div
                  key={i}
                  className={`absolute w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br ${item.color} shadow-xl flex items-center justify-center`}
                  style={{
                    top: '50%',
                    left: '50%',
                    transform: `rotate(${item.angle}deg) translateX(min(225px, 35vw)) translateY(-50%)`,
                  }}
                  animate={{
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    scale: { duration: 2, repeat: Infinity, delay: i * 0.3 },
                  }}
                >
                  {/* Counter-rotate to keep icons upright */}
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
                  >
                    <IconComponent className="w-7 h-7 md:w-8 md:h-8 text-white" strokeWidth={2} />
                  </motion.div>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Inner ring - BIGGER */}
          <motion.div
            className="absolute rounded-full border border-pink-500/30"
            style={{
              width: 'min(300px, 50vw)',
              height: 'min(300px, 50vw)',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          >
            {/* Small orbiting dots */}
            {[30, 120, 210, 300].map((angle, i) => (
              <motion.div
                key={i}
                className="absolute w-3 h-3 rounded-full bg-pink-400 shadow-lg shadow-pink-400/50"
                style={{
                  top: '50%',
                  left: '50%',
                  transform: `rotate(${angle}deg) translateX(min(150px, 25vw)) translateY(-50%)`,
                }}
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.4 }}
              />
            ))}
          </motion.div>

          {/* Center piece - BIGGER */}
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
              {/* Outer glow ring */}
              <motion.div
                className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 blur-xl"
                style={{
                  width: 'min(160px, 30vw)',
                  height: 'min(160px, 30vw)',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                }}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 0.8, 0.5],
                }}
                transition={{ duration: 3, repeat: Infinity }}
              />

              {/* Glowing core - BIGGER (120px) */}
              <motion.div
                className="relative w-28 h-28 md:w-32 md:h-32 rounded-3xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-2xl"
                animate={{
                  boxShadow: [
                    '0 0 60px rgba(139, 92, 246, 0.5), 0 0 120px rgba(59, 130, 246, 0.3)',
                    '0 0 100px rgba(139, 92, 246, 0.8), 0 0 200px rgba(59, 130, 246, 0.5)',
                    '0 0 60px rgba(139, 92, 246, 0.5), 0 0 120px rgba(59, 130, 246, 0.3)',
                  ],
                }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                {/* AI Icon - BIGGER */}
                <div className="w-full h-full flex items-center justify-center">
                  <svg className="w-14 h-14 md:w-16 md:h-16 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                  </svg>
                </div>
              </motion.div>
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
        {[...Array(8)].map((_, i) => (
          <motion.line
            key={i}
            x1="50%"
            y1="50%"
            x2={`${15 + Math.random() * 70}%`}
            y2={`${15 + Math.random() * 70}%`}
            stroke="url(#lineGradient)"
            strokeWidth="1"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: [0, 0.6, 0] }}
            transition={{
              duration: 4,
              repeat: Infinity,
              delay: i * 0.6,
              ease: 'easeInOut',
            }}
          />
        ))}
      </svg>
    </div>
  );
}
