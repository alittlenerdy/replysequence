'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, useInView, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  ChevronDown,
  Video,
  Sparkles,
  Mail,
  CheckCircle,
  Clock,
  Shield,
  Edit3,
  Zap,
  MessageSquare,
  Users,
  FileText,
  ArrowRight,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { GradientText } from '@/components/ui/GradientText';
import { GradientButton } from '@/components/ui/GradientButton';

// Floating particles component for hero
function FloatingParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-blue-400/30 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, Math.random() * 20 - 10, 0],
            opacity: [0.2, 0.6, 0.2],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: 3 + Math.random() * 4,
            repeat: Infinity,
            delay: Math.random() * 2,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

// Animated flow line connecting steps
function FlowLine({ progress }: { progress: number }) {
  return (
    <div className="absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2 hidden lg:block">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gray-700/50 to-transparent" />
      <motion.div
        className="absolute top-0 left-0 w-full bg-gradient-to-b from-blue-500 via-purple-500 to-pink-500"
        style={{ height: `${progress * 100}%` }}
      />
      {/* Glowing dot at the end */}
      <motion.div
        className="absolute left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-white shadow-lg shadow-purple-500/50"
        style={{ top: `${progress * 100}%` }}
        animate={{ scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      />
    </div>
  );
}

// Typewriter effect for example output
function TypewriterText({ text, delay = 0 }: { text: string; delay?: number }) {
  const [displayText, setDisplayText] = useState('');
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (isInView && !started) {
      const timer = setTimeout(() => {
        setStarted(true);
        let i = 0;
        const interval = setInterval(() => {
          if (i <= text.length) {
            setDisplayText(text.slice(0, i));
            i++;
          } else {
            clearInterval(interval);
          }
        }, 30);
        return () => clearInterval(interval);
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [isInView, text, delay, started]);

  return (
    <span ref={ref}>
      {displayText}
      {displayText.length < text.length && started && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.5, repeat: Infinity }}
          className="text-blue-400"
        >
          |
        </motion.span>
      )}
    </span>
  );
}

// Orbiting platform icons - planetary style like homepage
function OrbitingPlatforms() {
  // Outer orbit: Zoom and Meet (opposite sides)
  const outerPlatforms = [
    { Icon: ZoomIcon, color: '#2D8CFF', angle: 0, label: 'Zoom' },
    { Icon: MeetIcon, color: '#00897B', angle: 180, label: 'Meet' },
  ];

  // Middle orbit: Teams only
  const middlePlatform = { Icon: TeamsIcon, color: '#5B5FC7', angle: 90, label: 'Teams' };

  return (
    <div className="relative w-64 h-64 md:w-80 md:h-80">
      {/* Outer glow effect */}
      <motion.div
        className="absolute inset-0 rounded-full bg-gradient-to-br from-pink-500/10 via-rose-500/5 to-fuchsia-500/10 blur-2xl"
        animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Outer orbital ring */}
      <div
        className="absolute rounded-full border-2 border-blue-500/20 animate-orbit-slow"
        style={{
          width: '100%',
          height: '100%',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      >
        {/* Orbital ring glow */}
        <div className="absolute inset-0 rounded-full border border-purple-500/10" />

        {/* Zoom and Meet on outer orbit */}
        {outerPlatforms.map((item, i) => {
          const IconComponent = item.Icon;
          return (
            <div
              key={item.label}
              className="absolute"
              style={{
                top: '50%',
                left: '50%',
                transform: `rotate(${item.angle}deg) translateX(min(128px, 40vw)) translateY(-50%)`,
              }}
            >
              <motion.div
                className="w-12 h-12 md:w-14 md:h-14 rounded-xl shadow-xl flex items-center justify-center animate-orbit-counter"
                style={{
                  backgroundColor: item.color,
                  boxShadow: `0 4px 20px ${item.color}50`,
                }}
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 3, repeat: Infinity, delay: i * 0.8 }}
              >
                <IconComponent className="w-6 h-6 md:w-7 md:h-7" />
              </motion.div>
            </div>
          );
        })}
      </div>

      {/* Middle orbit for Teams */}
      <div
        className="absolute rounded-full border border-purple-500/20 animate-orbit-reverse"
        style={{
          width: '70%',
          height: '70%',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      >
        {/* Teams on middle orbit */}
        <div
          className="absolute"
          style={{
            top: '50%',
            left: '50%',
            transform: `rotate(${middlePlatform.angle}deg) translateX(min(90px, 28vw)) translateY(-50%)`,
          }}
        >
          <motion.div
            className="w-12 h-12 md:w-14 md:h-14 rounded-xl shadow-xl flex items-center justify-center animate-orbit-slow"
            style={{
              backgroundColor: middlePlatform.color,
              boxShadow: `0 4px 20px ${middlePlatform.color}50`,
            }}
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 3, repeat: Infinity, delay: 0.4 }}
          >
            <middlePlatform.Icon className="w-6 h-6 md:w-7 md:h-7" />
          </motion.div>
        </div>
      </div>

      {/* Inner decorative ring */}
      <div
        className="absolute rounded-full border border-pink-500/20"
        style={{
          width: '45%',
          height: '45%',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      />

      {/* Central glowing core */}
      <div className="absolute inset-0 flex items-center justify-center">
        {/* Outer glow */}
        <motion.div
          className="absolute w-24 h-24 md:w-28 md:h-28 rounded-full bg-gradient-to-br from-pink-500/30 to-rose-500/30 blur-xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.6, 0.9, 0.6] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Core */}
        <motion.div
          className="relative w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 shadow-2xl flex items-center justify-center"
          style={{ boxShadow: '0 0 40px rgba(244, 63, 94, 0.5)' }}
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          {/* AI Sparkle icon */}
          <svg className="w-8 h-8 md:w-10 md:h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
          </svg>
        </motion.div>
      </div>

      {/* Connection lines from center to platforms */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <defs>
          <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(244, 63, 94, 0.3)" />
            <stop offset="100%" stopColor="rgba(236, 72, 153, 0.3)" />
          </linearGradient>
        </defs>
        {/* Lines to outer platforms */}
        {outerPlatforms.map((item, i) => {
          const angle = (item.angle * Math.PI) / 180;
          const x2 = 50 + Math.cos(angle) * 40;
          const y2 = 50 + Math.sin(angle) * 40;
          return (
            <motion.line
              key={i}
              x1="50%"
              y1="50%"
              x2={`${x2}%`}
              y2={`${y2}%`}
              stroke="url(#connectionGradient)"
              strokeWidth="1"
              strokeDasharray="4 4"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.2, 0.5, 0.2] }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}
            />
          );
        })}
        {/* Line to Teams on middle orbit */}
        {(() => {
          const angle = (middlePlatform.angle * Math.PI) / 180;
          const x2 = 50 + Math.cos(angle) * 28;
          const y2 = 50 + Math.sin(angle) * 28;
          return (
            <motion.line
              x1="50%"
              y1="50%"
              x2={`${x2}%`}
              y2={`${y2}%`}
              stroke="url(#connectionGradient)"
              strokeWidth="1"
              strokeDasharray="4 4"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.2, 0.5, 0.2] }}
              transition={{ duration: 2, repeat: Infinity, delay: 1 }}
            />
          );
        })()}
      </svg>
    </div>
  );
}

// Platform icons as SVG components
function ZoomIcon({ className, fill = 'white' }: { className?: string; fill?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill={fill}>
      <path d="M4.585 6.836C3.71 6.836 3 7.547 3 8.42v7.16c0 .872.71 1.584 1.585 1.584h9.83c.875 0 1.585-.712 1.585-1.585V8.42c0-.872-.71-1.585-1.585-1.585H4.585zm12.415 2.11l3.96-2.376c.666-.4 1.04-.266 1.04.56v9.74c0 .826-.374.96-1.04.56L17 15.054V8.946z" />
    </svg>
  );
}

function TeamsIcon({ className, fill = 'white' }: { className?: string; fill?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill={fill}>
      <path d="M20.625 8.5h-6.25a.625.625 0 00-.625.625v6.25c0 .345.28.625.625.625h6.25c.345 0 .625-.28.625-.625v-6.25a.625.625 0 00-.625-.625zM17.5 6.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM12.5 8a3 3 0 100-6 3 3 0 000 6zm0 1c-2.21 0-4 1.567-4 3.5V15h8v-2.5c0-1.933-1.79-3.5-4-3.5z" />
    </svg>
  );
}

function MeetIcon({ className, fill = 'white' }: { className?: string; fill?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill={fill}>
      <path d="M12 11.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
      <path d="M15.29 15.71L18 18.41V5.59l-2.71 2.7A5.977 5.977 0 0112 7c-1.38 0-2.65.47-3.66 1.26L14.59 2H5a2 2 0 00-2 2v16a2 2 0 002 2h14a2 2 0 002-2V9.41l-5.71 6.3zM6 10a6 6 0 1112 0 6 6 0 01-12 0z" />
    </svg>
  );
}

// Accordion component for platform tips
function Accordion({
  title,
  children,
  icon,
}: {
  title: string;
  children: React.ReactNode;
  icon: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div
      className="border border-gray-700 light:border-gray-200 rounded-xl overflow-hidden"
      whileHover={{ scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-gray-800/50 light:bg-gray-50 hover:bg-gray-800 light:hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          {icon}
          <span className="font-medium text-white light:text-gray-900">{title}</span>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <ChevronDown className="w-5 h-5 text-gray-400" />
        </motion.div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="p-4 bg-gray-900/30 light:bg-white text-sm text-gray-400 light:text-gray-600">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// FAQ Item component
function FAQItem({ question, answer, index }: { question: string; answer: string; index: number }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      className="border border-gray-700 light:border-gray-200 rounded-xl overflow-hidden"
      whileHover={{ scale: 1.01, borderColor: 'rgba(139, 92, 246, 0.3)' }}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-5 bg-gray-900/50 light:bg-white hover:bg-gray-800/50 light:hover:bg-gray-50 transition-colors text-left"
      >
        <span className="font-semibold text-white light:text-gray-900 pr-4">{question}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          className="flex-shrink-0"
        >
          <ChevronDown className="w-5 h-5 text-gray-400" />
        </motion.div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="p-5 pt-0 bg-gray-900/50 light:bg-white text-gray-400 light:text-gray-600">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// 3D Tilt Step card component
function StepCard({
  step,
  icon,
  title,
  description,
  children,
  color,
}: {
  step: number;
  icon: React.ReactNode;
  title: string;
  description: string;
  children?: React.ReactNode;
  color: 'blue' | 'purple' | 'pink' | 'emerald';
}) {
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const mouseX = e.clientX - centerX;
    const mouseY = e.clientY - centerY;

    setRotateX(-mouseY / 20);
    setRotateY(mouseX / 20);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
  };

  const colorClasses = {
    blue: {
      border: 'border-blue-500/50',
      bg: 'bg-blue-500/10',
      text: 'text-blue-400',
      badge: 'bg-gradient-to-r from-blue-500 to-blue-600',
      glow: 'shadow-blue-500/30',
      hoverGlow: 'hover:shadow-blue-500/40',
    },
    purple: {
      border: 'border-purple-500/50',
      bg: 'bg-purple-500/10',
      text: 'text-purple-400',
      badge: 'bg-gradient-to-r from-purple-500 to-purple-600',
      glow: 'shadow-purple-500/30',
      hoverGlow: 'hover:shadow-purple-500/40',
    },
    pink: {
      border: 'border-pink-500/50',
      bg: 'bg-pink-500/10',
      text: 'text-pink-400',
      badge: 'bg-gradient-to-r from-pink-500 to-pink-600',
      glow: 'shadow-pink-500/30',
      hoverGlow: 'hover:shadow-pink-500/40',
    },
    emerald: {
      border: 'border-emerald-500/50',
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      badge: 'bg-gradient-to-r from-emerald-500 to-emerald-600',
      glow: 'shadow-emerald-500/30',
      hoverGlow: 'hover:shadow-emerald-500/40',
    },
  };

  const classes = colorClasses[color];

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.6, delay: step * 0.15, type: 'spring' }}
      style={{
        transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
        transformStyle: 'preserve-3d',
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative rounded-2xl bg-gray-900/50 light:bg-white light:shadow-lg border ${classes.border} p-6 md:p-8 transition-all duration-200 shadow-xl ${classes.glow} ${classes.hoverGlow}`}
    >
      {/* Animated step number badge */}
      <motion.div
        className={`absolute -top-4 left-6 px-4 py-1.5 rounded-full ${classes.badge} text-white text-sm font-bold shadow-lg ${classes.glow}`}
        animate={{ y: [0, -3, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        Step {step}
      </motion.div>

      {/* Glowing icon container */}
      <motion.div
        className={`w-16 h-16 rounded-2xl ${classes.bg} flex items-center justify-center mb-6 mt-2 border ${classes.border} relative overflow-hidden`}
        whileHover={{ scale: 1.1, rotate: 5 }}
        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
      >
        {/* Shine effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
          initial={{ x: '-200%' }}
          whileHover={{ x: '200%' }}
          transition={{ duration: 0.6 }}
        />
        <div className={classes.text}>{icon}</div>
      </motion.div>

      {/* Content */}
      <h3 className="text-xl md:text-2xl font-bold text-white light:text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-400 light:text-gray-600 mb-4">{description}</p>

      {/* Additional content */}
      {children}

      {/* Arrow indicator for next step */}
      {step < 4 && (
        <motion.div
          className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-gray-600 hidden lg:block"
          animate={{ y: [0, 5, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <ArrowRight className="w-6 h-6 rotate-90" />
        </motion.div>
      )}
    </motion.div>
  );
}

// Animated counter for stats
function AnimatedCounter({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (isInView) {
      const duration = 1500;
      const steps = 60;
      const increment = value / steps;
      let current = 0;
      const timer = setInterval(() => {
        current += increment;
        if (current >= value) {
          setCount(value);
          clearInterval(timer);
        } else {
          setCount(Math.floor(current));
        }
      }, duration / steps);
      return () => clearInterval(timer);
    }
  }, [isInView, value]);

  return (
    <span ref={ref}>
      {count}
      {suffix}
    </span>
  );
}

export default function HowItWorksPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  const flowProgress = useTransform(scrollYProgress, [0.1, 0.8], [0, 1]);

  return (
    <div ref={containerRef} className="min-h-screen bg-[#0a0a0f] light:bg-gray-50 text-white light:text-gray-900">
      <Header />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        {/* Floating particles */}
        <FloatingParticles />

        {/* Background gradient orbs - CSS animations for zero CLS */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ contain: 'layout style paint' }}>
          <div
            className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse-slow will-change-transform"
            style={{ contain: 'layout' }}
          />
          <div
            className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse-slow will-change-transform"
            style={{ animationDelay: '1s', contain: 'layout' }}
          />
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pink-500/5 rounded-full blur-3xl animate-pulse-slow will-change-transform"
            style={{ animationDelay: '2s', contain: 'layout' }}
          />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Animated badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 mb-6"
            >
              <motion.span
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              >
                <Sparkles className="w-4 h-4 text-purple-400" />
              </motion.span>
              <span className="text-sm font-medium text-gray-300 light:text-gray-700">
                Powered by Claude AI
              </span>
            </motion.div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              How <GradientText>ReplySequence</GradientText> Works
            </h1>
            <p className="text-xl text-gray-400 light:text-gray-600 max-w-2xl mx-auto mb-8">
              From meeting to follow-up email in 4 simple steps. No manual note-taking. No forgotten action items. Just perfect follow-ups, every time.
            </p>
          </motion.div>

          {/* Orbiting platforms showcase */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="flex justify-center mb-10"
          >
            <OrbitingPlatforms />
          </motion.div>

          {/* Animated stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="flex flex-wrap justify-center gap-6"
          >
            <motion.div
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20"
              whileHover={{ scale: 1.05, borderColor: 'rgba(59, 130, 246, 0.5)' }}
            >
              <Zap className="w-5 h-5 text-yellow-400" />
              <span className="text-lg font-bold text-white light:text-gray-900">
                <AnimatedCounter value={8} /> seconds
              </span>
              <span className="text-sm text-gray-400 light:text-gray-600">to draft</span>
            </motion.div>
            <motion.div
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20"
              whileHover={{ scale: 1.05, borderColor: 'rgba(16, 185, 129, 0.5)' }}
            >
              <Clock className="w-5 h-5 text-emerald-400" />
              <span className="text-lg font-bold text-white light:text-gray-900">
                <AnimatedCounter value={10} />+ hours
              </span>
              <span className="text-sm text-gray-400 light:text-gray-600">saved weekly</span>
            </motion.div>
            <motion.div
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20"
              whileHover={{ scale: 1.05, borderColor: 'rgba(168, 85, 247, 0.5)' }}
            >
              <CheckCircle className="w-5 h-5 text-purple-400" />
              <span className="text-lg font-bold text-white light:text-gray-900">
                <AnimatedCounter value={100} suffix="%" />
              </span>
              <span className="text-sm text-gray-400 light:text-gray-600">accurate</span>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Steps Section */}
      <section className="py-16 px-4 relative z-10">
        {/* Connecting flow line */}
        <motion.div style={{ opacity: flowProgress }}>
          <FlowLine progress={flowProgress.get()} />
        </motion.div>

        <div className="max-w-4xl mx-auto space-y-16 lg:space-y-24">
          {/* Step 1: Connect Your Platform */}
          <StepCard
            step={1}
            icon={<Video className="w-8 h-8" />}
            title="Connect Your Platform"
            description="Link your Zoom, Microsoft Teams, or Google Meet account with one click. We use secure OAuth to access only what we need - your meeting transcripts."
            color="blue"
          >
            <div className="mt-6 space-y-3">
              {/* Animated platform badges */}
              <div className="flex flex-wrap gap-3 mb-4">
                {[
                  { name: 'Zoom', color: '#2D8CFF', Icon: ZoomIcon },
                  { name: 'Teams', color: '#5B5FC7', Icon: TeamsIcon },
                  { name: 'Meet', color: '#00897B', Icon: MeetIcon },
                ].map(({ name, color, Icon }, i) => (
                  <motion.div
                    key={name}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    whileHover={{ scale: 1.05, y: -2 }}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg"
                    style={{
                      backgroundColor: `${color}15`,
                      border: `1px solid ${color}40`,
                    }}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm font-medium" style={{ color }}>{name}</span>
                  </motion.div>
                ))}
              </div>

              {/* Animated checklist */}
              {[
                'One-click OAuth connection',
                'Takes less than 30 seconds',
                'Minimal permissions - only transcript access',
              ].map((text, i) => (
                <motion.div
                  key={text}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="flex items-center gap-2 text-sm text-gray-400 light:text-gray-600"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 + i * 0.1, type: 'spring' }}
                  >
                    <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  </motion.div>
                  <span>{text}</span>
                </motion.div>
              ))}
            </div>
          </StepCard>

          {/* Step 2: Record Your Meeting */}
          <StepCard
            step={2}
            icon={<MessageSquare className="w-8 h-8" />}
            title="Record Your Meeting"
            description="Just enable transcription in your meeting settings and have your call as usual. ReplySequence automatically detects when a transcript is available."
            color="purple"
          >
            <div className="mt-6 space-y-3">
              <Accordion
                title="Zoom Tips"
                icon={<ZoomIcon className="w-5 h-5" />}
              >
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-0.5">1.</span>
                    Enable &ldquo;Audio Transcript&rdquo; in your Zoom settings
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-0.5">2.</span>
                    Record to cloud (not local) for automatic processing
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-0.5">3.</span>
                    Transcript is ready within minutes of meeting end
                  </li>
                </ul>
              </Accordion>

              <Accordion
                title="Microsoft Teams Tips"
                icon={<TeamsIcon className="w-5 h-5" />}
              >
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-0.5">1.</span>
                    Start transcription from the meeting controls
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-0.5">2.</span>
                    Ensure your admin has enabled transcription
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-0.5">3.</span>
                    Transcript appears in Teams chat after meeting
                  </li>
                </ul>
              </Accordion>

              <Accordion
                title="Google Meet Tips"
                icon={<MeetIcon className="w-5 h-5" />}
              >
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-teal-400 mt-0.5">1.</span>
                    Click &ldquo;Activities&rdquo; then &ldquo;Transcripts&rdquo; to enable
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-teal-400 mt-0.5">2.</span>
                    Requires Google Workspace Business Standard+
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-teal-400 mt-0.5">3.</span>
                    Transcript saves to Google Drive automatically
                  </li>
                </ul>
              </Accordion>
            </div>
          </StepCard>

          {/* Step 3: AI Analyzes Transcript */}
          <StepCard
            step={3}
            icon={<Sparkles className="w-8 h-8" />}
            title="AI Analyzes Transcript"
            description="Our AI (powered by Claude) reads the entire transcript and extracts everything that matters - key discussion points, commitments made, and action items."
            color="pink"
          >
            <div className="mt-6">
              {/* Animated example output preview with typewriter */}
              <div className="rounded-xl bg-gray-800/50 light:bg-gray-100 border border-gray-700 light:border-gray-200 p-4 overflow-hidden">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
                  Example Output
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-2 text-sm font-medium text-blue-400 mb-1">
                      <FileText className="w-4 h-4" />
                      Key Points
                    </div>
                    <ul className="text-sm text-gray-400 light:text-gray-600 space-y-1 pl-6">
                      <li className="list-disc"><TypewriterText text="Discussed Q1 roadmap priorities" delay={0} /></li>
                      <li className="list-disc"><TypewriterText text="Agreed on new pricing structure" delay={800} /></li>
                      <li className="list-disc"><TypewriterText text="Reviewed competitor analysis" delay={1600} /></li>
                    </ul>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-sm font-medium text-emerald-400 mb-1">
                      <CheckCircle className="w-4 h-4" />
                      Action Items
                    </div>
                    <ul className="text-sm text-gray-400 light:text-gray-600 space-y-1 pl-6">
                      <li className="list-disc"><TypewriterText text="Send proposal by Friday (John)" delay={2400} /></li>
                      <li className="list-disc"><TypewriterText text="Schedule follow-up demo (Sarah)" delay={3200} /></li>
                      <li className="list-disc"><TypewriterText text="Share updated pricing deck (You)" delay={4000} /></li>
                    </ul>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-sm font-medium text-purple-400 mb-1">
                      <Users className="w-4 h-4" />
                      Attendees Detected
                    </div>
                    <div className="text-sm text-gray-400 light:text-gray-600 pl-6">
                      <TypewriterText text="John Smith, Sarah Johnson, + 2 others" delay={4800} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </StepCard>

          {/* Step 4: Review & Send */}
          <StepCard
            step={4}
            icon={<Mail className="w-8 h-8" />}
            title="Review & Send"
            description="Your polished follow-up email draft appears in your dashboard within seconds. Make quick edits if needed, then send with one click."
            color="emerald"
          >
            <div className="mt-6 space-y-4">
              {/* Animated features grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { icon: Edit3, text: 'One-click editing' },
                  { icon: Shield, text: 'Review before sending' },
                  { icon: Zap, text: 'Send instantly' },
                  { icon: CheckCircle, text: 'CRM auto-update' },
                ].map(({ icon: Icon, text }, i) => (
                  <motion.div
                    key={text}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    whileHover={{ scale: 1.03, backgroundColor: 'rgba(16, 185, 129, 0.1)' }}
                    className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/50 light:bg-gray-100 border border-gray-700 light:border-gray-200 transition-colors"
                  >
                    <Icon className="w-5 h-5 text-emerald-400" />
                    <span className="text-sm text-gray-300 light:text-gray-700">{text}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </StepCard>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 relative z-10">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white light:text-gray-900">
              Frequently Asked <GradientText>Questions</GradientText>
            </h2>
            <p className="text-gray-400 light:text-gray-600">
              Everything you need to know about ReplySequence
            </p>
          </motion.div>

          <div className="space-y-4">
            {[
              {
                question: 'What platforms are supported?',
                answer: 'ReplySequence currently supports Zoom, Microsoft Teams, and Google Meet. We\'re always working on adding more integrations based on user feedback. All three platforms are fully integrated with OAuth for secure, one-click connections.',
              },
              {
                question: 'How long does it take to generate a draft?',
                answer: 'Most drafts are generated within 8 seconds of the transcript becoming available. The actual time depends on meeting length - a 30-minute call typically processes in under 10 seconds, while hour-long meetings may take 15-20 seconds.',
              },
              {
                question: 'Is my data secure?',
                answer: 'Absolutely. We use AES-256 encryption for all data at rest and TLS 1.3 for data in transit. Your meeting transcripts are processed but never used to train AI models. OAuth tokens are encrypted, and we follow SOC 2 security practices. See our Security page for full details.',
              },
              {
                question: 'Can I edit drafts before sending?',
                answer: 'Yes! Every draft appears in your dashboard where you can review and edit it. Make changes directly in the editor, then send when you\'re satisfied. You maintain full control over what gets sent.',
              },
              {
                question: 'Do I need to install anything?',
                answer: 'No installation required. ReplySequence is a web-based application that connects to your meeting platforms via secure OAuth. Just sign up, connect your accounts, and you\'re ready to go.',
              },
              {
                question: 'What if my meeting doesn\'t have transcription enabled?',
                answer: 'ReplySequence requires meeting transcripts to generate follow-ups. If transcription wasn\'t enabled for a meeting, we won\'t be able to process it. Make sure to enable transcription before your meetings start - we provide platform-specific guides above!',
              },
            ].map((faq, index) => (
              <FAQItem key={faq.question} {...faq} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 px-4 relative z-10">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white light:text-gray-900">
              Ready to Save Hours on <GradientText>Follow-ups</GradientText>?
            </h2>
            <p className="text-gray-400 light:text-gray-600 mb-8 max-w-xl mx-auto">
              Join thousands of sales professionals who never write another follow-up email from scratch.
            </p>

            <motion.div
              className="rounded-2xl bg-gray-900/50 light:bg-white light:shadow-xl border border-gray-700 light:border-gray-200 p-8 md:p-12"
              whileHover={{ scale: 1.01 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
                <GradientButton
                  href="https://tally.so/r/D4pv0j"
                  external
                  showArrow
                  size="lg"
                >
                  Join Beta Waitlist
                </GradientButton>
                <GradientButton
                  href="/pricing"
                  variant="secondary"
                  size="lg"
                >
                  View Pricing
                </GradientButton>
              </div>
              <p className="text-gray-500 light:text-gray-600 text-sm">
                Start with 5 free AI drafts • Cancel anytime
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-gray-800 light:border-gray-200 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-center md:text-left">
              <GradientText className="text-2xl font-bold">ReplySequence</GradientText>
              <p className="text-gray-500 light:text-gray-600 text-sm mt-2">
                &copy; 2026 ReplySequence. Built by Playground Giants.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-400 light:text-gray-600">
              <Link href="/" className="hover:text-white light:hover:text-gray-900 transition-colors">
                Home
              </Link>
              <Link href="/pricing" className="hover:text-white light:hover:text-gray-900 transition-colors">
                Pricing
              </Link>
              <Link href="/security" className="hover:text-white light:hover:text-gray-900 transition-colors">
                Security
              </Link>
              <Link href="/privacy" className="hover:text-white light:hover:text-gray-900 transition-colors">
                Privacy
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
