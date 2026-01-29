'use client';

import { useState, useEffect, useRef } from 'react';

interface CountUpProps {
  end: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  startOnMount?: boolean;
}

export function CountUp({
  end,
  duration = 1500,
  prefix = '',
  suffix = '',
  decimals = 0,
  startOnMount = true,
}: CountUpProps) {
  const [count, setCount] = useState(startOnMount ? 0 : end);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!startOnMount || hasAnimated) return;

    // Use Intersection Observer to start animation when visible
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          animateCount();
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [end, hasAnimated, startOnMount]);

  const animateCount = () => {
    const startTime = performance.now();
    const startValue = 0;

    const updateCount = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out cubic for smooth deceleration
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentValue = startValue + (end - startValue) * easeOut;

      setCount(currentValue);

      if (progress < 1) {
        requestAnimationFrame(updateCount);
      } else {
        setCount(end);
      }
    };

    requestAnimationFrame(updateCount);
  };

  const formatNumber = (num: number) => {
    if (decimals > 0) {
      return num.toFixed(decimals);
    }
    return Math.floor(num).toString();
  };

  return (
    <span ref={ref}>
      {prefix}
      {formatNumber(count)}
      {suffix}
    </span>
  );
}
