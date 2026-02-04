'use client';

import { useEffect } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  suffix?: string;
  subtitle?: string;
  gradient: string;
  accentColor: string;
  delay?: number;
}

function AnimatedCounter({ value, suffix = '' }: { value: number; suffix?: string }) {
  const spring = useSpring(0, {
    mass: 1,
    stiffness: 75,
    damping: 15,
  });

  const display = useTransform(spring, (current) => {
    return Math.floor(current).toLocaleString() + suffix;
  });

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return <motion.span>{display}</motion.span>;
}

export function StatCard({
  icon,
  label,
  value,
  suffix = '',
  subtitle,
  gradient,
  accentColor,
  delay = 0,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
      className="relative group"
    >
      {/* Glow effect on hover */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-100 rounded-2xl blur-xl transition-opacity duration-500`}
      />

      {/* Card */}
      <div className="relative bg-gray-900/50 border border-gray-700 hover:border-gray-600 rounded-2xl p-5 transition-all duration-300 overflow-hidden">
        {/* Background decoration */}
        <div
          className="absolute -right-8 -top-8 w-24 h-24 rounded-full opacity-10 blur-2xl"
          style={{ backgroundColor: accentColor }}
        />

        {/* Content */}
        <div className="relative">
          {/* Icon */}
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
            style={{ backgroundColor: `${accentColor}20` }}
          >
            <div style={{ color: accentColor }}>{icon}</div>
          </div>

          {/* Value */}
          <div className="text-3xl font-bold text-white mb-1">
            <AnimatedCounter value={value} suffix={suffix} />
          </div>

          {/* Label */}
          <div className="text-sm text-gray-400">{label}</div>

          {/* Subtitle */}
          {subtitle && (
            <div className="text-xs text-gray-500 mt-2">{subtitle}</div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
