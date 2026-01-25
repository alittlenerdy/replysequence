'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

// Particle configuration
const PARTICLE_COUNT = 40;

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: 'mint' | 'black';
}

// Generate particles in a grid pattern
function generateParticles(): Particle[] {
  const particles: Particle[] = [];
  const cols = 8;
  const rows = 5;

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    particles.push({
      id: i,
      x: (col / (cols - 1)) * 100,
      y: (row / (rows - 1)) * 100,
      size: Math.random() * 6 + 4,
      color: Math.random() > 0.7 ? 'mint' : 'black',
    });
  }
  return particles;
}

// Zoom window mockup component
function ZoomMockup({ opacity }: { opacity: number }) {
  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center"
      style={{ opacity }}
    >
      <div className="w-full max-w-md bg-background-pure rounded-xl border-2 border-black/20 shadow-2xl overflow-hidden">
        {/* Zoom header */}
        <div className="bg-black/90 px-4 py-2 flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          <span className="text-white/80 text-xs ml-2">Zoom Meeting</span>
        </div>
        {/* Video grid */}
        <div className="p-4 bg-black/5">
          <div className="grid grid-cols-2 gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="aspect-video bg-gradient-to-br from-mint/20 to-mint/40 rounded-lg flex items-center justify-center"
              >
                <div className="w-10 h-10 rounded-full bg-mint/50" />
              </div>
            ))}
          </div>
        </div>
        {/* Controls */}
        <div className="bg-black/90 px-4 py-3 flex justify-center gap-4">
          {['Mic', 'Cam', 'Share', 'End'].map((label) => (
            <div
              key={label}
              className={`w-10 h-10 rounded-full flex items-center justify-center text-xs ${
                label === 'End' ? 'bg-neon' : 'bg-white/20'
              }`}
            >
              <span className="text-white">{label[0]}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// Email mockup component
function EmailMockup({ opacity }: { opacity: number }) {
  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center"
      style={{ opacity }}
    >
      <div className="w-full max-w-md bg-background-pure rounded-xl border-2 border-black/20 shadow-2xl overflow-hidden">
        {/* Email header */}
        <div className="bg-mint px-4 py-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white/30" />
          <div>
            <div className="text-white font-bold text-sm">Follow-up: Discovery Call</div>
            <div className="text-white/70 text-xs">To: prospect@company.com</div>
          </div>
        </div>
        {/* Email body */}
        <div className="p-4 space-y-3">
          <div className="h-3 bg-black/10 rounded w-3/4" />
          <div className="h-3 bg-black/10 rounded w-full" />
          <div className="h-3 bg-black/10 rounded w-5/6" />
          <div className="h-3 bg-black/10 rounded w-2/3" />
          <div className="h-6" />
          <div className="h-3 bg-mint/30 rounded w-4/5" />
          <div className="h-3 bg-mint/30 rounded w-3/4" />
          <div className="h-6" />
          <div className="h-3 bg-black/10 rounded w-1/2" />
        </div>
        {/* Email actions */}
        <div className="px-4 py-3 border-t border-black/10 flex gap-2">
          <button className="btn-cta !px-4 !py-2 !text-sm">Send</button>
          <button className="btn-secondary !px-4 !py-2 !text-sm !border">Edit</button>
        </div>
      </div>
    </motion.div>
  );
}

export default function HeroAnimation() {
  const [phase, setPhase] = useState<'particles-in' | 'zoom' | 'particles-mid' | 'email' | 'particles-out'>('particles-in');
  const [particles] = useState(generateParticles);

  // Animation cycle
  useEffect(() => {
    const cycle = () => {
      // Phase 1: Particles fly in
      setPhase('particles-in');

      // Phase 2: Form Zoom window
      setTimeout(() => setPhase('zoom'), 1500);

      // Phase 3: Dissolve to particles
      setTimeout(() => setPhase('particles-mid'), 4500);

      // Phase 4: Form Email
      setTimeout(() => setPhase('email'), 6000);

      // Phase 5: Dissolve out
      setTimeout(() => setPhase('particles-out'), 9000);
    };

    cycle();
    const interval = setInterval(cycle, 10500);
    return () => clearInterval(interval);
  }, []);

  const getParticleAnimation = (particle: Particle) => {
    const centerX = 50;
    const centerY = 50;
    const startX = particle.x < 50 ? -100 : 200;
    const startY = particle.y < 50 ? -100 : 200;

    switch (phase) {
      case 'particles-in':
        return {
          x: [`${startX}%`, `${particle.x}%`],
          y: [`${startY}%`, `${particle.y}%`],
          opacity: [0, 1],
          scale: [0.5, 1],
        };
      case 'zoom':
      case 'email':
        return {
          x: `${centerX}%`,
          y: `${centerY}%`,
          opacity: 0,
          scale: 0,
        };
      case 'particles-mid':
        return {
          x: [`${centerX}%`, `${particle.x}%`],
          y: [`${centerY}%`, `${particle.y}%`],
          opacity: [0, 1],
          scale: [0, 1],
        };
      case 'particles-out':
        return {
          x: [`${particle.x}%`, `${startX}%`],
          y: [`${particle.y}%`, `${startY}%`],
          opacity: [1, 0],
          scale: [1, 0.5],
        };
    }
  };

  return (
    <div className="relative w-full h-[400px] lg:h-[500px]">
      {/* Glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-mint/5 via-transparent to-neon/5 rounded-3xl" />

      {/* Particles */}
      <div className="absolute inset-0">
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute rounded-full"
            style={{
              width: particle.size,
              height: particle.size,
              backgroundColor: particle.color === 'mint' ? 'var(--mint)' : '#000',
            }}
            animate={getParticleAnimation(particle)}
            transition={{
              duration: 1.5,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* Mockups */}
      <AnimatePresence mode="wait">
        {phase === 'zoom' && (
          <motion.div
            key="zoom"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0"
          >
            <ZoomMockup opacity={1} />
          </motion.div>
        )}
        {phase === 'email' && (
          <motion.div
            key="email"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0"
          >
            <EmailMockup opacity={1} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Label */}
      <motion.div
        className="absolute bottom-4 left-1/2 -translate-x-1/2 text-text-caption text-sm font-medium"
        animate={{
          opacity: phase === 'zoom' || phase === 'email' ? 1 : 0,
        }}
      >
        {phase === 'zoom' && 'Zoom Call Recording'}
        {phase === 'email' && 'AI-Generated Follow-up'}
      </motion.div>
    </div>
  );
}
