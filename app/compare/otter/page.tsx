import { Metadata } from 'next';
import Link from 'next/link';
import {
  Check,
  X,
  Zap,
  Clock,
  Mail,
  ArrowRight,
  Sparkles,
  MessageSquare,
  Globe,
  Shield,
  Trophy,
  Timer,
  Target,
  Smartphone,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'ReplySequence vs Otter.ai - Best Meeting Follow-Up Tool Comparison',
  description: 'Compare ReplySequence and Otter.ai for meeting transcription and follow-up. See how ReplySequence generates AI email drafts in 8 seconds vs Otter\'s approach.',
  keywords: [
    'otter.ai alternative',
    'otter vs replysequence',
    'best meeting follow-up tool',
    'meeting transcription comparison',
    'AI meeting notes',
    'sales follow-up automation',
  ],
  openGraph: {
    title: 'ReplySequence vs Otter.ai - Which is Right for You?',
    description: 'Compare ReplySequence and Otter.ai for meeting transcription and follow-up. Discover which tool saves you more time.',
    url: 'https://replysequence.vercel.app/compare/otter',
    type: 'article',
  },
  alternates: {
    canonical: 'https://replysequence.vercel.app/compare/otter',
  },
};

interface ComparisonRow {
  feature: string;
  replysequence: string | boolean;
  otter: string | boolean;
  winner?: 'replysequence' | 'otter' | 'tie';
  category?: string;
}

const comparisonData: ComparisonRow[] = [
  // Email Focus
  { feature: 'Auto Follow-up Emails', replysequence: 'Core Focus', otter: 'Add-on Feature', winner: 'replysequence', category: 'Email Workflow' },
  { feature: 'Email Generation Speed', replysequence: '8 seconds', otter: 'Not specified', winner: 'replysequence', category: 'Email Workflow' },
  { feature: 'Conversational Email Editing', replysequence: true, otter: false, winner: 'replysequence', category: 'Email Workflow' },
  { feature: 'One-Click Send', replysequence: true, otter: false, winner: 'replysequence', category: 'Email Workflow' },
  { feature: 'Custom Email Templates', replysequence: true, otter: false, winner: 'replysequence', category: 'Email Workflow' },
  // Core Features
  { feature: 'Meeting Transcription', replysequence: true, otter: true, winner: 'tie', category: 'Core Features' },
  { feature: 'AI Meeting Notes', replysequence: true, otter: true, winner: 'tie', category: 'Core Features' },
  { feature: 'Action Item Extraction', replysequence: true, otter: true, winner: 'tie', category: 'Core Features' },
  { feature: 'CRM Auto-Population', replysequence: true, otter: true, winner: 'tie', category: 'Core Features' },
  // Integrations
  { feature: 'Zoom Integration', replysequence: true, otter: true, winner: 'tie', category: 'Integrations' },
  { feature: 'Google Meet Integration', replysequence: true, otter: true, winner: 'tie', category: 'Integrations' },
  { feature: 'Microsoft Teams Integration', replysequence: true, otter: true, winner: 'tie', category: 'Integrations' },
  // Otter Advantages
  { feature: 'Real-time Collaboration', replysequence: 'Coming Soon', otter: true, winner: 'otter', category: 'Collaboration' },
  { feature: 'Mobile App', replysequence: 'Coming Soon', otter: true, winner: 'otter', category: 'Collaboration' },
  { feature: 'Live Transcription', replysequence: false, otter: true, winner: 'otter', category: 'Collaboration' },
];

const pricingComparison = [
  {
    tier: 'Free',
    replysequence: { price: '$0', period: '/mo', features: ['5 AI email drafts/month', 'Unlimited meetings', 'Basic templates'] },
    otter: { price: '$0', period: '/mo', features: ['300 minutes/month', 'Basic transcription', 'Limited exports'] },
  },
  {
    tier: 'Pro / Business',
    replysequence: { price: '$19', period: '/mo', features: ['Unlimited AI drafts', 'Priority processing', 'Custom templates', 'No branding'] },
    otter: { price: '$17', period: '/mo', features: ['1,200 minutes/month', 'Advanced search', 'OtterPilot', 'Custom vocabulary'] },
    highlighted: true,
  },
  {
    tier: 'Team / Business',
    replysequence: { price: '$29', period: '/mo', features: ['Everything in Pro', 'CRM sync', 'Team collaboration', 'API access'] },
    otter: { price: '$30', period: '/mo', features: ['6,000 minutes/month', 'Admin controls', 'Usage analytics', 'Priority support'] },
  },
];

const keyDifferences = [
  {
    icon: Timer,
    title: '8-Second Email Drafts',
    description: 'ReplySequence generates ready-to-send follow-up emails in 8 seconds. Not notes you have to turn into emails—actual emails.',
    stat: '8 sec',
    advantage: 'replysequence' as const,
  },
  {
    icon: Target,
    title: 'Email-First Design',
    description: 'Every feature is built around the email workflow. Draft, edit conversationally, send—all without leaving the app.',
    stat: '1-click',
    advantage: 'replysequence' as const,
  },
  {
    icon: MessageSquare,
    title: 'Transcription Depth',
    description: 'Otter has years of transcription refinement—speaker ID, custom vocabulary, live transcription during meetings.',
    stat: '2016',
    advantage: 'otter' as const,
  },
  {
    icon: Smartphone,
    title: 'Mobile Experience',
    description: 'Otter\'s mobile app lets you record and transcribe on the go. Great for in-person meetings.',
    stat: 'iOS/Android',
    advantage: 'otter' as const,
  },
];

function FeatureValue({ value, isWinner }: { value: string | boolean; isWinner: boolean }) {
  if (typeof value === 'boolean') {
    return value ? (
      <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${isWinner ? 'bg-emerald-500/20' : 'bg-gray-700/50'}`}>
        <Check className={`w-5 h-5 ${isWinner ? 'text-emerald-400' : 'text-gray-400'}`} />
      </div>
    ) : (
      <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-800/50">
        <X className="w-5 h-5 text-gray-600" />
      </div>
    );
  }
  return (
    <span className={`text-sm font-medium ${isWinner ? 'text-white' : 'text-gray-400'}`}>
      {value}
    </span>
  );
}

export default function OtterComparisonPage() {
  // Group features by category
  const categories = [...new Set(comparisonData.map(row => row.category))];

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Hero Section */}
      <section className="relative pt-24 pb-20 px-4 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 via-transparent to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-blue-500/10 rounded-full blur-[120px]" />

        <div className="relative max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 text-blue-300 text-sm font-medium mb-8">
            <Sparkles className="w-4 h-4" />
            Honest Comparison
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight">
            <span className="text-white">ReplySequence</span>
            <span className="text-gray-500 mx-3">vs</span>
            <span className="text-gray-400">Otter.ai</span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto mb-12">
            Two great tools. Different strengths.{' '}
            <span className="text-white">Here&apos;s which one is right for you.</span>
          </p>

          {/* Quick verdict cards */}
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="relative p-8 rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/40 overflow-hidden group hover:border-blue-400/60 transition-all duration-300">
              <div className="absolute top-4 right-4">
                <Trophy className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Choose ReplySequence if...</h3>
              <p className="text-gray-300 leading-relaxed">
                Your #1 goal is <span className="text-blue-400 font-semibold">sending follow-up emails faster</span>.
                You want AI-drafted emails in 8 seconds, not transcripts you have to process yourself.
              </p>
              <div className="mt-6 flex items-center gap-2 text-blue-400 font-medium">
                <Zap className="w-4 h-4" />
                Best for: Sales teams, consultants, anyone who lives in their inbox
              </div>
            </div>

            <div className="relative p-8 rounded-2xl bg-gray-900/50 border border-gray-700 overflow-hidden group hover:border-gray-600 transition-all duration-300">
              <h3 className="text-xl font-bold text-gray-200 mb-3">Choose Otter if...</h3>
              <p className="text-gray-400 leading-relaxed">
                You need <span className="text-gray-200 font-semibold">deep transcription features</span>,
                real-time collaboration during meetings, and a polished mobile app.
              </p>
              <div className="mt-6 flex items-center gap-2 text-gray-400 font-medium">
                <Globe className="w-4 h-4" />
                Best for: Journalists, researchers, teams who need live transcription
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Banner */}
      <section className="py-8 px-4 border-y border-gray-800 bg-gray-900/30">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl md:text-4xl font-bold text-blue-400 mb-1">8 sec</div>
              <div className="text-sm text-gray-500">Email draft time</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-white mb-1">10+ hrs</div>
              <div className="text-sm text-gray-500">Saved per week</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-white mb-1">3</div>
              <div className="text-sm text-gray-500">Platforms supported</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-emerald-400 mb-1">$19</div>
              <div className="text-sm text-gray-500">Pro plan / month</div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Comparison */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Feature Comparison</h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Side-by-side breakdown of what each platform offers
            </p>
          </div>

          {/* Comparison Header */}
          <div className="sticky top-0 z-10 bg-[#0a0a0f]/95 backdrop-blur-sm border-b border-gray-800 mb-4">
            <div className="grid grid-cols-3 py-4">
              <div className="text-gray-500 font-medium pl-4">Feature</div>
              <div className="text-center">
                <span className="text-blue-400 font-bold text-lg">ReplySequence</span>
              </div>
              <div className="text-center">
                <span className="text-gray-400 font-bold text-lg">Otter.ai</span>
              </div>
            </div>
          </div>

          {/* Grouped Features */}
          {categories.map((category) => (
            <div key={category} className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-700 to-transparent" />
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{category}</span>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-700 to-transparent" />
              </div>

              <div className="space-y-2">
                {comparisonData
                  .filter((row) => row.category === category)
                  .map((row, index) => (
                    <div
                      key={index}
                      className={`grid grid-cols-3 items-center py-4 px-4 rounded-xl transition-all duration-200 ${
                        row.winner === 'replysequence'
                          ? 'bg-blue-500/5 hover:bg-blue-500/10 border border-blue-500/20'
                          : row.winner === 'otter'
                          ? 'bg-gray-800/30 hover:bg-gray-800/50 border border-gray-700/50'
                          : 'bg-gray-900/30 hover:bg-gray-800/30 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-gray-200 font-medium">{row.feature}</span>
                        {row.winner === 'replysequence' && (
                          <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-xs font-semibold">
                            Winner
                          </span>
                        )}
                      </div>
                      <div className="flex justify-center">
                        <FeatureValue value={row.replysequence} isWinner={row.winner === 'replysequence' || row.winner === 'tie'} />
                      </div>
                      <div className="flex justify-center">
                        <FeatureValue value={row.otter} isWinner={row.winner === 'otter'} />
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Key Differences - Card Grid */}
      <section className="py-20 px-4 bg-gradient-to-b from-gray-900/50 to-transparent">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Key Differences</h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Understanding where each tool shines
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {keyDifferences.map((diff, index) => (
              <div
                key={index}
                className={`relative p-6 rounded-2xl border overflow-hidden group transition-all duration-300 ${
                  diff.advantage === 'replysequence'
                    ? 'bg-gradient-to-br from-blue-500/5 to-purple-500/5 border-blue-500/30 hover:border-blue-400/50'
                    : 'bg-gray-900/50 border-gray-700 hover:border-gray-600'
                }`}
              >
                {/* Stat badge */}
                <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-sm font-bold ${
                  diff.advantage === 'replysequence'
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'bg-gray-700 text-gray-400'
                }`}>
                  {diff.stat}
                </div>

                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4 ${
                  diff.advantage === 'replysequence'
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'bg-gray-700 text-gray-400'
                }`}>
                  <diff.icon className="w-6 h-6" />
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-lg font-bold text-white">{diff.title}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    diff.advantage === 'replysequence'
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'bg-gray-700 text-gray-400'
                  }`}>
                    {diff.advantage === 'replysequence' ? 'ReplySequence' : 'Otter'}
                  </span>
                </div>

                <p className="text-gray-400 leading-relaxed">{diff.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Comparison */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Pricing Comparison</h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Similar pricing, different value propositions
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {pricingComparison.map((tier, index) => (
              <div
                key={index}
                className={`relative rounded-2xl overflow-hidden ${
                  tier.highlighted
                    ? 'border-2 border-blue-500/50 bg-gradient-to-b from-blue-500/10 to-transparent'
                    : 'border border-gray-800 bg-gray-900/30'
                }`}
              >
                {tier.highlighted && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500" />
                )}

                <div className="p-6">
                  <h3 className="text-lg font-bold text-white text-center mb-6">{tier.tier}</h3>

                  {/* ReplySequence */}
                  <div className="p-5 rounded-xl bg-blue-500/10 border border-blue-500/30 mb-4">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-blue-400 font-semibold">ReplySequence</span>
                      <div className="flex items-baseline">
                        <span className="text-2xl font-bold text-white">{tier.replysequence.price}</span>
                        <span className="text-gray-400 text-sm">{tier.replysequence.period}</span>
                      </div>
                    </div>
                    <ul className="space-y-2">
                      {tier.replysequence.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                          <Check className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Otter */}
                  <div className="p-5 rounded-xl bg-gray-800/50 border border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-gray-400 font-semibold">Otter.ai</span>
                      <div className="flex items-baseline">
                        <span className="text-2xl font-bold text-gray-300">{tier.otter.price}</span>
                        <span className="text-gray-500 text-sm">{tier.otter.period}</span>
                      </div>
                    </div>
                    <ul className="space-y-2">
                      {tier.otter.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-400">
                          <Check className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom Line */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="relative p-8 md:p-12 rounded-3xl bg-gradient-to-br from-gray-900 to-gray-900/50 border border-gray-800 overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl" />

            <div className="relative">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20">
                  <Shield className="w-6 h-6 text-blue-400" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-white">The Bottom Line</h2>
              </div>

              <div className="space-y-4 text-gray-300 leading-relaxed mb-8">
                <p>
                  <strong className="text-white">Otter.ai</strong> is a mature transcription platform with excellent
                  real-time features and a polished mobile app. If you need to transcribe meetings on the fly,
                  collaborate live, or work heavily from your phone, Otter is solid.
                </p>
                <p>
                  <strong className="text-blue-400">ReplySequence</strong> is purpose-built for one thing:
                  turning meetings into follow-up emails as fast as possible. If your bottleneck is writing
                  emails after calls, ReplySequence will save you 10+ hours per week.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-gray-800/50 border border-gray-700">
                <p className="text-gray-400 text-sm italic flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-gray-300">Pro tip:</strong> Many teams use both—Otter for deep transcription
                    and live collaboration, ReplySequence specifically for sending follow-ups faster. Different tools for
                    different jobs.
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-t from-blue-500/5 to-transparent">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Send Follow-ups in{' '}
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              8 Seconds?
            </span>
          </h2>
          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
            Try ReplySequence free. Connect your Zoom, Teams, or Meet
            and see the difference for yourself.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/sign-up"
              className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-400 hover:to-purple-400 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300"
            >
              Start Free Trial
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-gray-300 bg-gray-800/80 hover:bg-gray-700 border border-gray-700 hover:border-gray-600 transition-all duration-300"
            >
              View Pricing
            </Link>
          </div>

          <p className="text-gray-500 text-sm mt-8">
            No credit card required • 5 free AI drafts • Cancel anytime
          </p>
        </div>
      </section>

      {/* FAQ Schema for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "What is the main difference between ReplySequence and Otter.ai?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "ReplySequence is focused specifically on generating follow-up emails from meetings in 8 seconds, while Otter.ai is a broader transcription and note-taking platform. ReplySequence is built for email workflow, Otter is built for transcription."
                }
              },
              {
                "@type": "Question",
                "name": "Is ReplySequence cheaper than Otter.ai?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Pricing is similar. ReplySequence Pro is $19/month with unlimited AI drafts. Otter Business is $16.99/month with 1,200 transcription minutes. The value depends on whether you need more email generation or more transcription time."
                }
              },
              {
                "@type": "Question",
                "name": "Can I use both ReplySequence and Otter together?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes! Many teams use Otter for deep transcription and collaboration, and ReplySequence specifically for sending follow-up emails faster. They solve different problems and work well together."
                }
              }
            ]
          })
        }}
      />
    </div>
  );
}
