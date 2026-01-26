'use client';

import { motion } from 'framer-motion';

// Generate positions across entire viewport
const gradients = [
  { size: 400, x: '5vw', y: '10vh', delay: 0, duration: 25 },
  { size: 300, x: '75vw', y: '5vh', delay: 2, duration: 20 },
  { size: 500, x: '60vw', y: '50vh', delay: 4, duration: 30 },
  { size: 250, x: '15vw', y: '65vh', delay: 1, duration: 18 },
  { size: 350, x: '45vw', y: '30vh', delay: 3, duration: 22 },
  { size: 280, x: '85vw', y: '75vh', delay: 5, duration: 24 },
  { size: 450, x: '-5vw', y: '40vh', delay: 2.5, duration: 28 },
  { size: 200, x: '35vw', y: '85vh', delay: 1.5, duration: 16 },
  { size: 320, x: '90vw', y: '25vh', delay: 3.5, duration: 21 },
  { size: 380, x: '25vw', y: '90vh', delay: 0.5, duration: 26 },
];

const mintGradients = [
  { size: 300, x: '55vw', y: '20vh', delay: 1, duration: 22 },
  { size: 220, x: '20vw', y: '80vh', delay: 3, duration: 18 },
  { size: 180, x: '80vw', y: '45vh', delay: 0.5, duration: 15 },
  { size: 260, x: '10vw', y: '35vh', delay: 2, duration: 20 },
];

export default function FloatingGradients() {
  return (
    <div
      className="pointer-events-none"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        zIndex: 0,
      }}
    >
      {/* Black gradient circles */}
      {gradients.map((g, i) => (
        <motion.div
          key={`black-${i}`}
          style={{
            position: 'absolute',
            width: g.size,
            height: g.size,
            left: g.x,
            top: g.y,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0,0,0,0.12) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
          animate={{
            x: [0, 50, -30, 60, 0],
            y: [0, -60, -120, -60, 0],
            scale: [1, 1.08, 0.92, 1.05, 1],
          }}
          transition={{
            duration: g.duration,
            delay: g.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Mint gradient circles */}
      {mintGradients.map((g, i) => (
        <motion.div
          key={`mint-${i}`}
          style={{
            position: 'absolute',
            width: g.size,
            height: g.size,
            left: g.x,
            top: g.y,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(37,99,235,0.15) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
          animate={{
            x: [0, -40, 30, -50, 0],
            y: [0, -40, -80, -40, 0],
            scale: [1, 0.95, 1.06, 0.94, 1],
          }}
          transition={{
            duration: g.duration,
            delay: g.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}
