import { Header } from '@/components/layout/Header';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About',
  description: 'ReplySequence automates meeting follow-up emails using AI. Built by Playground Giants for sales teams, account managers, and anyone who follows up after meetings.',
  openGraph: {
    title: 'About | ReplySequence',
    description: 'Learn about ReplySequence — AI-powered meeting follow-up emails for sales teams and account managers.',
    url: 'https://www.replysequence.com/about',
  },
  alternates: {
    canonical: 'https://www.replysequence.com/about',
  },
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-950 light:bg-gray-50">
      <Header />

      {/* Hero */}
      <section className="pt-32 pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-white light:text-gray-900 mb-6">
            Follow-ups shouldn&apos;t be{' '}
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              busywork
            </span>
          </h1>
          <p className="text-xl text-gray-400 light:text-gray-600 max-w-2xl mx-auto">
            We built ReplySequence because the best meeting follow-up is the one that actually gets sent.
          </p>
        </div>
      </section>

      {/* The Problem */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-white light:text-gray-900 mb-4">
                The problem we solve
              </h2>
              <p className="text-gray-400 light:text-gray-600 mb-4">
                After every meeting, there&apos;s a follow-up email that needs to be written. It should reference what was discussed, capture action items, and be sent while the conversation is still fresh.
              </p>
              <p className="text-gray-400 light:text-gray-600 mb-4">
                But life happens. You jump into the next call. The follow-up gets pushed to &quot;later.&quot; Later becomes never. Deals slip, details get lost, and relationships cool off.
              </p>
              <p className="text-gray-400 light:text-gray-600">
                ReplySequence makes sure that doesn&apos;t happen.
              </p>
            </div>
            <div className="bg-gray-900 light:bg-white rounded-2xl p-8 border border-gray-800 light:border-gray-200">
              <div className="space-y-4">
                {[
                  { stat: '67%', label: 'of follow-up emails are never sent' },
                  { stat: '2 hours', label: 'average time to write a follow-up' },
                  { stat: '< 30 sec', label: 'with ReplySequence' },
                ].map((item) => (
                  <div key={item.label} className="text-center py-4 border-b border-gray-800 light:border-gray-200 last:border-0">
                    <div className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                      {item.stat}
                    </div>
                    <div className="text-sm text-gray-400 light:text-gray-600 mt-1">
                      {item.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4 border-t border-gray-800 light:border-gray-200">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-white light:text-gray-900 text-center mb-12">
            What ReplySequence does
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: 'Listens to your meetings',
                description: 'Connect Zoom, Teams, or Google Meet. ReplySequence processes your meeting recordings and transcripts automatically.',
              },
              {
                title: 'Drafts your follow-ups',
                description: 'AI analyzes the conversation, identifies action items, and generates a personalized follow-up email ready to send.',
              },
              {
                title: 'Syncs to your CRM',
                description: 'Sent emails are automatically logged to HubSpot or Airtable. No manual data entry, no missed touchpoints.',
              },
            ].map((item) => (
              <div key={item.title} className="text-center">
                <h3 className="text-lg font-semibold text-white light:text-gray-900 mb-3">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-400 light:text-gray-600">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Built By */}
      <section className="py-16 px-4 border-t border-gray-800 light:border-gray-200">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white light:text-gray-900 mb-6">
            Built by Playground Giants
          </h2>
          <p className="text-gray-400 light:text-gray-600 mb-4">
            Playground Giants is a software studio that builds tools for professionals who are too busy doing real work to waste time on busywork.
          </p>
          <p className="text-gray-400 light:text-gray-600">
            ReplySequence is our first product — born from the frustration of watching important follow-ups fall through the cracks after every meeting.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-gradient-to-b from-gray-900 to-gray-950 light:from-white light:to-gray-50">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-white light:text-gray-900 mb-4">
            Stop letting follow-ups slip
          </h2>
          <p className="text-gray-400 light:text-gray-600 mb-8">
            Get started free with 5 AI drafts per month. No credit card required.
          </p>
          <Link
            href="/sign-up"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-lg font-semibold bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all"
          >
            Get Started Free
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-gray-800 light:border-gray-200 bg-gray-950 light:bg-gray-50">
        <div className="max-w-7xl mx-auto text-center text-gray-500 light:text-gray-600 text-sm">
          <p>&copy; 2026 ReplySequence. Built by Playground Giants.</p>
        </div>
      </footer>

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "AboutPage",
            "name": "About ReplySequence",
            "description": "ReplySequence automates meeting follow-up emails using AI. Built by Playground Giants.",
            "url": "https://www.replysequence.com/about",
            "isPartOf": {
              "@type": "WebSite",
              "name": "ReplySequence",
              "url": "https://www.replysequence.com",
            },
          }),
        }}
      />
    </div>
  );
}
