'use client';

import { motion } from 'framer-motion';
import { Play } from 'lucide-react';
import { useState } from 'react';
import { GradientText } from '@/components/ui/GradientText';

interface VideoSectionProps {
  videoUrl?: string;
}

export function VideoSection({ videoUrl }: VideoSectionProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  // Extract YouTube video ID if it's a YouTube URL
  function getYouTubeId(url: string): string | null {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=))([^?&]+)/);
    return match ? match[1] : null;
  }

  const youtubeId = videoUrl ? getYouTubeId(videoUrl) : null;
  const isYouTube = !!youtubeId;

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
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white light:text-gray-900">
            See It In <GradientText>Action</GradientText>
          </h2>
          <p className="text-gray-400 light:text-gray-600 max-w-2xl mx-auto">
            From meeting transcript to follow-ups, sequences, next steps, and CRM updates — in seconds
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative"
        >
          <div className="relative rounded-2xl overflow-hidden border border-gray-700 light:border-gray-200 light:shadow-xl aspect-video bg-gray-900 light:bg-gray-100">
            {videoUrl && isPlaying ? (
              // Playing state - show video
              isYouTube ? (
                <iframe
                  src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0`}
                  title="ReplySequence Demo"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full"
                />
              ) : (
                <video
                  src={videoUrl}
                  autoPlay
                  controls
                  className="absolute inset-0 w-full h-full object-cover"
                >
                  <track kind="captions" />
                </video>
              )
            ) : videoUrl ? (
              // Has video but not playing - show thumbnail with play button
              <>
                {isYouTube && (
                  <img
                    src={`https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`}
                    alt="Video thumbnail"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                )}
                <button
                  onClick={() => setIsPlaying(true)}
                  className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors cursor-pointer group"
                  aria-label="Play demo video"
                >
                  <motion.div
                    className="w-20 h-20 rounded-full bg-gradient-to-br from-[#5B6CFF] to-[#3A4BDD] flex items-center justify-center shadow-2xl shadow-[#5B6CFF]/50 group-hover:scale-110 transition-transform"
                    whileTap={{ scale: 0.95 }}
                  >
                    <Play className="w-8 h-8 text-white ml-1" fill="white" />
                  </motion.div>
                </button>
              </>
            ) : (
              // No video URL - show tasteful coming soon state
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 light:from-gray-50 light:to-gray-100">
                <div className="w-20 h-20 rounded-full bg-[#5B6CFF]/10 border border-[#5B6CFF]/20 flex items-center justify-center mb-6">
                  <Play className="w-8 h-8 text-[#5B6CFF] ml-1" />
                </div>
                <p className="text-lg font-semibold text-white light:text-gray-900 mb-2">
                  Product demo dropping soon
                </p>
                <p className="text-sm text-gray-400 light:text-gray-600 max-w-md text-center">
                  We&apos;re recording a walkthrough of the full meeting-to-follow-up workflow. Check back shortly.
                </p>
              </div>
            )}
          </div>

          {/* Caption */}
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            className="text-center text-sm text-gray-500 light:text-gray-600 mt-4"
          >
            Watch how ReplySequence turns every meeting into follow-ups, sequences, and pipeline updates
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}
