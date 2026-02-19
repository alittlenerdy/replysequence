'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

export function BlueprintGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener('resize', resize);

    // Grid settings
    const gridSize = 50;
    const nodeRadius = 2;
    let time = 0;
    let animationId: number;

    // Nodes array for pulsing effects
    const nodes: { x: number; y: number; pulseOffset: number }[] = [];

    const initNodes = () => {
      nodes.length = 0;
      const rect = canvas.getBoundingClientRect();
      for (let x = gridSize; x < rect.width; x += gridSize) {
        for (let y = gridSize; y < rect.height; y += gridSize) {
          nodes.push({
            x,
            y,
            pulseOffset: Math.random() * Math.PI * 2,
          });
        }
      }
    };
    initNodes();

    // Data flow particles
    const particles: { x: number; y: number; vx: number; vy: number; life: number }[] = [];

    const spawnParticle = () => {
      const rect = canvas.getBoundingClientRect();
      const edge = Math.floor(Math.random() * 4);
      let x, y, vx, vy;

      switch (edge) {
        case 0: // top
          x = Math.random() * rect.width;
          y = 0;
          vx = (Math.random() - 0.5) * 2;
          vy = Math.random() * 2 + 1;
          break;
        case 1: // right
          x = rect.width;
          y = Math.random() * rect.height;
          vx = -(Math.random() * 2 + 1);
          vy = (Math.random() - 0.5) * 2;
          break;
        case 2: // bottom
          x = Math.random() * rect.width;
          y = rect.height;
          vx = (Math.random() - 0.5) * 2;
          vy = -(Math.random() * 2 + 1);
          break;
        default: // left
          x = 0;
          y = Math.random() * rect.height;
          vx = Math.random() * 2 + 1;
          vy = (Math.random() - 0.5) * 2;
      }

      particles.push({ x, y, vx, vy, life: 1 });
    };

    const animate = () => {
      const rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);

      time += 0.02;

      // Draw grid lines
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.1)';
      ctx.lineWidth = 0.5;

      for (let x = gridSize; x < rect.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, rect.height);
        ctx.stroke();
      }

      for (let y = gridSize; y < rect.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(rect.width, y);
        ctx.stroke();
      }

      // Draw and animate nodes
      nodes.forEach((node) => {
        const pulse = Math.sin(time * 2 + node.pulseOffset) * 0.5 + 0.5;
        const radius = nodeRadius + pulse * 2;
        const opacity = 0.3 + pulse * 0.4;

        // Glow effect
        const gradient = ctx.createRadialGradient(
          node.x, node.y, 0,
          node.x, node.y, radius * 4
        );
        gradient.addColorStop(0, `rgba(79, 70, 229, ${opacity})`);
        gradient.addColorStop(0.5, `rgba(99, 102, 241, ${opacity * 0.5})`);
        gradient.addColorStop(1, 'rgba(99, 102, 241, 0)');

        ctx.beginPath();
        ctx.arc(node.x, node.y, radius * 4, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Core node
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(79, 70, 229, ${opacity + 0.3})`;
        ctx.fill();
      });

      // Spawn particles occasionally
      if (Math.random() < 0.05) {
        spawnParticle();
      }

      // Update and draw particles (data flow effect)
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.005;

        if (p.life <= 0 || p.x < 0 || p.x > rect.width || p.y < 0 || p.y > rect.height) {
          particles.splice(i, 1);
          continue;
        }

        // Draw particle trail
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 8);
        gradient.addColorStop(0, `rgba(99, 102, 241, ${p.life * 0.8})`);
        gradient.addColorStop(1, 'rgba(99, 102, 241, 0)');

        ctx.beginPath();
        ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${p.life})`;
        ctx.fill();
      }

      animationId = requestAnimationFrame(animate);
    };

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!prefersReducedMotion) {
      animate();
    } else {
      // Draw static grid for reduced motion
      const rect = canvas.getBoundingClientRect();
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.1)';
      ctx.lineWidth = 0.5;
      for (let x = gridSize; x < rect.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, rect.height);
        ctx.stroke();
      }
      for (let y = gridSize; y < rect.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(rect.width, y);
        ctx.stroke();
      }
      nodes.forEach((node) => {
        ctx.beginPath();
        ctx.arc(node.x, node.y, nodeRadius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(79, 70, 229, 0.5)';
        ctx.fill();
      });
    }

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.5, delay: 0.5 }}
      className="absolute inset-0 overflow-hidden pointer-events-none"
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ opacity: 0.6 }}
      />
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0f] via-transparent to-[#0a0a0f] light:from-gray-50 light:via-transparent light:to-gray-50" />
    </motion.div>
  );
}
