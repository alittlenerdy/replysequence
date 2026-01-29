'use client';

import dynamic from 'next/dynamic';

const FloatingGradients = dynamic(() => import('@/components/FloatingGradients'), { ssr: false });
const HeroAnimation = dynamic(() => import('@/components/HeroAnimation'), { ssr: false });
const AnimatedBackground = dynamic(() => import('@/components/AnimatedBackground'), { ssr: false });
const ThemeToggle = dynamic(() => import('@/components/ThemeToggle'), { ssr: false });
const VideoDemo = dynamic(() => import('@/components/VideoDemo'), { ssr: false });
const BentoGrid = dynamic(() => import('@/components/BentoGrid'), { ssr: false });
const FloatingElements = dynamic(() => import('@/components/FloatingElements'), { ssr: false });

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-text-primary font-roboto relative">
      {/* Animated gradient background */}
      <AnimatedBackground />

      {/* Floating gradient circles */}
      <FloatingGradients />

      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-black/5 dark:border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="text-2xl font-black logo-text">
            ReplySequence
          </div>
          <div className="flex items-center gap-4">
            <a
              href="/dashboard"
              className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
            >
              Dashboard
            </a>
            <ThemeToggle />
            <a
              href="https://tally.so/r/D4pv0j"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-cta !px-6 !py-2 !text-base"
            >
              Join Waitlist
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen pt-32 pb-20 px-4 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 z-10">
        <FloatingElements />
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="animate-fade-in-up">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black mb-6 leading-tight text-gray-900 dark:text-white">
              Turn Meetings Into Follow-Ups.{' '}
              <span className="gradient-glow">Automatically.</span>
            </h1>

            <p className="text-xl text-gray-700 dark:text-gray-300 mb-6 leading-relaxed max-w-3xl mx-auto">
              AI-powered follow-up emails drafted from your meeting transcripts, logged to your CRM, and ready to send.
            </p>

            {/* Platform logos */}
            <div className="flex items-center justify-center gap-2 mb-8 text-gray-600 dark:text-gray-400 flex-wrap">
              <span className="text-sm font-medium">Works with</span>
              {/* Zoom logo */}
              <div className="platform-pill flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#2D8CFF]/10 cursor-pointer">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#2D8CFF">
                  <path d="M4.585 6.836C3.71 6.836 3 7.547 3 8.42v7.16c0 .872.71 1.584 1.585 1.584h9.83c.875 0 1.585-.712 1.585-1.585V8.42c0-.872-.71-1.585-1.585-1.585H4.585zm12.415 2.11l3.96-2.376c.666-.4 1.04-.266 1.04.56v9.74c0 .826-.374.96-1.04.56L17 15.054V8.946z"/>
                </svg>
                <span className="text-xs font-semibold text-[#2D8CFF]">Zoom</span>
              </div>
              {/* Teams logo */}
              <div className="platform-pill flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#5B5FC7]/10 cursor-pointer">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#5B5FC7">
                  <path d="M20.625 8.5h-6.25a.625.625 0 00-.625.625v6.25c0 .345.28.625.625.625h6.25c.345 0 .625-.28.625-.625v-6.25a.625.625 0 00-.625-.625zM17.5 6.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM12.5 8a3 3 0 100-6 3 3 0 000 6zm0 1c-2.21 0-4 1.567-4 3.5V15h8v-2.5c0-1.933-1.79-3.5-4-3.5z"/>
                </svg>
                <span className="text-xs font-semibold text-[#5B5FC7]">Teams</span>
              </div>
              {/* Google Meet logo */}
              <div className="platform-pill flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#00897B]/10 cursor-pointer">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#00897B">
                  <path d="M12 11.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"/>
                  <path d="M15.29 15.71L18 18.41V5.59l-2.71 2.7A5.977 5.977 0 0112 7c-1.38 0-2.65.47-3.66 1.26L14.59 2H5a2 2 0 00-2 2v16a2 2 0 002 2h14a2 2 0 002-2V9.41l-5.71 6.3zM6 10a6 6 0 1112 0 6 6 0 01-12 0z"/>
                </svg>
                <span className="text-xs font-semibold text-[#00897B]">Meet</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 mb-6 justify-center">
              <a
                href="https://tally.so/r/D4pv0j"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-cta btn-cta-pulse"
              >
                Join Beta Waitlist
              </a>
            </div>

            {/* Trust signal with avatars */}
            <div className="flex items-center justify-center gap-3 text-gray-600 dark:text-gray-400 animate-fade-in-up-delay">
              <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 border-2 border-white dark:border-gray-800 shadow-sm" />
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 border-2 border-white dark:border-gray-800 shadow-sm" />
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-rose-500 border-2 border-white dark:border-gray-800 shadow-sm" />
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 border-2 border-white dark:border-gray-800 shadow-sm" />
              </div>
              <span className="text-sm font-medium">Join 1,200+ sales teams on the waitlist</span>
            </div>
          </div>

          {/* Hero Animation below centered text */}
          <div className="relative mt-16">
            <HeroAnimation />
          </div>
        </div>
      </section>

      {/* Video Demo */}
      <VideoDemo />

      {/* Bento Grid Features */}
      <BentoGrid />

      {/* Email Capture */}
      <section className="py-20 px-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 relative z-10">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-4xl font-black mb-4 text-gray-900 dark:text-white">
            Join the <span className="text-shimmer">Beta Waitlist</span>
          </h2>
          <p className="text-gray-700 dark:text-gray-300 mb-8">
            Be among the first to automate your follow-ups. Limited spots available for pilot program.
          </p>

          {/* CTA Button */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 border border-gray-200 dark:border-gray-700 shadow-xl">
            <a
              href="https://tally.so/r/D4pv0j"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-cta !px-12 !py-5 !text-xl inline-block"
            >
              Join Beta Waitlist
            </a>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-6">Takes 30 seconds - No credit card required - Limited to 100 pilot users</p>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20 px-4 bg-white dark:bg-gray-900 relative z-10">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-8 font-medium">Trusted by sales teams at</p>
          <div className="flex flex-wrap justify-center items-center gap-12">
            {['TechCorp', 'SalesHub', 'GrowthCo', 'ScaleUp', 'CloudBase'].map((company, i) => (
              <div key={i} className="text-2xl font-bold text-gray-400 dark:text-gray-600">{company}</div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 relative z-10">
        <div className="max-w-7xl mx-auto text-center text-gray-600 dark:text-gray-400 text-sm">
          <div className="mb-4">
            <span className="text-2xl font-black text-blue-600 dark:text-blue-400">
              ReplySequence
            </span>
          </div>
          <p>© 2026 ReplySequence. Built by Playground Giants.</p>
        </div>
      </footer>
    </div>
  )
}
