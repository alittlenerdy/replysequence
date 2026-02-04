'use client';

import { useEffect, useRef, useCallback, useState } from 'react';

interface Dot {
  id: number;
  x: number;
  y: number;
  size: number;
  createdAt: number;
}

// Configuration
const MAX_DOTS = 20;
const MIN_SIZE = 3;
const MAX_SIZE = 12;
const MAX_AGE = 1200; // milliseconds
const FADE_DISTANCE = 150; // pixels
const SPAWN_THRESHOLD = 8; // minimum pixels moved to spawn new dot

export default function MouseTrail() {
  const containerRef = useRef<HTMLDivElement>(null);
  const dotsRef = useRef<Dot[]>([]);
  const mouseRef = useRef({ x: 0, y: 0 });
  const lastSpawnRef = useRef({ x: 0, y: 0 });
  const idCounterRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const [isLightMode, setIsLightMode] = useState(false);
  const isLightModeRef = useRef(false);

  // Detect light/dark mode (dark is default)
  useEffect(() => {
    const checkLightMode = () => {
      const isLight = document.documentElement.classList.contains('light');
      setIsLightMode(isLight);
      isLightModeRef.current = isLight;
    };

    checkLightMode();

    // Watch for class changes on html element
    const observer = new MutationObserver(checkLightMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  // Generate random size for each dot
  const getRandomSize = useCallback(() => {
    return MIN_SIZE + Math.random() * (MAX_SIZE - MIN_SIZE);
  }, []);

  // Calculate distance between two points
  const getDistance = useCallback((x1: number, y1: number, x2: number, y2: number) => {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  }, []);

  // Update loop using requestAnimationFrame
  const updateDots = useCallback(() => {
    const container = containerRef.current;
    if (!container) {
      rafRef.current = requestAnimationFrame(updateDots);
      return;
    }

    const now = Date.now();
    const mouseX = mouseRef.current.x;
    const mouseY = mouseRef.current.y;

    // Filter out old dots and update opacity
    dotsRef.current = dotsRef.current.filter((dot) => {
      const age = now - dot.createdAt;
      if (age > MAX_AGE) return false;

      const distance = getDistance(mouseX, mouseY, dot.x, dot.y);
      const ageOpacity = 1 - age / MAX_AGE;
      const distanceOpacity = Math.max(0, 1 - distance / FADE_DISTANCE);
      const finalOpacity = ageOpacity * distanceOpacity;

      return finalOpacity > 0.05;
    });

    // Render dots
    const dotElements = container.children;
    const currentDots = dotsRef.current;

    // Remove extra elements
    while (dotElements.length > currentDots.length) {
      container.removeChild(container.lastChild!);
    }

    // Update or create elements
    currentDots.forEach((dot, index) => {
      const age = now - dot.createdAt;
      const distance = getDistance(mouseX, mouseY, dot.x, dot.y);
      const ageOpacity = 1 - age / MAX_AGE;
      const distanceOpacity = Math.max(0, 1 - distance / FADE_DISTANCE);
      const finalOpacity = Math.max(0, ageOpacity * distanceOpacity);

      let element = dotElements[index] as HTMLDivElement | undefined;

      if (!element) {
        element = document.createElement('div');
        element.style.position = 'fixed';
        element.style.borderRadius = '50%';
        element.style.pointerEvents = 'none';
        element.style.transform = 'translate(-50%, -50%)';
        element.style.transition = 'opacity 0.1s ease-out';
        element.style.zIndex = '9999';
        container.appendChild(element);
      }

      element.style.left = `${dot.x}px`;
      element.style.top = `${dot.y}px`;
      element.style.width = `${dot.size}px`;
      element.style.height = `${dot.size}px`;
      // Neon pink in dark mode, black in light mode
      element.style.backgroundColor = isLightModeRef.current
        ? `rgba(0, 0, 0, ${finalOpacity})`
        : `rgba(255, 0, 110, ${finalOpacity * 0.8})`;
    });

    rafRef.current = requestAnimationFrame(updateDots);
  }, [getDistance]);

  // Handle mouse movement
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      const x = e.clientX;
      const y = e.clientY;

      mouseRef.current = { x, y };

      // Check if we should spawn a new dot
      const distanceFromLastSpawn = getDistance(
        lastSpawnRef.current.x,
        lastSpawnRef.current.y,
        x,
        y
      );

      if (distanceFromLastSpawn >= SPAWN_THRESHOLD) {
        // Add new dot with random size
        const newDot: Dot = {
          id: idCounterRef.current++,
          x,
          y,
          size: getRandomSize(),
          createdAt: Date.now(),
        };

        dotsRef.current.push(newDot);

        // Limit number of dots
        if (dotsRef.current.length > MAX_DOTS) {
          dotsRef.current.shift();
        }

        lastSpawnRef.current = { x, y };
      }
    },
    [getDistance, getRandomSize]
  );

  useEffect(() => {
    // Start animation loop
    rafRef.current = requestAnimationFrame(updateDots);

    // Add mouse listener
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [updateDots, handleMouseMove]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 9999,
        overflow: 'hidden',
      }}
      aria-hidden="true"
    />
  );
}
