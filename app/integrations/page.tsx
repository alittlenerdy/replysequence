import { Header } from '@/components/layout/Header';
import { Check, ArrowRight, Zap } from 'lucide-react';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Integrations',
  description: 'ReplySequence integrates with Zoom, Microsoft Teams, Google Meet, Gmail, Outlook, HubSpot, and Airtable. Connect your tools and automate meeting follow-ups.',
  openGraph: {
    title: 'Integrations | ReplySequence',
    description: 'Connect Zoom, Teams, Meet, Gmail, Outlook, HubSpot, and Airtable for automated meeting follow-ups.',
    url: 'https://www.replysequence.com/integrations',
  },
  alternates: {
    canonical: 'https://www.replysequence.com/integrations',
  },
};

interface Integration {
  name: string;
  category: 'meeting' | 'email' | 'crm';
  description: string;
  features: string[];
  status: 'available' | 'coming_soon';
  logo: string; // SVG path or emoji fallback
  color: string;
}

const integrations: Integration[] = [
  {
    name: 'Zoom',
    category: 'meeting',
    description: 'Automatically capture transcripts from Zoom meetings and generate follow-up emails.',
    features: [
      'Webhook-based real-time processing',
      'Cloud recording transcript extraction',
      'Speaker identification',
      'Meeting metadata sync',
    ],
    status: 'available',
    logo: 'Z',
    color: 'from-blue-500 to-blue-600',
  },
  {
    name: 'Microsoft Teams',
    category: 'meeting',
    description: 'Process Teams meetings via Microsoft Graph API subscriptions for automatic follow-ups.',
    features: [
      'Graph API subscription webhooks',
      'Auto-renewing subscriptions',
      'Transcript and recording support',
      'Calendar event integration',
    ],
    status: 'available',
    logo: 'T',
    color: 'from-purple-500 to-indigo-600',
  },
  {
    name: 'Google Meet',
    category: 'meeting',
    description: 'Connect Google Meet via Calendar API to process meeting recordings and generate drafts.',
    features: [
      'Google Calendar sync',
      'Recording-based transcription',
      'Google Workspace integration',
      'Multi-account support',
    ],
    status: 'available',
    logo: 'M',
    color: 'from-green-500 to-emerald-600',
  },
  {
    name: 'Gmail',
    category: 'email',
    description: 'Send follow-up emails directly from your Gmail account for better deliverability.',
    features: [
      'OAuth-based secure connection',
      'Send as your real email address',
      'Automatic token refresh',
      'No third-party sender branding',
    ],
    status: 'available',
    logo: 'G',
    color: 'from-red-500 to-orange-500',
  },
  {
    name: 'Outlook / Microsoft 365',
    category: 'email',
    description: 'Connect your Outlook or Microsoft 365 account to send follow-ups from your business email.',
    features: [
      'Microsoft Graph API integration',
      'Send as your work email',
      'Enterprise-ready OAuth',
      'Works with M365 Business accounts',
    ],
    status: 'available',
    logo: 'O',
    color: 'from-blue-600 to-cyan-500',
  },
  {
    name: 'HubSpot',
    category: 'crm',
    description: 'Automatically log sent emails to HubSpot contacts and create engagement records.',
    features: [
      'Contact lookup and matching',
      'Email engagement logging',
      'Automatic token refresh',
      'Activity timeline sync',
    ],
    status: 'available',
    logo: 'H',
    color: 'from-orange-500 to-red-500',
  },
  {
    name: 'Airtable',
    category: 'crm',
    description: 'Sync meeting data and sent emails to Airtable for custom CRM workflows.',
    features: [
      'Contact record sync',
      'Meeting history logging',
      'Email send tracking',
      'Custom base support',
    ],
    status: 'available',
    logo: 'A',
    color: 'from-yellow-500 to-green-500',
  },
  {
    name: 'Salesforce',
    category: 'crm',
    description: 'Log meeting follow-ups directly into Salesforce contacts and opportunities.',
    features: [
      'Contact and lead matching',
      'Activity logging',
      'Opportunity association',
      'Enterprise SSO support',
    ],
    status: 'coming_soon',
    logo: 'S',
    color: 'from-blue-400 to-blue-600',
  },
];

const categoryLabels = {
  meeting: 'Meeting Platforms',
  email: 'Email Providers',
  crm: 'CRM Integrations',
};

const categoryDescriptions = {
  meeting: 'Connect your video conferencing tools to automatically capture transcripts and generate follow-up emails.',
  email: 'Send emails from your real business address for better deliverability and trust.',
  crm: 'Log every follow-up email to your CRM automatically. No manual data entry.',
};

export default function IntegrationsPage() {
  const categories = ['meeting', 'email', 'crm'] as const;

  return (
    <div className="min-h-screen bg-gray-950 light:bg-gray-50">
      <Header />

      {/* Hero */}
      <section className="pt-32 pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-white light:text-gray-900 mb-6">
            Connect Your{' '}
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Entire Stack
            </span>
          </h1>
          <p className="text-xl text-gray-400 light:text-gray-600 max-w-2xl mx-auto mb-8">
            ReplySequence integrates with the tools you already use. Meeting platforms, email providers, and CRMs — all connected.
          </p>
          <div className="flex items-center justify-center gap-4 text-sm text-gray-500 light:text-gray-400">
            <span className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-emerald-400" />
              7 integrations available
            </span>
            <span className="text-gray-700 light:text-gray-300">|</span>
            <span>Setup in under 2 minutes</span>
          </div>
        </div>
      </section>

      {/* Integration Categories */}
      {categories.map((category) => {
        const categoryIntegrations = integrations.filter((i) => i.category === category);

        return (
          <section key={category} className="py-12 px-4">
            <div className="max-w-6xl mx-auto">
              <div className="mb-8">
                <h2 className="text-2xl md:text-3xl font-bold text-white light:text-gray-900 mb-2">
                  {categoryLabels[category]}
                </h2>
                <p className="text-gray-400 light:text-gray-600">
                  {categoryDescriptions[category]}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categoryIntegrations.map((integration) => (
                  <div
                    key={integration.name}
                    className={`relative rounded-2xl p-6 bg-gray-900 light:bg-white border border-gray-800 light:border-gray-200 hover:border-gray-700 light:hover:border-gray-300 transition-all ${
                      integration.status === 'coming_soon' ? 'opacity-70' : ''
                    }`}
                  >
                    {integration.status === 'coming_soon' && (
                      <div className="absolute top-4 right-4">
                        <span className="text-xs px-2 py-1 rounded-full bg-gray-800 light:bg-gray-100 text-gray-400 light:text-gray-500 font-medium">
                          Coming Soon
                        </span>
                      </div>
                    )}

                    {/* Logo */}
                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-r ${integration.color} mb-4`}>
                      <span className="text-white font-bold text-lg">
                        {integration.logo}
                      </span>
                    </div>

                    {/* Name + Description */}
                    <h3 className="text-lg font-semibold text-white light:text-gray-900 mb-2">
                      {integration.name}
                    </h3>
                    <p className="text-sm text-gray-400 light:text-gray-600 mb-4">
                      {integration.description}
                    </p>

                    {/* Features */}
                    <ul className="space-y-2">
                      {integration.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <Check className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-300 light:text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </section>
        );
      })}

      {/* How It Works */}
      <section className="py-16 px-4 border-t border-gray-800 light:border-gray-200">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-white light:text-gray-900 text-center mb-12">
            How Integration Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                title: 'Connect Your Accounts',
                description: 'Link your meeting platform and email in Settings. OAuth-based, no passwords stored.',
              },
              {
                step: '2',
                title: 'Meet as Usual',
                description: 'Have your Zoom, Teams, or Meet calls as normal. ReplySequence processes recordings automatically.',
              },
              {
                step: '3',
                title: 'Drafts Appear Instantly',
                description: 'AI-generated follow-up emails appear in your dashboard. Review, edit, and send — or let auto-send handle it.',
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-lg mb-4">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold text-white light:text-gray-900 mb-2">
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

      {/* CTA */}
      <section className="py-16 px-4 bg-gradient-to-b from-gray-900 to-gray-950 light:from-white light:to-gray-50">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-white light:text-gray-900 mb-4">
            Ready to connect your tools?
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
            "@type": "WebPage",
            "name": "ReplySequence Integrations",
            "description": "Connect Zoom, Microsoft Teams, Google Meet, Gmail, Outlook, HubSpot, and Airtable for automated meeting follow-up emails.",
            "url": "https://www.replysequence.com/integrations",
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
