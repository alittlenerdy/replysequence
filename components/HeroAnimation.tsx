'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';

// Particle configuration
const PARTICLE_COUNT = 48;

interface Particle {
  id: number;
  // Target position within the hero container (percentage)
  targetX: number;
  targetY: number;
  // Start position from viewport edges (pixels, calculated dynamically)
  startAngle: number; // Angle from center to determine which edge
  size: number;
  color: 'mint' | 'black';
}

// Generate particles with target positions and edge origins
function generateParticles(): Particle[] {
  const particles: Particle[] = [];
  const cols = 8;
  const rows = 6;

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    // Calculate angle from center to this particle's target position
    const targetX = (col / (cols - 1)) * 100;
    const targetY = (row / (rows - 1)) * 100;
    const angle = Math.atan2(targetY - 50, targetX - 50);

    particles.push({
      id: i,
      targetX,
      targetY,
      startAngle: angle,
      size: Math.random() * 8 + 4,
      color: Math.random() > 0.65 ? 'mint' : 'black',
    });
  }
  return particles;
}

// Zoom window mockup component
function ZoomMockup() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="w-full max-w-md bg-white rounded-xl border-2 border-black/20 shadow-2xl overflow-hidden">
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
    </div>
  );
}

// Email mockup component
function EmailMockup() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="w-full max-w-md bg-white rounded-xl border-2 border-black/20 shadow-2xl overflow-hidden">
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
    </div>
  );
}

export default function HeroAnimation() {
  const [phase, setPhase] = useState<'particles-in' | 'zoom' | 'particles-mid' | 'email' | 'particles-out'>('particles-in');
  const [particles] = useState(generateParticles);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerRect, setContainerRect] = useState({ left: 0, top: 0, width: 0, height: 0 });

  // Get container position for calculating viewport-relative particle origins
  useEffect(() => {
    const updateRect = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerRect({
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height,
        });
      }
    };

    updateRect();
    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect);

    return () => {
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect);
    };
  }, []);

  // Animation cycle
  useEffect(() => {
    const cycle = () => {
      setPhase('particles-in');
      setTimeout(() => setPhase('zoom'), 1500);
      setTimeout(() => setPhase('particles-mid'), 4500);
      setTimeout(() => setPhase('email'), 6000);
      setTimeout(() => setPhase('particles-out'), 9000);
    };

    cycle();
    const interval = setInterval(cycle, 10500);
    return () => clearInterval(interval);
  }, []);

  // Calculate start position from viewport edge based on angle
  const getEdgePosition = (particle: Particle) => {
    const angle = particle.startAngle;
    const distance = Math.max(window.innerWidth, window.innerHeight) * 0.8;

    // Calculate position relative to container center
    const containerCenterX = containerRect.left + containerRect.width / 2;
    const containerCenterY = containerRect.top + containerRect.height / 2;

    // Start position in viewport coordinates
    const startX = containerCenterX + Math.cos(angle) * distance;
    const startY = containerCenterY + Math.sin(angle) * distance;

    // Convert to position relative to container
    const relativeStartX = startX - containerRect.left;
    const relativeStartY = startY - containerRect.top;

    return {
      startX: (relativeStartX / containerRect.width) * 100,
      startY: (relativeStartY / containerRect.height) * 100,
    };
  };

  const getParticleAnimation = (particle: Particle) => {
    const { startX, startY } = getEdgePosition(particle);
    const centerX = 50;
    const centerY = 50;

    switch (phase) {
      case 'particles-in':
        return {
          left: [`${startX}%`, `${particle.targetX}%`],
          top: [`${startY}%`, `${particle.targetY}%`],
          opacity: [0, 1],
          scale: [0.3, 1],
        };
      case 'zoom':
      case 'email':
        return {
          left: `${centerX}%`,
          top: `${centerY}%`,
          opacity: 0,
          scale: 0,
        };
      case 'particles-mid':
        return {
          left: [`${centerX}%`, `${particle.targetX}%`],
          top: [`${centerY}%`, `${particle.targetY}%`],
          opacity: [0, 1],
          scale: [0, 1],
        };
      case 'particles-out':
        return {
          left: [`${particle.targetX}%`, `${startX}%`],
          top: [`${particle.targetY}%`, `${startY}%`],
          opacity: [1, 0],
          scale: [1, 0.3],
        };
    }
  };

  return (
    <div ref={containerRef} className="relative w-full h-[400px] lg:h-[500px] overflow-visible">
      {/* Glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-mint/5 via-transparent to-neon/5 rounded-3xl" />

      {/* Particles - overflow visible to allow particles from outside */}
      <div className="absolute inset-0" style={{ overflow: 'visible' }}>
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="rounded-full"
            style={{
              position: 'absolute',
              width: particle.size,
              height: particle.size,
              backgroundColor: particle.color === 'mint' ? 'var(--mint)' : '#000',
              marginLeft: -particle.size / 2,
              marginTop: -particle.size / 2,
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
            <ZoomMockup />
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
            <EmailMockup />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Label */}
      <motion.div
        className="absolute bottom-4 left-1/2 -translate-x-1/2 text-text-caption text-sm font-medium whitespace-nowrap"
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
