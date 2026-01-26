'use client';

import dynamic from 'next/dynamic';

const FloatingGradients = dynamic(() => import('@/components/FloatingGradients'), { ssr: false });
const HeroAnimation = dynamic(() => import('@/components/HeroAnimation'), { ssr: false });

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-text-primary font-roboto relative">
      {/* Floating gradient circles */}
      <FloatingGradients />

      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-black/5">
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
      <section className="pt-32 pb-20 px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Copy */}
            <div>
              {/* Teams Badge */}
              <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-white text-sm font-bold shadow-lg shadow-blue-500/25 animate-pulse-slow">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.625 8.5h-6.25a.625.625 0 00-.625.625v6.25c0 .345.28.625.625.625h6.25c.345 0 .625-.28.625-.625v-6.25a.625.625 0 00-.625-.625zM17.5 6.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM12.5 8a3 3 0 100-6 3 3 0 000 6zm0 1c-2.21 0-4 1.567-4 3.5V15h8v-2.5c0-1.933-1.79-3.5-4-3.5z"/>
                </svg>
                Now with Microsoft Teams
              </div>

              <h1 className="text-5xl lg:text-6xl font-black mb-6 leading-tight text-text-primary">
                Turn Your Zoom, Teams, or Online Meetings Into{' '}
                <span className="text-mint">
                  Perfect Follow-Ups
                </span>
              </h1>

              <p className="text-xl text-text-secondary mb-8 leading-relaxed">
                ReplySequence turns your video calls into high-quality, on-brand follow-up emails that are automatically drafted from transcripts, logged to your CRM, and ready to send with almost no manual effort. Works with Zoom, Microsoft Teams, and more.
              </p>

              <div className="flex flex-wrap gap-4 mb-8">
                <a
                  href="https://tally.so/r/D4pv0j"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-cta"
                >
                  Join Beta Waitlist
                </a>
                <button className="btn-secondary">
                  Watch Demo
                </button>
              </div>

              <div className="text-text-caption">
                <span className="text-sm font-medium">Join 1,200+ sales teams on the waitlist</span>
              </div>
            </div>

            {/* Right: Animated Hero */}
            <div className="relative">
              <HeroAnimation />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 bg-background-alt relative z-10 gradient-overlay">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: 'AI-Powered Drafts',
                description: 'Automatically generate follow-up emails from meeting transcripts with perfect context.',
              },
              {
                title: 'CRM Integration',
                description: 'Seamlessly log all interactions to your CRM without manual data entry.',
              },
              {
                title: 'Brand Voice Match',
                description: 'Follow-ups that sound like you, not a robot. On-brand every time.',
              }
            ].map((feature, i) => (
              <div
                key={i}
                className="p-6 rounded-2xl bg-background-pure border-2 border-black/10 hover:border-mint hover:shadow-lg hover:shadow-mint/10 transition-all duration-300"
              >
                <div className="w-12 h-12 mb-4 rounded-xl bg-gradient-to-br from-mint to-mint-hover flex items-center justify-center">
                  <div className="w-6 h-6 rounded-full bg-white/30" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-mint">
                  {feature.title}
                </h3>
                <p className="text-text-secondary">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Email Capture */}
      <section className="py-20 px-6 relative z-10">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-4xl font-black mb-4 text-text-primary">
            Join the <span className="text-mint">Beta Waitlist</span>
          </h2>
          <p className="text-text-secondary mb-8">
            Be among the first to automate your follow-ups. Limited spots available for pilot program.
          </p>

          {/* CTA Button */}
          <div className="bg-background-alt rounded-2xl p-12 border-2 border-black/10 cta-gradient-bg">
            <a
              href="https://tally.so/r/D4pv0j"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-cta !px-12 !py-5 !text-xl inline-block"
            >
              Join Beta Waitlist
            </a>
            <p className="text-text-caption text-sm mt-6">Takes 30 seconds - No credit card required - Limited to 100 pilot users</p>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20 px-6 bg-background-alt relative z-10">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-text-caption text-sm mb-8 font-medium">Trusted by sales teams at</p>
          <div className="flex flex-wrap justify-center items-center gap-12">
            {['TechCorp', 'SalesHub', 'GrowthCo', 'ScaleUp', 'CloudBase'].map((company, i) => (
              <div key={i} className="text-2xl font-bold text-text-caption/50">{company}</div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-black/10 relative z-10">
        <div className="max-w-7xl mx-auto text-center text-text-caption text-sm">
          <div className="mb-4">
            <span className="text-2xl font-black logo-text">
              ReplySequence
            </span>
          </div>
          <p>© 2026 ReplySequence. Built by Playground Giants.</p>
        </div>
      </footer>
    </div>
  )
}
