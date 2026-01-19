export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="text-2xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-red-500 bg-clip-text text-transparent">
            ReplySequence
          </div>
          <a
            href="https://tally.so/r/D4pv0j"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-2 rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-red-500 text-white font-semibold hover:opacity-90 transition-opacity"
          >
            Join Waitlist
          </a>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Copy */}
            <div>
              <div className="inline-block mb-4 px-4 py-2 rounded-full border border-pink-500/30 bg-pink-500/10">
                <span className="text-sm text-pink-400">🚀 Zoom Meeting Automation</span>
              </div>

              <h1 className="text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                Turn Your Zoom Calls Into{' '}
                <span className="bg-gradient-to-r from-pink-500 via-purple-500 to-red-500 bg-clip-text text-transparent">
                  Perfect Follow-Ups
                </span>
              </h1>

              <p className="text-xl text-gray-400 mb-8 leading-relaxed">
                ReplySequence turns your Zoom calls into high-quality, on-brand follow-up emails that are automatically drafted from transcripts, logged to your CRM, and ready to send with almost no manual effort.
              </p>

              <div className="flex gap-4 mb-8">
                <a
                  href="https://tally.so/r/D4pv0j"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-8 py-4 rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-red-500 text-white font-semibold text-lg hover:opacity-90 transition-opacity shadow-lg shadow-pink-500/25"
                >
                  Join Beta Waitlist
                </a>
                <button className="px-8 py-4 rounded-full border border-white/10 text-white font-semibold text-lg hover:bg-white/5 transition-colors">
                  Watch Demo
                </button>
              </div>

              <div className="flex items-center gap-2 text-gray-400">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 border-2 border-[#0a0a0a]" />
                  ))}
                </div>
                <span className="text-sm">Join 1,200+ sales teams on the waitlist</span>
              </div>
            </div>

            {/* Right: Mockup */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-red-500/20 blur-3xl" />
              <div className="relative bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
                {/* Placeholder for mockup - replace with actual screenshot */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-purple-600" />
                    <div>
                      <div className="h-3 w-32 bg-gradient-to-r from-pink-500/50 to-purple-500/50 rounded" />
                      <div className="h-2 w-24 bg-white/20 rounded mt-2" />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="h-3 w-full bg-white/20 rounded" />
                    <div className="h-3 w-5/6 bg-white/20 rounded" />
                    <div className="h-3 w-4/6 bg-white/20 rounded" />
                  </div>

                  <div className="pt-4 border-t border-white/10">
                    <div className="flex gap-2">
                      <div className="flex-1 h-10 rounded-lg bg-gradient-to-r from-pink-500/30 to-purple-500/30 border border-pink-500/30" />
                      <div className="w-24 h-10 rounded-lg bg-gradient-to-r from-pink-500 to-purple-600" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 border-t border-white/5">
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
              <div key={i} className="p-6 rounded-2xl bg-gradient-to-br from-white/5 to-white/10 border border-white/10 hover:border-pink-500/30 transition-colors">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold mb-2 bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                  {feature.title}
                </h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Email Capture */}
      <section className="py-20 px-6 border-t border-white/5">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">
            Join the <span className="bg-gradient-to-r from-pink-500 via-purple-500 to-red-500 bg-clip-text text-transparent">Beta Waitlist</span>
          </h2>
          <p className="text-gray-400 mb-8">
            Be among the first to automate your follow-ups. Limited spots available for pilot program.
          </p>

          {/* CTA Button */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-12 border border-white/10">
            <a
              href="https://tally.so/r/D4pv0j"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-12 py-5 rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-red-500 text-white font-semibold text-xl hover:opacity-90 transition-opacity shadow-lg shadow-pink-500/25"
            >
              Join Beta Waitlist →
            </a>
            <p className="text-gray-400 text-sm mt-6">Takes 30 seconds • No credit card required • Limited to 100 pilot users</p>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-gray-500 text-sm mb-8">Trusted by sales teams at</p>
          <div className="flex flex-wrap justify-center items-center gap-12 opacity-50">
            {['TechCorp', 'SalesHub', 'GrowthCo', 'ScaleUp', 'CloudBase'].map((company, i) => (
              <div key={i} className="text-2xl font-bold text-gray-600">{company}</div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto text-center text-gray-500 text-sm">
          <div className="mb-4">
            <span className="text-2xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-red-500 bg-clip-text text-transparent">
              ReplySequence
            </span>
          </div>
          <p>© 2026 ReplySequence. Built by Playground Giants.</p>
        </div>
      </footer>
    </div>
  )
}