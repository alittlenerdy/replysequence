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

// Avatar data for meeting participants
const meetingParticipants = [
  { initials: 'JD', name: 'John Doe', color: '#2563EB' },
  { initials: 'SK', name: 'Sarah Kim', color: '#8B5CF6' },
  { initials: 'AM', name: 'Alex Morgan', color: '#06B6D4' },
  { initials: 'RW', name: 'Rachel Wang', color: '#64748B' },
];

// Zoom window mockup component
function ZoomMockup() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="w-full max-w-md bg-white rounded-xl border-2 border-black/20 shadow-2xl overflow-hidden">
        {/* Zoom header */}
        <div className="bg-black/90 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
            </div>
            <span className="text-white/80 text-xs ml-2">Discovery Call - Q1 Planning</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-red-400 text-xs font-medium">REC</span>
          </div>
        </div>
        {/* Video grid with avatars */}
        <div className="p-3 bg-gradient-to-b from-black/5 to-black/10">
          <div className="grid grid-cols-2 gap-2">
            {meetingParticipants.map((participant, i) => (
              <div
                key={i}
                className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg flex flex-col items-center justify-center relative overflow-hidden"
              >
                {/* Avatar circle with initials */}
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg"
                  style={{ backgroundColor: participant.color }}
                >
                  {participant.initials}
                </div>
                {/* Name label */}
                <span className="text-white/80 text-[10px] mt-1.5 font-medium">
                  {participant.name}
                </span>
                {/* Mic indicator */}
                {i !== 1 && (
                  <div className="absolute bottom-1.5 right-1.5 w-4 h-4 rounded-full bg-black/50 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-green-400" />
                  </div>
                )}
                {i === 1 && (
                  <div className="absolute bottom-1.5 right-1.5 w-4 h-4 rounded-full bg-red-500/80 flex items-center justify-center">
                    <div className="w-1.5 h-0.5 bg-white rounded-full" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        {/* Controls */}
        <div className="bg-black/90 px-4 py-3 flex justify-center gap-3">
          {[
            { label: 'Mic', icon: 'M', active: true },
            { label: 'Cam', icon: 'C', active: true },
            { label: 'Share', icon: 'S', active: false },
            { label: 'End', icon: 'E', active: false, danger: true },
          ].map((btn) => (
            <div
              key={btn.label}
              className={`w-9 h-9 rounded-full flex items-center justify-center text-xs transition-colors ${
                btn.danger ? 'bg-red-500 hover:bg-red-600' : btn.active ? 'bg-white/20' : 'bg-white/10'
              }`}
            >
              <span className="text-white text-[10px] font-medium">{btn.icon}</span>
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
        {/* Email header bar */}
        <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <div className="w-3 h-3 rounded-full bg-green-400" />
          </div>
          <span className="text-gray-400 text-xs">New Message</span>
        </div>
        {/* Email metadata */}
        <div className="px-4 py-3 border-b border-gray-100 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-xs w-12">To:</span>
            <span className="text-gray-700 text-xs font-medium">sarah.kim@acmecorp.com</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-xs w-12">From:</span>
            <span className="text-gray-700 text-xs">john.doe@yourcompany.com</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-xs w-12">Subject:</span>
            <span className="text-gray-900 text-xs font-semibold">Follow-up: Q1 Planning Discussion</span>
          </div>
        </div>
        {/* Email body with realistic content */}
        <div className="px-4 py-4 text-[11px] leading-relaxed text-gray-700 space-y-3 max-h-[180px] overflow-hidden">
          <p>Hi Sarah,</p>
          <p>
            Thanks for taking the time to meet today. It was great discussing the Q1 roadmap
            and how we can support your team&apos;s goals.
          </p>
          <p>
            <span className="font-semibold text-gray-900">Key points from our call:</span>
          </p>
          <ul className="list-disc list-inside space-y-1 text-gray-600">
            <li>Timeline: Launch by March 15th</li>
            <li>Budget: $50K approved for Phase 1</li>
            <li>Next step: Technical review Thursday</li>
          </ul>
          <p>
            Looking forward to the technical deep-dive. Let me know if you need
            anything before then.
          </p>
          <p className="text-gray-500">
            Best,<br />
            <span className="font-medium text-gray-700">John Doe</span><br />
            <span className="text-gray-400">Account Executive</span>
          </p>
        </div>
        {/* Email actions */}
        <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between bg-gray-50">
          <div className="flex gap-2">
            <button className="btn-cta !px-4 !py-1.5 !text-xs !rounded-lg">Send</button>
            <button className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Edit</button>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-5 h-5 rounded bg-gray-200 flex items-center justify-center">
              <span className="text-gray-400 text-[10px]">A</span>
            </div>
            <div className="w-5 h-5 rounded bg-gray-200 flex items-center justify-center">
              <span className="text-gray-400 text-[10px]">+</span>
            </div>
          </div>
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
