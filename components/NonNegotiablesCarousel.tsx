'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  Sparkles,
  Send,
  Monitor,
  RefreshCw,
  Shield,
  Zap,
  Pencil,
  BarChart3,
  type LucideIcon,
} from 'lucide-react';
import { GradientText } from '@/components/ui/GradientText';

// Per-card color palette: mix of warm (amber, orange, rose) and cool (indigo, emerald, cyan)
const CARD_COLORS = [
  { bg: 'from-amber-500/20 to-orange-600/20', icon: 'text-amber-400 light:text-amber-600', border: 'hover:border-amber-500/40 light:hover:border-amber-300', badge: 'bg-amber-500', dot: 'from-amber-500/30 to-orange-500/30', badgeText: 'text-amber-400 light:text-amber-600', glow: 'bg-amber-500/10' },
  { bg: 'from-violet-500/20 to-purple-600/20', icon: 'text-violet-400 light:text-violet-600', border: 'hover:border-violet-500/40 light:hover:border-violet-300', badge: 'bg-violet-500', dot: 'from-violet-500/30 to-purple-500/30', badgeText: 'text-violet-400 light:text-violet-600', glow: 'bg-violet-500/10' },
  { bg: 'from-emerald-500/20 to-teal-600/20', icon: 'text-emerald-400 light:text-emerald-600', border: 'hover:border-emerald-500/40 light:hover:border-emerald-300', badge: 'bg-emerald-500', dot: 'from-emerald-500/30 to-teal-500/30', badgeText: 'text-emerald-400 light:text-emerald-600', glow: 'bg-emerald-500/10' },
  { bg: 'from-cyan-500/20 to-blue-600/20', icon: 'text-cyan-400 light:text-cyan-600', border: 'hover:border-cyan-500/40 light:hover:border-cyan-300', badge: 'bg-cyan-500', dot: 'from-cyan-500/30 to-blue-500/30', badgeText: 'text-cyan-400 light:text-cyan-600', glow: 'bg-cyan-500/10' },
  { bg: 'from-orange-500/20 to-red-600/20', icon: 'text-orange-400 light:text-orange-600', border: 'hover:border-orange-500/40 light:hover:border-orange-300', badge: 'bg-orange-500', dot: 'from-orange-500/30 to-red-500/30', badgeText: 'text-orange-400 light:text-orange-600', glow: 'bg-orange-500/10' },
  { bg: 'from-indigo-500/20 to-blue-600/20', icon: 'text-indigo-400 light:text-indigo-600', border: 'hover:border-indigo-500/40 light:hover:border-indigo-300', badge: 'bg-indigo-500', dot: 'from-indigo-500/30 to-blue-500/30', badgeText: 'text-indigo-400 light:text-indigo-600', glow: 'bg-indigo-500/10' },
  { bg: 'from-yellow-500/20 to-amber-600/20', icon: 'text-yellow-400 light:text-yellow-600', border: 'hover:border-yellow-500/40 light:hover:border-yellow-300', badge: 'bg-yellow-500', dot: 'from-yellow-500/30 to-amber-500/30', badgeText: 'text-yellow-400 light:text-yellow-600', glow: 'bg-yellow-500/10' },
  { bg: 'from-rose-500/20 to-pink-600/20', icon: 'text-rose-400 light:text-rose-600', border: 'hover:border-rose-500/40 light:hover:border-rose-300', badge: 'bg-rose-500', dot: 'from-rose-500/30 to-pink-500/30', badgeText: 'text-rose-400 light:text-rose-600', glow: 'bg-rose-500/10' },
  { bg: 'from-teal-500/20 to-emerald-600/20', icon: 'text-teal-400 light:text-teal-600', border: 'hover:border-teal-500/40 light:hover:border-teal-300', badge: 'bg-teal-500', dot: 'from-teal-500/30 to-emerald-500/30', badgeText: 'text-teal-400 light:text-teal-600', glow: 'bg-teal-500/10' },
];

// Mini illustrations — small SVG scenes that reinforce each non-negotiable visually
function MailIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 80" fill="none" className={className} aria-hidden="true">
      {/* Envelope */}
      <rect x="10" y="16" width="60" height="44" rx="6" stroke="currentColor" strokeWidth="2" opacity="0.6" />
      <path d="M10 22l30 20 30-20" stroke="currentColor" strokeWidth="2" opacity="0.6" />
      {/* Checkmark floating */}
      <circle cx="90" cy="24" r="16" fill="currentColor" opacity="0.15" />
      <path d="M82 24l5 5 11-11" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Small envelopes stacked */}
      <rect x="20" y="8" width="40" height="12" rx="3" stroke="currentColor" strokeWidth="1.5" opacity="0.3" />
    </svg>
  );
}

function AIVoiceIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 80" fill="none" className={className} aria-hidden="true">
      {/* Sound wave / voice */}
      <path d="M20 40 Q30 20 40 40 Q50 60 60 40 Q70 20 80 40" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.5" />
      <path d="M25 40 Q35 28 45 40 Q55 52 65 40 Q75 28 85 40" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
      {/* Sparkle dots */}
      <circle cx="95" cy="20" r="3" fill="currentColor" opacity="0.6" />
      <circle cx="105" cy="30" r="2" fill="currentColor" opacity="0.4" />
      <circle cx="100" cy="45" r="2.5" fill="currentColor" opacity="0.5" />
      {/* Pen nib */}
      <path d="M10 65l8-20 12 12-20 8z" fill="currentColor" opacity="0.15" />
    </svg>
  );
}

function OneClickIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 80" fill="none" className={className} aria-hidden="true">
      {/* Button shape */}
      <rect x="20" y="22" width="70" height="36" rx="18" stroke="currentColor" strokeWidth="2" opacity="0.5" />
      <text x="55" y="45" textAnchor="middle" fontSize="14" fill="currentColor" fontWeight="bold" opacity="0.6">Send</text>
      {/* Cursor clicking */}
      <path d="M95 30l-8 20 5-2 3 8 4-2-3-8 5-1z" fill="currentColor" opacity="0.5" />
      {/* Speed lines */}
      <line x1="8" y1="35" x2="16" y2="35" stroke="currentColor" strokeWidth="1.5" opacity="0.3" />
      <line x1="5" y1="42" x2="16" y2="42" stroke="currentColor" strokeWidth="1.5" opacity="0.2" />
      <line x1="8" y1="49" x2="16" y2="49" stroke="currentColor" strokeWidth="1.5" opacity="0.3" />
    </svg>
  );
}

function PlatformsIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 80" fill="none" className={className} aria-hidden="true">
      {/* Three monitors/screens */}
      <rect x="5" y="20" width="28" height="22" rx="3" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
      <line x1="19" y1="42" x2="19" y2="48" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
      <line x1="12" y1="48" x2="26" y2="48" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
      <rect x="46" y="14" width="28" height="22" rx="3" stroke="currentColor" strokeWidth="2" opacity="0.6" />
      <line x1="60" y1="36" x2="60" y2="42" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
      <line x1="53" y1="42" x2="67" y2="42" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
      <rect x="87" y="20" width="28" height="22" rx="3" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
      <line x1="101" y1="42" x2="101" y2="48" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
      <line x1="94" y1="48" x2="108" y2="48" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
      {/* Connection lines */}
      <path d="M33 31 Q40 28 46 25" stroke="currentColor" strokeWidth="1" opacity="0.3" strokeDasharray="3 2" />
      <path d="M74 25 Q80 28 87 31" stroke="currentColor" strokeWidth="1" opacity="0.3" strokeDasharray="3 2" />
      {/* Play icons on screens */}
      <polygon points="16,28 24,31 16,34" fill="currentColor" opacity="0.3" />
      <polygon points="57,21 65,25 57,29" fill="currentColor" opacity="0.4" />
      <polygon points="98,28 106,31 98,34" fill="currentColor" opacity="0.3" />
    </svg>
  );
}

function CRMSyncIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 80" fill="none" className={className} aria-hidden="true">
      {/* Database icon */}
      <ellipse cx="30" cy="24" rx="18" ry="8" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
      <path d="M12 24v20c0 4.4 8 8 18 8s18-3.6 18-8V24" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
      <path d="M12 34c0 4.4 8 8 18 8s18-3.6 18-8" stroke="currentColor" strokeWidth="1" opacity="0.3" />
      {/* Sync arrows */}
      <path d="M56 30h20" stroke="currentColor" strokeWidth="2" opacity="0.5" />
      <path d="M72 25l6 5-6 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
      <path d="M76 45H56" stroke="currentColor" strokeWidth="2" opacity="0.3" />
      <path d="M60 40l-6 5 6 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.3" />
      {/* CRM card */}
      <rect x="84" y="20" width="30" height="35" rx="4" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
      <line x1="90" y1="30" x2="108" y2="30" stroke="currentColor" strokeWidth="1" opacity="0.3" />
      <line x1="90" y1="37" x2="104" y2="37" stroke="currentColor" strokeWidth="1" opacity="0.3" />
      <line x1="90" y1="44" x2="100" y2="44" stroke="currentColor" strokeWidth="1" opacity="0.3" />
    </svg>
  );
}

function PrivacyIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 80" fill="none" className={className} aria-hidden="true">
      {/* Shield */}
      <path d="M60 8 L90 22 L90 46 Q90 64 60 74 Q30 64 30 46 L30 22 Z" stroke="currentColor" strokeWidth="2" opacity="0.5" fill="currentColor" fillOpacity="0.05" />
      {/* Lock inside shield */}
      <rect x="50" y="36" width="20" height="16" rx="3" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
      <path d="M54 36v-6a6 6 0 0112 0v6" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
      <circle cx="60" cy="45" r="2" fill="currentColor" opacity="0.5" />
      {/* Sparkle effects */}
      <circle cx="42" cy="22" r="2" fill="currentColor" opacity="0.3" />
      <circle cx="78" cy="22" r="2" fill="currentColor" opacity="0.3" />
    </svg>
  );
}

function SpeedIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 80" fill="none" className={className} aria-hidden="true">
      {/* Speedometer arc */}
      <path d="M20 60 A40 40 0 0 1 100 60" stroke="currentColor" strokeWidth="2.5" opacity="0.4" strokeLinecap="round" />
      {/* Fast segment */}
      <path d="M75 22 A40 40 0 0 1 100 60" stroke="currentColor" strokeWidth="3" opacity="0.7" strokeLinecap="round" />
      {/* Needle */}
      <line x1="60" y1="58" x2="88" y2="32" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
      <circle cx="60" cy="58" r="4" fill="currentColor" opacity="0.5" />
      {/* 30s text */}
      <text x="60" y="76" textAnchor="middle" fontSize="11" fill="currentColor" fontWeight="bold" opacity="0.5">&lt;30s</text>
    </svg>
  );
}

function EditableIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 80" fill="none" className={className} aria-hidden="true">
      {/* Document */}
      <rect x="25" y="8" width="50" height="64" rx="4" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
      {/* Text lines */}
      <line x1="33" y1="22" x2="67" y2="22" stroke="currentColor" strokeWidth="1.5" opacity="0.3" />
      <line x1="33" y1="30" x2="60" y2="30" stroke="currentColor" strokeWidth="1.5" opacity="0.3" />
      <line x1="33" y1="38" x2="55" y2="38" stroke="currentColor" strokeWidth="1.5" opacity="0.3" />
      <line x1="33" y1="46" x2="63" y2="46" stroke="currentColor" strokeWidth="1.5" opacity="0.3" />
      {/* Pencil editing */}
      <path d="M85 15l10 10-30 30-12 4 4-12z" stroke="currentColor" strokeWidth="2" opacity="0.6" fill="currentColor" fillOpacity="0.1" />
      <line x1="83" y1="27" x2="93" y2="17" stroke="currentColor" strokeWidth="1" opacity="0.3" />
      {/* Cursor blink line */}
      <line x1="50" y1="52" x2="50" y2="60" stroke="currentColor" strokeWidth="2" opacity="0.5" />
    </svg>
  );
}

function TrackingIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 80" fill="none" className={className} aria-hidden="true">
      {/* Chart bars */}
      <rect x="15" y="45" width="12" height="25" rx="2" fill="currentColor" opacity="0.2" />
      <rect x="33" y="35" width="12" height="35" rx="2" fill="currentColor" opacity="0.3" />
      <rect x="51" y="25" width="12" height="45" rx="2" fill="currentColor" opacity="0.4" />
      <rect x="69" y="15" width="12" height="55" rx="2" fill="currentColor" opacity="0.5" />
      {/* Trend line */}
      <path d="M21 42 L39 32 L57 22 L75 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
      {/* Eye icon */}
      <ellipse cx="100" cy="30" rx="12" ry="8" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
      <circle cx="100" cy="30" r="4" fill="currentColor" opacity="0.4" />
      {/* Click dot */}
      <circle cx="100" cy="55" r="6" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
      <circle cx="100" cy="55" r="2" fill="currentColor" opacity="0.4" />
    </svg>
  );
}

const ILLUSTRATIONS: React.FC<{ className?: string }>[] = [
  MailIllustration,
  AIVoiceIllustration,
  OneClickIllustration,
  PlatformsIllustration,
  CRMSyncIllustration,
  PrivacyIllustration,
  SpeedIllustration,
  EditableIllustration,
  TrackingIllustration,
];

export const NON_NEGOTIABLES: readonly { title: string; description: string; icon: LucideIcon }[] = [
  {
    title: 'Every meeting gets a follow-up',
    description: 'No call falls through the cracks. Period.',
    icon: Mail,
  },
  {
    title: 'AI drafts in your voice',
    description: 'Learns your tone, not a generic template.',
    icon: Sparkles,
  },
  {
    title: 'One-click send',
    description: 'Review, tweak if needed, and send from your inbox.',
    icon: Send,
  },
  {
    title: 'Zoom + Meet + Teams',
    description: 'All three platforms, one workflow.',
    icon: Monitor,
  },
  {
    title: 'CRM sync on autopilot',
    description: 'HubSpot, Salesforce, Airtable — automatically logged.',
    icon: RefreshCw,
  },
  {
    title: 'Privacy-first',
    description: 'No recordings stored. Transcripts processed and purged.',
    icon: Shield,
  },
  {
    title: 'Draft in under 30 seconds',
    description: 'Not 24 hours. Seconds after your call ends.',
    icon: Zap,
  },
  {
    title: 'Fully editable',
    description: 'You always have final say before anything sends.',
    icon: Pencil,
  },
  {
    title: 'Opens and clicks tracked',
    description: 'Know exactly who engaged with your follow-up.',
    icon: BarChart3,
  },
];

function useCardsPerView() {
  const [cardsPerView, setCardsPerView] = useState(3);

  useEffect(() => {
    function update() {
      if (window.innerWidth < 768) {
        setCardsPerView(1);
      } else if (window.innerWidth < 1024) {
        setCardsPerView(2);
      } else {
        setCardsPerView(3);
      }
    }
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return cardsPerView;
}

export function NonNegotiablesCarousel() {
  const cardsPerView = useCardsPerView();
  const totalGroups = Math.ceil(NON_NEGOTIABLES.length / cardsPerView);
  const [activeGroup, setActiveGroup] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const advance = useCallback(() => {
    setActiveGroup((prev) => (prev + 1) % totalGroups);
  }, [totalGroups]);

  // Auto-advance
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(advance, 3500);
    return () => clearInterval(timer);
  }, [advance, isPaused]);

  // Reset group if it's out of bounds after resize
  useEffect(() => {
    if (activeGroup >= totalGroups) {
      setActiveGroup(0);
    }
  }, [activeGroup, totalGroups]);

  const startIdx = activeGroup * cardsPerView;
  const visibleCards = NON_NEGOTIABLES.slice(startIdx, startIdx + cardsPerView);

  return (
    <section className="py-20 px-4 relative z-10">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white light:text-gray-900 mb-4">
            Our 9 <GradientText>Non-Negotiables</GradientText>
          </h2>
          <p className="text-gray-400 light:text-gray-600 max-w-2xl mx-auto">
            These are the promises baked into every feature we ship. No exceptions.
          </p>
        </motion.div>

        {/* Carousel */}
        <div
          className="relative"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div className={`grid gap-6 ${
            cardsPerView === 1 ? 'grid-cols-1' :
            cardsPerView === 2 ? 'grid-cols-2' :
            'grid-cols-3'
          }`}>
            <AnimatePresence mode="wait">
              {visibleCards.map((item, i) => {
                const globalIndex = startIdx + i;
                const Icon = item.icon;
                const colors = CARD_COLORS[globalIndex];
                const Illustration = ILLUSTRATIONS[globalIndex];
                return (
                  <motion.div
                    key={globalIndex}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.4, delay: i * 0.08 }}
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                    className={`relative bg-gray-900/50 light:bg-white border border-gray-700 light:border-gray-200 rounded-2xl overflow-hidden ${colors.border} transition-colors`}
                  >
                    {/* Illustration area — colored background with SVG scene */}
                    <div className={`relative h-40 flex items-center justify-center bg-gradient-to-br ${colors.bg}`}>
                      {/* Subtle glow blob */}
                      <div className={`absolute inset-0 ${colors.glow} opacity-50`} />
                      <Illustration className={`w-28 h-28 ${colors.icon} relative z-10`} />

                      {/* Number badge */}
                      <div className={`absolute top-3 right-3 w-8 h-8 rounded-full bg-gradient-to-br ${colors.dot} flex items-center justify-center`}>
                        <span className={`text-xs font-bold ${colors.badgeText}`}>
                          {globalIndex + 1}
                        </span>
                      </div>
                    </div>

                    {/* Content area */}
                    <div className="p-6">
                      {/* Icon + title row */}
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${colors.bg} flex items-center justify-center flex-shrink-0`}>
                          <Icon className={`w-[18px] h-[18px] ${colors.icon}`} />
                        </div>
                        <h3 className="text-lg font-bold text-white light:text-gray-900">
                          {item.title}
                        </h3>
                      </div>
                      <p className="text-sm text-gray-400 light:text-gray-600 ml-12">
                        {item.description}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Progress dots — colored to match first card in group */}
          <div className="flex items-center justify-center gap-2 mt-8">
            {Array.from({ length: totalGroups }).map((_, i) => {
              const groupColor = CARD_COLORS[i * cardsPerView];
              return (
                <button
                  key={i}
                  onClick={() => setActiveGroup(i)}
                  className={`h-2 rounded-full transition-[width,background-color] duration-300 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 ${
                    i === activeGroup
                      ? `w-8 ${groupColor.badge}`
                      : 'w-2 bg-gray-700 light:bg-gray-300 hover:bg-gray-600 light:hover:bg-gray-400'
                  }`}
                  aria-label={`Go to group ${i + 1}`}
                />
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
