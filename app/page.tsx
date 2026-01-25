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
          <a
            href="https://tally.so/r/D4pv0j"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-cta !px-6 !py-2 !text-base"
          >
            Join Waitlist
          </a>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Copy */}
            <div>
              <div className="inline-block mb-4 px-4 py-2 rounded-full border-2 border-mint bg-mint-tint">
                <span className="text-sm text-mint-hover font-bold">Zoom Meeting Automation</span>
              </div>

              <h1 className="text-5xl lg:text-6xl font-black mb-6 leading-tight text-text-primary">
                Turn Your Zoom Calls Into{' '}
                <span className="text-mint">
                  Perfect Follow-Ups
                </span>
              </h1>

              <p className="text-xl text-text-secondary mb-8 leading-relaxed">
                ReplySequence turns your Zoom calls into high-quality, on-brand follow-up emails that are automatically drafted from transcripts, logged to your CRM, and ready to send with almost no manual effort.
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
                description: 'Automatically generate follow-up emails from Zoom transcripts with perfect context.',
                icon: '🤖'
              },
              {
                title: 'CRM Integration',
                description: 'Seamlessly log all interactions to your CRM without manual data entry.',
                icon: '🔗'
              },
              {
                title: 'Brand Voice Match',
                description: 'Follow-ups that sound like you, not a robot. On-brand every time.',
                icon: '✨'
              }
            ].map((feature, i) => (
              <div
                key={i}
                className="p-6 rounded-2xl bg-background-pure border-2 border-black/10 hover:border-mint hover:shadow-lg hover:shadow-mint/10 transition-all duration-300"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
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
