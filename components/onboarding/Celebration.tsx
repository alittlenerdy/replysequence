'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';

interface CelebrationProps {
  show: boolean;
  onComplete?: () => void;
  duration?: number; // Duration in ms, default 1500
  variant?: 'confetti' | 'sparkle' | 'checkmark' | 'full'; // full = all effects
}

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  rotation: number;
  delay: number;
}

interface Sparkle {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
}

const COLORS = ['#10b981', '#34d399', '#6ee7b7', '#3b82f6', '#8b5cf6', '#a78bfa'];

export function Celebration({
  show,
  onComplete,
  duration = 1500,
  variant = 'full',
}: CelebrationProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);
  const [showCheckmark, setShowCheckmark] = useState(false);

  const generateParticles = useCallback(() => {
    const newParticles: Particle[] = [];
    const count = variant === 'full' ? 30 : 20;

    for (let i = 0; i < count; i++) {
      newParticles.push({
        id: i,
        x: 50 + (Math.random() - 0.5) * 60, // Center with spread
        y: 50 + (Math.random() - 0.5) * 40,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: 4 + Math.random() * 6,
        rotation: Math.random() * 360,
        delay: Math.random() * 0.2,
      });
    }
    return newParticles;
  }, [variant]);

  const generateSparkles = useCallback(() => {
    const newSparkles: Sparkle[] = [];
    const count = variant === 'full' ? 12 : 8;

    for (let i = 0; i < count; i++) {
      newSparkles.push({
        id: i,
        x: 30 + Math.random() * 40,
        y: 20 + Math.random() * 60,
        size: 8 + Math.random() * 16,
        delay: Math.random() * 0.3,
      });
    }
    return newSparkles;
  }, [variant]);

  useEffect(() => {
    if (show) {
      // Generate particles and sparkles
      if (variant === 'confetti' || variant === 'full') {
        setParticles(generateParticles());
      }
      if (variant === 'sparkle' || variant === 'full') {
        setSparkles(generateSparkles());
      }
      if (variant === 'checkmark' || variant === 'full') {
        setShowCheckmark(true);
      }

      // Clean up after duration
      const timer = setTimeout(() => {
        setParticles([]);
        setSparkles([]);
        setShowCheckmark(false);
        onComplete?.();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      setParticles([]);
      setSparkles([]);
      setShowCheckmark(false);
    }
  }, [show, duration, variant, onComplete, generateParticles, generateSparkles]);

  if (!show && particles.length === 0 && sparkles.length === 0 && !showCheckmark) {
    return null;
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {/* Confetti Particles */}
      <AnimatePresence>
        {particles.map((particle) => (
          <motion.div
            key={`particle-${particle.id}`}
            initial={{
              opacity: 1,
              x: `${particle.x}vw`,
              y: `${particle.y}vh`,
              scale: 0,
              rotate: 0,
            }}
            animate={{
              opacity: [1, 1, 0],
              x: `${particle.x + (Math.random() - 0.5) * 30}vw`,
              y: `${particle.y + 30 + Math.random() * 20}vh`,
              scale: [0, 1.2, 1],
              rotate: particle.rotation + Math.random() * 360,
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: duration / 1000,
              delay: particle.delay,
              ease: [0.2, 0.8, 0.2, 1],
            }}
            style={{
              position: 'absolute',
              width: particle.size,
              height: particle.size,
              backgroundColor: particle.color,
              borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            }}
          />
        ))}
      </AnimatePresence>

      {/* Sparkle Effects */}
      <AnimatePresence>
        {sparkles.map((sparkle) => (
          <motion.div
            key={`sparkle-${sparkle.id}`}
            initial={{
              opacity: 0,
              scale: 0,
              x: `${sparkle.x}vw`,
              y: `${sparkle.y}vh`,
            }}
            animate={{
              opacity: [0, 1, 1, 0],
              scale: [0, 1, 1.2, 0],
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: (duration / 1000) * 0.8,
              delay: sparkle.delay,
              ease: 'easeOut',
            }}
            className="absolute"
            style={{
              width: sparkle.size,
              height: sparkle.size,
            }}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="w-full h-full"
            >
              <path
                d="M12 2L13.09 8.26L18 6L14.74 10.91L21 12L14.74 13.09L18 18L13.09 15.74L12 22L10.91 15.74L6 18L9.26 13.09L3 12L9.26 10.91L6 6L10.91 8.26L12 2Z"
                fill="url(#sparkle-gradient)"
              />
              <defs>
                <linearGradient id="sparkle-gradient" x1="3" y1="2" x2="21" y2="22">
                  <stop stopColor="#10b981" />
                  <stop offset="1" stopColor="#3b82f6" />
                </linearGradient>
              </defs>
            </svg>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Success Checkmark */}
      <AnimatePresence>
        {showCheckmark && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 20,
            }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          >
            <motion.div
              initial={{ scale: 1 }}
              animate={{ scale: [1, 1.1, 1] }}
              transition={{
                duration: 0.4,
                delay: 0.2,
              }}
              className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-2xl shadow-emerald-500/40"
            >
              <motion.div
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.1 }}
              >
                <Check className="w-10 h-10 text-white" strokeWidth={3} />
              </motion.div>
            </motion.div>

            {/* Ripple effect */}
            <motion.div
              initial={{ opacity: 0.6, scale: 1 }}
              animate={{ opacity: 0, scale: 2 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="absolute inset-0 rounded-full border-2 border-emerald-400"
            />
            <motion.div
              initial={{ opacity: 0.4, scale: 1 }}
              animate={{ opacity: 0, scale: 2.5 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="absolute inset-0 rounded-full border-2 border-emerald-400"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Mini celebration for inline use (smaller, positioned relative to parent)
export function MiniCelebration({
  show,
  onComplete,
}: {
  show: boolean;
  onComplete?: () => void;
}) {
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);

  useEffect(() => {
    if (show) {
      const newSparkles: Sparkle[] = [];
      for (let i = 0; i < 6; i++) {
        newSparkles.push({
          id: i,
          x: 20 + Math.random() * 60,
          y: 20 + Math.random() * 60,
          size: 6 + Math.random() * 10,
          delay: Math.random() * 0.2,
        });
      }
      setSparkles(newSparkles);

      const timer = setTimeout(() => {
        setSparkles([]);
        onComplete?.();
      }, 800);

      return () => clearTimeout(timer);
    } else {
      setSparkles([]);
    }
  }, [show, onComplete]);

  if (!show && sparkles.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <AnimatePresence>
        {sparkles.map((sparkle) => (
          <motion.div
            key={sparkle.id}
            initial={{
              opacity: 0,
              scale: 0,
              left: `${sparkle.x}%`,
              top: `${sparkle.y}%`,
            }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
            }}
            transition={{
              duration: 0.6,
              delay: sparkle.delay,
            }}
            className="absolute"
            style={{
              width: sparkle.size,
              height: sparkle.size,
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
              <path
                d="M12 2L13.09 8.26L18 6L14.74 10.91L21 12L14.74 13.09L18 18L13.09 15.74L12 22L10.91 15.74L6 18L9.26 13.09L3 12L9.26 10.91L6 6L10.91 8.26L12 2Z"
                fill="#10b981"
              />
            </svg>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
