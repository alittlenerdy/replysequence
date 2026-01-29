'use client';

import { useState } from 'react';

export default function VideoDemo() {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <section className="py-20 px-4 bg-white dark:bg-gray-900 relative z-10">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-display font-bold mb-4 text-gray-900 dark:text-white">
            See It In <span className="text-shimmer">Action</span>
          </h2>
          <p className="text-gray-700 dark:text-gray-300 text-lg max-w-2xl mx-auto">
            Watch how ReplySequence transforms a 30-minute sales call into a perfect follow-up email in seconds.
          </p>
        </div>

        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-gray-200 dark:border-gray-700">
          {!isPlaying ? (
            <div className="aspect-video flex items-center justify-center bg-gradient-to-br from-background-alt to-background relative group cursor-pointer"
                 onClick={() => setIsPlaying(true)}>
              {/* Thumbnail placeholder */}
              <div className="absolute inset-0 bg-gradient-to-br from-mint/5 to-neon/5" />

              {/* Fake UI Preview */}
              <div className="absolute inset-6 md:inset-8 lg:inset-10 rounded-2xl bg-white dark:bg-gray-800 shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden scale-100 md:scale-105">
                <div className="h-12 bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 flex items-center px-4 gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                  <div className="ml-4 flex-1 h-6 bg-white dark:bg-gray-600 rounded-lg" />
                </div>
                <div className="p-6 grid grid-cols-3 gap-4">
                  <div className="col-span-2 space-y-3">
                    <div className="h-4 bg-blue-500/20 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-full" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-5/6" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-4/6" />
                    <div className="mt-6 h-24 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl" />
                  </div>
                  <div className="space-y-3">
                    <div className="h-20 bg-gray-200 dark:bg-gray-600 rounded-xl" />
                    <div className="h-20 bg-gray-200 dark:bg-gray-600 rounded-xl" />
                  </div>
                </div>
              </div>

              {/* Play Button */}
              <button className="video-play-btn relative z-10 group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                </svg>
              </button>

              {/* Duration Badge */}
              <div className="absolute bottom-4 right-4 bg-black/80 text-white text-sm px-3 py-1 rounded-full">
                2:34
              </div>
            </div>
          ) : (
            <div className="aspect-video bg-black flex items-center justify-center">
              {/* Replace with actual Loom embed */}
              <div className="text-white text-center">
                <p className="text-lg mb-2">Loom Video Embed</p>
                <p className="text-white/60 text-sm">Add your Loom embed code here</p>
                <button
                  onClick={() => setIsPlaying(false)}
                  className="mt-4 px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Video Stats */}
        <div className="flex justify-center gap-8 md:gap-12 mt-8 text-center">
          <div>
            <div className="text-2xl md:text-3xl font-display font-bold text-blue-600 dark:text-blue-400">30 sec</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Meeting to Draft</div>
          </div>
          <div>
            <div className="text-2xl md:text-3xl font-display font-bold text-blue-600 dark:text-blue-400">98%</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Accuracy Rate</div>
          </div>
          <div>
            <div className="text-2xl md:text-3xl font-display font-bold text-blue-600 dark:text-blue-400">5+ hrs</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Saved Weekly</div>
          </div>
        </div>
      </div>
    </section>
  );
}
