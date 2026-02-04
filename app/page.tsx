'use client';

import dynamic from 'next/dynamic';
import Image from 'next/image';
import {
  Clock,
  FileText,
  Zap,
  Link2,
  Link2Off,
  BarChart3,
  Users,
  ArrowDown,
  FileX,
  Shield,
  Lock,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';

const FloatingGradients = dynamic(() => import('@/components/FloatingGradients'), { ssr: false });
const HeroAnimation = dynamic(() => import('@/components/HeroAnimation'), { ssr: false });
const AnimatedBackground = dynamic(() => import('@/components/AnimatedBackground'), { ssr: false });
const VideoDemo = dynamic(() => import('@/components/VideoDemo'), { ssr: false });
const BentoGrid = dynamic(() => import('@/components/BentoGrid'), { ssr: false });
const FloatingElements = dynamic(() => import('@/components/FloatingElements'), { ssr: false });

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-900 light:bg-white text-white light:text-gray-900 font-sans relative">
      {/* Animated gradient background */}
      <AnimatedBackground />

      {/* Floating gradient circles */}
      <FloatingGradients />

      {/* Header with Sign In/Out */}
      <Header />

      {/* Hero Section */}
      <section className="relative min-h-screen pt-32 pb-20 px-4 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 light:from-blue-50 light:via-purple-50 light:to-pink-50 z-10">
        <FloatingElements />
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="animate-fade-in-up">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-display font-bold mb-6 leading-tight text-white light:text-gray-900">
              Stop Losing Deals to{' '}
              <span className="gradient-glow font-display font-extrabold">Forgotten Promises.</span>
            </h1>

            <p className="text-xl text-gray-300 light:text-gray-700 mb-6 leading-relaxed max-w-3xl mx-auto">
              Turn every Zoom call into a perfect follow-up email and CRM update—automatically.
            </p>

            {/* Platform logos */}
            <div className="flex items-center justify-center gap-2 mb-8 text-gray-400 light:text-gray-600 flex-wrap">
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

            <div className="flex flex-wrap gap-4 mb-6 justify-center px-4 sm:px-0">
              <a
                href="https://tally.so/r/D4pv0j"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-cta btn-cta-pulse w-full sm:w-auto text-center"
              >
                Join Beta Waitlist
              </a>
            </div>

            {/* Trust signal with avatars */}
            <div className="flex items-center justify-center gap-3 text-gray-400 light:text-gray-600 animate-fade-in-up-delay">
              <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 border-2 border-gray-800 light:border-white shadow-sm" />
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 border-2 border-gray-800 light:border-white shadow-sm" />
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-rose-500 border-2 border-gray-800 light:border-white shadow-sm" />
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 border-2 border-gray-800 light:border-white shadow-sm" />
              </div>
              <span className="text-sm font-medium">Join 1,200+ sales teams on the waitlist</span>
            </div>

            {/* Security Trust Badges */}
            <div className="flex flex-wrap items-center justify-center gap-3 mt-6 animate-fade-in-up-delay">
              <a
                href="/security"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full hover:bg-green-500/20 transition-colors"
              >
                <Shield className="w-3.5 h-3.5 text-green-400" />
                <span className="text-xs font-medium text-green-400">SOC 2 Infrastructure</span>
              </a>
              <a
                href="/security"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full hover:bg-blue-500/20 transition-colors"
              >
                <Lock className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-xs font-medium text-blue-400">256-bit Encryption</span>
              </a>
              <a
                href="/privacy"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/10 border border-purple-500/20 rounded-full hover:bg-purple-500/20 transition-colors"
              >
                <Shield className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-xs font-medium text-purple-400">GDPR Compliant</span>
              </a>
            </div>
          </div>

          {/* Hero Animation below centered text */}
          <div className="relative mt-16">
            <HeroAnimation />
          </div>
        </div>
      </section>

      {/* Pain Points Section */}
      <section className="py-16 px-4 bg-gray-950 light:bg-gray-50 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4 text-white light:text-gray-900">
              The Real Cost of Manual Follow-ups
            </h2>
            <p className="text-gray-400 light:text-gray-600 max-w-2xl mx-auto">
              Every VP Sales knows these problems. Most accept them as &quot;the cost of doing business.&quot;
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Clock,
                headline: 'Follow-ups eat 10-15 hours/week',
                detail: 'Sales reps only spend 28% of their time actually selling',
              },
              {
                icon: FileX,
                headline: 'Notes scattered & incomplete',
                detail: 'Paper notes, Google Docs, half-filled CRM fields',
              },
              {
                icon: Zap,
                headline: 'Slow follow-up kills momentum',
                detail: 'Competitor demos while your rep is still writing notes',
              },
              {
                icon: Link2Off,
                headline: 'Siloed tools = double/triple entry',
                detail: 'Zoom + email + CRM all disconnected',
              },
              {
                icon: BarChart3,
                headline: 'CRM data wrong = vibes-based forecasts',
                detail: 'Missing fields, stale stages, deals falling through cracks',
              },
              {
                icon: Users,
                headline: 'Scaling multiplies chaos',
                detail: 'Going from 5→20 reps means 4x the admin work',
              },
            ].map((pain, index) => {
              const IconComponent = pain.icon;
              return (
                <div
                  key={index}
                  className="group rounded-xl bg-gray-900/50 light:bg-white border border-orange-500/20 light:border-orange-200 p-6 transition-all duration-300 hover:border-orange-500/40 hover:shadow-lg hover:shadow-orange-500/5"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                      <IconComponent className="w-5 h-5 text-orange-400" aria-hidden="true" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white light:text-gray-900 mb-1">
                        {pain.headline}
                      </h3>
                      <p className="text-sm text-gray-400 light:text-gray-600">
                        {pain.detail}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Video Demo */}
      <VideoDemo />

      {/* Bento Grid Features */}
      <BentoGrid />

      {/* Product Screenshots */}
      <section className="py-20 px-4 bg-gray-900 light:bg-gray-50 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-display font-bold mb-4 text-white light:text-gray-900">
              See It In <span className="gradient-glow font-display font-extrabold">Action</span>
            </h2>
            <p className="text-gray-300 light:text-gray-700 max-w-2xl mx-auto">
              From meeting transcript to polished follow-up email in seconds
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                src: '/screenshots/dashboard.svg',
                alt: 'ReplySequence Dashboard',
                caption: 'Dashboard Overview',
                description: 'See all your meetings and drafts in one place',
              },
              {
                src: '/screenshots/draft-editor.svg',
                alt: 'AI Draft Editor',
                caption: 'AI-Powered Drafts',
                description: 'Review and customize AI-generated emails',
              },
              {
                src: '/screenshots/email-preview.svg',
                alt: 'Email Preview',
                caption: 'Email Preview',
                description: 'Preview before sending to your contacts',
              },
              {
                src: '/screenshots/integrations.svg',
                alt: 'Platform Integrations',
                caption: 'Seamless Integrations',
                description: 'Connect Zoom, Teams, and Google Meet',
              },
            ].map((screenshot, index) => (
              <div
                key={index}
                className="group relative overflow-hidden rounded-2xl bg-gray-800 light:bg-white border border-gray-700 light:border-gray-200 shadow-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:border-blue-500/50"
              >
                <div className="aspect-video relative">
                  <Image
                    src={screenshot.src}
                    alt={screenshot.alt}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 50vw"
                    priority={index < 2}
                  />
                  {/* Gradient overlay for text readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                {/* Caption */}
                <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                  <h3 className="text-lg font-bold text-white mb-1">{screenshot.caption}</h3>
                  <p className="text-sm text-gray-300">{screenshot.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pain to Result Mapping */}
      <section className="py-20 px-4 bg-gradient-to-br from-gray-800 to-gray-900 light:from-white light:to-gray-50 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-display font-bold mb-4 text-white light:text-gray-900">
              From <span className="text-red-400 light:text-red-500">Pain</span> to{' '}
              <span className="text-emerald-400 light:text-emerald-500">Results</span>
            </h2>
            <p className="text-gray-300 light:text-gray-700 max-w-2xl mx-auto">
              See exactly how ReplySequence transforms your workflow
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Clock,
                pain: 'Follow-ups eat 10-15 hours/week',
                feature: 'Auto-drafted emails in 8 seconds',
                result: 'Give reps 10 hours/week back',
              },
              {
                icon: FileText,
                pain: 'Notes scattered & incomplete',
                feature: 'Transcript parsing + extraction',
                result: 'Complete context, every time',
              },
              {
                icon: Zap,
                pain: 'Slow follow-up kills momentum',
                feature: '8-second generation',
                result: 'Strike while iron is hot',
              },
              {
                icon: Link2,
                pain: 'Siloed tools = double entry',
                feature: 'Email + CRM logging in one',
                result: 'One action, two updates',
              },
              {
                icon: BarChart3,
                pain: 'CRM data wrong = vibes forecasts',
                feature: 'Accurate auto-logging',
                result: 'Forecasts you can trust',
              },
              {
                icon: Users,
                pain: 'Scaling multiplies chaos',
                feature: 'Same process, any team size',
                result: '10 reps or 100, same quality',
              },
            ].map((mapping, index) => {
              const IconComponent = mapping.icon;
              return (
                <div
                  key={index}
                  className="group relative rounded-2xl bg-gray-900/50 light:bg-white border border-gray-700 light:border-gray-200 p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-500/10 hover:border-blue-500/30"
                >
                  {/* Icon */}
                  <div className="flex justify-center mb-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                      <IconComponent className="w-6 h-6 text-blue-400" aria-hidden="true" />
                    </div>
                  </div>

                  {/* Pain Point */}
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold uppercase tracking-wider text-red-400" aria-label="Pain point">
                        Pain
                      </span>
                    </div>
                    <p className="text-sm text-red-300 light:text-red-600 font-medium">
                      {mapping.pain}
                    </p>
                  </div>

                  {/* Arrow with Feature */}
                  <div className="flex flex-col items-center my-3">
                    <ArrowDown className="w-5 h-5 text-blue-400 mb-1" aria-hidden="true" />
                    <span className="text-xs text-blue-400 font-medium text-center px-2">
                      {mapping.feature}
                    </span>
                    <ArrowDown className="w-5 h-5 text-blue-400 mt-1" aria-hidden="true" />
                  </div>

                  {/* Result */}
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400" aria-label="Result">
                        Result
                      </span>
                    </div>
                    <p className="text-sm text-emerald-300 light:text-emerald-600 font-medium">
                      {mapping.result}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Email Capture */}
      <section className="py-20 px-4 bg-gradient-to-br from-gray-800 to-gray-900 light:from-blue-50 light:to-purple-50 relative z-10">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-4xl font-display font-bold mb-4 text-white light:text-gray-900">
            Join the <span className="text-shimmer font-display font-extrabold">Beta Waitlist</span>
          </h2>
          <p className="text-gray-300 light:text-gray-700 mb-8">
            Be among the first to automate your follow-ups. Limited spots available for pilot program.
          </p>

          {/* CTA Button */}
          <div className="bg-gray-800 light:bg-white rounded-2xl p-6 sm:p-12 border border-gray-700 light:border-gray-200 shadow-xl mx-4 sm:mx-0">
            <a
              href="https://tally.so/r/D4pv0j"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-cta !px-8 sm:!px-12 !py-4 sm:!py-5 !text-lg sm:!text-xl inline-block w-full sm:w-auto text-center"
            >
              Join Beta Waitlist
            </a>
            <p className="text-gray-400 light:text-gray-600 text-xs sm:text-sm mt-6">Takes 30 seconds - No credit card required - Limited to 100 pilot users</p>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20 px-4 bg-gray-900 light:bg-white relative z-10">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-gray-400 light:text-gray-600 text-sm mb-8 font-medium">Trusted by sales teams at</p>
          <div className="flex flex-wrap justify-center items-center gap-12">
            {['TechCorp', 'SalesHub', 'GrowthCo', 'ScaleUp', 'CloudBase'].map((company, i) => (
              <div key={i} className="text-2xl font-bold text-gray-600 light:text-gray-400">{company}</div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-gray-700 light:border-gray-200 bg-gray-950 light:bg-gray-50 relative z-10">
        <div className="max-w-7xl mx-auto text-center text-gray-400 light:text-gray-600 text-sm">
          <div className="mb-4">
            <span className="text-2xl font-display font-bold text-blue-400 light:text-blue-600">
              ReplySequence
            </span>
          </div>
          <p>&copy; 2026 ReplySequence. Built by Playground Giants.</p>
        </div>
      </footer>
    </div>
  )
}
