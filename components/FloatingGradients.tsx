'use client';

import { motion } from 'framer-motion';

// Generate random positions for floating gradients
const gradients = [
  { size: 300, x: '10%', y: '20%', delay: 0, duration: 25 },
  { size: 200, x: '80%', y: '10%', delay: 2, duration: 20 },
  { size: 400, x: '70%', y: '60%', delay: 4, duration: 30 },
  { size: 150, x: '20%', y: '70%', delay: 1, duration: 18 },
  { size: 250, x: '50%', y: '40%', delay: 3, duration: 22 },
  { size: 180, x: '85%', y: '80%', delay: 5, duration: 24 },
  { size: 350, x: '5%', y: '50%', delay: 2.5, duration: 28 },
  { size: 120, x: '40%', y: '15%', delay: 1.5, duration: 16 },
];

const mintGradients = [
  { size: 200, x: '60%', y: '30%', delay: 1, duration: 22 },
  { size: 150, x: '25%', y: '85%', delay: 3, duration: 18 },
  { size: 100, x: '90%', y: '45%', delay: 0.5, duration: 15 },
];

export default function FloatingGradients() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Black gradient circles */}
      {gradients.map((g, i) => (
        <motion.div
          key={`black-${i}`}
          className="floating-gradient"
          style={{
            width: g.size,
            height: g.size,
            left: g.x,
            top: g.y,
          }}
          animate={{
            x: [0, 30, -20, 40, 0],
            y: [0, -40, -80, -40, 0],
            scale: [1, 1.05, 0.95, 1.02, 1],
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
          className="floating-gradient-mint"
          style={{
            width: g.size,
            height: g.size,
            left: g.x,
            top: g.y,
          }}
          animate={{
            x: [0, -30, 20, -40, 0],
            y: [0, -30, -60, -30, 0],
            scale: [1, 0.98, 1.03, 0.97, 1],
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
