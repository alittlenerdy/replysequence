import { Metadata } from 'next';
import Link from 'next/link';
import {
  Check,
  X,
  Zap,
  Clock,
  Mail,
  Database,
  DollarSign,
  ArrowRight,
  Sparkles,
  MessageSquare,
  Globe,
  Shield,
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
  highlight?: boolean;
}

const comparisonData: ComparisonRow[] = [
  { feature: 'Auto Follow-up Emails', replysequence: 'Core Focus', otter: 'Partial (OtterPilot Agent)', highlight: true },
  { feature: 'Email Generation Speed', replysequence: '8 seconds', otter: 'Not specified', highlight: true },
  { feature: 'Meeting Transcription', replysequence: true, otter: true },
  { feature: 'AI Meeting Notes', replysequence: true, otter: true },
  { feature: 'Action Item Extraction', replysequence: true, otter: true },
  { feature: 'CRM Auto-Population', replysequence: true, otter: true },
  { feature: 'Zoom Integration', replysequence: true, otter: true },
  { feature: 'Google Meet Integration', replysequence: true, otter: true },
  { feature: 'Microsoft Teams Integration', replysequence: true, otter: true },
  { feature: 'Conversational Email Editing', replysequence: true, otter: false, highlight: true },
  { feature: 'One-Click Send', replysequence: true, otter: false },
  { feature: 'Custom Email Templates', replysequence: true, otter: false },
  { feature: 'Multi-Platform Dashboard', replysequence: true, otter: true },
  { feature: 'Real-time Collaboration', replysequence: 'Coming Soon', otter: true },
  { feature: 'Mobile App', replysequence: 'Coming Soon', otter: true },
];

const pricingComparison = [
  {
    tier: 'Free',
    replysequence: { price: '$0/mo', features: ['5 AI drafts/month', 'Unlimited meetings', 'Basic templates'] },
    otter: { price: '$0/mo', features: ['300 minutes/month', 'Basic transcription', 'Limited features'] },
  },
  {
    tier: 'Pro/Business',
    replysequence: { price: '$19/mo', features: ['Unlimited AI drafts', 'Priority processing', 'Custom templates', 'No branding'] },
    otter: { price: '$16.99/mo', features: ['1,200 minutes/month', 'Advanced search', 'OtterPilot', 'Custom vocabulary'] },
  },
  {
    tier: 'Team/Enterprise',
    replysequence: { price: '$29/mo', features: ['CRM sync', 'Team collaboration', 'Analytics', 'API access'] },
    otter: { price: '$30/mo', features: ['6,000 minutes/month', 'Admin controls', 'Usage analytics', 'Priority support'] },
  },
];

const keyDifferences = [
  {
    icon: Zap,
    title: '8-Second Email Drafts',
    description: 'ReplySequence is laser-focused on one thing: turning your meetings into ready-to-send follow-up emails in 8 seconds. Otter focuses on transcription and notes first, with email as an add-on.',
    advantage: 'replysequence',
  },
  {
    icon: Mail,
    title: 'Email-First Workflow',
    description: 'Every feature in ReplySequence is designed around the email workflow—from AI drafting to conversational editing to one-click sending. Otter\'s OtterPilot Agent handles emails but as part of a broader feature set.',
    advantage: 'replysequence',
  },
  {
    icon: MessageSquare,
    title: 'Transcription Depth',
    description: 'Otter has been in the transcription game longer and offers more granular control over transcripts, speaker identification, and real-time collaboration on notes.',
    advantage: 'otter',
  },
  {
    icon: Globe,
    title: 'Mobile Experience',
    description: 'Otter has a mature mobile app for on-the-go transcription. ReplySequence is currently web-focused, with mobile apps on the roadmap.',
    advantage: 'otter',
  },
];

function FeatureCell({ value }: { value: string | boolean }) {
  if (typeof value === 'boolean') {
    return value ? (
      <Check className="w-5 h-5 text-emerald-400" />
    ) : (
      <X className="w-5 h-5 text-gray-500" />
    );
  }
  return <span className="text-sm">{value}</span>;
}

export default function OtterComparisonPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-8">
            <Sparkles className="w-4 h-4" />
            Comparison Guide
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            <span className="text-white">ReplySequence vs Otter.ai</span>
            <br />
            <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Which is Right for You?
            </span>
          </h1>

          <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-8">
            Both tools help you get more from your meetings. But they take different approaches.
            Here&apos;s an honest comparison to help you decide.
          </p>

          {/* Quick verdict */}
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto mb-12">
            <div className="p-6 rounded-2xl bg-blue-500/10 border border-blue-500/30">
              <h3 className="text-lg font-bold text-blue-400 mb-2">Choose ReplySequence if...</h3>
              <p className="text-gray-300 text-sm">
                Your #1 goal is sending follow-up emails faster. You want AI to draft perfect emails in seconds, not minutes.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-gray-800/50 border border-gray-700">
              <h3 className="text-lg font-bold text-gray-300 mb-2">Choose Otter if...</h3>
              <p className="text-gray-400 text-sm">
                You need deep transcription features, real-time collaboration, and a mobile app for on-the-go recording.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-4">Feature Comparison</h2>
          <p className="text-gray-400 text-center mb-12 max-w-2xl mx-auto">
            A side-by-side look at what each platform offers
          </p>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left py-4 px-4 text-gray-400 font-medium">Feature</th>
                  <th className="text-center py-4 px-4">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-blue-400 font-bold">ReplySequence</span>
                    </div>
                  </th>
                  <th className="text-center py-4 px-4">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-gray-300 font-bold">Otter.ai</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((row, index) => (
                  <tr
                    key={index}
                    className={`border-b border-gray-800/50 ${row.highlight ? 'bg-blue-500/5' : ''}`}
                  >
                    <td className="py-4 px-4 text-gray-300">
                      {row.feature}
                      {row.highlight && (
                        <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">
                          Key Difference
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="flex justify-center">
                        <FeatureCell value={row.replysequence} />
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="flex justify-center text-gray-400">
                        <FeatureCell value={row.otter} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Key Differences */}
      <section className="py-16 px-4 bg-gray-900/50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-4">Key Differences</h2>
          <p className="text-gray-400 text-center mb-12 max-w-2xl mx-auto">
            Understanding where each tool excels
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            {keyDifferences.map((diff, index) => (
              <div
                key={index}
                className={`p-6 rounded-2xl border ${
                  diff.advantage === 'replysequence'
                    ? 'bg-blue-500/5 border-blue-500/30'
                    : 'bg-gray-800/30 border-gray-700'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl ${
                    diff.advantage === 'replysequence'
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'bg-gray-700 text-gray-400'
                  }`}>
                    <diff.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-bold text-white">{diff.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        diff.advantage === 'replysequence'
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'bg-gray-700 text-gray-400'
                      }`}>
                        {diff.advantage === 'replysequence' ? 'ReplySequence' : 'Otter'} advantage
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm">{diff.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Comparison */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-4">Pricing Comparison</h2>
          <p className="text-gray-400 text-center mb-12 max-w-2xl mx-auto">
            Both offer competitive pricing with different value propositions
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {pricingComparison.map((tier, index) => (
              <div key={index} className="p-6 rounded-2xl bg-gray-800/50 border border-gray-700">
                <h3 className="text-lg font-bold text-white mb-6 text-center">{tier.tier}</h3>

                <div className="space-y-6">
                  {/* ReplySequence */}
                  <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-blue-400 font-medium text-sm">ReplySequence</span>
                      <span className="text-white font-bold">{tier.replysequence.price}</span>
                    </div>
                    <ul className="space-y-1.5">
                      {tier.replysequence.features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-2 text-xs text-gray-300">
                          <Check className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Otter */}
                  <div className="p-4 rounded-xl bg-gray-700/30 border border-gray-600">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-gray-400 font-medium text-sm">Otter.ai</span>
                      <span className="text-gray-300 font-bold">{tier.otter.price}</span>
                    </div>
                    <ul className="space-y-1.5">
                      {tier.otter.features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-2 text-xs text-gray-400">
                          <Check className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
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
      <section className="py-16 px-4 bg-gray-900/50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-8">The Bottom Line</h2>

          <div className="p-8 rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/30">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 rounded-xl bg-blue-500/20">
                <Shield className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Our Honest Take</h3>
                <p className="text-gray-300">
                  <strong className="text-blue-400">Otter.ai</strong> is a fantastic transcription tool with a mature feature set.
                  If you need deep transcription features, real-time collaboration, and a polished mobile experience, it&apos;s a solid choice.
                </p>
                <p className="text-gray-300 mt-3">
                  <strong className="text-blue-400">ReplySequence</strong> is purpose-built for one thing: turning your meetings into
                  follow-up emails as fast as humanly possible. If sending great follow-ups is your bottleneck,
                  ReplySequence will save you hours every week.
                </p>
              </div>
            </div>

            <div className="border-t border-gray-700 pt-6 mt-6">
              <p className="text-gray-400 text-sm italic">
                Many teams use both—Otter for deep transcription needs, ReplySequence for rapid follow-up emails.
                They solve different problems.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Send Follow-ups in{' '}
            <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              8 Seconds?
            </span>
          </h2>
          <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
            Try ReplySequence free. Connect your Zoom, Teams, or Meet in one click
            and see the difference for yourself.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/sign-up"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300"
            >
              Try ReplySequence Free
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-gray-300 bg-gray-800 hover:bg-gray-700 border border-gray-700 transition-all duration-300"
            >
              View Pricing
            </Link>
          </div>

          <p className="text-gray-500 text-sm mt-6">
            No credit card required. 5 free AI drafts to start.
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
