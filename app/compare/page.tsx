import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { WaitlistForm } from '@/components/landing/WaitlistForm';
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
    differentiator: 'Gong analyzes conversations for deal intelligence. ReplySequence generates follow-ups, sequences, next steps, and risk alerts in seconds — at a fraction of the cost.',
    color: 'from-violet-500 to-purple-600',
  },
  {
    slug: 'otter',
    name: 'Otter.ai',
    tagline: 'Live transcription and meeting notes',
    differentiator: 'Otter transcribes meetings in real time. ReplySequence turns transcripts into follow-ups, sequences, tracked next steps, and CRM updates.',
    color: 'from-blue-500 to-cyan-600',
  },
  {
    slug: 'fireflies',
    name: 'Fireflies.ai',
    tagline: 'Meeting transcription and search',
    differentiator: 'Fireflies records and transcribes. ReplySequence drafts the follow-up, triggers sequences, tracks next steps, and flags deal risks.',
    color: 'from-amber-500 to-orange-600',
  },
  {
    slug: 'chorus',
    name: 'Chorus (ZoomInfo)',
    tagline: 'Enterprise conversation intelligence',
    differentiator: 'Chorus provides conversation analytics within the ZoomInfo ecosystem. ReplySequence generates follow-ups, sequences, and deal intelligence independently at $19/mo.',
    color: 'from-sky-500 to-blue-600',
  },
  {
    slug: 'fathom',
    name: 'Fathom',
    tagline: 'AI notetaker with meeting summaries',
    differentiator: 'Fathom focuses on note-taking and CRM sync. ReplySequence generates follow-ups, sequences, next steps, and risk alerts in seconds.',
    color: 'from-purple-500 to-[#4F46E5]',
  },
  {
    slug: 'avoma',
    name: 'Avoma',
    tagline: 'Meeting lifecycle assistant',
    differentiator: 'Avoma covers the full meeting lifecycle. ReplySequence focuses on the part that drives revenue: follow-ups, sequences, next-step tracking, and deal risk alerts.',
    color: 'from-teal-500 to-emerald-600',
  },
  {
    slug: 'tldv',
    name: 'tl;dv',
    tagline: 'Meeting recordings with AI summaries',
    differentiator: 'tl;dv creates timestamped recordings. ReplySequence creates the follow-up, sequence, and next-step tracking that closes the deal.',
    color: 'from-green-500 to-emerald-600',
  },
  {
    slug: 'grain',
    name: 'Grain',
    tagline: 'Video highlights from meetings',
    differentiator: 'Grain clips meeting highlights. ReplySequence drafts follow-ups, triggers sequences, and tracks next steps from the full conversation.',
    color: 'from-rose-500 to-pink-600',
  },
  {
    slug: 'manual',
    name: 'Manual Follow-Up',
    tagline: 'The DIY approach',
    differentiator: 'Manual follow-ups take 23 minutes and 44% never get sent. ReplySequence generates follow-ups, sequences, next steps, and risk alerts in seconds — every time.',
    color: 'from-gray-500 to-slate-600',
  },
];

export default function ComparePage() {
  return (
    <div className="min-h-screen bg-[#060B18] light:bg-gray-50 relative overflow-hidden">
      {/* Ambient gradient orbs — match homepage */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(91,108,255,0.12)_0%,transparent_70%)] pointer-events-none" />
      <div className="absolute top-[40%] left-[20%] w-[500px] h-[500px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(91,108,255,0.06)_0%,transparent_70%)] pointer-events-none" />

      <Header />

      {/* Hero */}
      <section className="relative pt-32 pb-16 px-4 z-10">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white light:text-gray-900 mb-6 leading-tight text-pretty">
            How ReplySequence{' '}
            <span className="bg-gradient-to-r from-[#6366F1] to-[#818CF8] bg-clip-text text-transparent">
              Compares
            </span>
          </h1>
          <p className="text-xl text-gray-400 light:text-gray-600 max-w-2xl mx-auto mb-10">
            Most AI meeting tools stop at transcription. ReplySequence goes further — turning every call into follow-ups, multi-step sequences, tracked next steps, deal risk alerts, and CRM updates.
          </p>

          {/* Key differentiators */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-16">
            {[
              { icon: Clock, text: 'Follow-ups + sequences in seconds' },
              { icon: Mail, text: 'Next steps tracked, risks flagged' },
              { icon: Zap, text: 'Zoom, Teams, Meet + CRM sync' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-gray-300 light:text-gray-600">
                <item.icon className="w-5 h-5 text-[#6366F1]" />
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
              className="group block rounded-2xl bg-gray-900/50 light:bg-white border border-gray-800 light:border-gray-200 border-l-2 border-l-[#6366F1]/30 hover:border-[#6366F1]/30 light:hover:border-[#6366F1]/40 hover:-translate-y-0.5 hover:shadow-lg p-6 transition-all duration-200 cursor-pointer hover:bg-gray-900/80 light:hover:bg-gray-50"
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
                <ArrowRight className="w-5 h-5 text-gray-600 light:text-gray-400 group-hover:text-[#6366F1] group-hover:translate-x-1 transition-[color,transform] shrink-0" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Demo CTA */}
      <section className="px-4">
        <div className="max-w-4xl mx-auto text-center mt-12">
          <p className="text-[#8892B0] light:text-gray-500 mb-4">See how ReplySequence handles all of this automatically.</p>
          <Link href="/demo" className="btn-secondary-cta inline-flex items-center gap-2 rounded-xl">
            Watch Demo
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
          </Link>
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
          <div className="glass-border-accent rounded-2xl p-6 sm:p-10">
            <WaitlistForm />
          </div>
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
