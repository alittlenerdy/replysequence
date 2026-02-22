import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Zap, Clock, Mail } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Compare ReplySequence to AI Meeting Tools - Gong, Otter, Fireflies, Fathom, Chorus, Avoma & More',
  description:
    'See how ReplySequence compares to Gong, Otter.ai, Fireflies.ai, Fathom, Chorus, Avoma, tl;dv, and Grain. Find the right AI meeting follow-up tool for your workflow.',
  openGraph: {
    title: 'Compare ReplySequence to Top AI Meeting Tools',
    description:
      'Detailed comparisons of ReplySequence vs Gong, Otter.ai, Fireflies.ai, Fathom, Chorus, Avoma, and more. Find the right tool for meeting follow-ups.',
    url: 'https://www.replysequence.com/compare',
  },
  alternates: {
    canonical: 'https://www.replysequence.com/compare',
  },
};

const competitors = [
  {
    slug: 'gong',
    name: 'Gong',
    tagline: 'Revenue intelligence platform',
    differentiator: 'Gong analyzes conversations for deal intelligence. ReplySequence generates the follow-up email in 8 seconds at a fraction of the cost.',
    color: 'from-violet-500 to-purple-600',
  },
  {
    slug: 'otter',
    name: 'Otter.ai',
    tagline: 'Live transcription and meeting notes',
    differentiator: 'Otter transcribes meetings in real time. ReplySequence turns those transcripts into ready-to-send emails.',
    color: 'from-blue-500 to-cyan-600',
  },
  {
    slug: 'fireflies',
    name: 'Fireflies.ai',
    tagline: 'Meeting transcription and search',
    differentiator: 'Fireflies records and transcribes. ReplySequence drafts the follow-up email you actually need to send.',
    color: 'from-amber-500 to-orange-600',
  },
  {
    slug: 'chorus',
    name: 'Chorus (ZoomInfo)',
    tagline: 'Enterprise conversation intelligence',
    differentiator: 'Chorus provides conversation analytics within the ZoomInfo ecosystem. ReplySequence generates follow-up emails independently at $19/mo.',
    color: 'from-sky-500 to-blue-600',
  },
  {
    slug: 'fathom',
    name: 'Fathom',
    tagline: 'AI notetaker with meeting summaries',
    differentiator: 'Fathom focuses on note-taking and CRM sync. ReplySequence generates follow-up emails in 8 seconds.',
    color: 'from-purple-500 to-indigo-600',
  },
  {
    slug: 'avoma',
    name: 'Avoma',
    tagline: 'Meeting lifecycle assistant',
    differentiator: 'Avoma covers the full meeting lifecycle. ReplySequence focuses on the part that drives revenue: sending follow-ups fast.',
    color: 'from-teal-500 to-emerald-600',
  },
  {
    slug: 'tldv',
    name: 'tl;dv',
    tagline: 'Meeting recordings with AI summaries',
    differentiator: 'tl;dv creates timestamped recordings. ReplySequence creates the email that closes the deal.',
    color: 'from-green-500 to-emerald-600',
  },
  {
    slug: 'grain',
    name: 'Grain',
    tagline: 'Video highlights from meetings',
    differentiator: 'Grain clips meeting highlights. ReplySequence drafts follow-up emails from the full conversation.',
    color: 'from-rose-500 to-pink-600',
  },
];

export default function ComparePage() {
  return (
    <div className="min-h-screen bg-gray-950 light:bg-gray-50">
      <Header />

      {/* Hero */}
      <section className="pt-32 pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white light:text-gray-900 mb-6 leading-tight">
            How ReplySequence{' '}
            <span className="bg-gradient-to-r from-indigo-300 via-indigo-400 to-indigo-600 bg-clip-text text-transparent">
              Compares
            </span>
          </h1>
          <p className="text-xl text-gray-400 light:text-gray-600 max-w-2xl mx-auto mb-10">
            Most AI meeting tools stop at transcription. ReplySequence goes further — turning every call into a follow-up email your prospect actually wants to open.
          </p>

          {/* Key differentiators */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-16">
            {[
              { icon: Clock, text: '8-second email drafts' },
              { icon: Mail, text: 'Ready to send, not just read' },
              { icon: Zap, text: 'Works with Zoom, Teams, Meet' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-gray-300 light:text-gray-600">
                <item.icon className="w-5 h-5 text-indigo-400" />
                <span className="text-sm font-medium">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Cards */}
      <section className="pb-20 px-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {competitors.map((comp) => (
            <Link
              key={comp.slug}
              href={`/compare/${comp.slug}`}
              className="group block rounded-2xl bg-gray-900/50 light:bg-white border border-gray-800 light:border-gray-200 hover:border-indigo-500/50 light:hover:border-indigo-400 p-6 transition-all hover:bg-gray-900/80 light:hover:bg-gray-50"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-lg font-bold text-white light:text-gray-900">
                      ReplySequence vs {comp.name}
                    </h2>
                    <span className="text-xs text-gray-500 light:text-gray-400 font-medium">
                      {comp.tagline}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 light:text-gray-600">
                    {comp.differentiator}
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-600 light:text-gray-400 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all shrink-0" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="pb-20 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-white light:text-gray-900 mb-3">
            Still deciding?
          </h2>
          <p className="text-gray-400 light:text-gray-600 mb-6">
            Join the waitlist and see ReplySequence for yourself. No commitment needed.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-500/20"
          >
            Join the Waitlist
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* BreadcrumbList */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.replysequence.com' },
              { '@type': 'ListItem', position: 2, name: 'Compare', item: 'https://www.replysequence.com/compare' },
            ],
          }),
        }}
      />

      {/* CollectionPage JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: 'Compare ReplySequence to AI Meeting Tools',
            description: 'Detailed comparisons of ReplySequence vs popular AI meeting assistants.',
            url: 'https://www.replysequence.com/compare',
            mainEntity: competitors.map((comp) => ({
              '@type': 'WebPage',
              name: `ReplySequence vs ${comp.name}`,
              url: `https://www.replysequence.com/compare/${comp.slug}`,
            })),
          }),
        }}
      />

      <Footer />
    </div>
  );
}
