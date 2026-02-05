'use client';

import { motion } from 'framer-motion';
import { Play, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { GradientText } from '@/components/ui/GradientText';

export function VideoSection() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <section className="py-20 px-4 relative z-10">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            See It In <GradientText>Action</GradientText>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            From meeting transcript to polished follow-up email in seconds
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Video container */}
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 aspect-video group cursor-pointer">
            {/* Animated border glow */}
            <motion.div
              className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{ zIndex: -1 }}
              animate={isHovered ? { opacity: [0.5, 0.8, 0.5] } : {}}
              transition={{ duration: 2, repeat: Infinity }}
            />

            {/* Background mockup */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-pink-900/10">
              {/* Simulated dashboard UI */}
              <div className="absolute inset-4 md:inset-8 rounded-xl bg-gray-900/90 border border-gray-700 overflow-hidden">
                {/* Header bar */}
                <div className="h-12 bg-gray-800 border-b border-gray-700 flex items-center px-4 gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/60" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                    <div className="w-3 h-3 rounded-full bg-green-500/60" />
                  </div>
                  <div className="flex-1 flex justify-center">
                    <div className="px-4 py-1 rounded-md bg-gray-700/50 text-xs text-gray-400">
                      replysequence.com/dashboard
                    </div>
                  </div>
                </div>

                {/* Content area */}
                <div className="p-4 md:p-6 grid grid-cols-3 gap-4 h-full">
                  {/* Sidebar */}
                  <div className="col-span-1 space-y-3">
                    <div className="h-8 bg-gray-800 rounded-lg" />
                    <div className="h-6 bg-gray-800/60 rounded-lg w-3/4" />
                    <div className="h-6 bg-gray-800/60 rounded-lg w-1/2" />
                    <div className="h-6 bg-blue-500/20 rounded-lg border border-blue-500/30" />
                    <div className="h-6 bg-gray-800/60 rounded-lg w-2/3" />
                  </div>

                  {/* Main content */}
                  <div className="col-span-2 space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="h-6 bg-gray-800 rounded w-1/3" />
                      <div className="h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg w-24" />
                    </div>
                    {/* Cards */}
                    {[1, 2, 3].map((i) => (
                      <motion.div
                        key={i}
                        className="h-20 bg-gray-800/50 rounded-xl border border-gray-700 p-3"
                        initial={{ opacity: 0.5 }}
                        animate={{ opacity: [0.5, 0.8, 0.5] }}
                        transition={{ duration: 2, delay: i * 0.3, repeat: Infinity }}
                      >
                        <div className="flex gap-3">
                          <div className="w-12 h-12 rounded-lg bg-gray-700" />
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-700 rounded w-2/3" />
                            <div className="h-3 bg-gray-700/50 rounded w-full" />
                            <div className="h-3 bg-gray-700/50 rounded w-1/2" />
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Play button overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
              <motion.button
                className="relative"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                {/* Pulse rings */}
                <motion.div
                  className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500 to-purple-600"
                  animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <motion.div
                  className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500 to-purple-600"
                  animate={{ scale: [1, 1.8, 1], opacity: [0.3, 0, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                />

                {/* Button */}
                <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-purple-500/50">
                  <Play className="w-8 h-8 text-white ml-1" fill="white" />
                </div>
              </motion.button>
            </div>

            {/* Corner badge */}
            <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-900/80 border border-gray-700 backdrop-blur-sm">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="text-xs text-gray-300 font-medium">Demo Video Coming Soon</span>
            </div>
          </div>

          {/* Caption */}
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            className="text-center text-sm text-gray-500 mt-4"
          >
            Watch how ReplySequence transforms your meeting follow-ups
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}
