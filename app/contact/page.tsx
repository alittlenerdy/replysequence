import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Mail, MessageSquare } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Get in touch with the ReplySequence team. We respond to every message within 24 hours.',
  openGraph: {
    title: 'Contact | ReplySequence',
    description: 'Get in touch with the ReplySequence team. We respond within 24 hours.',
    url: 'https://www.replysequence.com/contact',
  },
  alternates: {
    canonical: 'https://www.replysequence.com/contact',
  },
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gray-950 light:bg-gray-50">
      <Header />

      {/* Hero */}
      <section className="pt-32 pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-white light:text-gray-900 mb-6">
            Get in{' '}
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Touch
            </span>
          </h1>
          <p className="text-xl text-gray-400 light:text-gray-600 max-w-2xl mx-auto">
            Have a question, feature request, or just want to say hello? We&apos;d love to hear from you.
          </p>
        </div>
      </section>

      {/* Contact Options */}
      <section className="py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Email */}
            <a
              href="mailto:jimmy@replysequence.com"
              className="group rounded-2xl p-8 bg-gray-900 light:bg-white border border-gray-800 light:border-gray-200 hover:border-blue-500/50 transition-all"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-500/20 mb-4">
                <Mail className="w-6 h-6 text-blue-400" />
              </div>
              <h2 className="text-lg font-semibold text-white light:text-gray-900 mb-2">
                Email Us
              </h2>
              <p className="text-sm text-gray-400 light:text-gray-600 mb-4">
                For support, sales questions, or partnership inquiries.
              </p>
              <span className="text-blue-400 group-hover:text-blue-300 text-sm font-medium transition-colors">
                jimmy@replysequence.com
              </span>
            </a>

            {/* Feature Requests */}
            <a
              href="mailto:jimmy@replysequence.com"
              className="group rounded-2xl p-8 bg-gray-900 light:bg-white border border-gray-800 light:border-gray-200 hover:border-purple-500/50 transition-all"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-purple-500/20 mb-4">
                <MessageSquare className="w-6 h-6 text-purple-400" />
              </div>
              <h2 className="text-lg font-semibold text-white light:text-gray-900 mb-2">
                Feature Requests
              </h2>
              <p className="text-sm text-gray-400 light:text-gray-600 mb-4">
                Tell us what you&apos;d like to see next in ReplySequence.
              </p>
              <span className="text-purple-400 group-hover:text-purple-300 text-sm font-medium transition-colors">
                jimmy@replysequence.com
              </span>
            </a>
          </div>

          {/* Response Time */}
          <div className="mt-12 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-sm text-emerald-400 font-medium">
                We respond to every message within 24 hours
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-4 border-t border-gray-800 light:border-gray-200">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-white light:text-gray-900 text-center mb-8">
            Common Questions
          </h2>
          <div className="space-y-4">
            {[
              {
                q: 'I need help setting up my integrations',
                a: 'Check our integrations page for setup guides, or email us at jimmy@replysequence.com and we\'ll walk you through it.',
              },
              {
                q: 'I found a bug',
                a: 'Please email jimmy@replysequence.com with a description of what happened and any screenshots. We take bugs seriously and fix them fast.',
              },
              {
                q: 'Can I request a feature?',
                a: 'Absolutely. Email jimmy@replysequence.com with your idea. We read every request and it directly shapes our roadmap.',
              },
              {
                q: 'Do you offer enterprise plans?',
                a: 'Yes. For teams of 10+ or organizations that need custom integrations, SSO, or dedicated support, email jimmy@replysequence.com.',
              },
            ].map((faq, index) => (
              <div
                key={index}
                className="bg-gray-900 light:bg-white rounded-xl p-6 border border-gray-800 light:border-gray-200"
              >
                <h3 className="text-base font-semibold text-white light:text-gray-900 mb-2">
                  {faq.q}
                </h3>
                <p className="text-sm text-gray-400 light:text-gray-600">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ContactPage",
            "name": "Contact ReplySequence",
            "description": "Get in touch with the ReplySequence team.",
            "url": "https://www.replysequence.com/contact",
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
