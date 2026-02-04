'use client';

export default function BentoGrid() {
  return (
    <section className="py-20 px-4 bg-gray-800 light:bg-gray-50 relative z-10">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-display font-bold mb-4 text-white light:text-gray-900">
            Everything You Need to <span className="gradient-glow font-display font-extrabold">Close Faster</span>
          </h2>
          <p className="text-gray-300 light:text-gray-700 text-lg max-w-2xl mx-auto">
            One platform. Every follow-up. Zero missed opportunities.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Featured Card - Large */}
          <div className="bento-card-featured lg:col-span-2 lg:row-span-2">
            <div className="flex flex-col h-full">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center icon-pulse">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <span className="text-xs font-bold text-white/80 uppercase tracking-wider">AI-Powered</span>
              </div>
              <h3 className="text-2xl font-display font-semibold mb-3 text-white">
                Instant Draft Generation
              </h3>
              <p className="text-white/85 mb-6 flex-grow">
                Our AI analyzes your meeting transcript, identifies key action items, commitments, and next steps, then crafts a personalized follow-up that sounds exactly like you wrote it.
              </p>

              {/* Mini UI Preview */}
              <div className="bg-white/10 rounded-2xl p-4 border border-white/10">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-white/30" />
                  <div>
                    <div className="h-3 w-24 bg-white/40 rounded" />
                    <div className="h-2 w-16 bg-white/20 rounded mt-1" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-white/20 rounded w-full" />
                  <div className="h-3 bg-white/20 rounded w-5/6" />
                  <div className="h-3 bg-white/30 rounded w-4/6" />
                </div>
              </div>
            </div>
          </div>

          {/* CRM Integration Card */}
          <div className="bento-card">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
              </svg>
            </div>
            <h3 className="text-lg font-display font-semibold mb-2 text-white light:text-gray-900">CRM Sync</h3>
            <p className="text-gray-300 light:text-gray-700 text-sm">
              Auto-log every interaction to Salesforce, HubSpot, or your CRM of choice. Never manually update a record again.
            </p>
          </div>

          {/* Brand Voice Card */}
          <div className="bento-card">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
            </div>
            <h3 className="text-lg font-display font-semibold mb-2 text-white light:text-gray-900">Your Voice</h3>
            <p className="text-gray-300 light:text-gray-700 text-sm">
              Train the AI on your writing style. Every email sounds authentically you, not a generic template.
            </p>
          </div>

          {/* Multi-Platform Card */}
          <div className="bento-card">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-display font-semibold mb-2 text-white light:text-gray-900">All Platforms</h3>
            <p className="text-gray-300 light:text-gray-700 text-sm">
              Works with Zoom, Teams, and Google Meet. One tool for all your video calls.
            </p>
          </div>

          {/* Analytics Card */}
          <div className="bento-card lg:col-span-2">
            <div className="flex items-start justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-4">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-display font-semibold mb-2 text-white light:text-gray-900">Smart Analytics</h3>
                <p className="text-gray-300 light:text-gray-700 text-sm max-w-md">
                  Track open rates, response times, and follow-up effectiveness. Know exactly what works and optimize your outreach.
                </p>
              </div>
              {/* Mini Chart */}
              <div className="hidden md:flex items-end gap-1 h-16">
                <div className="w-4 h-6 bg-blue-500/30 rounded-t" />
                <div className="w-4 h-10 bg-blue-500/50 rounded-t" />
                <div className="w-4 h-8 bg-blue-500/40 rounded-t" />
                <div className="w-4 h-14 bg-blue-500/70 rounded-t" />
                <div className="w-4 h-16 bg-blue-500 rounded-t" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
