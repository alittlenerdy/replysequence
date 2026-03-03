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
} from 'lucide-react';
import { GradientText } from '@/components/ui/GradientText';

export const NON_NEGOTIABLES = [
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
] as const;

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
                return (
                  <motion.div
                    key={globalIndex}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.4, delay: i * 0.08 }}
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                    className="relative bg-gray-900/50 light:bg-white border border-gray-700 light:border-gray-200 rounded-2xl p-6 hover:border-indigo-500/40 light:hover:border-indigo-300 transition-colors"
                  >
                    {/* Number badge */}
                    <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500/20 to-indigo-700/20 flex items-center justify-center">
                      <span className="text-xs font-bold text-indigo-400 light:text-indigo-600">
                        {globalIndex + 1}
                      </span>
                    </div>

                    {/* Icon */}
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-indigo-700/20 flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-indigo-400 light:text-indigo-600" />
                    </div>

                    {/* Content */}
                    <h3 className="text-lg font-bold text-white light:text-gray-900 mb-2">
                      {item.title}
                    </h3>
                    <p className="text-sm text-gray-400 light:text-gray-600">
                      {item.description}
                    </p>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Progress dots */}
          <div className="flex items-center justify-center gap-2 mt-8">
            {Array.from({ length: totalGroups }).map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveGroup(i)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === activeGroup
                    ? 'w-8 bg-indigo-500'
                    : 'w-2 bg-gray-700 light:bg-gray-300 hover:bg-gray-600 light:hover:bg-gray-400'
                }`}
                aria-label={`Go to group ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
