'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function HeroAnimation() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Animated orbs configuration
  const orbs = [
    { size: 300, x: '20%', y: '30%', color: 'blue', delay: 0 },
    { size: 250, x: '70%', y: '40%', color: 'purple', delay: 0.5 },
    { size: 200, x: '50%', y: '60%', color: 'pink', delay: 1 },
    { size: 150, x: '80%', y: '20%', color: 'blue', delay: 1.5 },
    { size: 180, x: '10%', y: '70%', color: 'purple', delay: 2 },
  ];

  const getGradient = (color: string) => {
    switch (color) {
      case 'blue':
        return 'from-blue-500/30 to-blue-600/10';
      case 'purple':
        return 'from-purple-500/30 to-purple-600/10';
      case 'pink':
        return 'from-pink-500/30 to-pink-600/10';
      default:
        return 'from-blue-500/30 to-blue-600/10';
    }
  };

  return (
    <div className="relative w-full h-[500px] md:h-[600px] overflow-hidden">
      {/* Animated floating orbs */}
      {orbs.map((orb, index) => (
        <motion.div
          key={index}
          className={`absolute rounded-full bg-gradient-to-br ${getGradient(orb.color)} blur-3xl`}
          style={{
            width: orb.size,
            height: orb.size,
            left: orb.x,
            top: orb.y,
            transform: 'translate(-50%, -50%)',
          }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{
            opacity: [0.3, 0.6, 0.3],
            scale: [1, 1.2, 1],
            x: [0, 30, -30, 0],
            y: [0, -20, 20, 0],
          }}
          transition={{
            duration: 8 + index * 2,
            repeat: Infinity,
            delay: orb.delay,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Central visualization */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.5 }}
      >
        <div className="relative">
          {/* Outer ring */}
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-blue-500/20"
            style={{ width: 320, height: 320, margin: 'auto', left: 0, right: 0, top: 0, bottom: 0 }}
            animate={{ rotate: 360 }}
            transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
          >
            {/* Orbiting dots */}
            {[0, 90, 180, 270].map((angle, i) => (
              <motion.div
                key={i}
                className="absolute w-3 h-3 rounded-full bg-blue-400"
                style={{
                  top: '50%',
                  left: '50%',
                  transform: `rotate(${angle}deg) translateX(160px) translateY(-50%)`,
                }}
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}
              />
            ))}
          </motion.div>

          {/* Middle ring */}
          <motion.div
            className="absolute inset-0 rounded-full border border-purple-500/30"
            style={{ width: 240, height: 240, margin: 'auto', left: 0, right: 0, top: 0, bottom: 0 }}
            animate={{ rotate: -360 }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          >
            {[45, 135, 225, 315].map((angle, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 rounded-full bg-purple-400"
                style={{
                  top: '50%',
                  left: '50%',
                  transform: `rotate(${angle}deg) translateX(120px) translateY(-50%)`,
                }}
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}
              />
            ))}
          </motion.div>

          {/* Inner ring */}
          <motion.div
            className="absolute inset-0 rounded-full border border-pink-500/20"
            style={{ width: 160, height: 160, margin: 'auto', left: 0, right: 0, top: 0, bottom: 0 }}
            animate={{ rotate: 360 }}
            transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
          />

          {/* Center piece */}
          <motion.div
            className="relative w-80 h-80 flex items-center justify-center"
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <div className="relative">
              {/* Glowing core */}
              <motion.div
                className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-2xl shadow-purple-500/50"
                animate={{
                  boxShadow: [
                    '0 0 60px rgba(139, 92, 246, 0.5)',
                    '0 0 100px rgba(139, 92, 246, 0.8)',
                    '0 0 60px rgba(139, 92, 246, 0.5)',
                  ],
                }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                {/* AI Icon */}
                <div className="w-full h-full flex items-center justify-center">
                  <svg className="w-12 h-12 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                  </svg>
                </div>
              </motion.div>

              {/* Floating elements around core */}
              {[
                { icon: '📧', angle: 0, distance: 80 },
                { icon: '📝', angle: 72, distance: 90 },
                { icon: '🎯', angle: 144, distance: 85 },
                { icon: '⚡', angle: 216, distance: 88 },
                { icon: '✅', angle: 288, distance: 82 },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  className="absolute w-10 h-10 rounded-xl bg-gray-900/80 border border-gray-700 flex items-center justify-center text-lg backdrop-blur-sm"
                  style={{
                    top: '50%',
                    left: '50%',
                  }}
                  initial={{
                    x: Math.cos((item.angle * Math.PI) / 180) * item.distance - 20,
                    y: Math.sin((item.angle * Math.PI) / 180) * item.distance - 20,
                  }}
                  animate={{
                    x: Math.cos((item.angle * Math.PI) / 180) * item.distance - 20,
                    y: Math.sin((item.angle * Math.PI) / 180) * item.distance - 20,
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    scale: { duration: 2, repeat: Infinity, delay: i * 0.2 },
                  }}
                >
                  {item.icon}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Connection lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(59, 130, 246, 0.5)" />
            <stop offset="100%" stopColor="rgba(139, 92, 246, 0.5)" />
          </linearGradient>
        </defs>
        {/* Animated connection lines */}
        {[...Array(6)].map((_, i) => (
          <motion.line
            key={i}
            x1="50%"
            y1="50%"
            x2={`${20 + Math.random() * 60}%`}
            y2={`${20 + Math.random() * 60}%`}
            stroke="url(#lineGradient)"
            strokeWidth="1"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: [0, 0.5, 0] }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: i * 0.5,
              ease: 'easeInOut',
            }}
          />
        ))}
      </svg>
    </div>
  );
}
